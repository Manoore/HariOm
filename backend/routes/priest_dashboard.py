"""
Priest Dashboard Routes Module
Contains all priest dashboard-related endpoints for the Divine App.
Includes: classes, availability, analytics, content, streams, portfolio, services, earnings, posts
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from database import (
    users_collection, priests_collection, priest_classes_collection,
    priest_availability_collection, priest_content_collection,
    priest_streams_collection, bookings_collection, reviews_collection,
    priest_services_collection, priest_posts_collection, class_enrollments_collection,
    payment_transactions_collection
)
from models import UserRole
from auth import require_role

router = APIRouter(prefix="/api/priest", tags=["Priest Dashboard"])

# ===================== HELPER FUNCTIONS =====================

async def get_priest_profile(user: dict):
    """Helper to get priest profile for current user"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    return priest


# ===================== PRIEST CLASSES =====================

@router.get("/classes")
async def get_priest_classes(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get all classes created by priest"""
    priest = await get_priest_profile(user)
    
    cursor = priest_classes_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    classes = []
    async for cls in cursor:
        classes.append({
            "id": str(cls["_id"]),
            "title": cls["title"],
            "description": cls["description"],
            "class_type": cls["class_type"],
            "location_type": cls.get("location_type", "online"),
            "temple_name": cls.get("temple_name", ""),
            "duration_minutes": cls["duration_minutes"],
            "price": cls["price"],
            "max_students": cls["max_students"],
            "enrolled_count": cls.get("enrolled_count", 0),
            "schedule": cls.get("schedule", []),
            "category": cls.get("category", "General"),
            "frequency": cls.get("frequency", "weekly"),
            "schedule_day": cls.get("schedule_day", ""),
            "schedule_time": cls.get("schedule_time", ""),
            "is_active": cls.get("is_active", True),
            "created_at": cls["created_at"].isoformat() if isinstance(cls["created_at"], datetime) else cls["created_at"]
        })
    return {"classes": classes}


@router.post("/classes")
async def create_priest_class(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Create a new class"""
    priest = await get_priest_profile(user)
    data = await request.json()
    
    # Determine if class is free based on price
    price = data.get("price", 0)
    is_free = data.get("is_free", price == 0)
    if is_free:
        price = 0  # Ensure price is 0 for free classes
    
    class_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "title": data.get("title"),
        "description": data.get("description", ""),
        "class_type": data.get("class_type", "online"),  # online / offline / both
        "location_type": data.get("location_type", "online"),  # online, home_visit, temple
        "temple_name": data.get("temple_name", ""),  # If location_type is temple
        "duration_minutes": data.get("duration_minutes", 60),
        "is_free": is_free,
        "price": price,
        "max_students": data.get("max_students", 20),
        "available_slots": data.get("max_students", 20),  # Track remaining slots
        "enrolled_count": 0,
        "enrollments": [],  # List of enrolled user IDs
        "schedule": data.get("schedule", []),  # [{"day": "Monday", "time": "10:00"}]
        "category": data.get("category", "General"),
        "frequency": data.get("frequency", "weekly"),  # once, daily, weekly, biweekly, monthly
        "schedule_day": data.get("schedule_day", ""),  # Day of week for weekly/biweekly
        "schedule_time": data.get("schedule_time", ""),  # Time of class
        "meeting_link": data.get("meeting_link", ""),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_classes_collection.insert_one(class_dict)
    return {"message": "Class created", "class_id": str(result.inserted_id)}


@router.put("/classes/{class_id}")
async def update_priest_class(class_id: str, request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update a class"""
    priest = await get_priest_profile(user)
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    
    if not cls or cls["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Class not found")
    
    data = await request.json()
    
    # Handle is_free and price together
    if "is_free" in data:
        if data["is_free"]:
            data["price"] = 0
    elif "price" in data:
        data["is_free"] = data["price"] == 0
    
    # Update available_slots if max_students changed
    if "max_students" in data:
        current_enrolled = cls.get("enrolled_count", 0)
        new_max = data["max_students"]
        data["available_slots"] = max(0, new_max - current_enrolled)
    
    update_data = {k: v for k, v in data.items() if k in [
        "title", "description", "class_type", "duration_minutes", 
        "is_free", "price", "max_students", "available_slots", "schedule", 
        "category", "is_active", "frequency", "schedule_day", "schedule_time",
        "meeting_link", "location_type", "temple_name"
    ]}
    
    await priest_classes_collection.update_one(
        {"_id": ObjectId(class_id)},
        {"$set": update_data}
    )
    return {"message": "Class updated"}


@router.delete("/classes/{class_id}")
async def delete_priest_class(class_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a class"""
    priest = await get_priest_profile(user)
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    
    if not cls or cls["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Class not found")
    
    await priest_classes_collection.delete_one({"_id": ObjectId(class_id)})
    return {"message": "Class deleted"}


# ===================== PRIEST AVAILABILITY =====================

@router.get("/availability")
async def get_priest_availability(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's availability settings"""
    priest = await get_priest_profile(user)
    
    availability = await priest_availability_collection.find_one({"priest_id": str(priest["_id"])})
    
    if not availability:
        # Return default availability
        return {
            "online_slots": [],
            "offline_slots": [],
            "blocked_dates": [],
            "default_duration": 60
        }
    
    return {
        "online_slots": availability.get("online_slots", []),
        "offline_slots": availability.get("offline_slots", []),
        "blocked_dates": availability.get("blocked_dates", []),
        "default_duration": availability.get("default_duration", 60)
    }


@router.post("/availability")
async def update_priest_availability(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update priest's availability"""
    priest = await get_priest_profile(user)
    data = await request.json()
    
    availability_dict = {
        "priest_id": str(priest["_id"]),
        "online_slots": data.get("online_slots", []),  # [{"day": "Monday", "start": "09:00", "end": "17:00"}]
        "offline_slots": data.get("offline_slots", []),
        "blocked_dates": data.get("blocked_dates", []),  # ["2026-03-20", "2026-03-21"]
        "default_duration": data.get("default_duration", 60),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await priest_availability_collection.update_one(
        {"priest_id": str(priest["_id"])},
        {"$set": availability_dict},
        upsert=True
    )
    return {"message": "Availability updated"}


# ===================== PRIEST ANALYTICS =====================

@router.get("/analytics")
async def get_priest_analytics(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's dashboard analytics"""
    priest = await get_priest_profile(user)
    priest_id = str(priest["_id"])
    
    # Get booking stats
    all_bookings = await bookings_collection.find({"priest_id": priest_id}).to_list(None)
    
    total_bookings = len(all_bookings)
    pending_bookings = len([b for b in all_bookings if b["status"] == "pending"])
    confirmed_bookings = len([b for b in all_bookings if b["status"] == "confirmed"])
    completed_bookings = len([b for b in all_bookings if b["status"] == "completed"])
    cancelled_bookings = len([b for b in all_bookings if b["status"] == "cancelled"])
    
    # Calculate earnings
    total_earnings = sum(b.get("price", 0) for b in all_bookings if b["status"] == "completed")
    
    # This month's earnings
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_bookings = [b for b in all_bookings if b["status"] == "completed" and b.get("created_at", now) >= month_start]
    monthly_earnings = sum(b.get("price", 0) for b in this_month_bookings)
    
    # Get classes stats
    classes = await priest_classes_collection.find({"priest_id": priest_id}).to_list(None)
    total_classes = len(classes)
    total_students = sum(c.get("enrolled_count", 0) for c in classes)
    
    # Get content stats
    content_count = await priest_content_collection.count_documents({"priest_id": priest_id})
    
    # Get ratings
    reviews = await reviews_collection.find({"priest_id": priest_id}).to_list(None)
    avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0
    
    # Recent bookings
    recent_bookings = sorted(all_bookings, key=lambda x: x.get("created_at", now), reverse=True)[:5]
    recent_list = []
    for b in recent_bookings:
        recent_list.append({
            "id": str(b["_id"]),
            "service_name": b["service_name"],
            "status": b["status"],
            "price": b.get("price", 0),
            "date": b.get("booking_date").isoformat() if isinstance(b.get("booking_date"), datetime) else b.get("booking_date", "")
        })
    
    return {
        "stats": {
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "confirmed_bookings": confirmed_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_earnings": total_earnings,
            "monthly_earnings": monthly_earnings,
            "total_classes": total_classes,
            "total_students": total_students,
            "content_count": content_count,
            "avg_rating": round(avg_rating, 1),
            "total_reviews": len(reviews)
        },
        "recent_bookings": recent_list
    }


# ===================== PRIEST CONTENT (MANTRAS/CHANTS) =====================

@router.get("/content")
async def get_priest_content(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get all content posted by priest"""
    priest = await get_priest_profile(user)
    
    cursor = priest_content_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    content_list = []
    async for content in cursor:
        content_list.append({
            "id": str(content["_id"]),
            "title": content["title"],
            "description": content.get("description", ""),
            "content_type": content["content_type"],  # text, audio, video
            "category": content.get("category", "General"),
            "text_content": content.get("text_content", ""),
            "media_url": content.get("media_url", ""),
            "views": content.get("views", 0),
            "likes": content.get("likes", 0),
            "is_published": content.get("is_published", True),
            "created_at": content["created_at"].isoformat() if isinstance(content["created_at"], datetime) else content["created_at"]
        })
    return {"content": content_list}


@router.post("/content")
async def create_priest_content(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Post new content (mantra/chant)"""
    priest = await get_priest_profile(user)
    data = await request.json()
    
    content_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "title": data.get("title"),
        "description": data.get("description", ""),
        "content_type": data.get("content_type", "text"),  # text, audio, video
        "category": data.get("category", "Mantra"),
        "text_content": data.get("text_content", ""),
        "media_url": data.get("media_url", ""),
        "views": 0,
        "likes": 0,
        "is_published": data.get("is_published", True),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_content_collection.insert_one(content_dict)
    return {"message": "Content posted", "content_id": str(result.inserted_id)}


@router.delete("/content/{content_id}")
async def delete_priest_content(content_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete content"""
    priest = await get_priest_profile(user)
    content = await priest_content_collection.find_one({"_id": ObjectId(content_id)})
    
    if not content or content["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Content not found")
    
    await priest_content_collection.delete_one({"_id": ObjectId(content_id)})
    return {"message": "Content deleted"}


# ===================== PRIEST LIVE STREAMING =====================

@router.get("/streams")
async def get_priest_streams(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's live streams"""
    priest = await get_priest_profile(user)
    
    cursor = priest_streams_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    streams = []
    async for stream in cursor:
        streams.append({
            "id": str(stream["_id"]),
            "title": stream["title"],
            "description": stream.get("description", ""),
            "stream_type": stream.get("stream_type", "puja"),
            "status": stream.get("status", "scheduled"),  # scheduled, live, ended
            "scheduled_at": stream.get("scheduled_at").isoformat() if isinstance(stream.get("scheduled_at"), datetime) else stream.get("scheduled_at", ""),
            "started_at": stream.get("started_at").isoformat() if isinstance(stream.get("started_at"), datetime) else stream.get("started_at"),
            "ended_at": stream.get("ended_at").isoformat() if isinstance(stream.get("ended_at"), datetime) else stream.get("ended_at"),
            "viewer_count": stream.get("viewer_count", 0),
            "max_viewers": stream.get("max_viewers", 0),
            "created_at": stream["created_at"].isoformat() if isinstance(stream["created_at"], datetime) else stream["created_at"]
        })
    return {"streams": streams}


@router.post("/streams")
async def create_stream(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Schedule or start a live stream"""
    priest = await get_priest_profile(user)
    data = await request.json()
    
    stream_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "title": data.get("title"),
        "description": data.get("description", ""),
        "stream_type": data.get("stream_type", "puja"),  # puja, class, discourse, aarti
        "status": "scheduled",
        "scheduled_at": datetime.fromisoformat(data["scheduled_at"]) if data.get("scheduled_at") else datetime.now(timezone.utc),
        "viewer_count": 0,
        "max_viewers": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_streams_collection.insert_one(stream_dict)
    return {"message": "Stream scheduled", "stream_id": str(result.inserted_id)}


@router.put("/streams/{stream_id}")
async def update_stream(stream_id: str, request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update a scheduled stream (before it starts)"""
    priest = await get_priest_profile(user)
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    if stream.get("status") == "live":
        raise HTTPException(status_code=400, detail="Cannot edit a live stream")
    
    data = await request.json()
    update_data = {k: v for k, v in data.items() if k in [
        "title", "description", "scheduled_time", "thumbnail"
    ]}
    
    await priest_streams_collection.update_one(
        {"_id": ObjectId(stream_id)},
        {"$set": update_data}
    )
    return {"message": "Stream updated"}


@router.delete("/streams/{stream_id}")
async def delete_stream(stream_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a scheduled stream (before it starts)"""
    priest = await get_priest_profile(user)
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    if stream.get("status") == "live":
        raise HTTPException(status_code=400, detail="Cannot delete a live stream - end it first")
    
    await priest_streams_collection.delete_one({"_id": ObjectId(stream_id)})
    return {"message": "Stream deleted"}


@router.put("/streams/{stream_id}/start")
async def start_stream(stream_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Start a live stream"""
    priest = await get_priest_profile(user)
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    await priest_streams_collection.update_one(
        {"_id": ObjectId(stream_id)},
        {"$set": {"status": "live", "started_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Stream started", "status": "live"}


@router.put("/streams/{stream_id}/end")
async def end_stream(stream_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """End a live stream"""
    priest = await get_priest_profile(user)
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    await priest_streams_collection.update_one(
        {"_id": ObjectId(stream_id)},
        {"$set": {"status": "ended", "ended_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Stream ended", "status": "ended"}


# ===================== PRIEST PROFILE =====================

@router.get("/profile")
async def get_priest_profile_data(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's own profile"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    return {
        "id": str(priest["_id"]),
        "user_id": priest["user_id"],
        "user_name": user["name"],
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "specializations": priest.get("specializations", []),
        "experience_years": priest.get("experience_years", 0),
        "languages": priest.get("languages", []),
        "bio": priest.get("bio", ""),
        "rating": priest.get("rating", 0),
        "total_reviews": priest.get("total_reviews", 0),
        "is_verified": priest.get("is_verified", False),
        "approval_status": priest.get("approval_status", "pending"),
        "rejection_reason": priest.get("rejection_reason", ""),
        "available_online": priest.get("available_online", True),
        "base_price": priest.get("base_price", 1100),
        "profile_photo": priest.get("profile_photo"),
        "location": priest.get("location", {}),
        "temple_affiliation": priest.get("temple_affiliation", ""),
        "math_mutt": priest.get("math_mutt", "")
    }


@router.put("/profile")
async def update_priest_profile(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update priest's profile"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    data = await request.json()
    
    update_data = {k: v for k, v in data.items() if k in [
        "specializations", "experience_years", "languages", "bio",
        "available_online", "base_price", "profile_photo", "location",
        "temple_affiliation", "math_mutt"
    ]}
    
    if update_data:
        await priests_collection.update_one(
            {"_id": priest["_id"]},
            {"$set": update_data}
        )
    
    # Update user name if provided
    if "name" in data:
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"name": data["name"]}}
        )
    
    return {"message": "Profile updated"}


# ===================== PRIEST REVIEWS =====================

@router.get("/reviews")
async def get_priest_reviews(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get reviews for priest"""
    priest = await get_priest_profile(user)
    
    cursor = reviews_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    reviews = []
    async for review in cursor:
        reviewer = await users_collection.find_one({"_id": ObjectId(review["user_id"])})
        reviews.append({
            "id": str(review["_id"]),
            "user_id": review["user_id"],
            "user_name": reviewer["name"] if reviewer else "Anonymous",
            "rating": review["rating"],
            "comment": review.get("comment", ""),
            "service_name": review.get("service_name", ""),
            "created_at": review["created_at"].isoformat() if isinstance(review["created_at"], datetime) else review["created_at"]
        })
    
    # Calculate rating distribution
    all_ratings = [r["rating"] for r in reviews]
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in all_ratings:
        if 1 <= r <= 5:
            distribution[r] = distribution.get(r, 0) + 1
    
    avg_rating = sum(all_ratings) / len(all_ratings) if all_ratings else 0
    
    return {
        "reviews": reviews,
        "total": len(reviews),
        "avg_rating": round(avg_rating, 1),
        "distribution": distribution
    }


# ===================== PRIEST PORTFOLIO =====================

@router.get("/portfolio")
async def get_priest_portfolio(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's portfolio (photos/videos)"""
    priest = await get_priest_profile(user)
    
    return {
        "portfolio": priest.get("portfolio", []),
        "photos": [p for p in priest.get("portfolio", []) if p.get("type") == "image"],
        "videos": [p for p in priest.get("portfolio", []) if p.get("type") == "video"]
    }


@router.post("/portfolio")
async def add_portfolio_item(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Add item to portfolio"""
    priest = await get_priest_profile(user)
    data = await request.json()
    
    item = {
        "id": str(ObjectId()),
        "url": data.get("url"),
        "type": data.get("type", "image"),  # image, video
        "caption": data.get("caption", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await priests_collection.update_one(
        {"_id": priest["_id"]},
        {"$push": {"portfolio": item}}
    )
    
    return {"message": "Portfolio item added", "item": item}


@router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(item_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Remove item from portfolio"""
    priest = await get_priest_profile(user)
    
    await priests_collection.update_one(
        {"_id": priest["_id"]},
        {"$pull": {"portfolio": {"id": item_id}}}
    )
    
    return {"message": "Portfolio item deleted"}


# ===================== PRIEST SERVICES =====================

@router.get("/services")
async def get_priest_services(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's services"""
    priest = await get_priest_profile(user)
    
    cursor = priest_services_collection.find({"priest_id": str(priest["_id"])})
    services = []
    async for svc in cursor:
        services.append({
            "id": str(svc["_id"]),
            "name": svc.get("name", ""),
            "description": svc.get("description", ""),
            "price": svc.get("price", 0),
            "duration": svc.get("duration", ""),
            "category": svc.get("category", "general"),
            "location_type": svc.get("location_type", "online"),
            "temple_name": svc.get("temple_name", "")
        })
    return {"services": services}


@router.post("/services")
async def add_priest_service(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Add a new service"""
    priest = await get_priest_profile(user)
    data = await request.json()
    
    service_dict = {
        "priest_id": str(priest["_id"]),
        "name": data.get("name"),
        "description": data.get("description", ""),
        "price": data.get("price", 0),
        "duration": data.get("duration", "60 minutes"),
        "category": data.get("category", "general"),
        "location_type": data.get("location_type", "online"),
        "temple_name": data.get("temple_name", ""),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_services_collection.insert_one(service_dict)
    return {"message": "Service added", "service_id": str(result.inserted_id)}


@router.put("/services/{service_id}")
async def update_priest_service(service_id: str, request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update a service"""
    priest = await get_priest_profile(user)
    svc = await priest_services_collection.find_one({"_id": ObjectId(service_id)})
    
    if not svc or svc["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Service not found")
    
    data = await request.json()
    update_data = {k: v for k, v in data.items() if k in [
        "name", "description", "price", "duration", "category", "location_type", "temple_name"
    ]}
    
    await priest_services_collection.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": update_data}
    )
    return {"message": "Service updated"}


@router.delete("/services/{service_id}")
async def delete_priest_service(service_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a service"""
    priest = await get_priest_profile(user)
    svc = await priest_services_collection.find_one({"_id": ObjectId(service_id)})
    
    if not svc or svc["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Service not found")
    
    await priest_services_collection.delete_one({"_id": ObjectId(service_id)})
    return {"message": "Service deleted"}


# ===================== PRIEST EARNINGS =====================

@router.get("/earnings")
async def get_priest_earnings(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's earnings summary"""
    priest = await get_priest_profile(user)
    priest_id = str(priest["_id"])
    
    # Get all completed bookings
    completed_bookings = await bookings_collection.find({
        "priest_id": priest_id,
        "status": "completed"
    }).to_list(None)
    
    total_earnings = sum(b.get("price", 0) for b in completed_bookings)
    
    # This month earnings
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_bookings = [b for b in completed_bookings if b.get("created_at", now) >= month_start]
    monthly_earnings = sum(b.get("price", 0) for b in this_month_bookings)
    
    # Recent transactions
    recent = sorted(completed_bookings, key=lambda x: x.get("created_at", now), reverse=True)[:10]
    transactions = []
    for b in recent:
        transactions.append({
            "id": str(b["_id"]),
            "service_name": b.get("service_name", ""),
            "amount": b.get("price", 0),
            "date": b.get("created_at").isoformat() if isinstance(b.get("created_at"), datetime) else str(b.get("created_at", "")),
            "type": "booking"
        })
    
    # Get class enrollment earnings
    enrollments = await class_enrollments_collection.find({
        "priest_id": priest_id,
        "payment_status": "paid"
    }).to_list(None)
    
    class_earnings = sum(e.get("amount", 0) for e in enrollments)
    total_earnings += class_earnings
    
    return {
        "total_earnings": total_earnings,
        "monthly_earnings": monthly_earnings,
        "class_earnings": class_earnings,
        "pending_payouts": 0,  # Placeholder for Stripe Connect
        "transactions": transactions
    }


# ===================== PRIEST POSTS =====================

@router.get("/posts")
async def get_priest_posts(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's posts"""
    priest = await get_priest_profile(user)
    
    cursor = priest_posts_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    posts = []
    async for post in cursor:
        posts.append({
            "id": str(post["_id"]),
            "content": post.get("content", ""),
            "image_url": post.get("image_url"),
            "likes": post.get("likes", 0),
            "comments_count": post.get("comments_count", 0),
            "views": post.get("views", 0),
            "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
        })
    return {"posts": posts}


@router.post("/posts")
async def create_priest_post(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Create a new post"""
    priest = await get_priest_profile(user)
    data = await request.json()
    
    post_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "content": data.get("content", ""),
        "image_url": data.get("image_url"),
        "likes": 0,
        "liked_by": [],
        "comments_count": 0,
        "views": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_posts_collection.insert_one(post_dict)
    return {"message": "Post created", "post_id": str(result.inserted_id)}


@router.delete("/posts/{post_id}")
async def delete_priest_post(post_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a post"""
    priest = await get_priest_profile(user)
    post = await priest_posts_collection.find_one({"_id": ObjectId(post_id)})
    
    if not post or post["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Post not found")
    
    await priest_posts_collection.delete_one({"_id": ObjectId(post_id)})
    return {"message": "Post deleted"}
