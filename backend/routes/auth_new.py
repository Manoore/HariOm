"""
Auth Routes Module
Contains all authentication-related endpoints for the Divine App.
Includes: registration, login, profile management, Firebase sync
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel

from database import users_collection, priests_collection, astrologers_collection, shops_collection, user_notifications_collection
from models import UserCreate, UserLogin, UserUpdate, UserRole
from auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

async def notify_admins_new_provider(provider_type: str, provider_name: str, provider_email: str):
    """Send notification to all admins about new provider registration"""
    # Find all admins
    admins_cursor = users_collection.find({"role": {"$in": ["admin", "super_admin"]}})
    async for admin in admins_cursor:
        await user_notifications_collection.insert_one({
            "user_id": str(admin["_id"]),
            "type": "new_provider_registration",
            "title": f"New {provider_type.capitalize()} Registration",
            "message": f"{provider_name} ({provider_email}) has registered as a {provider_type} and is awaiting approval.",
            "data": {"provider_type": provider_type},
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })

# ===================== BASIC AUTH =====================

@router.post("/register")
async def register(user_data: UserCreate):
    """Register a new user with email/password"""
    existing = await users_collection.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role,
        "is_verified": False,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await users_collection.insert_one(user_dict)
    token = create_access_token(data={"sub": str(result.inserted_id)})
    
    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "email": user_data.email,
            "name": user_data.name,
            "role": user_data.role
        }
    }

@router.post("/login")
async def login(credentials: UserLogin):
    """Login with email/password"""
    user = await users_collection.find_one({"email": credentials.email})
    
    # Check if user is active
    if user and not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Check both password fields (password_hash for new users, password for legacy)
    password_field = user.get("password_hash") or user.get("password") if user else None
    if not user or not password_field or not verify_password(credentials.password, password_field):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone"),
        "role": user["role"],
        "is_verified": user.get("is_verified", False),
        "address": user.get("address"),
        "city": user.get("city"),
        "pincode": user.get("pincode"),
        "date_of_birth": user.get("date_of_birth"),
        "gotra": user.get("gotra"),
        "nakshatra": user.get("nakshatra"),
        "profile_completed": user.get("profile_completed", False),
        "firebase_uid": user.get("firebase_uid")
    }

# ===================== PROFILE UPDATE =====================

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    date_of_birth: Optional[str] = None
    gotra: Optional[str] = None
    nakshatra: Optional[str] = None

@router.put("/update-profile")
async def update_user_profile(profile_data: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if update_dict:
        # Check if profile is complete
        required_fields = ["name", "phone", "address", "city", "pincode"]
        current_data = {**user, **update_dict}
        profile_complete = all(current_data.get(f) for f in required_fields)
        update_dict["profile_completed"] = profile_complete
        
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": update_dict}
        )
    
    updated_user = await users_collection.find_one({"_id": user["_id"]})
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(updated_user["_id"]),
            "email": updated_user["email"],
            "name": updated_user["name"],
            "phone": updated_user.get("phone"),
            "role": updated_user["role"],
            "address": updated_user.get("address"),
            "city": updated_user.get("city"),
            "pincode": updated_user.get("pincode"),
            "profile_completed": updated_user.get("profile_completed", False)
        }
    }

@router.put("/profile")
async def update_profile(update_data: UserUpdate, user: dict = Depends(get_current_user)):
    """Update user profile (alternative endpoint)"""
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": update_dict}
        )
    updated_user = await users_collection.find_one({"_id": user["_id"]})
    return {
        "message": "Profile updated",
        "user": {
            "id": str(updated_user["_id"]),
            "email": updated_user.get("email"),
            "name": updated_user["name"],
            "role": updated_user["role"]
        }
    }

# ===================== FIREBASE AUTH =====================

class FirebaseSyncRequest(BaseModel):
    firebase_uid: str
    email: Optional[str] = None
    name: str
    photo_url: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    auth_type: Optional[str] = None

class FirebaseRegisterRequest(BaseModel):
    firebase_uid: str
    email: Optional[str] = None
    name: str
    phone: Optional[str] = None
    role: str = "devotee"
    auth_type: Optional[str] = None

@router.post("/firebase-sync")
async def firebase_sync(data: FirebaseSyncRequest):
    """Sync Firebase user with backend - create if not exists, return existing if found"""
    try:
        # Build query to find existing user
        query_conditions = [{"firebase_uid": data.firebase_uid}]
        if data.email:
            query_conditions.append({"email": data.email})
        if data.phone:
            query_conditions.append({"phone": data.phone})
        
        # Check if user already exists
        user = await users_collection.find_one({"$or": query_conditions})
        
        if user:
            # Check if user is active
            if not user.get("is_active", True):
                raise HTTPException(status_code=403, detail="Account is deactivated")
            
            # Update firebase_uid and other fields if needed
            update_fields = {"firebase_uid": data.firebase_uid}
            if data.photo_url:
                update_fields["photo_url"] = data.photo_url
            if data.phone and not user.get("phone"):
                update_fields["phone"] = data.phone
            if data.auth_type:
                update_fields["auth_type"] = data.auth_type
            
            if not user.get("firebase_uid") or user.get("firebase_uid") != data.firebase_uid or update_fields:
                await users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": update_fields}
                )
            
            return {
                "user": {
                    "id": str(user["_id"]),
                    "email": user.get("email"),
                    "name": user["name"],
                    "role": user["role"],
                    "firebase_uid": data.firebase_uid,
                    "is_verified": user.get("is_verified", False),
                    "phone": user.get("phone") or data.phone,
                    "address": user.get("address"),
                    "city": user.get("city"),
                    "pincode": user.get("pincode"),
                    "date_of_birth": user.get("date_of_birth"),
                    "gotra": user.get("gotra"),
                    "nakshatra": user.get("nakshatra"),
                    "profile_completed": user.get("profile_completed", False),
                    "auth_type": user.get("auth_type") or data.auth_type
                }
            }
        
        # Create new user
        selected_role = UserRole.DEVOTEE
        if data.role:
            try:
                selected_role = UserRole(data.role)
            except ValueError:
                selected_role = UserRole.DEVOTEE
        
        user_dict = {
            "firebase_uid": data.firebase_uid,
            "email": data.email,
            "phone": data.phone,
            "name": data.name,
            "photo_url": data.photo_url,
            "role": selected_role,
            "auth_type": data.auth_type or ("phone" if data.phone and not data.email else "email"),
            "is_verified": True,
            "is_active": True,
            "profile_completed": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await users_collection.insert_one(user_dict)
        
        # If priest, create priest profile
        if selected_role == UserRole.PRIEST:
            priest_profile = {
                "user_id": str(result.inserted_id),
                "user_name": data.name,
                "specializations": [],
                "languages": ["Hindi", "Sanskrit"],
                "experience_years": 1,
                "bio": "",
                "services": [],
                "rating": 0.0,
                "total_reviews": 0,
                "is_verified": False,
                "approval_status": "pending",  # pending, approved, rejected
                "created_at": datetime.now(timezone.utc)
            }
            await priests_collection.insert_one(priest_profile)
        
        # If astrologer, create astrologer profile
        if selected_role == UserRole.ASTROLOGER:
            astrologer_profile = {
                "user_id": str(result.inserted_id),
                "user_name": data.name,
                "specializations": [],
                "languages": ["Hindi", "English"],
                "experience_years": 1,
                "bio": "",
                "hourly_rate": 500,
                "rating": 0.0,
                "total_reviews": 0,
                "is_verified": False,
                "approval_status": "pending",  # pending, approved, rejected
                "is_available": False,
                "created_at": datetime.now(timezone.utc)
            }
            await astrologers_collection.insert_one(astrologer_profile)
        
        # If shop owner, create shop profile
        if selected_role == UserRole.SHOP_OWNER:
            shop_profile = {
                "owner_id": str(result.inserted_id),
                "owner_name": data.name,
                "shop_name": f"{data.name}'s Shop",
                "description": "",
                "products": [],
                "rating": 0.0,
                "total_reviews": 0,
                "is_verified": False,
                "approval_status": "pending",  # pending, approved, rejected
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            }
            await shops_collection.insert_one(shop_profile)
        
        # Notify admins about new provider registration
        if selected_role in [UserRole.PRIEST, UserRole.ASTROLOGER, UserRole.SHOP_OWNER]:
            provider_type = "priest" if selected_role == UserRole.PRIEST else "astrologer" if selected_role == UserRole.ASTROLOGER else "shop owner"
            await notify_admins_new_provider(provider_type, data.name, data.email or "")
        
        return {
            "user": {
                "id": str(result.inserted_id),
                "email": data.email,
                "name": data.name,
                "role": selected_role,
                "firebase_uid": data.firebase_uid,
                "is_verified": True,
                "phone": data.phone,
                "profile_completed": False,
                "auth_type": user_dict["auth_type"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firebase sync failed: {str(e)}")

@router.post("/firebase-register")
async def firebase_register(data: FirebaseRegisterRequest):
    """Register a new user via Firebase authentication"""
    # Check if user already exists
    query_conditions = [{"firebase_uid": data.firebase_uid}]
    if data.email:
        query_conditions.append({"email": data.email})
    
    existing = await users_collection.find_one({"$or": query_conditions})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Map role string to enum
    role_map = {
        "devotee": UserRole.DEVOTEE,
        "priest": UserRole.PRIEST,
        "astrologer": UserRole.ASTROLOGER,
        "shop_owner": UserRole.SHOP_OWNER
    }
    
    user_dict = {
        "firebase_uid": data.firebase_uid,
        "email": data.email,
        "name": data.name,
        "phone": data.phone,
        "role": role_map.get(data.role, UserRole.DEVOTEE),
        "auth_type": data.auth_type or "email",
        "is_verified": True,
        "is_active": True,
        "profile_completed": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await users_collection.insert_one(user_dict)
    
    return {
        "user": {
            "id": str(result.inserted_id),
            "email": data.email,
            "name": data.name,
            "role": user_dict["role"]
        }
    }
