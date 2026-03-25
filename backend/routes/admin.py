"""
Admin Routes
Handles admin dashboard, user management, and system settings
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from bson import ObjectId

from database import (
    users_collection, priests_collection, astrologers_collection,
    shops_collection, bookings_collection, orders_collection,
    system_settings_collection
)
from models import UserRole
from auth import get_current_user, require_role
from system_config import (
    get_all_config, get_config_value, update_config, update_multiple_configs,
    get_config_by_category, CONFIG_CATEGORIES, init_system_config
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get admin dashboard statistics"""
    return {
        "users": await users_collection.count_documents({}),
        "priests": await priests_collection.count_documents({}),
        "astrologers": await astrologers_collection.count_documents({}),
        "shops": await shops_collection.count_documents({}),
        "bookings": await bookings_collection.count_documents({}),
        "orders": await orders_collection.count_documents({})
    }

@router.get("/users")
async def get_all_users(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get all users"""
    cursor = users_collection.find({})
    users = []
    async for u in cursor:
        users.append({
            "id": str(u["_id"]),
            "email": u.get("email"),
            "name": u.get("name"),
            "role": u.get("role"),
            "created_at": u.get("created_at").isoformat() if u.get("created_at") else None
        })
    return {"users": users}

@router.put("/verify-priest/{priest_id}")
async def verify_priest(priest_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Verify a priest"""
    result = await priests_collection.update_one(
        {"_id": ObjectId(priest_id)},
        {"$set": {"is_verified": True, "verified_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Priest not found")
    return {"message": "Priest verified"}

@router.put("/verify-astrologer/{astrologer_id}")
async def verify_astrologer(astrologer_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Verify an astrologer"""
    result = await astrologers_collection.update_one(
        {"_id": ObjectId(astrologer_id)},
        {"$set": {"is_verified": True, "verified_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Astrologer not found")
    return {"message": "Astrologer verified"}

@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request, admin: dict = Depends(require_role([UserRole.ADMIN]))):
    """Update user role"""
    data = await request.json()
    new_role = data.get("role")
    
    if new_role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated", "role": new_role}

# Consultation Settings
@router.get("/consultation-settings")
async def get_consultation_settings(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get consultation settings"""
    settings = await system_settings_collection.find_one({"type": "consultation"})
    if not settings:
        settings = {
            "min_recharge_amount": 100,
            "low_balance_warning": 20,
            "grace_period_seconds": 30,
            "free_minutes_new_users": 5,
            "free_minutes_enabled": True,
            "platform_commission_percent": 20
        }
    return settings

@router.put("/consultation-settings")
async def update_consultation_settings(request: Request, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Update consultation settings"""
    data = await request.json()
    await system_settings_collection.update_one(
        {"type": "consultation"},
        {"$set": {**data, "type": "consultation", "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"message": "Settings updated"}

# Default cancellation policy
DEFAULT_CANCELLATION_POLICY = {
    "rules": [
        {"min_hours": 24, "max_hours": None, "refund_percent": 100, "label": "More than 24 hours before"},
        {"min_hours": 0, "max_hours": 24, "refund_percent": 50, "label": "Within 24 hours"},
        {"min_hours": None, "max_hours": 0, "refund_percent": 0, "label": "After booking time"},
    ]
}

@router.get("/cancellation-policy")
async def get_cancellation_policy(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get cancellation policy settings"""
    policy = await system_settings_collection.find_one({"type": "cancellation_policy"}, {"_id": 0})
    if not policy:
        return {**DEFAULT_CANCELLATION_POLICY, "type": "cancellation_policy"}
    return policy

@router.put("/cancellation-policy")
async def update_cancellation_policy(request: Request, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Update cancellation policy settings"""
    data = await request.json()
    rules = data.get("rules", [])
    
    # Validate rules
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


# System Config
@router.get("/system-config")
async def get_system_config(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get all system configuration"""
    config = await get_all_config()
    return {
        "config": config,
        "categories": CONFIG_CATEGORIES
    }

@router.get("/system-config/{category}")
async def get_system_config_by_category(category: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get system configuration by category"""
    if category not in CONFIG_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    config = await get_config_by_category(category)
    return {
        "category": category,
        "config": config,
        "metadata": CONFIG_CATEGORIES[category]
    }

@router.put("/system-config")
async def update_system_config(request: Request, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Update multiple system configurations"""
    data = await request.json()
    count = await update_multiple_configs(data)
    return {"message": "Configuration updated", "updated_count": count}

@router.put("/system-config/{key}")
async def update_single_config(key: str, request: Request, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Update single system configuration"""
    data = await request.json()
    value = data.get("value")
    
    if value is None:
        raise HTTPException(status_code=400, detail="Value required")
    
    await update_config(key, value)
    return {"message": "Configuration updated", "key": key}

@router.get("/system-config/init")
async def initialize_system_config(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Initialize system configuration with defaults"""
    await init_system_config()
    return {"message": "System configuration initialized"}
