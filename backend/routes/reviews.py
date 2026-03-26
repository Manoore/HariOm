"""
Product Reviews Routes
Handles customer reviews and ratings for products
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId

from database import (
    product_reviews_collection, products_collection, 
    orders_collection, users_collection
)
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["Reviews"])

class ReviewCreate(BaseModel):
    product_id: str
    rating: int  # 1-5
    comment: str
    images: list = []

@router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Create a review for a product (must have purchased)"""
    data = await request.json()
    
    # Validate product exists
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user has purchased this product
    user_id = str(user["_id"])
    purchased = await orders_collection.find_one({
        "user_id": user_id,
        "items.product_id": product_id,
        "status": {"$in": ["paid", "received", "accepted", "processing", "shipping", "delivered"]}
    })
    
    if not purchased:
        raise HTTPException(status_code=403, detail="You must purchase this product to review it")
    
    # Check if user already reviewed
    existing_review = await product_reviews_collection.find_one({
        "product_id": product_id,
        "user_id": user_id
    })
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    rating = data.get("rating")
    if not rating or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    comment = data.get("comment", "").strip()
    images = data.get("images", [])
    
    review = {
        "product_id": product_id,
        "user_id": user_id,
        "user_name": user.get("name", "Anonymous"),
        "user_image": user.get("profile_image"),
        "rating": rating,
        "comment": comment,
        "images": images,
        "is_verified_purchase": True,
        "helpful_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await product_reviews_collection.insert_one(review)
    
    # Update product rating
    await update_product_rating(product_id)
    
    return {
        "message": "Review submitted",
        "review_id": str(result.inserted_id),
        "review": {
            "id": str(result.inserted_id),
            "rating": rating,
            "comment": comment,
            "user_name": user.get("name"),
            "created_at": review["created_at"].isoformat()
        }
    }

@router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str, limit: int = 20, skip: int = 0, sort: str = "recent"):
    """Get reviews for a product"""
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Sort options
    sort_field = "created_at"
    sort_order = -1  # descending
    if sort == "helpful":
        sort_field = "helpful_count"
    elif sort == "rating_high":
        sort_field = "rating"
    elif sort == "rating_low":
        sort_field = "rating"
        sort_order = 1
    
    cursor = product_reviews_collection.find({"product_id": product_id}).sort(sort_field, sort_order).skip(skip).limit(limit)
    
    reviews = []
    async for review in cursor:
        reviews.append({
            "id": str(review["_id"]),
            "user_name": review.get("user_name", "Anonymous"),
            "user_image": review.get("user_image"),
            "rating": review.get("rating"),
            "comment": review.get("comment"),
            "images": review.get("images", []),
            "is_verified_purchase": review.get("is_verified_purchase", False),
            "helpful_count": review.get("helpful_count", 0),
            "created_at": review.get("created_at").isoformat() if review.get("created_at") else None
        })
    
    # Get rating summary
    rating_summary = await get_rating_summary(product_id)
    
    total_reviews = await product_reviews_collection.count_documents({"product_id": product_id})
    
    return {
        "reviews": reviews,
        "total": total_reviews,
        "rating_summary": rating_summary,
        "product": {
            "id": str(product["_id"]),
            "name": product["name"],
            "rating": product.get("rating", 0),
            "total_reviews": product.get("total_reviews", 0)
        }
    }

@router.put("/reviews/{review_id}")
async def update_review(review_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Update own review"""
    review = await product_reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Cannot edit another user's review")
    
    data = await request.json()
    
    update_data = {}
    if "rating" in data:
        rating = data["rating"]
        if rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        update_data["rating"] = rating
    
    if "comment" in data:
        update_data["comment"] = data["comment"].strip()
    
    if "images" in data:
        update_data["images"] = data["images"]
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await product_reviews_collection.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": update_data}
    )
    
    # Update product rating
    await update_product_rating(review["product_id"])
    
    return {"message": "Review updated"}

@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user: dict = Depends(get_current_user)):
    """Delete own review"""
    review = await product_reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Cannot delete another user's review")
    
    product_id = review["product_id"]
    
    await product_reviews_collection.delete_one({"_id": ObjectId(review_id)})
    
    # Update product rating
    await update_product_rating(product_id)
    
    return {"message": "Review deleted"}

@router.post("/reviews/{review_id}/helpful")
async def mark_review_helpful(review_id: str, user: dict = Depends(get_current_user)):
    """Mark a review as helpful"""
    review = await product_reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Prevent self-voting
    if review["user_id"] == str(user["_id"]):
        raise HTTPException(status_code=400, detail="Cannot mark your own review as helpful")
    
    await product_reviews_collection.update_one(
        {"_id": ObjectId(review_id)},
        {"$inc": {"helpful_count": 1}}
    )
    
    return {"message": "Marked as helpful"}

@router.get("/users/me/reviews")
async def get_my_reviews(user: dict = Depends(get_current_user)):
    """Get current user's reviews"""
    cursor = product_reviews_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    
    reviews = []
    async for review in cursor:
        product = await products_collection.find_one({"_id": ObjectId(review["product_id"])})
        reviews.append({
            "id": str(review["_id"]),
            "product_id": review["product_id"],
            "product_name": product["name"] if product else "Unknown",
            "product_image": product.get("images", [None])[0] if product else None,
            "rating": review.get("rating"),
            "comment": review.get("comment"),
            "images": review.get("images", []),
            "helpful_count": review.get("helpful_count", 0),
            "created_at": review.get("created_at").isoformat() if review.get("created_at") else None
        })
    
    return {"reviews": reviews}

@router.get("/products/{product_id}/can-review")
async def can_review_product(product_id: str, user: dict = Depends(get_current_user)):
    """Check if user can review a product"""
    user_id = str(user["_id"])
    
    # Check if purchased
    purchased = await orders_collection.find_one({
        "user_id": user_id,
        "items.product_id": product_id,
        "status": {"$in": ["paid", "received", "accepted", "processing", "shipping", "delivered"]}
    })
    
    if not purchased:
        return {"can_review": False, "reason": "Must purchase to review"}
    
    # Check if already reviewed
    existing_review = await product_reviews_collection.find_one({
        "product_id": product_id,
        "user_id": user_id
    })
    
    if existing_review:
        return {"can_review": False, "reason": "Already reviewed", "review_id": str(existing_review["_id"])}
    
    return {"can_review": True}

# Helper functions
async def update_product_rating(product_id: str):
    """Recalculate and update product rating"""
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1}
        }}
    ]
    
    result = await product_reviews_collection.aggregate(pipeline).to_list(1)
    
    if result:
        avg_rating = round(result[0]["avg_rating"], 1)
        total_reviews = result[0]["total_reviews"]
    else:
        avg_rating = 0
        total_reviews = 0
    
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"rating": avg_rating, "total_reviews": total_reviews}}
    )

async def get_rating_summary(product_id: str):
    """Get rating distribution for a product"""
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {
            "_id": "$rating",
            "count": {"$sum": 1}
        }}
    ]
    
    result = await product_reviews_collection.aggregate(pipeline).to_list(5)
    
    summary = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for item in result:
        summary[item["_id"]] = item["count"]
    
    return summary
