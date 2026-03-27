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
    system_settings_collection, payment_transactions_collection,
    wallet_transactions_collection, class_enrollments_collection
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



# ===================== PAYMENTS DASHBOARD =====================

@router.get("/payments/dashboard")
async def get_payments_dashboard(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get admin payments dashboard data"""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week = now - timedelta(days=now.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    platform_fee_pct = float(await get_config_value("platform_fee_percentage", 5)) / 100
    gst_pct = float(await get_config_value("gst_percentage", 18)) / 100

    # --- Order Revenue ---
    paid_statuses = ["paid", "received", "accepted", "processing", "shipping", "delivered"]
    order_pipeline = [
        {"$match": {"status": {"$in": paid_statuses}}},
        {"$group": {
            "_id": None,
            "total": {"$sum": "$total_amount"},
            "platform_fees": {"$sum": {"$ifNull": ["$platform_fee", 0]}},
            "tax": {"$sum": {"$ifNull": ["$tax_amount", 0]}},
            "count": {"$sum": 1}
        }}
    ]
    order_agg = await orders_collection.aggregate(order_pipeline).to_list(1)
    order_stats = order_agg[0] if order_agg else {"total": 0, "platform_fees": 0, "tax": 0, "count": 0}

    # Today/week/month orders
    async def orders_by_period(date_filter):
        pipeline = [
            {"$match": {"status": {"$in": paid_statuses}, "created_at": date_filter}},
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}, "count": {"$sum": 1}}}
        ]
        result = await orders_collection.aggregate(pipeline).to_list(1)
        return result[0] if result else {"total": 0, "count": 0}

    today_orders = await orders_by_period({"$gte": start_of_today})
    week_orders = await orders_by_period({"$gte": start_of_week})
    month_orders = await orders_by_period({"$gte": start_of_month})

    # --- Booking Revenue ---
    booking_pipeline = [
        {"$match": {"status": "completed", "price": {"$exists": True}}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}, "count": {"$sum": 1}}}
    ]
    booking_agg = await bookings_collection.aggregate(booking_pipeline).to_list(1)
    booking_stats = booking_agg[0] if booking_agg else {"total": 0, "count": 0}

    # --- Class Enrollment Revenue ---
    class_pipeline = [
        {"$match": {"status": "completed", "amount": {"$gt": 0}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    class_agg = await class_enrollments_collection.aggregate(class_pipeline).to_list(1)
    class_stats = class_agg[0] if class_agg else {"total": 0, "count": 0}

    # --- Wallet Recharges ---
    wallet_pipeline = [
        {"$match": {"type": "credit"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    wallet_agg = await wallet_transactions_collection.aggregate(wallet_pipeline).to_list(1)
    wallet_stats = wallet_agg[0] if wallet_agg else {"total": 0, "count": 0}

    # --- Gateway Split (from payment_transactions) ---
    gateway_pipeline = [
        {"$match": {"payment_status": {"$in": ["completed", "succeeded", "paid"]}}},
        {"$group": {"_id": "$payment_method", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    gateway_agg = await payment_transactions_collection.aggregate(gateway_pipeline).to_list(10)
    gateway_split = {}
    for g in gateway_agg:
        gateway_split[g["_id"] or "unknown"] = {"total": g["total"], "count": g["count"]}

    # Total revenue across all sources
    total_revenue = (order_stats.get("total", 0) or 0) + (booking_stats.get("total", 0) or 0) + (class_stats.get("total", 0) or 0) + (wallet_stats.get("total", 0) or 0)
    total_platform_fees = (order_stats.get("platform_fees", 0) or 0) + round((booking_stats.get("total", 0) or 0) * platform_fee_pct, 2) + round((class_stats.get("total", 0) or 0) * platform_fee_pct, 2)
    total_gst = (order_stats.get("tax", 0) or 0) + round(total_platform_fees * gst_pct, 2)

    # --- Provider Payouts Summary ---
    # Shop owners
    shop_payout_pipeline = [
        {"$match": {"status": {"$in": paid_statuses}}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.shop_id", "total": {"$sum": "$items.subtotal"}}}
    ]
    shop_payouts = await orders_collection.aggregate(shop_payout_pipeline).to_list(100)

    # Priest earnings from bookings
    priest_payout_pipeline = [
        {"$match": {"status": "completed", "price": {"$exists": True}}},
        {"$group": {"_id": "$priest_id", "total": {"$sum": "$price"}, "count": {"$sum": 1}}}
    ]
    priest_payouts = await bookings_collection.aggregate(priest_payout_pipeline).to_list(100)

    total_provider_due = sum(s["total"] * (1 - platform_fee_pct) for s in shop_payouts) + sum(p["total"] * (1 - platform_fee_pct) for p in priest_payouts)

    return {
        "summary": {
            "total_revenue": round(total_revenue, 2),
            "today_revenue": round(today_orders.get("total", 0) or 0, 2),
            "week_revenue": round(week_orders.get("total", 0) or 0, 2),
            "month_revenue": round(month_orders.get("total", 0) or 0, 2),
            "platform_fees_earned": round(total_platform_fees, 2),
            "gst_collected": round(total_gst, 2),
            "platform_fee_pct": platform_fee_pct * 100,
            "gst_pct": gst_pct * 100,
        },
        "by_type": {
            "orders": {"total": round(order_stats.get("total", 0) or 0, 2), "count": order_stats.get("count", 0) or 0},
            "bookings": {"total": round(booking_stats.get("total", 0) or 0, 2), "count": booking_stats.get("count", 0) or 0},
            "classes": {"total": round(class_stats.get("total", 0) or 0, 2), "count": class_stats.get("count", 0) or 0},
            "wallet_recharges": {"total": round(wallet_stats.get("total", 0) or 0, 2), "count": wallet_stats.get("count", 0) or 0},
        },
        "gateway_split": gateway_split,
        "provider_payouts": {
            "total_due": round(total_provider_due, 2),
            "shop_owners": len(shop_payouts),
            "priests": len(priest_payouts),
        }
    }


@router.get("/payments/transactions")
async def get_payment_transactions(
    skip: int = 0,
    limit: int = 50,
    payment_type: str = None,
    gateway: str = None,
    status: str = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Get all payment transactions with filters"""
    query = {}
    if payment_type:
        query["payment_type"] = payment_type
    if gateway:
        query["payment_method"] = gateway
    if status:
        query["payment_status"] = status

    cursor = payment_transactions_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    total = await payment_transactions_collection.count_documents(query)

    transactions = []
    async for tx in cursor:
        user_info = None
        if tx.get("user_id"):
            try:
                u = await users_collection.find_one({"_id": ObjectId(tx["user_id"])})
                user_info = {"name": u.get("name", "Unknown"), "email": u.get("email", "")} if u else None
            except Exception:
                pass

        transactions.append({
            "id": str(tx["_id"]),
            "user_id": tx.get("user_id"),
            "user_name": user_info["name"] if user_info else "Unknown",
            "user_email": user_info["email"] if user_info else "",
            "amount": tx.get("amount", 0),
            "currency": tx.get("currency", "INR"),
            "payment_type": tx.get("payment_type", "general"),
            "payment_method": tx.get("payment_method", "unknown"),
            "payment_status": tx.get("payment_status", "unknown"),
            "payment_intent_id": tx.get("payment_intent_id"),
            "razorpay_order_id": tx.get("razorpay_order_id"),
            "created_at": tx.get("created_at").isoformat() if tx.get("created_at") else None,
        })

    return {"transactions": transactions, "total": total, "skip": skip, "limit": limit}
