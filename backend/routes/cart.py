"""
Cart Routes
Handles shopping cart operations
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId

from database import cart_collection, products_collection, shops_collection
from auth import get_current_user

router = APIRouter(prefix="/api/cart", tags=["Cart"])

class CartAddItem(BaseModel):
    product_id: str
    quantity: int = 1

class CartUpdateItem(BaseModel):
    product_id: str
    quantity: int

@router.get("")
async def get_cart(user: dict = Depends(get_current_user)):
    """Get user's cart"""
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    if not cart:
        return {"items": [], "total": 0}
    
    items = []
    total = 0
    
    for cart_item in cart.get("items", []):
        product = await products_collection.find_one({"_id": ObjectId(cart_item["product_id"])})
        if product:
            item_total = product["price"] * cart_item["quantity"]
            total += item_total
            items.append({
                "product_id": cart_item["product_id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": cart_item["quantity"],
                "subtotal": item_total,
                "image": product.get("images", [None])[0],
                "stock": product["stock"]
            })
    
    return {"items": items, "total": total}

@router.post("/add")
async def add_to_cart(data: CartAddItem, user: dict = Depends(get_current_user)):
    """Add item to cart"""
    product = await products_collection.find_one({"_id": ObjectId(data.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["stock"] < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    
    if cart:
        existing_item = next((item for item in cart["items"] if item["product_id"] == data.product_id), None)
        
        if existing_item:
            new_quantity = existing_item["quantity"] + data.quantity
            if new_quantity > product["stock"]:
                raise HTTPException(status_code=400, detail="Insufficient stock")
            
            await cart_collection.update_one(
                {"user_id": str(user["_id"]), "items.product_id": data.product_id},
                {"$set": {"items.$.quantity": new_quantity, "updated_at": datetime.now(timezone.utc)}}
            )
        else:
            await cart_collection.update_one(
                {"user_id": str(user["_id"])},
                {
                    "$push": {"items": {"product_id": data.product_id, "quantity": data.quantity}},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
    else:
        await cart_collection.insert_one({
            "user_id": str(user["_id"]),
            "items": [{"product_id": data.product_id, "quantity": data.quantity}],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
    
    return {"message": "Item added to cart"}

@router.put("/update")
async def update_cart_item(data: CartUpdateItem, user: dict = Depends(get_current_user)):
    """Update cart item quantity"""
    if data.quantity <= 0:
        await cart_collection.update_one(
            {"user_id": str(user["_id"])},
            {"$pull": {"items": {"product_id": data.product_id}}}
        )
        return {"message": "Item removed from cart"}
    
    product = await products_collection.find_one({"_id": ObjectId(data.product_id)})
    if product and data.quantity > product["stock"]:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    await cart_collection.update_one(
        {"user_id": str(user["_id"]), "items.product_id": data.product_id},
        {"$set": {"items.$.quantity": data.quantity, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Cart updated"}

@router.delete("/clear")
async def clear_cart(user: dict = Depends(get_current_user)):
    """Clear entire cart"""
    await cart_collection.delete_one({"user_id": str(user["_id"])})
    return {"message": "Cart cleared"}

@router.get("/summary")
async def get_cart_summary(user: dict = Depends(get_current_user)):
    """Get cart with shipping calculation"""
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    if not cart or not cart.get("items"):
        return {"items": [], "subtotal": 0, "shipping": 0, "total": 0}
    
    items = []
    subtotal = 0
    shop_shipping = {}
    
    for cart_item in cart["items"]:
        product = await products_collection.find_one({"_id": ObjectId(cart_item["product_id"])})
        if not product:
            continue
        
        item_total = product["price"] * cart_item["quantity"]
        subtotal += item_total
        
        shop_id = product.get("shop_id")
        items.append({
            "product_id": cart_item["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": cart_item["quantity"],
            "subtotal": item_total,
            "stock": product["stock"],
            "shop_id": shop_id,
            "shop_name": product.get("shop_name", "Shop"),
            "image": product.get("images", [None])[0]
        })
        
        if shop_id and shop_id not in shop_shipping:
            shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
            if shop:
                shop_shipping[shop_id] = {
                    "name": shop.get("name"),
                    "cost": shop.get("shipping_cost", 50),
                    "free_above": shop.get("free_shipping_above", 0)
                }
    
    # Calculate shipping
    total_shipping = 0
    shipping_breakdown = []
    for shop_id, shipping_info in shop_shipping.items():
        shop_subtotal = sum(item["subtotal"] for item in items if item.get("shop_id") == shop_id)
        if shipping_info["free_above"] > 0 and shop_subtotal >= shipping_info["free_above"]:
            shipping_breakdown.append({"shop": shipping_info["name"], "cost": 0, "reason": "Free shipping"})
        else:
            total_shipping += shipping_info["cost"]
            free_msg = f"Free above ₹{shipping_info['free_above']}" if shipping_info["free_above"] > 0 else ""
            shipping_breakdown.append({"shop": shipping_info["name"], "cost": shipping_info["cost"], "reason": free_msg})
    
    return {
        "items": items,
        "item_count": sum(item["quantity"] for item in items),
        "subtotal": subtotal,
        "shipping": total_shipping,
        "shipping_breakdown": shipping_breakdown,
        "total": subtotal + total_shipping
    }
