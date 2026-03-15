"""
Products/Marketplace Routes
Handles public product listing and categories
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from bson import ObjectId

from database import products_collection, product_reviews_collection

router = APIRouter(prefix="/api", tags=["Products"])

@router.get("/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    shop_id: Optional[str] = None,
    limit: int = 50
):
    """Get all products with optional filters"""
    query = {}
    
    if category:
        query["category"] = category
    if shop_id:
        query["shop_id"] = shop_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = products_collection.find(query).limit(limit)
    products = []
    async for product in cursor:
        products.append({
            "id": str(product["_id"]),
            "shop_id": product.get("shop_id"),
            "shop_name": product.get("shop_name", "Unknown"),
            "name": product["name"],
            "description": product["description"],
            "price": product["price"],
            "category": product["category"],
            "stock": product["stock"],
            "images": product.get("images", []),
            "video_url": product.get("video_url"),
            "rating": product.get("rating", 0),
            "total_reviews": product.get("total_reviews", 0)
        })
    
    return {"products": products}

@router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product details"""
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get reviews
    reviews_cursor = product_reviews_collection.find({"product_id": product_id}).sort("created_at", -1).limit(10)
    reviews = []
    async for review in reviews_cursor:
        reviews.append({
            "id": str(review["_id"]),
            "user_name": review.get("user_name"),
            "rating": review.get("rating"),
            "comment": review.get("comment"),
            "images": review.get("images", []),
            "created_at": review.get("created_at").isoformat() if review.get("created_at") else None
        })
    
    return {
        "id": str(product["_id"]),
        "shop_id": product.get("shop_id"),
        "shop_name": product.get("shop_name"),
        "name": product["name"],
        "description": product["description"],
        "price": product["price"],
        "category": product["category"],
        "stock": product["stock"],
        "images": product.get("images", []),
        "video_url": product.get("video_url"),
        "rating": product.get("rating", 0),
        "total_reviews": product.get("total_reviews", 0),
        "reviews": reviews
    }

@router.get("/product-categories")
async def get_product_categories():
    """Get all product categories"""
    categories = [
        "Pooja Items", "Idols & Statues", "Books & Scriptures",
        "Incense & Dhoop", "Flowers & Garlands", "Clothing", 
        "Accessories", "Other"
    ]
    return {"categories": categories}
