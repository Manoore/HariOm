"""
Priest Routes Module
Contains all priest-related public endpoints for the Divine App.
Includes: priest listing, priest details, registration, services
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId

from database import (
    users_collection, priests_collection, priest_services_collection
)
from models import PriestCreate, UserRole
from auth import get_current_user

router = APIRouter(prefix="/api/priests", tags=["Priests"])

# ===================== PUBLIC PRIEST ENDPOINTS =====================

@router.get("")
async def get_priests(
    specialization: Optional[str] = None,
    language: Optional[str] = None,
    location: Optional[str] = None,
    zipcode: Optional[str] = None,
    min_rating: Optional[float] = None,
    puja_type: Optional[str] = None,
    subcaste: Optional[str] = None,
    math_mutt: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get list of approved priests with optional filters"""
    # Only show priests that are approved by admin
    query = {
        "$or": [
            {"approval_status": "approved"},
            {"is_verified": True, "approval_status": {"$exists": False}}  # Legacy support
        ]
    }
    
    if specialization:
        query["specializations"] = {"$regex": specialization, "$options": "i"}
    if language:
        query["languages"] = {"$regex": language, "$options": "i"}
    if location:
        query["$or"] = [
            {"location.city": {"$regex": location, "$options": "i"}},
            {"location.state": {"$regex": location, "$options": "i"}},
            {"location.address": {"$regex": location, "$options": "i"}},
            {"city": {"$regex": location, "$options": "i"}},
            {"state": {"$regex": location, "$options": "i"}},
            {"work_locations": {"$elemMatch": {"$regex": location, "$options": "i"}}}
        ]
    if zipcode:
        query["$or"] = query.get("$or", []) + [
            {"location.zipcode": zipcode},
            {"location.postal_code": zipcode},
            {"zipcode": zipcode},
            {"postal_code": zipcode}
        ]
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    if subcaste:
        query["subcaste"] = {"$regex": subcaste, "$options": "i"}
    if math_mutt:
        query["math_mutt"] = {"$regex": math_mutt, "$options": "i"}
    
    # Filter by puja_type if provided
    priest_ids_with_puja = None
    if puja_type:
        services_cursor = priest_services_collection.find({
            "name": {"$regex": puja_type, "$options": "i"}
        })
        matching_priest_ids = set()
        async for svc in services_cursor:
            matching_priest_ids.add(svc.get("priest_id"))
        priest_ids_with_puja = list(matching_priest_ids)
        
        if priest_ids_with_puja:
            query["_id"] = {"$in": [ObjectId(pid) for pid in priest_ids_with_puja]}
        else:
            return {"priests": [], "total": 0}
    
    cursor = priests_collection.find(query).skip(skip).limit(limit)
    priests = []
    
    async for priest in cursor:
        user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        
        # Fetch services from the separate services collection
        services_cursor = priest_services_collection.find({"priest_id": str(priest["_id"])})
        services = []
        async for svc in services_cursor:
            services.append({
                "id": str(svc["_id"]),
                "name": svc.get("name", ""),
                "description": svc.get("description", ""),
                "price": svc.get("price", 0),
                "duration": svc.get("duration", ""),
                "category": svc.get("category", "general")
            })
        
        # Fallback to embedded services
        if not services and priest.get("services"):
            services = priest["services"]
        
        priests.append({
            "id": str(priest["_id"]),
            "user_id": priest["user_id"],
            "user_name": user["name"] if user else "Unknown",
            "specializations": priest.get("specializations", []),
            "experience_years": priest.get("experience_years", 0),
            "languages": priest.get("languages", []),
            "services": services,
            "bio": priest.get("bio", ""),
            "rating": priest.get("rating", 0),
            "total_reviews": priest.get("total_reviews", 0),
            "is_verified": priest.get("is_verified", False),
            "available_online": priest.get("available_online", True),
            "location": priest.get("location", {}),
            "city": priest.get("city") or priest.get("location", {}).get("city", ""),
            "state": priest.get("state") or priest.get("location", {}).get("state", ""),
            "subcaste": priest.get("subcaste", ""),
            "math_mutt": priest.get("math_mutt", ""),
            "temple_affiliation": priest.get("temple_affiliation", ""),
            "work_locations": priest.get("work_locations", []),
        })
    
    return {"priests": priests, "total": await priests_collection.count_documents(query)}

@router.get("/{priest_id}")
async def get_priest(priest_id: str):
    """Get single priest details"""
    priest = await priests_collection.find_one({"_id": ObjectId(priest_id)})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest not found")
    
    user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
    
    # Fetch services
    services_cursor = priest_services_collection.find({"priest_id": str(priest["_id"])})
    services = []
    async for svc in services_cursor:
        services.append({
            "id": str(svc["_id"]),
            "name": svc.get("name", ""),
            "description": svc.get("description", ""),
            "price": svc.get("price", 0),
            "duration": svc.get("duration", ""),
            "category": svc.get("category", "general")
        })
    
    if not services and priest.get("services"):
        services = priest["services"]
    
    return {
        "id": str(priest["_id"]),
        "user_id": priest["user_id"],
        "user_name": user["name"] if user else "Unknown",
        "specializations": priest.get("specializations", []),
        "experience_years": priest.get("experience_years", 0),
        "languages": priest.get("languages", []),
        "services": services,
        "bio": priest.get("bio", ""),
        "rating": priest.get("rating", 0),
        "total_reviews": priest.get("total_reviews", 0),
        "is_verified": priest.get("is_verified", False),
        "available_online": priest.get("available_online", True),
        "city": priest.get("city") or priest.get("location", {}).get("city", ""),
        "state": priest.get("state") or priest.get("location", {}).get("state", ""),
        "base_price": priest.get("base_price", 1100),
        "profile_photo": priest.get("profile_photo"),
        "subcaste": priest.get("subcaste", ""),
        "math_mutt": priest.get("math_mutt", ""),
        "temple_affiliation": priest.get("temple_affiliation", ""),
        "work_locations": priest.get("work_locations", []),
    }

@router.get("/{priest_id}/services")
async def get_priest_services_public(priest_id: str):
    """Get services for a specific priest (public endpoint)"""
    priest = await priests_collection.find_one({"_id": ObjectId(priest_id)})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest not found")
    
    services_cursor = priest_services_collection.find({"priest_id": priest_id})
    services = []
    async for svc in services_cursor:
        services.append({
            "id": str(svc["_id"]),
            "name": svc.get("name", ""),
            "description": svc.get("description", ""),
            "price": svc.get("price", 0),
            "duration": svc.get("duration", ""),
            "category": svc.get("category", "general")
        })
    
    if not services and priest.get("services"):
        services = priest["services"]
    
    return {"services": services, "priest_id": priest_id}

# ===================== PRIEST REGISTRATION =====================

@router.post("/register")
async def register_as_priest(data: PriestCreate, user: dict = Depends(get_current_user)):
    """Register current user as a priest"""
    existing = await priests_collection.find_one({"user_id": str(user["_id"])})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as priest")
    
    priest_dict = {
        "user_id": str(user["_id"]),
        "specializations": data.specializations,
        "experience_years": data.experience_years,
        "languages": data.languages,
        "services": [s.dict() for s in data.services],
        "bio": data.bio,
        "rating": 0.0,
        "total_reviews": 0,
        "is_verified": False,
        "available_online": data.available_online,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priests_collection.insert_one(priest_dict)
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"role": UserRole.PRIEST}}
    )
    
    return {"message": "Registered as priest", "priest_id": str(result.inserted_id)}
