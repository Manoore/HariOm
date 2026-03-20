"""
Order Routes
Handles checkout and order management with Stripe payment integration
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
import stripe
import os

from database import (
    orders_collection, cart_collection, products_collection, 
    shops_collection, users_collection, chat_rooms_collection, chat_messages_collection
)
from models import OrderStatus, UserRole
from auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["Orders"])

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

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
    """Create order and Stripe checkout session"""
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = []
    subtotal = 0
    shop_shipping = {}
    shop_names = {}
    stripe_line_items = []
    
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
            "image": product.get("images", [None])[0] if product.get("images") else None
        })
        
        # Create Stripe line item
        stripe_line_items.append({
            "price_data": {
                "currency": "inr",
                "product_data": {
                    "name": product["name"],
                    "images": product.get("images", [])[:1] if product.get("images") else [],
                },
                "unit_amount": int(product["price"] * 100),  # Stripe uses smallest currency unit (paise)
            },
            "quantity": cart_item["quantity"],
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
    
    # Add shipping as a line item if applicable
    if total_shipping > 0:
        stripe_line_items.append({
            "price_data": {
                "currency": "inr",
                "product_data": {
                    "name": "Shipping",
                },
                "unit_amount": int(total_shipping * 100),
            },
            "quantity": 1,
        })
    
    total_amount = subtotal + total_shipping
    
    # Create order in pending state
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
    
    # Get frontend URL for redirect
    frontend_url = os.environ.get("FRONTEND_URL", "https://pooja-live.preview.emergentagent.com")
    
    # Create Stripe checkout session
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=stripe_line_items,
            mode="payment",
            success_url=f"{frontend_url}?payment=success&order_id={order_id}",
            cancel_url=f"{frontend_url}?payment=cancelled&order_id={order_id}",
            metadata={
                "order_id": order_id,
                "user_id": str(user["_id"])
            },
            customer_email=user.get("email"),
        )
        
        # Store stripe session id
        await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"stripe_session_id": checkout_session.id}}
        )
        
        return {
            "message": "Checkout session created",
            "order_id": order_id,
            "order_number": order_id[-8:].upper(),
            "subtotal": subtotal,
            "shipping": total_shipping,
            "total": total_amount,
            "payment_method": data.payment_method,
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except stripe.error.StripeError as e:
        # If Stripe fails, delete the order
        await orders_collection.delete_one({"_id": ObjectId(order_id)})
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")


@router.post("/payment/confirm/{order_id}")
async def confirm_payment(order_id: str, user: dict = Depends(get_current_user)):
    """Confirm payment was successful and finalize order"""
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order.get("payment_status") == "paid":
        return {"message": "Payment already confirmed", "order_id": order_id}
    
    # Verify with Stripe if session exists
    session_id = order.get("stripe_session_id")
    if session_id:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status != "paid":
                raise HTTPException(status_code=400, detail="Payment not completed")
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Could not verify payment: {str(e)}")
    
    # Update order status
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "payment_status": "paid",
                "status": OrderStatus.PAID,
                "paid_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Reduce stock (only after successful payment)
    for item in order["items"]:
        await products_collection.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock": -item["quantity"]}}
        )
    
    # Create chat rooms with shop owners
    for shop_id in order.get("shop_ids", []):
        shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
        if shop:
            shop_owner = await users_collection.find_one({"_id": ObjectId(shop["owner_id"])})
            if shop_owner:
                shop_items_count = len([i for i in order["items"] if i.get("shop_id") == shop_id])
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
        "message": "Payment confirmed",
        "order_id": order_id,
        "order_number": order_id[-8:].upper(),
        "status": "confirmed"
    }


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            # For testing without webhook signature
            import json
            event = json.loads(payload)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")
        
        if order_id:
            # Update order status
            await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": OrderStatus.PAID,
                        "paid_at": datetime.now(timezone.utc),
                        "stripe_payment_intent": session.get("payment_intent")
                    }
                }
            )
            
            # Get order and reduce stock
            order = await orders_collection.find_one({"_id": ObjectId(order_id)})
            if order and order.get("payment_status") == "paid":
                for item in order["items"]:
                    await products_collection.update_one(
                        {"_id": ObjectId(item["product_id"])},
                        {"$inc": {"stock": -item["quantity"]}}
                    )
    
    elif event["type"] == "checkout.session.expired":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")
        
        if order_id:
            # Mark order as cancelled
            await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {
                    "$set": {
                        "payment_status": "expired",
                        "status": OrderStatus.CANCELLED
                    }
                }
            )
    
    return {"status": "ok"}

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
