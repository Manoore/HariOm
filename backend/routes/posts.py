"""
Posts/Social Feed Routes
Handles priest posts, comments, and likes
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from database import (
    priest_posts_collection, post_likes_collection, 
    post_comments_collection, users_collection
)
from models import UserRole
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/posts", tags=["Posts"])

@router.get("")
async def get_posts(limit: int = 20, skip: int = 0):
    """Get all posts (public feed)"""
    cursor = priest_posts_collection.find().sort("created_at", -1).skip(skip).limit(limit)
    posts = []
    async for post in cursor:
        posts.append({
            "id": str(post["_id"]),
            "priest_id": post.get("priest_id"),
            "priest_name": post.get("priest_name"),
            "content": post.get("content"),
            "image_url": post.get("image_url"),
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })
    return {"posts": posts}

@router.get("/feed")
async def get_posts_feed(limit: int = 20, skip: int = 0):
    """Get all posts (public feed) - alias for /posts"""
    cursor = priest_posts_collection.find().sort("created_at", -1).skip(skip).limit(limit)
    posts = []
    async for post in cursor:
        posts.append({
            "id": str(post["_id"]),
            "priest_id": post.get("priest_id"),
            "priest_name": post.get("priest_name"),
            "content": post.get("content"),
            "image_url": post.get("image_url"),
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
        })
    return {"posts": posts}

@router.post("")
async def create_post(request: Request, user: dict = Depends(require_role([UserRole.PRIEST, UserRole.ADMIN]))):
    """Create a new post"""
    data = await request.json()
    
    post = {
        "priest_id": str(user["_id"]),
        "priest_name": user.get("name"),
        "content": data.get("content"),
        "image_url": data.get("image_url"),
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_posts_collection.insert_one(post)
    return {"message": "Post created", "post_id": str(result.inserted_id)}

@router.get("/{post_id}")
async def get_post(post_id: str):
    """Get single post"""
    post = await priest_posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {
        "id": str(post["_id"]),
        "priest_id": post.get("priest_id"),
        "priest_name": post.get("priest_name"),
        "content": post.get("content"),
        "image_url": post.get("image_url"),
        "likes_count": post.get("likes_count", 0),
        "comments_count": post.get("comments_count", 0),
        "created_at": post.get("created_at").isoformat() if post.get("created_at") else None
    }

@router.get("/{post_id}/comments")
async def get_comments(post_id: str, limit: int = 20):
    """Get comments for a post"""
    cursor = post_comments_collection.find({"post_id": post_id}).sort("created_at", -1).limit(limit)
    comments = []
    async for comment in cursor:
        comments.append({
            "id": str(comment["_id"]),
            "user_id": comment.get("user_id"),
            "user_name": comment.get("user_name"),
            "text": comment.get("text"),
            "image_url": comment.get("image_url"),
            "created_at": comment.get("created_at").isoformat() if comment.get("created_at") else None
        })
    return {"comments": comments}

@router.post("/{post_id}/comments")
async def add_comment(post_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Add a comment to a post"""
    post = await priest_posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    data = await request.json()
    text = data.get("text", "").strip()
    image_url = data.get("image_url")
    
    if not text and not image_url:
        raise HTTPException(status_code=400, detail="Comment text or image required")
    
    comment = {
        "post_id": post_id,
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "User"),
        "text": text,
        "image_url": image_url,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await post_comments_collection.insert_one(comment)
    
    # Update comment count
    await priest_posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"comments_count": 1}}
    )
    
    return {
        "id": str(result.inserted_id),
        "user_name": user.get("name"),
        "text": text,
        "image_url": image_url,
        "created_at": comment["created_at"].isoformat()
    }

@router.delete("/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: str, comment_id: str, user: dict = Depends(get_current_user)):
    """Delete a comment"""
    comment = await post_comments_collection.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment["user_id"] != str(user["_id"]) and user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await post_comments_collection.delete_one({"_id": ObjectId(comment_id)})
    
    # Update comment count
    await priest_posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"comments_count": -1}}
    )
    
    return {"message": "Comment deleted"}

@router.post("/{post_id}/like")
async def toggle_like(post_id: str, user: dict = Depends(get_current_user)):
    """Toggle like on a post"""
    post = await priest_posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    user_id = str(user["_id"])
    existing_like = await post_likes_collection.find_one({
        "post_id": post_id,
        "user_id": user_id
    })
    
    if existing_like:
        # Unlike
        await post_likes_collection.delete_one({"_id": existing_like["_id"]})
        await priest_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"likes_count": -1}}
        )
        liked = False
    else:
        # Like
        await post_likes_collection.insert_one({
            "post_id": post_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc)
        })
        await priest_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"likes_count": 1}}
        )
        liked = True
    
    updated_post = await priest_posts_collection.find_one({"_id": ObjectId(post_id)})
    
    return {
        "liked": liked,
        "likes_count": updated_post.get("likes_count", 0)
    }

@router.get("/{post_id}/like-status")
async def get_like_status(post_id: str, user: dict = Depends(get_current_user)):
    """Check if user has liked a post"""
    existing_like = await post_likes_collection.find_one({
        "post_id": post_id,
        "user_id": str(user["_id"])
    })
    return {"liked": existing_like is not None}
