"""
Consultation, Wallet, and System Config Routes
Handles video consultations, wallet management, astrologer profiles, and system configuration
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from database import astrologers_collection, users_collection, festivals_collection, temples_collection, bookings_collection, service_reviews_collection
from auth import get_current_user, require_role
from video_consultation import (
    get_system_settings, update_system_settings,
    get_user_wallet, add_wallet_balance, get_wallet_transactions,
    get_astrologer_profile, update_astrologer_profile, get_available_astrologers,
    start_consultation_call, process_call_minute, end_consultation_call, get_call_history,
    get_astrologer_dashboard_stats, get_astrologer_earnings_report
)
from system_config import (
    get_all_config, get_config_value, update_config, update_multiple_configs,
    get_config_by_category, CONFIG_CATEGORIES, init_system_config,
    is_maintenance_mode, get_app_branding
)

router = APIRouter(prefix="/api", tags=["Consultation"])


# ===================== ASTROLOGER ROUTES =====================

@router.get("/astrologers")
async def get_astrologers(skip: int = 0, limit: int = 20):
    """Get list of approved astrologers"""
    query = {
        "$or": [
            {"approval_status": "approved"},
            {"is_verified": True, "approval_status": {"$exists": False}}
        ]
    }
    cursor = astrologers_collection.find(query).skip(skip).limit(limit)
    astrologers = []
    async for astro in cursor:
        try:
            user = await users_collection.find_one({"_id": ObjectId(astro["user_id"])})
            astrologers.append({
                "id": str(astro["_id"]),
                "user_id": astro["user_id"],
                "user_name": user["name"] if user else "Unknown",
                "specializations": astro.get("specializations", []),
                "experience_years": astro.get("experience_years", 0),
                "languages": astro.get("languages", []),
                "consultation_fee": astro.get("consultation_fee", 0),
                "bio": astro.get("bio", ""),
                "rating": astro.get("rating", 0),
                "is_verified": astro.get("is_verified", False)
            })
        except Exception as e:
            print(f"Error processing astrologer {astro.get('_id')}: {e}")
            continue
    return {"astrologers": astrologers}


# ===================== FESTIVAL & TEMPLE ROUTES =====================

@router.get("/festivals")
async def get_festivals():
    """Get all festivals"""
    cursor = festivals_collection.find({}).sort("date", 1)
    festivals = []
    async for festival in cursor:
        festivals.append({
            "id": str(festival["_id"]),
            "name": festival["name"],
            "date": festival["date"],
            "description": festival["description"],
            "importance": festival.get("importance", "Medium")
        })
    return {"festivals": festivals, "count": len(festivals)}


@router.get("/temples")
async def get_temples(city: Optional[str] = None, state: Optional[str] = None):
    """Get temples with optional city/state filter"""
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    
    cursor = temples_collection.find(query)
    temples = []
    async for temple in cursor:
        temples.append({
            "id": str(temple["_id"]),
            "name": temple["name"],
            "city": temple["city"],
            "state": temple["state"],
            "deity": temple["deity"],
            "description": temple["description"]
        })
    return {"temples": temples, "count": len(temples)}


# ===================== SERVICE REVIEWS =====================

@router.post("/bookings/{booking_id}/review")
async def create_service_review(booking_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Create a review for a completed booking"""
    data = await request.json()
    
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.get("user_id") != str(user["_id"]):
        raise HTTPException(status_code=403, detail="This is not your booking")
    
    if booking.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    
    existing = await service_reviews_collection.find_one({"booking_id": booking_id})
    if existing:
        raise HTTPException(status_code=400, detail="Review already submitted")
    
    review = {
        "booking_id": booking_id,
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "Anonymous"),
        "provider_id": booking.get("priest_id") or booking.get("astrologer_id"),
        "provider_type": "priest" if booking.get("priest_id") else "astrologer",
        "service_type": booking.get("service_type", booking.get("puja_type", "General")),
        "rating": data.get("rating", 5),
        "review_text": data.get("review_text", ""),
        "would_recommend": data.get("would_recommend", True),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await service_reviews_collection.insert_one(review)
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"has_review": True, "review_id": str(result.inserted_id)}}
    )
    
    return {"message": "Review submitted successfully", "review_id": str(result.inserted_id)}


@router.get("/providers/{provider_id}/reviews")
async def get_provider_reviews(provider_id: str, skip: int = 0, limit: int = 20):
    """Get reviews for a provider"""
    cursor = service_reviews_collection.find({"provider_id": provider_id}).sort("created_at", -1).skip(skip).limit(limit)
    
    reviews = []
    total_rating = 0
    count = 0
    
    async for review in cursor:
        reviews.append({
            "id": str(review["_id"]),
            "user_name": review.get("user_name", "Anonymous"),
            "rating": review.get("rating", 5),
            "review_text": review.get("review_text", ""),
            "service_type": review.get("service_type", ""),
            "would_recommend": review.get("would_recommend", True),
            "created_at": review.get("created_at").isoformat() if review.get("created_at") else None
        })
        total_rating += review.get("rating", 5)
        count += 1
    
    avg_rating = round(total_rating / count, 1) if count > 0 else 0
    
    return {
        "reviews": reviews,
        "total_count": count,
        "average_rating": avg_rating
    }


# ===================== ADMIN CONSULTATION SETTINGS =====================

@router.get("/admin/consultation-settings")
async def get_consultation_settings(user: dict = Depends(get_current_user)):
    """Get consultation system settings (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    settings = await get_system_settings()
    return {k: v for k, v in settings.items() if k != "_id"}


@router.put("/admin/consultation-settings")
async def update_consultation_settings(request: Request, user: dict = Depends(get_current_user)):
    """Update consultation system settings (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    data = await request.json()
    settings = await update_system_settings(data)
    return {k: v for k, v in settings.items() if k != "_id"}


# ===================== SYSTEM CONFIGURATION =====================

@router.get("/admin/system-config")
async def get_system_config(user: dict = Depends(get_current_user)):
    """Get all system configuration (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = await get_all_config(include_sensitive=False)
    return {"config": config, "categories": CONFIG_CATEGORIES}


@router.get("/admin/system-config/{category}")
async def get_system_config_by_category(category: str, user: dict = Depends(get_current_user)):
    """Get system config by category (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if category not in CONFIG_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    config = await get_config_by_category(category, include_sensitive=False)
    return {"category": category, "category_info": CONFIG_CATEGORIES[category], "config": config}


@router.put("/admin/system-config")
async def update_system_config(request: Request, user: dict = Depends(get_current_user)):
    """Update system configuration (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    data = await request.json()
    result = await update_multiple_configs(data)
    return {"message": "Configuration updated", **result}


@router.put("/admin/system-config/{key}")
async def update_single_config(key: str, request: Request, user: dict = Depends(get_current_user)):
    """Update a single config value (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    data = await request.json()
    value = data.get("value")
    
    try:
        result = await update_config(key, value)
        return {"message": "Configuration updated", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/admin/system-config/init")
async def initialize_system_config(user: dict = Depends(get_current_user)):
    """Initialize system config from env variables (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await init_system_config()
    return {"message": "System configuration initialized"}


# ===================== PUBLIC APP ENDPOINTS =====================

@router.get("/app/branding")
async def get_branding():
    """Get public app branding info"""
    return await get_app_branding()


@router.get("/app/status")
async def get_app_status():
    """Check if app is in maintenance mode"""
    maintenance = await is_maintenance_mode()
    if maintenance:
        message = await get_config_value("maintenance_message", "We are currently performing scheduled maintenance.")
        return {"maintenance": True, "message": message}
    return {"maintenance": False}


# ===================== WALLET ENDPOINTS =====================

@router.get("/wallet")
async def get_wallet(user: dict = Depends(get_current_user)):
    """Get current user's wallet"""
    return await get_user_wallet(str(user["_id"]))


@router.get("/wallet/transactions")
async def get_transactions(skip: int = 0, limit: int = 50, user: dict = Depends(get_current_user)):
    """Get wallet transaction history"""
    transactions = await get_wallet_transactions(str(user["_id"]), limit, skip)
    return {"transactions": transactions}


@router.post("/wallet/recharge")
async def recharge_wallet(request: Request, user: dict = Depends(get_current_user)):
    """Add balance to wallet after successful payment"""
    data = await request.json()
    amount = data.get("amount", 0)
    payment_id = data.get("payment_id")
    payment_method = data.get("payment_method", "razorpay")
    
    settings = await get_system_settings()
    if amount < settings["min_recharge_amount"]:
        raise HTTPException(status_code=400, detail=f"Minimum recharge amount is ₹{settings['min_recharge_amount']}")
    
    wallet = await add_wallet_balance(str(user["_id"]), amount, payment_id, payment_method)
    return {"message": "Wallet recharged successfully", "wallet": wallet}


# ===================== ASTROLOGER PROFILE & AVAILABILITY =====================

@router.get("/astrologers/available")
async def list_available_astrologers():
    """Get list of available astrologers"""
    astrologers = await get_available_astrologers()
    return {"astrologers": astrologers}


@router.get("/astrologer/profile")
async def get_my_astrologer_profile(user: dict = Depends(get_current_user)):
    """Get current astrologer's profile"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    profile = await get_astrologer_profile(str(user["_id"]))
    if not profile:
        profile = await update_astrologer_profile(str(user["_id"]), {
            "rate_per_minute": 10,
            "is_available": False
        })
    return profile


@router.put("/astrologer/profile")
async def update_my_astrologer_profile(request: Request, user: dict = Depends(get_current_user)):
    """Update current astrologer's profile"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    data = await request.json()
    profile = await update_astrologer_profile(str(user["_id"]), data)
    return profile


@router.put("/astrologer/availability")
async def set_astrologer_availability(request: Request, user: dict = Depends(get_current_user)):
    """Set astrologer online/offline status"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    data = await request.json()
    is_available = data.get("is_available", False)
    profile = await update_astrologer_profile(str(user["_id"]), {"is_available": is_available})
    return {"is_available": profile["is_available"]}


# ===================== ASTROLOGER DASHBOARD =====================

@router.get("/astrologer/dashboard")
async def get_astrologer_dashboard(user: dict = Depends(get_current_user)):
    """Get astrologer dashboard with stats"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    
    data = await get_astrologer_dashboard_stats(str(user["_id"]))
    if not data:
        raise HTTPException(status_code=404, detail="Astrologer profile not found")
    return data


@router.get("/astrologer/earnings")
async def get_astrologer_earnings(period: str = "week", user: dict = Depends(get_current_user)):
    """Get astrologer earnings report"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    
    if period not in ["day", "week", "month"]:
        period = "week"
    
    return await get_astrologer_earnings_report(str(user["_id"]), period)


@router.get("/astrologer/calls")
async def get_astrologer_calls(skip: int = 0, limit: int = 20, user: dict = Depends(get_current_user)):
    """Get astrologer's call history"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    
    calls = await get_call_history(str(user["_id"]), "astrologer", limit, skip)
    return {"calls": calls}


# ===================== VIDEO CONSULTATION =====================

@router.post("/consultation/start")
async def start_call(request: Request, user: dict = Depends(get_current_user)):
    """Start a video consultation with an astrologer"""
    data = await request.json()
    astrologer_user_id = data.get("astrologer_user_id")
    
    if not astrologer_user_id:
        raise HTTPException(status_code=400, detail="Astrologer ID required")
    
    try:
        result = await start_consultation_call(str(user["_id"]), astrologer_user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/consultation/{call_id}/process-minute")
async def process_minute(call_id: str, user: dict = Depends(get_current_user)):
    """Process billing for one minute of consultation"""
    result = await process_call_minute(call_id)
    return result


@router.post("/consultation/{call_id}/end")
async def end_call(call_id: str, request: Request, user: dict = Depends(get_current_user)):
    """End a consultation call"""
    data = await request.json()
    reason = data.get("reason", "normal")
    
    try:
        result = await end_consultation_call(call_id, reason)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/consultation/history")
async def consultation_history(skip: int = 0, limit: int = 20, user: dict = Depends(get_current_user)):
    """Get user's consultation history"""
    role = "astrologer" if user.get("role") == "astrologer" else "user"
    calls = await get_call_history(str(user["_id"]), role, limit, skip)
    return {"calls": calls}


@router.get("/consultation/settings")
async def get_public_consultation_settings():
    """Get public consultation settings (for frontend)"""
    settings = await get_system_settings()
    return {
        "min_recharge_amount": settings["min_recharge_amount"],
        "low_balance_warning": settings["low_balance_warning"],
        "grace_period_seconds": settings["grace_period_seconds"],
        "free_minutes_new_users": settings["free_minutes_new_users"] if settings["free_minutes_enabled"] else 0
    }
