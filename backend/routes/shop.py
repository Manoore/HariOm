"""
Shop Owner Routes
Handles shop registration, products, orders, inventory, and profile management
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from database import (
    shops_collection, products_collection, orders_collection, 
    users_collection, chat_rooms_collection
)
from models import ProductCreate, UserRole
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/shop", tags=["Shop Owner"])

@router.post("/register")
async def register_shop(request: Request, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Register a new shop"""
    existing_shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if existing_shop:
        raise HTTPException(status_code=400, detail="Shop already registered")
    
    data = await request.json()
    
    shop_dict = {
        "owner_id": str(user["_id"]),
        "name": data.get("name"),
        "description": data.get("description"),
        "address": data.get("address"),
        "city": data.get("city"),
        "phone": data.get("phone"),
        "email": user.get("email"),
        "shipping_cost": data.get("shipping_cost", 50),
        "free_shipping_above": data.get("free_shipping_above", 0),
        "rating": 0.0,
        "is_verified": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await shops_collection.insert_one(shop_dict)
    return {"message": "Shop registered", "shop_id": str(result.inserted_id)}

@router.post("/products")
async def add_product(data: ProductCreate, user: dict = Depends(require_role([UserRole.SHOP_OWNER, UserRole.ADMIN]))):
    """Add a new product"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    product_dict = {
        "shop_id": str(shop["_id"]),
        "shop_name": shop["name"],
        "name": data.name,
        "description": data.description,
        "price": data.price,
        "category": data.category,
        "stock": data.stock,
        "images": data.images,
        "video_url": data.video_url,
        "rating": 0.0,
        "total_reviews": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await products_collection.insert_one(product_dict)
    return {"message": "Product added", "product_id": str(result.inserted_id)}

@router.get("/my-products")
async def get_my_products(user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Get all products for shop owner"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    cursor = products_collection.find({"shop_id": str(shop["_id"])})
    products = []
    async for product in cursor:
        products.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "description": product["description"],
            "price": product["price"],
            "category": product["category"],
            "stock": product["stock"],
            "images": product.get("images", []),
            "video_url": product.get("video_url"),
            "rating": product.get("rating", 0)
        })
    return {"products": products}

@router.get("/profile")
async def get_shop_profile(user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Get shop profile"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return {
        "id": str(shop["_id"]),
        "name": shop.get("name"),
        "description": shop.get("description"),
        "address": shop.get("address"),
        "city": shop.get("city"),
        "phone": shop.get("phone"),
        "email": shop.get("email", user.get("email")),
        "logo": shop.get("logo"),
        "banner": shop.get("banner"),
        "shipping_cost": shop.get("shipping_cost", 50),
        "free_shipping_above": shop.get("free_shipping_above", 0),
        "rating": shop.get("rating", 0),
        "is_verified": shop.get("is_verified", False),
        "approval_status": shop.get("approval_status", "pending"),
        "rejection_reason": shop.get("rejection_reason", ""),
        "created_at": shop.get("created_at", datetime.now(timezone.utc)).isoformat()
    }

@router.put("/profile")
async def update_shop_profile(request: Request, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Update shop profile"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    data = await request.json()
    allowed_fields = ["name", "description", "address", "city", "phone", "email", 
                      "logo", "banner", "shipping_cost", "free_shipping_above"]
    
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await shops_collection.update_one(
        {"_id": shop["_id"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated"}

@router.get("/orders")
async def get_shop_orders(
    status: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.SHOP_OWNER]))
):
    """Get all orders for shop owner"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop_id = str(shop["_id"])
    
    query = {"shop_ids": shop_id}
    if status:
        query["status"] = status
    
    cursor = orders_collection.find(query).sort("created_at", -1)
    orders = []
    async for order in cursor:
        customer = await users_collection.find_one({"_id": ObjectId(order["user_id"])}) if ObjectId.is_valid(order["user_id"]) else None
        
        shop_items = [item for item in order["items"] if item.get("shop_id") == shop_id]
        shop_total = sum(item.get("subtotal", 0) for item in shop_items)
        
        orders.append({
            "id": str(order["_id"]),
            "order_number": str(order["_id"])[-8:].upper(),
            "customer_name": customer.get("name", "Unknown") if customer else "Unknown",
            "customer_phone": customer.get("phone", "N/A") if customer else "N/A",
            "customer_email": customer.get("email", "") if customer else "",
            "items": shop_items,
            "item_count": len(shop_items),
            "shop_total": shop_total,
            "shipping_address": order.get("shipping_address"),
            "status": order.get("status"),
            "payment_status": order.get("payment_status"),
            "payment_method": order.get("payment_method"),
            "created_at": order.get("created_at", datetime.now(timezone.utc)).isoformat()
        })
    
    return {"orders": orders}

@router.get("/dashboard")
async def get_shop_dashboard(user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Get dashboard statistics"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop_id = str(shop["_id"])
    
    # Get product count
    product_count = await products_collection.count_documents({"shop_id": shop_id})
    low_stock_count = await products_collection.count_documents({"shop_id": shop_id, "stock": {"$lt": 10}})
    
    # Get orders statistics
    all_orders = await orders_collection.count_documents({"shop_ids": shop_id})
    pending_orders = await orders_collection.count_documents({"shop_ids": shop_id, "status": "pending"})
    processing_orders = await orders_collection.count_documents({"shop_ids": shop_id, "status": "paid"})
    shipped_orders = await orders_collection.count_documents({"shop_ids": shop_id, "status": "shipped"})
    delivered_orders = await orders_collection.count_documents({"shop_ids": shop_id, "status": "delivered"})
    
    # Calculate revenue
    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Today's revenue
    today_pipeline = [
        {"$match": {"shop_ids": shop_id, "status": {"$in": ["paid", "shipped", "delivered"]}, "created_at": {"$gte": start_of_today}}},
        {"$unwind": "$items"},
        {"$match": {"items.shop_id": shop_id}},
        {"$group": {"_id": None, "total": {"$sum": "$items.subtotal"}}}
    ]
    today_result = await orders_collection.aggregate(today_pipeline).to_list(1)
    today_revenue = today_result[0]["total"] if today_result else 0
    
    # Monthly revenue
    month_pipeline = [
        {"$match": {"shop_ids": shop_id, "status": {"$in": ["paid", "shipped", "delivered"]}, "created_at": {"$gte": start_of_month}}},
        {"$unwind": "$items"},
        {"$match": {"items.shop_id": shop_id}},
        {"$group": {"_id": None, "total": {"$sum": "$items.subtotal"}}}
    ]
    month_result = await orders_collection.aggregate(month_pipeline).to_list(1)
    monthly_revenue = month_result[0]["total"] if month_result else 0
    
    # Total revenue
    total_pipeline = [
        {"$match": {"shop_ids": shop_id, "status": {"$in": ["paid", "shipped", "delivered"]}}},
        {"$unwind": "$items"},
        {"$match": {"items.shop_id": shop_id}},
        {"$group": {"_id": None, "total": {"$sum": "$items.subtotal"}}}
    ]
    total_result = await orders_collection.aggregate(total_pipeline).to_list(1)
    total_revenue = total_result[0]["total"] if total_result else 0
    
    # Recent orders
    recent_cursor = orders_collection.find({"shop_ids": shop_id}).sort("created_at", -1).limit(5)
    recent_orders = []
    async for order in recent_cursor:
        customer = await users_collection.find_one({"_id": ObjectId(order["user_id"])}) if ObjectId.is_valid(order["user_id"]) else None
        shop_items = [item for item in order["items"] if item.get("shop_id") == shop_id]
        recent_orders.append({
            "id": str(order["_id"]),
            "order_number": str(order["_id"])[-8:].upper(),
            "customer_name": customer.get("name", "Unknown") if customer else "Unknown",
            "items_count": len(shop_items),
            "total": sum(item.get("subtotal", 0) for item in shop_items),
            "status": order.get("status"),
            "created_at": order.get("created_at", datetime.now(timezone.utc)).isoformat()
        })
    
    # Top selling products
    top_pipeline = [
        {"$match": {"shop_ids": shop_id, "status": {"$in": ["paid", "shipped", "delivered"]}}},
        {"$unwind": "$items"},
        {"$match": {"items.shop_id": shop_id}},
        {"$group": {"_id": "$items.product_id", "name": {"$first": "$items.name"}, "sold": {"$sum": "$items.quantity"}, "revenue": {"$sum": "$items.subtotal"}}},
        {"$sort": {"sold": -1}},
        {"$limit": 5}
    ]
    top_products = await orders_collection.aggregate(top_pipeline).to_list(5)
    
    return {
        "stats": {
            "total_products": product_count,
            "low_stock": low_stock_count,
            "total_orders": all_orders,
            "pending_orders": pending_orders,
            "processing_orders": processing_orders,
            "shipped_orders": shipped_orders,
            "delivered_orders": delivered_orders,
            "today_revenue": today_revenue,
            "monthly_revenue": monthly_revenue,
            "total_revenue": total_revenue
        },
        "recent_orders": recent_orders,
        "top_products": [{"id": p["_id"], "name": p["name"], "sold": p["sold"], "revenue": p["revenue"]} for p in top_products]
    }

@router.put("/products/{product_id}")
async def update_product(product_id: str, request: Request, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Update a product"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    product = await products_collection.find_one({"_id": ObjectId(product_id), "shop_id": str(shop["_id"])})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    data = await request.json()
    allowed_fields = ["name", "description", "price", "category", "stock", "images", "video_url"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    
    return {"message": "Product updated"}

@router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Delete a product"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    result = await products_collection.delete_one({"_id": ObjectId(product_id), "shop_id": str(shop["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}

@router.get("/inventory")
async def get_shop_inventory(user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Get inventory with low stock alerts"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    cursor = products_collection.find({"shop_id": str(shop["_id"])}).sort("stock", 1)
    products = []
    async for product in cursor:
        products.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "category": product["category"],
            "price": product["price"],
            "stock": product["stock"],
            "images": product.get("images", []),
            "is_low_stock": product["stock"] < 10,
            "is_out_of_stock": product["stock"] == 0
        })
    
    return {
        "products": products,
        "total": len(products),
        "low_stock_count": sum(1 for p in products if p["is_low_stock"]),
        "out_of_stock_count": sum(1 for p in products if p["is_out_of_stock"])
    }

@router.put("/products/{product_id}/stock")
async def update_product_stock(product_id: str, request: Request, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Update product stock"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    data = await request.json()
    new_stock = data.get("stock", 0)
    
    result = await products_collection.update_one(
        {"_id": ObjectId(product_id), "shop_id": str(shop["_id"])},
        {"$set": {"stock": new_stock, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Stock updated"}



# ===================== PUBLIC MARKETPLACE ROUTES =====================

# Create a separate router for public marketplace (without /shop prefix)
from fastapi import APIRouter as MarketAPIRouter
marketplace_router = MarketAPIRouter(prefix="/api", tags=["Marketplace"])


@marketplace_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get all products from approved shops"""
    # First, get all approved shop IDs
    approved_shops_query = {
        "$or": [
            {"approval_status": "approved"},
            {"is_verified": True, "approval_status": {"$exists": False}}
        ]
    }
    approved_shops_cursor = shops_collection.find(approved_shops_query, {"_id": 1})
    approved_shop_ids = []
    async for shop in approved_shops_cursor:
        approved_shop_ids.append(str(shop["_id"]))
    
    # Only show products from approved shops
    query = {"shop_id": {"$in": approved_shop_ids}} if approved_shop_ids else {"shop_id": {"$in": []}}
    
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    # If location filter is provided, first get approved shops in that location
    if location:
        location_query = {
            "$and": [
                approved_shops_query,
                {"$or": [
                    {"city": {"$regex": location, "$options": "i"}},
                    {"state": {"$regex": location, "$options": "i"}},
                    {"address": {"$regex": location, "$options": "i"}},
                    {"pincode": location},
                    {"location.city": {"$regex": location, "$options": "i"}},
                    {"location.state": {"$regex": location, "$options": "i"}}
                ]}
            ]
        }
        shops_cursor = shops_collection.find(location_query)
        shop_ids_in_location = []
        async for shop in shops_cursor:
            shop_ids_in_location.append(str(shop["_id"]))
        
        if shop_ids_in_location:
            query["shop_id"] = {"$in": shop_ids_in_location}
        else:
            return {"products": [], "total": 0}
    
    cursor = products_collection.find(query).skip(skip).limit(limit)
    products = []
    async for product in cursor:
        shop = await shops_collection.find_one({"_id": ObjectId(product["shop_id"])}) if product.get("shop_id") else None
        products.append({
            "id": str(product["_id"]),
            "shop_id": product["shop_id"],
            "shop_name": product.get("shop_name", "Unknown"),
            "shop_city": shop.get("city", "") if shop else "",
            "shop_state": shop.get("state", "") if shop else "",
            "name": product["name"],
            "description": product["description"],
            "price": product["price"],
            "category": product["category"],
            "stock": product["stock"],
            "images": product.get("images", []),
            "rating": product.get("rating", 0),
            "total_reviews": product.get("total_reviews", 0)
        })
    return {"products": products, "total": await products_collection.count_documents(query)}


@marketplace_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID"""
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": str(product["_id"]),
        "shop_id": product["shop_id"],
        "shop_name": product.get("shop_name", "Unknown"),
        "name": product["name"],
        "description": product["description"],
        "price": product["price"],
        "category": product["category"],
        "stock": product["stock"],
        "images": product.get("images", []),
        "rating": product.get("rating", 0),
        "total_reviews": product.get("total_reviews", 0)
    }


@marketplace_router.get("/product-categories")
async def get_product_categories():
    """Get all product categories"""
    categories = await products_collection.distinct("category")
    return {"categories": categories}
