"""
Order Routes
Handles checkout and order management
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId

from database import (
    orders_collection, cart_collection, products_collection, 
    shops_collection, users_collection, chat_rooms_collection, chat_messages_collection
)
from models import OrderStatus, UserRole
from auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["Orders"])

class CheckoutData(BaseModel):
    shipping_address: str
    shipping_city: str
    shipping_phone: str
    shipping_name: str
    payment_method: str = "stripe"
    notes: Optional[str] = None

async def create_chat_room(room_type, reference_id, participant1_id, participant1_name, 
                           participant2_id, participant2_name, context):
    """Helper to create chat rooms"""
    existing = await chat_rooms_collection.find_one({
        "room_type": room_type,
        "reference_id": reference_id,
        "participants": {"$all": [participant1_id, participant2_id]}
    })
    
    if existing:
        return str(existing["_id"])
    
    room = {
        "room_type": room_type,
        "reference_id": reference_id,
        "participants": [participant1_id, participant2_id],
        "participant_names": {
            participant1_id: participant1_name,
            participant2_id: participant2_name
        },
        "context": context,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "last_message_at": datetime.now(timezone.utc)
    }
    
    result = await chat_rooms_collection.insert_one(room)
    return str(result.inserted_id)

@router.post("/checkout")
async def create_checkout(data: CheckoutData, user: dict = Depends(get_current_user)):
    """Create order with full checkout flow"""
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = []
    subtotal = 0
    shop_shipping = {}
    shop_names = {}
    
    for cart_item in cart["items"]:
        product = await products_collection.find_one({"_id": ObjectId(cart_item["product_id"])})
        if not product:
            continue
        
        if product["stock"] < cart_item["quantity"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product['name']}. Available: {product['stock']}"
            )
        
        item_total = product["price"] * cart_item["quantity"]
        subtotal += item_total
        
        shop_id = product.get("shop_id")
        items.append({
            "product_id": cart_item["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": cart_item["quantity"],
            "subtotal": item_total,
            "shop_id": shop_id,
            "image": product.get("images", [None])[0]
        })
        
        if shop_id and shop_id not in shop_shipping:
            shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
            if shop:
                shop_shipping[shop_id] = {
                    "cost": shop.get("shipping_cost", 50),
                    "free_above": shop.get("free_shipping_above", 0)
                }
                shop_names[shop_id] = shop.get("name", "Shop")
    
    # Calculate shipping
    total_shipping = 0
    for shop_id, shipping_info in shop_shipping.items():
        shop_subtotal = sum(item["subtotal"] for item in items if item.get("shop_id") == shop_id)
        if shipping_info["free_above"] > 0 and shop_subtotal >= shipping_info["free_above"]:
            pass
        else:
            total_shipping += shipping_info["cost"]
    
    total_amount = subtotal + total_shipping
    
    order_dict = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "items": items,
        "subtotal": subtotal,
        "shipping_cost": total_shipping,
        "total_amount": total_amount,
        "shipping_address": data.shipping_address,
        "shipping_city": data.shipping_city,
        "shipping_phone": data.shipping_phone,
        "shipping_name": data.shipping_name,
        "notes": data.notes,
        "status": OrderStatus.PENDING,
        "payment_method": data.payment_method,
        "payment_status": "pending",
        "shop_ids": list(shop_shipping.keys()),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await orders_collection.insert_one(order_dict)
    order_id = str(result.inserted_id)
    
    # Reduce stock
    for item in items:
        await products_collection.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock": -item["quantity"]}}
        )
    
    # Create chat rooms
    for shop_id in shop_shipping.keys():
        shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
        if shop:
            shop_owner = await users_collection.find_one({"_id": ObjectId(shop["owner_id"])})
            if shop_owner:
                shop_items_count = len([i for i in items if i.get("shop_id") == shop_id])
                context = f"Order #{order_id[-8:].upper()} - {shop_items_count} item(s)"
                await create_chat_room(
                    room_type="order",
                    reference_id=order_id,
                    participant1_id=str(user["_id"]),
                    participant1_name=user.get("name", "Customer"),
                    participant2_id=str(shop_owner["_id"]),
                    participant2_name=shop.get("name", shop_owner.get("name", "Shop")),
                    context=context
                )
    
    # Clear cart
    await cart_collection.delete_one({"user_id": str(user["_id"])})
    
    return {
        "message": "Order created",
        "order_id": order_id,
        "order_number": order_id[-8:].upper(),
        "subtotal": subtotal,
        "shipping": total_shipping,
        "total": total_amount,
        "payment_method": data.payment_method
    }

@router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    """Get user's orders"""
    cursor = orders_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    orders = []
    async for order in cursor:
        orders.append({
            "id": str(order["_id"]),
            "items": order["items"],
            "total_amount": order["total_amount"],
            "status": order.get("status"),
            "payment_status": order.get("payment_status"),
            "created_at": order.get("created_at", datetime.now(timezone.utc)).isoformat()
        })
    return {"orders": orders}

@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, user: dict = Depends(get_current_user)):
    """Get single order details"""
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    is_owner = order["user_id"] == str(user["_id"])
    is_shop_owner = False
    if not is_owner:
        for shop_id in order.get("shop_ids", []):
            shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
            if shop and shop["owner_id"] == str(user["_id"]):
                is_shop_owner = True
                break
    
    if not is_owner and not is_shop_owner and user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get shop info
    shops = {}
    for shop_id in order.get("shop_ids", []):
        shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
        if shop:
            shops[shop_id] = {"name": shop.get("name"), "phone": shop.get("phone")}
    
    return {
        "id": str(order["_id"]),
        "order_number": str(order["_id"])[-8:].upper(),
        "items": order["items"],
        "subtotal": order.get("subtotal", order.get("total_amount", 0)),
        "shipping_cost": order.get("shipping_cost", 0),
        "total_amount": order["total_amount"],
        "shipping_address": order.get("shipping_address"),
        "shipping_city": order.get("shipping_city"),
        "shipping_phone": order.get("shipping_phone"),
        "shipping_name": order.get("shipping_name"),
        "notes": order.get("notes"),
        "status": order.get("status"),
        "payment_method": order.get("payment_method"),
        "payment_status": order.get("payment_status"),
        "shops": shops,
        "created_at": order.get("created_at", datetime.now(timezone.utc)).isoformat()
    }

@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, request_data: dict, user: dict = Depends(get_current_user)):
    """Update order status"""
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if user is shop owner for this order
    is_shop_owner = False
    for shop_id in order.get("shop_ids", []):
        shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
        if shop and shop["owner_id"] == str(user["_id"]):
            is_shop_owner = True
            break
    
    if not is_shop_owner and user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_status = request_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status required")
    
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Status updated", "status": new_status}

@router.post("/orders/{order_id}/pay")
async def pay_for_order(order_id: str, user: dict = Depends(get_current_user)):
    """Mark order as paid"""
    order = await orders_collection.find_one({"_id": ObjectId(order_id), "user_id": str(user["_id"])})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": OrderStatus.PAID, "payment_status": "paid", "paid_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Payment confirmed", "status": "paid"}
