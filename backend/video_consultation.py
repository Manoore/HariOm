"""
Video Consultation Module - 100ms Integration with Per-Minute Billing
"""
import os
import jwt
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from database import (
    system_settings_collection, user_wallets_collection, 
    wallet_transactions_collection, consultation_calls_collection,
    astrologer_profiles_collection, users_collection
)
from bson import ObjectId

# 100ms Configuration
HMS_ACCESS_KEY = os.environ.get("HMS_ACCESS_KEY")
HMS_SECRET = os.environ.get("HMS_SECRET")

# Default System Settings
DEFAULT_SETTINGS = {
    "min_recharge_amount": 100,
    "low_balance_warning": 20,
    "grace_period_seconds": 30,
    "free_minutes_new_users": 5,
    "free_minutes_enabled": True,
    "referral_bonus_minutes": 2,
    "platform_commission_percent": 20,
}

# ===================== SYSTEM SETTINGS =====================

async def get_system_settings() -> Dict[str, Any]:
    """Get all system settings with defaults"""
    settings = await system_settings_collection.find_one({"_id": "consultation_settings"})
    if not settings:
        # Initialize with defaults
        settings = {"_id": "consultation_settings", **DEFAULT_SETTINGS}
        await system_settings_collection.insert_one(settings)
    
    # Merge with defaults for any missing keys
    for key, value in DEFAULT_SETTINGS.items():
        if key not in settings:
            settings[key] = value
    
    return settings

async def update_system_settings(updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update system settings"""
    allowed_keys = set(DEFAULT_SETTINGS.keys())
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_keys}
    
    await system_settings_collection.update_one(
        {"_id": "consultation_settings"},
        {"$set": filtered_updates},
        upsert=True
    )
    return await get_system_settings()

# ===================== WALLET MANAGEMENT =====================

async def get_user_wallet(user_id: str) -> Dict[str, Any]:
    """Get user wallet, create if not exists"""
    wallet = await user_wallets_collection.find_one({"user_id": user_id})
    if not wallet:
        # Check if new user should get free minutes
        settings = await get_system_settings()
        free_minutes = settings["free_minutes_new_users"] if settings["free_minutes_enabled"] else 0
        
        wallet = {
            "user_id": user_id,
            "balance": 0,
            "free_minutes": free_minutes,
            "total_recharged": 0,
            "total_spent": 0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await user_wallets_collection.insert_one(wallet)
    
    return {
        "user_id": wallet["user_id"],
        "balance": wallet.get("balance", 0),
        "free_minutes": wallet.get("free_minutes", 0),
        "total_recharged": wallet.get("total_recharged", 0),
        "total_spent": wallet.get("total_spent", 0)
    }

async def add_wallet_balance(user_id: str, amount: float, payment_id: str, payment_method: str) -> Dict[str, Any]:
    """Add balance to user wallet after successful payment"""
    wallet = await get_user_wallet(user_id)
    
    new_balance = wallet["balance"] + amount
    
    await user_wallets_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "balance": new_balance,
                "updated_at": datetime.now(timezone.utc)
            },
            "$inc": {"total_recharged": amount}
        }
    )
    
    # Record transaction
    transaction = {
        "user_id": user_id,
        "type": "credit",
        "amount": amount,
        "balance_after": new_balance,
        "description": f"Wallet recharge via {payment_method}",
        "payment_id": payment_id,
        "payment_method": payment_method,
        "created_at": datetime.now(timezone.utc)
    }
    await wallet_transactions_collection.insert_one(transaction)
    
    return await get_user_wallet(user_id)

async def deduct_wallet_balance(user_id: str, amount: float, description: str, call_id: str = None) -> Dict[str, Any]:
    """Deduct balance from user wallet"""
    wallet = await get_user_wallet(user_id)
    
    new_balance = max(0, wallet["balance"] - amount)
    
    await user_wallets_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "balance": new_balance,
                "updated_at": datetime.now(timezone.utc)
            },
            "$inc": {"total_spent": amount}
        }
    )
    
    # Record transaction
    transaction = {
        "user_id": user_id,
        "type": "debit",
        "amount": amount,
        "balance_after": new_balance,
        "description": description,
        "call_id": call_id,
        "created_at": datetime.now(timezone.utc)
    }
    await wallet_transactions_collection.insert_one(transaction)
    
    return await get_user_wallet(user_id)

async def use_free_minutes(user_id: str, minutes: int) -> int:
    """Use free minutes, return remaining minutes to use"""
    wallet = await get_user_wallet(user_id)
    free_mins = wallet.get("free_minutes", 0)
    
    if free_mins <= 0:
        return minutes
    
    minutes_to_use = min(free_mins, minutes)
    remaining = minutes - minutes_to_use
    
    await user_wallets_collection.update_one(
        {"user_id": user_id},
        {
            "$inc": {"free_minutes": -minutes_to_use},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return remaining

async def get_wallet_transactions(user_id: str, limit: int = 50, skip: int = 0):
    """Get user's wallet transaction history"""
    cursor = wallet_transactions_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    transactions = []
    async for t in cursor:
        transactions.append({
            "id": str(t["_id"]),
            "type": t["type"],
            "amount": t["amount"],
            "balance_after": t["balance_after"],
            "description": t["description"],
            "created_at": t["created_at"].isoformat()
        })
    
    return transactions

# ===================== 100MS INTEGRATION =====================

def generate_100ms_token(room_id: str, user_id: str, role: str = "guest") -> str:
    """Generate 100ms authentication token"""
    now = datetime.utcnow()
    exp = now + timedelta(hours=24)
    
    payload = {
        "access_key": HMS_ACCESS_KEY,
        "room_id": room_id,
        "user_id": user_id,
        "role": role,
        "type": "app",
        "version": 2,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "jti": str(uuid.uuid4())
    }
    
    token = jwt.encode(payload, HMS_SECRET, algorithm="HS256")
    return token

def generate_100ms_management_token() -> str:
    """Generate 100ms management token for server-side operations"""
    now = datetime.utcnow()
    exp = now + timedelta(hours=24)
    
    payload = {
        "access_key": HMS_ACCESS_KEY,
        "type": "management",
        "version": 2,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "jti": str(uuid.uuid4())
    }
    
    token = jwt.encode(payload, HMS_SECRET, algorithm="HS256")
    return token

async def create_100ms_room(title: str) -> Dict[str, Any]:
    """Create a new 100ms room"""
    import httpx
    
    management_token = generate_100ms_management_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.100ms.live/v2/rooms",
            headers={
                "Authorization": f"Bearer {management_token}",
                "Content-Type": "application/json"
            },
            json={
                "name": title,
                "description": f"Consultation room - {title}",
                "template_id": None,  # Uses default template
                "recording_info": {
                    "enabled": True
                }
            }
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to create room: {response.text}")

async def end_100ms_room(room_id: str, reason: str = "Call ended") -> bool:
    """End a 100ms room (kicks all participants)"""
    import httpx
    
    management_token = generate_100ms_management_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.100ms.live/v2/rooms/{room_id}/end",
            headers={
                "Authorization": f"Bearer {management_token}",
                "Content-Type": "application/json"
            },
            json={
                "reason": reason,
                "lock": True
            }
        )
        
        return response.status_code == 200

# ===================== ASTROLOGER MANAGEMENT =====================

async def get_astrologer_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Get astrologer profile"""
    profile = await astrologer_profiles_collection.find_one({"user_id": user_id})
    if profile:
        return {
            "id": str(profile["_id"]),
            "user_id": profile["user_id"],
            "rate_per_minute": profile.get("rate_per_minute", 10),
            "specializations": profile.get("specializations", []),
            "experience_years": profile.get("experience_years", 0),
            "languages": profile.get("languages", ["Hindi", "English"]),
            "is_available": profile.get("is_available", False),
            "total_consultations": profile.get("total_consultations", 0),
            "total_earnings": profile.get("total_earnings", 0),
            "avg_rating": profile.get("avg_rating", 0),
            "created_at": profile.get("created_at", datetime.now(timezone.utc)).isoformat()
        }
    return None

async def update_astrologer_profile(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update astrologer profile"""
    allowed_fields = ["rate_per_minute", "specializations", "experience_years", "languages", "is_available"]
    filtered = {k: v for k, v in updates.items() if k in allowed_fields}
    
    await astrologer_profiles_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {**filtered, "updated_at": datetime.now(timezone.utc)},
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)}
        },
        upsert=True
    )
    
    return await get_astrologer_profile(user_id)

async def get_available_astrologers():
    """Get list of available astrologers with their rates"""
    cursor = astrologer_profiles_collection.find({"is_available": True})
    
    astrologers = []
    async for profile in cursor:
        user = await users_collection.find_one({"_id": ObjectId(profile["user_id"])})
        if user:
            astrologers.append({
                "id": str(profile["_id"]),
                "user_id": profile["user_id"],
                "name": user.get("name", "Astrologer"),
                "profile_photo": user.get("profile_photo"),
                "rate_per_minute": profile.get("rate_per_minute", 10),
                "specializations": profile.get("specializations", []),
                "experience_years": profile.get("experience_years", 0),
                "languages": profile.get("languages", ["Hindi", "English"]),
                "total_consultations": profile.get("total_consultations", 0),
                "avg_rating": profile.get("avg_rating", 0)
            })
    
    return astrologers

# ===================== CONSULTATION CALLS =====================

async def start_consultation_call(user_id: str, astrologer_user_id: str) -> Dict[str, Any]:
    """Start a new consultation call"""
    settings = await get_system_settings()
    wallet = await get_user_wallet(user_id)
    astrologer = await get_astrologer_profile(astrologer_user_id)
    
    if not astrologer:
        raise Exception("Astrologer not found")
    
    rate_per_minute = astrologer["rate_per_minute"]
    
    # Check if user has free minutes or sufficient balance
    has_free_minutes = wallet.get("free_minutes", 0) > 0
    min_balance_required = settings["min_recharge_amount"] if not has_free_minutes else 0
    
    if not has_free_minutes and wallet["balance"] < min_balance_required:
        raise Exception(f"Insufficient balance. Minimum ₹{min_balance_required} required.")
    
    # Create 100ms room
    astrologer_user = await users_collection.find_one({"_id": ObjectId(astrologer_user_id)})
    room_title = f"Consultation with {astrologer_user.get('name', 'Astrologer')}"
    
    room_data = await create_100ms_room(room_title)
    room_id = room_data.get("id")
    
    # Generate tokens for both participants
    user_token = generate_100ms_token(room_id, user_id, "guest")
    astrologer_token = generate_100ms_token(room_id, astrologer_user_id, "host")
    
    # Create call record
    call_record = {
        "user_id": user_id,
        "astrologer_user_id": astrologer_user_id,
        "room_id": room_id,
        "rate_per_minute": rate_per_minute,
        "status": "active",
        "started_at": datetime.now(timezone.utc),
        "ended_at": None,
        "duration_seconds": 0,
        "total_charged": 0,
        "free_minutes_used": 0,
        "wallet_deducted": 0,
        "astrologer_earning": 0,
        "platform_commission": 0
    }
    
    result = await consultation_calls_collection.insert_one(call_record)
    call_id = str(result.inserted_id)
    
    return {
        "call_id": call_id,
        "room_id": room_id,
        "user_token": user_token,
        "astrologer_token": astrologer_token,
        "rate_per_minute": rate_per_minute,
        "user_balance": wallet["balance"],
        "free_minutes": wallet.get("free_minutes", 0),
        "settings": {
            "low_balance_warning": settings["low_balance_warning"],
            "grace_period_seconds": settings["grace_period_seconds"]
        }
    }

async def process_call_minute(call_id: str) -> Dict[str, Any]:
    """Process billing for one minute of call - called every 60 seconds"""
    call = await consultation_calls_collection.find_one({"_id": ObjectId(call_id)})
    if not call or call["status"] != "active":
        return {"status": "call_not_active"}
    
    settings = await get_system_settings()
    wallet = await get_user_wallet(call["user_id"])
    rate = call["rate_per_minute"]
    
    # Check free minutes first
    free_mins = wallet.get("free_minutes", 0)
    charge_amount = 0
    
    if free_mins > 0:
        # Use free minute
        await user_wallets_collection.update_one(
            {"user_id": call["user_id"]},
            {"$inc": {"free_minutes": -1}}
        )
        await consultation_calls_collection.update_one(
            {"_id": ObjectId(call_id)},
            {
                "$inc": {
                    "duration_seconds": 60,
                    "free_minutes_used": 1
                }
            }
        )
        wallet = await get_user_wallet(call["user_id"])
    else:
        # Charge from wallet
        charge_amount = rate
        if wallet["balance"] >= charge_amount:
            await deduct_wallet_balance(
                call["user_id"], 
                charge_amount, 
                f"Consultation call - 1 min @ ₹{rate}/min",
                call_id
            )
            
            # Calculate commission
            commission_percent = settings["platform_commission_percent"]
            platform_commission = charge_amount * (commission_percent / 100)
            astrologer_earning = charge_amount - platform_commission
            
            await consultation_calls_collection.update_one(
                {"_id": ObjectId(call_id)},
                {
                    "$inc": {
                        "duration_seconds": 60,
                        "total_charged": charge_amount,
                        "wallet_deducted": charge_amount,
                        "astrologer_earning": astrologer_earning,
                        "platform_commission": platform_commission
                    }
                }
            )
            wallet = await get_user_wallet(call["user_id"])
    
    # Check balance status
    balance = wallet["balance"]
    free_minutes = wallet.get("free_minutes", 0)
    
    status = "ok"
    if free_minutes <= 0 and balance < rate:
        status = "insufficient_balance"
    elif free_minutes <= 0 and balance <= settings["low_balance_warning"]:
        status = "low_balance"
    
    # Calculate minutes left
    if free_minutes > 0:
        minutes_left = free_minutes + (balance // rate)
    else:
        minutes_left = balance // rate
    
    return {
        "status": status,
        "balance": balance,
        "free_minutes": free_minutes,
        "minutes_left": int(minutes_left),
        "charged": charge_amount,
        "low_balance_warning": settings["low_balance_warning"],
        "grace_period_seconds": settings["grace_period_seconds"]
    }

async def end_consultation_call(call_id: str, reason: str = "normal") -> Dict[str, Any]:
    """End a consultation call"""
    call = await consultation_calls_collection.find_one({"_id": ObjectId(call_id)})
    if not call:
        raise Exception("Call not found")
    
    # End the 100ms room
    await end_100ms_room(call["room_id"], reason)
    
    # Update call record
    ended_at = datetime.now(timezone.utc)
    started_at = call["started_at"]
    # Handle timezone-naive datetime from MongoDB
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    duration = (ended_at - started_at).total_seconds()
    
    await consultation_calls_collection.update_one(
        {"_id": ObjectId(call_id)},
        {
            "$set": {
                "status": "completed",
                "ended_at": ended_at,
                "end_reason": reason
            }
        }
    )
    
    # Update astrologer stats
    await astrologer_profiles_collection.update_one(
        {"user_id": call["astrologer_user_id"]},
        {
            "$inc": {
                "total_consultations": 1,
                "total_earnings": call.get("astrologer_earning", 0)
            }
        }
    )
    
    return {
        "call_id": call_id,
        "duration_seconds": duration,
        "total_charged": call.get("total_charged", 0),
        "free_minutes_used": call.get("free_minutes_used", 0),
        "reason": reason
    }

async def get_call_history(user_id: str, role: str = "user", limit: int = 20, skip: int = 0):
    """Get call history for user or astrologer"""
    query = {"user_id": user_id} if role == "user" else {"astrologer_user_id": user_id}
    
    cursor = consultation_calls_collection.find(query).sort("started_at", -1).skip(skip).limit(limit)
    
    calls = []
    async for call in cursor:
        # Get other party's info
        if role == "user":
            other_user = await users_collection.find_one({"_id": ObjectId(call["astrologer_user_id"])})
        else:
            other_user = await users_collection.find_one({"_id": ObjectId(call["user_id"])})
        
        calls.append({
            "id": str(call["_id"]),
            "other_party": {
                "name": other_user.get("name", "User") if other_user else "Unknown",
                "profile_photo": other_user.get("profile_photo") if other_user else None
            },
            "status": call["status"],
            "duration_seconds": call.get("duration_seconds", 0),
            "rate_per_minute": call["rate_per_minute"],
            "total_charged": call.get("total_charged", 0),
            "free_minutes_used": call.get("free_minutes_used", 0),
            "astrologer_earning": call.get("astrologer_earning", 0) if role == "astrologer" else None,
            "started_at": call["started_at"].isoformat(),
            "ended_at": call["ended_at"].isoformat() if call.get("ended_at") else None
        })
    
    return calls
