"""
Admin Routes Module
Contains all admin-related endpoints for the Divine App.
Includes: user management, priest verification, puja types, audio library, admin management
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId

from database import (
    users_collection, priests_collection, astrologers_collection,
    products_collection, bookings_collection, orders_collection,
    puja_types_collection, audio_library_collection, shops_collection,
    user_notifications_collection, system_config_collection, system_settings_collection
)
from models import UserRole
from auth import require_role, get_password_hash, verify_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ===================== SIGNUP SETTINGS =====================

@router.get("/signup-settings")
async def get_signup_settings():
    """Get public signup settings - no auth required for signup page to read"""
    settings = await system_config_collection.find_one({"key": "signup_settings"})
    if not settings:
        # Return defaults
        return {
            "settings": {
                "enable_priest_signup": True,
                "enable_astrologer_signup": True,
                "enable_shop_owner_signup": True
            }
        }
    return {"settings": settings.get("value", {})}


@router.put("/signup-settings")
async def update_signup_settings(request: Request, admin: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Update signup settings - admin only"""
    data = await request.json()
    
    settings = {
        "enable_priest_signup": data.get("enable_priest_signup", True),
        "enable_astrologer_signup": data.get("enable_astrologer_signup", False),
        "enable_shop_owner_signup": data.get("enable_shop_owner_signup", False)
    }
    
    await system_config_collection.update_one(
        {"key": "signup_settings"},
        {"$set": {"key": "signup_settings", "value": settings, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    return {"message": "Settings updated", "settings": settings}


# ===================== ADMIN STATS =====================

@router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Get admin dashboard statistics"""
    # Query for pending providers (priests, astrologers, shops)
    pending_query = {
        "$or": [
            {"approval_status": "pending"},
            {"approval_status": {"$exists": False}, "is_verified": {"$ne": True}}
        ]
    }
    
    # Count ALL pending providers (not just priests)
    pending_priests = await priests_collection.count_documents(pending_query)
    pending_astrologers = await astrologers_collection.count_documents(pending_query)
    pending_shops = await shops_collection.count_documents(pending_query)
    
    stats = {
        "total_users": await users_collection.count_documents({}),
        "total_priests": await priests_collection.count_documents({}),
        "total_astrologers": await astrologers_collection.count_documents({}),
        "total_products": await products_collection.count_documents({}),
        "total_bookings": await bookings_collection.count_documents({}),
        "total_orders": await orders_collection.count_documents({}),
        "pending_verifications": pending_priests + pending_astrologers + pending_shops
    }
    return stats

# ===================== USER MANAGEMENT =====================

@router.post("/users/create")
async def admin_create_user(request: Request, admin: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Admin creates a new user with any role"""
    data = await request.json()
    
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "devotee")
    phone = data.get("phone", "")
    
    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check if email already exists
    existing = await users_collection.find_one({"email": email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    valid_roles = ["devotee", "priest", "astrologer", "shop_owner", "admin"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Create user
    hashed_password = get_password_hash(password)
    new_user = {
        "name": name,
        "email": email.lower(),
        "phone": phone,
        "password": hashed_password,
        "role": role,
        "is_verified": True,  # Admin-created users are auto-verified
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by_admin": str(admin["_id"])
    }
    
    result = await users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Auto-create profile based on role
    if role == "priest":
        await priests_collection.insert_one({
            "user_id": user_id,
            "approval_status": "approved",  # Admin-created priests are auto-approved
            "is_verified": True,
            "created_at": datetime.now(timezone.utc)
        })
    elif role == "astrologer":
        await astrologers_collection.insert_one({
            "user_id": user_id,
            "approval_status": "approved",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc)
        })
    elif role == "shop_owner":
        await shops_collection.insert_one({
            "owner_id": user_id,
            "name": f"{name}'s Shop",
            "approval_status": "approved",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc)
        })
    
    return {
        "message": f"User created successfully as {role}",
        "user_id": user_id,
        "email": email.lower(),
        "role": role
    }

@router.get("/users")
async def get_all_users(
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    skip: int = 0,
    limit: int = 50
):
    """Get all users (paginated)"""
    cursor = users_collection.find({}, {"password": 0}).skip(skip).limit(limit)
    users = []
    async for u in cursor:
        users.append({
            "id": str(u["_id"]),
            "email": u["email"],
            "name": u["name"],
            "role": u["role"],
            "is_verified": u.get("is_verified", False),
            "is_active": u.get("is_active", True),
            "created_at": u["created_at"].isoformat() if isinstance(u.get("created_at"), datetime) else None
        })
    return {"users": users, "total": await users_collection.count_documents({})}

@router.get("/users/{user_id}")
async def get_user_by_id(user_id: str, admin: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Get single user details"""
    user = await users_collection.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "phone": user.get("phone"),
        "is_verified": user.get("is_verified", False),
        "is_active": user.get("is_active", True),
        "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else None
    }

@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, admin: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Update a user's role"""
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role}}
    )
    
    # If changing to priest, create priest profile if not exists
    if role == UserRole.PRIEST:
        existing_priest = await priests_collection.find_one({"user_id": user_id})
        if not existing_priest:
            priest_profile = {
                "user_id": user_id,
                "specializations": [],
                "experience_years": 0,
                "is_verified": False,
                "rating": 0,
                "total_reviews": 0,
                "bio": "",
                "languages": ["Hindi", "English"],
                "services": [],
                "created_at": datetime.now(timezone.utc)
            }
            await priests_collection.insert_one(priest_profile)
    
    return {"message": f"User role updated to {role}"}

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    request: Request,
    admin: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Activate or deactivate a user account"""
    data = await request.json()
    is_active = data.get("is_active", True)
    
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deactivating themselves
    if str(user["_id"]) == admin["sub"]:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": is_active}}
    )
    
    status = "activated" if is_active else "deactivated"
    return {"message": f"User {status} successfully"}

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    request: Request,
    admin: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Reset a user's password (admin function)"""
    data = await request.json()
    new_password = data.get("new_password")
    
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    hashed_password = get_password_hash(new_password)
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_password}}
    )
    
    return {"message": "Password reset successfully"}

# ===================== PRIEST MANAGEMENT =====================

@router.get("/priests")
async def get_all_priests_admin(user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Get all priests including unverified ones"""
    cursor = priests_collection.find({})
    priests = []
    async for priest in cursor:
        priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        priests.append({
            "priest_id": str(priest["_id"]),
            "user_id": str(priest["user_id"]),
            "name": priest_user["name"] if priest_user else "Unknown",
            "email": priest_user["email"] if priest_user else "Unknown",
            "is_verified": priest.get("is_verified", False),
            "specializations": priest.get("specializations", []),
            "created_at": priest["created_at"].isoformat() if isinstance(priest.get("created_at"), datetime) else None
        })
    return {"priests": priests, "total": len(priests)}

@router.put("/verify-priest/{priest_id}")
async def verify_priest(priest_id: str, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Verify a priest account"""
    result = await priests_collection.update_one(
        {"_id": ObjectId(priest_id)},
        {"$set": {"is_verified": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Priest not found")
    return {"message": "Priest verified"}

@router.put("/verify-astrologer/{astrologer_id}")
async def verify_astrologer(astrologer_id: str, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Verify an astrologer account"""
    result = await astrologers_collection.update_one(
        {"_id": ObjectId(astrologer_id)},
        {"$set": {"is_verified": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Astrologer not found")
    return {"message": "Astrologer verified"}

# ===================== ADMIN PROFILE =====================

@router.put("/profile")
async def update_admin_profile(request: Request, admin: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Update admin's own profile"""
    data = await request.json()
    
    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"]
    if "phone" in data:
        update_data["phone"] = data["phone"]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await users_collection.update_one(
        {"_id": ObjectId(admin["sub"])},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}

@router.post("/change-password")
async def change_admin_password(request: Request, admin: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Change admin's own password"""
    data = await request.json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both current and new password are required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    user = await users_collection.find_one({"_id": ObjectId(admin["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    hashed_password = get_password_hash(new_password)
    await users_collection.update_one(
        {"_id": ObjectId(admin["sub"])},
        {"$set": {"password": hashed_password}}
    )
    
    return {"message": "Password changed successfully"}

# ===================== SUPER ADMIN - MANAGE ADMINS =====================

@router.get("/admins")
async def get_all_admins(admin: dict = Depends(require_role([UserRole.SUPER_ADMIN]))):
    """Get all admin users (Super Admin only)"""
    cursor = users_collection.find(
        {"role": {"$in": [UserRole.ADMIN, UserRole.SUPER_ADMIN]}},
        {"password": 0}
    )
    admins = []
    async for a in cursor:
        admins.append({
            "id": str(a["_id"]),
            "email": a["email"],
            "name": a["name"],
            "role": a["role"],
            "phone": a.get("phone"),
            "is_active": a.get("is_active", True),
            "created_at": a["created_at"].isoformat() if isinstance(a.get("created_at"), datetime) else None
        })
    return {"admins": admins}

@router.post("/admins")
async def create_admin(request: Request, admin: dict = Depends(require_role([UserRole.SUPER_ADMIN]))):
    """Create a new admin user (Super Admin only)"""
    data = await request.json()
    
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()
    password = data.get("password", "")
    role = data.get("role", UserRole.ADMIN)
    
    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="Email, name, and password are required")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    if role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid role for admin")
    
    existing = await users_collection.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_admin = {
        "email": email,
        "name": name,
        "password": get_password_hash(password),
        "role": role,
        "is_active": True,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await users_collection.insert_one(new_admin)
    
    return {
        "message": "Admin created successfully",
        "id": str(result.inserted_id)
    }

@router.put("/admins/{admin_id}")
async def update_admin(admin_id: str, request: Request, super_admin: dict = Depends(require_role([UserRole.SUPER_ADMIN]))):
    """Update an admin user (Super Admin only)"""
    data = await request.json()
    
    target_admin = await users_collection.find_one({"_id": ObjectId(admin_id)})
    if not target_admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if target_admin["role"] not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=400, detail="Target user is not an admin")
    
    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"].strip()
    if "phone" in data:
        update_data["phone"] = data["phone"]
    if "role" in data and data["role"] in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        update_data["role"] = data["role"]
    if "is_active" in data:
        update_data["is_active"] = data["is_active"]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await users_collection.update_one(
        {"_id": ObjectId(admin_id)},
        {"$set": update_data}
    )
    
    return {"message": "Admin updated successfully"}

@router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: str, super_admin: dict = Depends(require_role([UserRole.SUPER_ADMIN]))):
    """Delete an admin user (Super Admin only)"""
    if admin_id == super_admin["sub"]:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    
    target_admin = await users_collection.find_one({"_id": ObjectId(admin_id)})
    if not target_admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if target_admin["role"] not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=400, detail="Target user is not an admin")
    
    await users_collection.delete_one({"_id": ObjectId(admin_id)})
    
    return {"message": "Admin deleted successfully"}

# ===================== PUJA TYPES MANAGEMENT =====================

DEFAULT_PUJA_TYPES = [
    # Deity-Specific Pujas
    {"name": "Ganesh Puja", "category": "Deity Puja"},
    {"name": "Lakshmi Puja", "category": "Deity Puja"},
    {"name": "Shiva Puja", "category": "Deity Puja"},
    {"name": "Vishnu Puja", "category": "Deity Puja"},
    {"name": "Durga Puja", "category": "Deity Puja"},
    {"name": "Saraswati Puja", "category": "Deity Puja"},
    {"name": "Hanuman Puja", "category": "Deity Puja"},
    {"name": "Krishna Puja", "category": "Deity Puja"},
    # Festival Pujas
    {"name": "Diwali Lakshmi Puja", "category": "Festival Puja"},
    {"name": "Ganesh Chaturthi Puja", "category": "Festival Puja"},
    {"name": "Navratri Durga Puja", "category": "Festival Puja"},
    {"name": "Satyanarayan Puja", "category": "Festival Puja"},
    {"name": "Krishna Janmashtami Puja", "category": "Festival Puja"},
    {"name": "Maha Shivratri Puja", "category": "Festival Puja"},
    # Samskaras
    {"name": "Namkaran Puja", "category": "Samskara"},
    {"name": "Annaprashan Puja", "category": "Samskara"},
    {"name": "Mundan Puja", "category": "Samskara"},
    {"name": "Upanayanam", "category": "Samskara"},
    {"name": "Vivah Puja", "category": "Samskara"},
    # Griha Pujas
    {"name": "Griha Pravesh Puja", "category": "Griha Puja"},
    {"name": "Bhoomi Puja", "category": "Griha Puja"},
    {"name": "Vastu Puja", "category": "Griha Puja"},
    # Graha Pujas
    {"name": "Navagraha Puja", "category": "Graha Puja"},
    {"name": "Maha Mrityunjaya Puja", "category": "Graha Puja"},
    {"name": "Rudrabhishek", "category": "Graha Puja"},
    # Homams
    {"name": "Ganapathy Homam", "category": "Homam"},
    {"name": "Navagraha Homam", "category": "Homam"},
    {"name": "Sudarshana Homam", "category": "Homam"},
]

async def seed_puja_types():
    """Seed default puja types if collection is empty"""
    count = await puja_types_collection.count_documents({})
    if count == 0:
        for puja in DEFAULT_PUJA_TYPES:
            puja["is_active"] = True
            puja["created_at"] = datetime.now(timezone.utc)
        await puja_types_collection.insert_many(DEFAULT_PUJA_TYPES)

@router.get("/puja-types")
async def get_puja_types(user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Get all puja types for admin management"""
    await seed_puja_types()
    
    cursor = puja_types_collection.find({}).sort("name", 1)
    puja_types = []
    async for puja in cursor:
        puja_types.append({
            "id": str(puja["_id"]),
            "name": puja["name"],
            "category": puja.get("category", "General"),
            "is_active": puja.get("is_active", True),
            "created_at": puja["created_at"].isoformat() if puja.get("created_at") else None
        })
    return {"puja_types": puja_types}

@router.post("/puja-types")
async def create_puja_type(request: Request, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Create a new puja type"""
    data = await request.json()
    
    name = data.get("name", "").strip()
    category = data.get("category", "General").strip()
    
    if not name:
        raise HTTPException(status_code=400, detail="Puja name is required")
    
    existing = await puja_types_collection.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Puja type already exists")
    
    new_puja = {
        "name": name,
        "category": category,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await puja_types_collection.insert_one(new_puja)
    
    return {
        "message": "Puja type created",
        "id": str(result.inserted_id)
    }

@router.put("/puja-types/{puja_id}")
async def update_puja_type(puja_id: str, request: Request, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Update a puja type"""
    data = await request.json()
    
    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"].strip()
    if "category" in data:
        update_data["category"] = data["category"].strip()
    if "is_active" in data:
        update_data["is_active"] = data["is_active"]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await puja_types_collection.update_one(
        {"_id": ObjectId(puja_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Puja type not found")
    
    return {"message": "Puja type updated"}

@router.delete("/puja-types/{puja_id}")
async def delete_puja_type(puja_id: str, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Delete a puja type"""
    result = await puja_types_collection.delete_one({"_id": ObjectId(puja_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Puja type not found")
    
    return {"message": "Puja type deleted"}

# ===================== AUDIO LIBRARY MANAGEMENT =====================

AUDIO_CATEGORIES = [
    "MAHAVAKYAS",
    "ESSENTIAL DAILY MANTRAS",
    "GANESH MANTRAS",
    "SHIVA MANTRAS",
    "VISHNU MANTRAS",
    "LAKSHMI MANTRAS",
    "SARASWATI MANTRAS",
    "HANUMAN MANTRAS",
    "NAVAGRAHA MANTRAS",
    "DAILY SHLOKAS",
    "PHILOSOPHICAL SHLOKAS",
    "POWERFUL STOTRAS",
    "POOJA RITUAL MANTRAS",
    "KEY SECTIONS FROM EPICS",
]

@router.get("/audio-library")
async def get_admin_audio_library(user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Get all audio library items for admin management"""
    cursor = audio_library_collection.find({}).sort([("category", 1), ("title", 1)])
    items = []
    async for item in cursor:
        items.append({
            "id": str(item["_id"]),
            "item_id": item.get("item_id"),
            "title": item.get("title"),
            "search_query": item.get("search_query"),
            "category": item.get("category"),
            "is_active": item.get("is_active", True),
            "created_at": item.get("created_at").isoformat() if item.get("created_at") else None
        })
    
    return {"items": items, "categories": AUDIO_CATEGORIES}

@router.post("/audio-library")
async def add_audio_item(request: Request, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Add a new audio item"""
    data = await request.json()
    
    title = data.get("title", "").strip()
    search_query = data.get("search_query", "").strip()
    category = data.get("category", "ESSENTIAL DAILY MANTRAS")
    
    if not title or not search_query:
        raise HTTPException(status_code=400, detail="Title and search query are required")
    
    item_id = title.lower().replace(" ", "-").replace("(", "").replace(")", "")[:50]
    
    existing = await audio_library_collection.find_one({"item_id": item_id})
    if existing:
        raise HTTPException(status_code=400, detail="An item with similar title already exists")
    
    new_item = {
        "item_id": item_id,
        "title": title,
        "search_query": search_query,
        "category": category,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await audio_library_collection.insert_one(new_item)
    
    return {
        "message": "Audio item added",
        "id": str(result.inserted_id),
        "item_id": item_id
    }

@router.put("/audio-library/{item_id}")
async def update_audio_item(item_id: str, request: Request, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Update an audio item"""
    data = await request.json()
    
    update_data = {}
    if "title" in data:
        update_data["title"] = data["title"].strip()
    if "search_query" in data:
        update_data["search_query"] = data["search_query"].strip()
    if "category" in data:
        update_data["category"] = data["category"]
    if "is_active" in data:
        update_data["is_active"] = data["is_active"]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await audio_library_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Audio item not found")
    
    return {"message": "Audio item updated"}

@router.delete("/audio-library/{item_id}")
async def delete_audio_item(item_id: str, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Delete an audio item"""
    result = await audio_library_collection.delete_one({"_id": ObjectId(item_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Audio item not found")
    
    return {"message": "Audio item deleted"}


# ===================== VIDEO LIBRARY MANAGEMENT =====================

from database import video_library_collection as video_lib_collection

@router.get("/video-library")
async def get_admin_video_library(user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Get all videos for admin management"""
    videos = []
    cursor = video_lib_collection.find({})
    async for video in cursor:
        videos.append({
            "id": str(video["_id"]),
            "title": video.get("title", ""),
            "video_id": video.get("video_id", ""),
            "artist": video.get("artist", ""),
            "duration": video.get("duration", ""),
            "category": video.get("category", ""),
            "thumbnail": video.get("thumbnail", f"https://img.youtube.com/vi/{video.get('video_id', '')}/mqdefault.jpg"),
            "is_active": video.get("is_active", True),
            "created_at": video.get("created_at")
        })
    
    return {"videos": videos}

@router.post("/video-library")
async def add_video(request: Request, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Add a new video to the library"""
    data = await request.json()
    
    video_doc = {
        "title": data.get("title"),
        "video_id": data.get("video_id"),
        "artist": data.get("artist", ""),
        "duration": data.get("duration", ""),
        "category": data.get("category", "aarti"),
        "thumbnail": f"https://img.youtube.com/vi/{data.get('video_id', '')}/mqdefault.jpg",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await video_lib_collection.insert_one(video_doc)
    
    return {"message": "Video added successfully", "id": str(result.inserted_id)}

@router.put("/video-library/{video_id}")
async def update_video(video_id: str, request: Request, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Update a video in the library"""
    data = await request.json()
    
    update_data = {
        "title": data.get("title"),
        "video_id": data.get("video_id"),
        "artist": data.get("artist", ""),
        "duration": data.get("duration", ""),
        "category": data.get("category"),
        "thumbnail": f"https://img.youtube.com/vi/{data.get('video_id', '')}/mqdefault.jpg",
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await video_lib_collection.update_one(
        {"_id": ObjectId(video_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return {"message": "Video updated successfully"}

@router.delete("/video-library/{video_id}")
async def delete_video(video_id: str, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Delete a video from the library"""
    result = await video_lib_collection.delete_one({"_id": ObjectId(video_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return {"message": "Video deleted successfully"}


# ===================== PROVIDER APPROVAL MANAGEMENT =====================

@router.get("/pending-approvals")
async def get_pending_approvals(user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Get all pending provider approvals"""
    pending = {
        "priests": [],
        "astrologers": [],
        "shops": []
    }
    
    # Query for pending OR missing approval_status (legacy records)
    pending_query = {
        "$or": [
            {"approval_status": "pending"},
            {"approval_status": {"$exists": False}, "is_verified": {"$ne": True}}
        ]
    }
    
    # Get pending priests
    cursor = priests_collection.find(pending_query)
    async for priest in cursor:
        priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        pending["priests"].append({
            "id": str(priest["_id"]),
            "user_id": priest["user_id"],
            "name": priest_user.get("name", "Unknown") if priest_user else "Unknown",
            "email": priest_user.get("email", "") if priest_user else "",
            "phone": priest_user.get("phone", "") if priest_user else "",
            "specializations": priest.get("specializations", []),
            "experience_years": priest.get("experience_years", 0),
            "created_at": priest.get("created_at").isoformat() if priest.get("created_at") else None
        })
    
    # Get pending astrologers
    cursor = astrologers_collection.find(pending_query)
    async for astro in cursor:
        astro_user = await users_collection.find_one({"_id": ObjectId(astro["user_id"])})
        pending["astrologers"].append({
            "id": str(astro["_id"]),
            "user_id": astro["user_id"],
            "name": astro_user.get("name", "Unknown") if astro_user else "Unknown",
            "email": astro_user.get("email", "") if astro_user else "",
            "phone": astro_user.get("phone", "") if astro_user else "",
            "specializations": astro.get("specializations", []),
            "experience_years": astro.get("experience_years", 0),
            "created_at": astro.get("created_at").isoformat() if astro.get("created_at") else None
        })
    
    # Get pending shops
    shop_pending_query = {
        "$or": [
            {"approval_status": "pending"},
            {"approval_status": {"$exists": False}, "is_verified": {"$ne": True}}
        ]
    }
    cursor = shops_collection.find(shop_pending_query)
    async for shop in cursor:
        shop_user = await users_collection.find_one({"_id": ObjectId(shop["owner_id"])})
        pending["shops"].append({
            "id": str(shop["_id"]),
            "owner_id": shop["owner_id"],
            "owner_name": shop_user.get("name", "Unknown") if shop_user else "Unknown",
            "email": shop_user.get("email", "") if shop_user else "",
            "shop_name": shop.get("shop_name", "") or shop.get("name", ""),
            "created_at": shop.get("created_at").isoformat() if shop.get("created_at") else None
        })
    
    return pending


@router.put("/approve/{provider_type}/{provider_id}")
async def approve_provider(provider_type: str, provider_id: str, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Approve a provider (priest, astrologer, or shop)"""
    collection_map = {
        "priest": priests_collection,
        "astrologer": astrologers_collection,
        "shop": shops_collection
    }
    
    if provider_type not in collection_map:
        raise HTTPException(status_code=400, detail="Invalid provider type")
    
    collection = collection_map[provider_type]
    result = await collection.update_one(
        {"_id": ObjectId(provider_id)},
        {"$set": {"approval_status": "approved", "is_verified": True, "approved_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Get provider and notify them
    provider = await collection.find_one({"_id": ObjectId(provider_id)})
    user_id = provider.get("user_id") or provider.get("owner_id")
    
    if user_id:
        await user_notifications_collection.insert_one({
            "user_id": user_id,
            "type": "approval_status",
            "title": "Profile Approved!",
            "message": f"Congratulations! Your {provider_type} profile has been approved. You are now visible to devotees.",
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"message": f"{provider_type.capitalize()} approved successfully"}


@router.put("/reject/{provider_type}/{provider_id}")
async def reject_provider(provider_type: str, provider_id: str, request: Request, user: dict = Depends(require_role([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    """Reject a provider (priest, astrologer, or shop)"""
    data = await request.json()
    reason = data.get("reason", "Your profile does not meet our requirements")
    
    collection_map = {
        "priest": priests_collection,
        "astrologer": astrologers_collection,
        "shop": shops_collection
    }
    
    if provider_type not in collection_map:
        raise HTTPException(status_code=400, detail="Invalid provider type")
    
    collection = collection_map[provider_type]
    result = await collection.update_one(
        {"_id": ObjectId(provider_id)},
        {"$set": {"approval_status": "rejected", "rejection_reason": reason, "rejected_at": datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Get provider and notify them
    provider = await collection.find_one({"_id": ObjectId(provider_id)})
    user_id = provider.get("user_id") or provider.get("owner_id")
    
    if user_id:
        await user_notifications_collection.insert_one({
            "user_id": user_id,
            "type": "approval_status",
            "title": "Profile Update Required",
            "message": f"Your {provider_type} profile needs some updates: {reason}. Please update your profile and it will be reviewed again.",
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"message": f"{provider_type.capitalize()} rejected"}


# ===================== CANCELLATION POLICY =====================

DEFAULT_CANCELLATION_RULES = [
    {"min_hours": 24, "max_hours": None, "refund_percent": 100, "label": "More than 24 hours before"},
    {"min_hours": 0, "max_hours": 24, "refund_percent": 50, "label": "Within 24 hours"},
    {"min_hours": None, "max_hours": 0, "refund_percent": 0, "label": "After booking time"},
]

@router.get("/cancellation-policy")
async def get_cancellation_policy(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get cancellation policy settings"""
    policy = await system_settings_collection.find_one({"type": "cancellation_policy"}, {"_id": 0})
    if not policy:
        return {"type": "cancellation_policy", "rules": DEFAULT_CANCELLATION_RULES}
    return policy

@router.put("/cancellation-policy")
async def update_cancellation_policy(request: Request, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Update cancellation policy settings"""
    data = await request.json()
    rules = data.get("rules", [])
    
    for rule in rules:
        rp = rule.get("refund_percent")
        if rp is None or not (0 <= rp <= 100):
            raise HTTPException(status_code=400, detail="Refund percent must be between 0 and 100")
    
    await system_settings_collection.update_one(
        {"type": "cancellation_policy"},
        {"$set": {"type": "cancellation_policy", "rules": rules, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"message": "Cancellation policy updated"}
