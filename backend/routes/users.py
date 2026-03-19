"""
User Profile Routes
Handles user profile updates and management
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel

from database import users_collection
from auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gotra: Optional[str] = None
    nakshatra: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    address: Optional[str] = None
    profile_image: Optional[str] = None
    profile_photo: Optional[str] = None  # Accept both field names

@router.put("/profile")
async def update_profile(data: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_data = {}
    
    if data.name is not None:
        update_data["name"] = data.name
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.dob is not None:
        update_data["dob"] = data.dob
    if data.gotra is not None:
        update_data["gotra"] = data.gotra
    if data.nakshatra is not None:
        update_data["nakshatra"] = data.nakshatra
    if data.city is not None:
        update_data["city"] = data.city
    if data.pincode is not None:
        update_data["pincode"] = data.pincode
    if data.address is not None:
        update_data["address"] = data.address
    if data.profile_image is not None:
        update_data["profile_image"] = data.profile_image
    if data.profile_photo is not None:
        update_data["profile_photo"] = data.profile_photo
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": update_data}
    )
    
    updated_user = await users_collection.find_one({"_id": user["_id"]})
    
    return {
        "message": "Profile updated",
        "user": {
            "id": str(updated_user["_id"]),
            "email": updated_user["email"],
            "name": updated_user.get("name"),
            "role": updated_user.get("role"),
            "phone": updated_user.get("phone"),
            "dob": updated_user.get("dob"),
            "gotra": updated_user.get("gotra"),
            "nakshatra": updated_user.get("nakshatra"),
            "city": updated_user.get("city"),
            "pincode": updated_user.get("pincode"),
            "address": updated_user.get("address"),
            "profile_image": updated_user.get("profile_image")
        }
    }

@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get user profile"""
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "role": user.get("role"),
        "phone": user.get("phone"),
        "dob": user.get("dob"),
        "gotra": user.get("gotra"),
        "nakshatra": user.get("nakshatra"),
        "city": user.get("city"),
        "pincode": user.get("pincode"),
        "address": user.get("address"),
        "profile_image": user.get("profile_image"),
        "wallet_balance": user.get("wallet_balance", 0),
        "free_minutes": user.get("free_minutes", 0)
    }
