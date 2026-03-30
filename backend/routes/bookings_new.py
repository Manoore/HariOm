"""
Booking Routes Module
Contains all booking-related endpoints for the Divine App.
Includes: create booking, get bookings, update status
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from bson import ObjectId

from database import (
    users_collection, priests_collection, bookings_collection,
    priest_services_collection, chat_rooms_collection, system_settings_collection
)
from models import BookingCreate, BookingStatus, UserRole
from auth import get_current_user, require_role

# Import notification service
try:
    from services.notification_service import (
        notify_booking_created, notify_booking_confirmed,
        notify_booking_cancelled, notify_booking_completed,
        notify_refund_initiated, notify_priest_new_booking,
        notify_priest_booking_cancelled
    )
    NOTIFICATIONS_ENABLED = True
except ImportError:
    NOTIFICATIONS_ENABLED = False

router = APIRouter(prefix="/api", tags=["Bookings"])

# Default cancellation rules (used when no admin policy is set)
DEFAULT_RULES = [
    {"min_hours": 24, "max_hours": None, "refund_percent": 100},
    {"min_hours": 0, "max_hours": 24, "refund_percent": 50},
    {"min_hours": None, "max_hours": 0, "refund_percent": 0},
]

async def get_cancellation_refund(hours_until_booking: float) -> int:
    """Get refund percentage based on admin-configured cancellation policy"""
    policy = await system_settings_collection.find_one({"type": "cancellation_policy"}, {"_id": 0})
    rules = policy.get("rules", DEFAULT_RULES) if policy else DEFAULT_RULES
    
    # Sort rules so the most specific match wins (highest min_hours first)
    for rule in sorted(rules, key=lambda r: r.get("min_hours") or -9999, reverse=True):
        min_h = rule.get("min_hours")
        max_h = rule.get("max_hours")
        
        # "After booking time" rule: hours < 0
        if min_h is None and max_h is not None and hours_until_booking <= max_h:
            return rule.get("refund_percent", 0)
        # "More than X hours" rule: hours > min_h
        if min_h is not None and max_h is None and hours_until_booking > min_h:
            return rule.get("refund_percent", 100)
        # "Between X and Y hours" rule
        if min_h is not None and max_h is not None and min_h <= hours_until_booking <= max_h:
            return rule.get("refund_percent", 50)
    
    return 0

# Helper function to create chat room (imported from main module)
async def create_chat_room(room_type: str, reference_id: str, participant1_id: str, 
                          participant1_name: str, participant2_id: str, 
                          participant2_name: str, context: str = None):
    """Create a chat room for booking communication"""
    # Check if room already exists
    existing = await chat_rooms_collection.find_one({
        "type": room_type,
        "reference_id": reference_id
    })
    
    if existing:
        return str(existing["_id"])
    
    room = {
        "type": room_type,
        "reference_id": reference_id,
        "participants": [
            {"user_id": participant1_id, "name": participant1_name},
            {"user_id": participant2_id, "name": participant2_name}
        ],
        "context": context,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "last_message_at": datetime.now(timezone.utc)
    }
    
    result = await chat_rooms_collection.insert_one(room)
    return str(result.inserted_id)

async def deactivate_chat_room(room_type: str, reference_id: str):
    """Deactivate a chat room"""
    await chat_rooms_collection.update_one(
        {"type": room_type, "reference_id": reference_id},
        {"$set": {"is_active": False}}
    )

# ===================== DEVOTEE BOOKING ENDPOINTS =====================

@router.post("/bookings")
async def create_booking(data: BookingCreate, user: dict = Depends(get_current_user)):
    """Create a new booking"""
    priest = await priests_collection.find_one({"_id": ObjectId(data.priest_id)})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest not found")
    
    # Find service price - check separate services collection first
    service = None
    services_cursor = priest_services_collection.find({"priest_id": data.priest_id})
    async for svc in services_cursor:
        if svc.get("name") == data.service_name:
            service = {"name": svc["name"], "price": svc.get("price", 0)}
            break
    
    # Fallback to embedded services
    if not service and priest.get("services"):
        service = next((s for s in priest["services"] if s["name"] == data.service_name), None)
    
    if not service:
        raise HTTPException(status_code=400, detail="Service not found")
    
    priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
    
    booking_dict = {
        "user_id": str(user["_id"]),
        "priest_id": data.priest_id,
        "priest_name": priest_user["name"] if priest_user else "Unknown",
        "service_name": data.service_name,
        "price": service["price"],
        "booking_date": data.booking_date,
        "booking_type": data.booking_type,
        "status": BookingStatus.PENDING,
        "address": data.address,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await bookings_collection.insert_one(booking_dict)
    booking_id = str(result.inserted_id)
    
    # Send notification to devotee
    if NOTIFICATIONS_ENABLED:
        try:
            booking_date_str = data.booking_date.strftime("%B %d, %Y at %I:%M %p") if hasattr(data.booking_date, 'strftime') else str(data.booking_date)
            await notify_booking_created(str(user["_id"]), {
                "service_name": data.service_name,
                "priest_name": priest_user["name"] if priest_user else "Unknown",
                "booking_date": booking_date_str,
                "amount": service["price"],
                "booking_id": booking_id[:8].upper()
            })
        except Exception:
            pass
    
    # Send notification to priest (in-app + email + push)
    if NOTIFICATIONS_ENABLED and priest.get("user_id"):
        try:
            booking_date_str = data.booking_date.strftime("%B %d, %Y at %I:%M %p") if hasattr(data.booking_date, 'strftime') else str(data.booking_date)
            await notify_priest_new_booking(priest["user_id"], {
                "devotee_name": user.get("name", "A devotee"),
                "service_name": data.service_name,
                "booking_date": booking_date_str,
                "amount": service["price"],
                "booking_id": booking_id[:8].upper()
            })
        except Exception:
            pass
    
    # Create Razorpay order for payment
    price = service["price"]
    if price and price > 0:
        try:
            import razorpay
            from system_config import get_razorpay_credentials, get_fees_and_taxes, calculate_fees_and_taxes
            
            fees_config = await get_fees_and_taxes()
            fees_calc = calculate_fees_and_taxes(price, fees_config)
            platform_fee = fees_calc["platform_fee"]
            gst_amount = fees_calc["tax_amount"]
            total_amount = price + platform_fee + gst_amount
            
            rz_creds = await get_razorpay_credentials()
            rz_client = razorpay.Client(auth=(rz_creds["key_id"], rz_creds["key_secret"]))
            rz_order = rz_client.order.create(data={
                "amount": int(total_amount * 100),
                "currency": "INR",
                "notes": {"type": "puja_booking", "booking_id": booking_id, "user_id": str(user["_id"])}
            })
            
            return {
                "message": "Booking created. Please complete payment.",
                "booking_id": booking_id,
                "requires_payment": True,
                "price": price,
                "price_breakdown": {
                    "base_price": price,
                    "platform_fee": platform_fee,
                    "platform_fee_percent": fees_config["platform_fee"]["value"] if fees_config["platform_fee"]["enabled"] else 0,
                    "gst": gst_amount,
                    "gst_percent": fees_calc["tax_percentage"],
                    "tax_label": fees_calc["tax_label"],
                    "total": total_amount,
                },
                "razorpay_order_id": rz_order["id"],
                "razorpay_key": rz_creds["key_id"],
            }
        except Exception as e:
            print(f"Razorpay order creation for booking failed: {e}")
    
    return {
        "message": "Booking created",
        "booking_id": booking_id,
        "requires_payment": False,
        "price": service["price"]
    }


@router.post("/bookings/{booking_id}/confirm-payment")
async def confirm_booking_payment(booking_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Verify Razorpay payment and confirm booking"""
    import razorpay
    from system_config import get_razorpay_credentials
    
    data = await request.json()
    payment_id = data.get("payment_id")
    
    if not payment_id:
        raise HTTPException(status_code=400, detail="Payment ID required")
    
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id), "user_id": str(user["_id"])})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify Razorpay payment
    try:
        rz_creds = await get_razorpay_credentials()
        rz_client = razorpay.Client(auth=(rz_creds["key_id"], rz_creds["key_secret"]))
        payment = rz_client.payment.fetch(payment_id)
        if payment.get("status") != "captured":
            raise HTTPException(status_code=400, detail="Payment not verified")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")
    
    # Update booking to confirmed
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {
            "status": "confirmed",
            "payment_id": payment_id,
            "payment_method": "razorpay",
            "paid_at": datetime.now(timezone.utc),
        }}
    )
    
    return {"message": "Payment verified. Booking confirmed!", "booking_id": booking_id}


@router.get("/bookings")
async def get_user_bookings(user: dict = Depends(get_current_user)):
    """Get all bookings for current user"""
    cursor = bookings_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    bookings = []
    
    async for booking in cursor:
        bookings.append({
            "id": str(booking["_id"]),
            "priest_id": booking["priest_id"],
            "priest_name": booking["priest_name"],
            "service_name": booking["service_name"],
            "price": booking["price"],
            "booking_date": booking["booking_date"].isoformat() if isinstance(booking["booking_date"], datetime) else booking["booking_date"],
            "booking_type": booking["booking_type"],
            "status": booking["status"],
            "address": booking.get("address"),
            "notes": booking.get("notes"),
            "created_at": booking["created_at"].isoformat()
        })
    
    return {"bookings": bookings}

# ===================== PRIEST BOOKING ENDPOINTS =====================

@router.get("/priest/bookings")
async def get_priest_bookings(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get all bookings for current priest"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    cursor = bookings_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    bookings = []
    
    async for booking in cursor:
        booker = await users_collection.find_one({"_id": ObjectId(booking["user_id"])})
        bookings.append({
            "id": str(booking["_id"]),
            "user_name": booker["name"] if booker else "Unknown",
            "user_phone": booker.get("phone") if booker else None,
            "service_name": booking["service_name"],
            "price": booking["price"],
            "booking_date": booking["booking_date"].isoformat() if isinstance(booking["booking_date"], datetime) else booking["booking_date"],
            "booking_type": booking["booking_type"],
            "status": booking["status"],
            "address": booking.get("address"),
            "notes": booking.get("notes"),
            "created_at": booking["created_at"].isoformat()
        })
    
    return {"bookings": bookings}

# ===================== BOOKING STATUS =====================

@router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: BookingStatus, user: dict = Depends(get_current_user)):
    """Update booking status"""
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify user is priest for this booking or booking owner
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not (priest and str(priest["_id"]) == booking["priest_id"]) and booking["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    old_status = booking.get("status", "pending")
    
    update_data = {"status": status}
    # Track when booking was completed for chat expiry
    if status == BookingStatus.COMPLETED:
        update_data["completed_at"] = datetime.now(timezone.utc)
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )
    
    # Auto-create chat room when booking is confirmed
    if status == BookingStatus.CONFIRMED and old_status != "confirmed":
        devotee = await users_collection.find_one({"_id": ObjectId(booking["user_id"])})
        priest_doc = await priests_collection.find_one({"_id": ObjectId(booking["priest_id"])})
        priest_user = await users_collection.find_one({"_id": ObjectId(priest_doc["user_id"])}) if priest_doc else None
        
        if devotee and priest_user:
            booking_date = booking.get("booking_date")
            date_str = booking_date.strftime("%B %d, %Y") if hasattr(booking_date, 'strftime') else str(booking_date)
            context = f"{booking.get('service_name', 'Pooja')} on {date_str}"
            
            await create_chat_room(
                room_type="booking",
                reference_id=booking_id,
                participant1_id=str(devotee["_id"]),
                participant1_name=devotee.get("name", "Devotee"),
                participant2_id=str(priest_user["_id"]),
                participant2_name=priest_user.get("name", "Priest"),
                context=context
            )
        
        # Send notification for booking confirmed
        if NOTIFICATIONS_ENABLED:
            try:
                await notify_booking_confirmed(booking["user_id"], {
                    "service_name": booking.get("service_name", "Puja"),
                    "priest_name": priest_user.get("name", "Priest") if priest_user else "Priest",
                    "booking_date": date_str
                })
            except Exception:
                pass
    
    # Send notification for booking completed
    if status == BookingStatus.COMPLETED and old_status != "completed":
        if NOTIFICATIONS_ENABLED:
            try:
                priest_doc = await priests_collection.find_one({"_id": ObjectId(booking["priest_id"])})
                priest_user = await users_collection.find_one({"_id": ObjectId(priest_doc["user_id"])}) if priest_doc else None
                await notify_booking_completed(booking["user_id"], {
                    "service_name": booking.get("service_name", "Puja"),
                    "priest_name": priest_user.get("name", "Priest") if priest_user else "Priest"
                })
            except Exception:
                pass
    
    # Deactivate chat room on cancellation
    if status == BookingStatus.CANCELLED:
        await deactivate_chat_room("booking", booking_id)
    
    return {"message": "Booking status updated"}

# ===================== BOOKING CANCELLATION =====================

@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, request: Request, user: dict = Depends(get_current_user)):
    """
    Cancel a booking with 24-hour policy.
    - Cancellations more than 24 hours before: Full refund
    - Cancellations within 24 hours: 50% refund (or as per policy)
    - Cancellations after booking time: No refund
    """
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify user is the booking owner or the priest
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    is_priest = priest and str(priest["_id"]) == booking["priest_id"]
    is_devotee = booking["user_id"] == str(user["_id"])
    
    if not is_priest and not is_devotee:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    
    # Check if booking can be cancelled
    current_status = booking.get("status", "pending")
    if current_status in ["cancelled", "completed"]:
        raise HTTPException(status_code=400, detail=f"Booking already {current_status}")
    
    # Get cancellation reason from request
    try:
        data = await request.json()
        reason = data.get("reason", "")
    except Exception:
        reason = ""
    
    # Calculate refund based on admin-configured policy
    booking_date = booking.get("booking_date")
    now = datetime.now(timezone.utc)
    
    refund_percentage = 0
    refund_amount = 0
    price = booking.get("price", 0)
    
    if booking_date:
        if isinstance(booking_date, datetime):
            if booking_date.tzinfo is None:
                booking_date = booking_date.replace(tzinfo=timezone.utc)
            
            hours_until_booking = (booking_date - now).total_seconds() / 3600
            refund_percentage = await get_cancellation_refund(hours_until_booking)
            refund_amount = price * (refund_percentage / 100)
    
    # Update booking status
    update_data = {
        "status": "cancelled",
        "cancelled_at": now,
        "cancelled_by": "priest" if is_priest else "devotee",
        "cancellation_reason": reason,
        "refund_percentage": refund_percentage,
        "refund_amount": refund_amount,
        "refund_status": "pending" if refund_amount > 0 else "not_applicable"
    }
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )
    
    # Deactivate chat room
    await deactivate_chat_room("booking", booking_id)
    
    # Send cancellation notifications to both parties (except the one who cancelled)
    if NOTIFICATIONS_ENABLED:
        try:
            priest_doc = await priests_collection.find_one({"_id": ObjectId(booking["priest_id"])})
            priest_user = await users_collection.find_one({"_id": ObjectId(priest_doc["user_id"])}) if priest_doc else None
            devotee = await users_collection.find_one({"_id": ObjectId(booking["user_id"])})
            
            # Always notify the devotee about the cancellation
            await notify_booking_cancelled(booking["user_id"], {
                "service_name": booking.get("service_name", "Puja"),
                "priest_name": priest_user.get("name", "Priest") if priest_user else "Priest",
                "amount": price,
                "refund_amount": refund_amount,
                "refund_status": update_data["refund_status"]
            })
            
            # If there's a refund, also send refund notification to devotee
            if refund_amount > 0:
                await notify_refund_initiated(booking["user_id"], {
                    "refund_amount": refund_amount,
                    "original_amount": price,
                    "reason": "Booking cancellation by priest" if is_priest else "Booking cancellation"
                })
            
            # Notify the priest only if the devotee cancelled (not if priest cancelled themselves)
            if not is_priest and priest_doc and priest_doc.get("user_id"):
                await notify_priest_booking_cancelled(priest_doc["user_id"], {
                    "devotee_name": devotee.get("name", "A devotee") if devotee else "A devotee",
                    "service_name": booking.get("service_name", "Puja"),
                })
        except Exception:
            pass
    
    return {
        "message": "Booking cancelled successfully",
        "refund_percentage": refund_percentage,
        "refund_amount": refund_amount,
        "refund_status": update_data["refund_status"]
    }

@router.get("/bookings/{booking_id}/cancellation-preview")
async def get_cancellation_preview(booking_id: str, user: dict = Depends(get_current_user)):
    """
    Get a preview of what happens if user cancels this booking
    """
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify user is involved in this booking
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    is_priest = priest and str(priest["_id"]) == booking["priest_id"]
    is_devotee = booking["user_id"] == str(user["_id"])
    
    if not is_priest and not is_devotee:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    booking_date = booking.get("booking_date")
    now = datetime.now(timezone.utc)
    price = booking.get("price", 0)
    
    refund_percentage = 0
    refund_amount = 0
    policy_message = ""
    
    if booking_date:
        if isinstance(booking_date, datetime):
            if booking_date.tzinfo is None:
                booking_date = booking_date.replace(tzinfo=timezone.utc)
            
            hours_until_booking = (booking_date - now).total_seconds() / 3600
            refund_percentage = await get_cancellation_refund(hours_until_booking)
            refund_amount = price * (refund_percentage / 100)
            
            if refund_percentage == 100:
                policy_message = f"Full refund - cancellation more than {abs(hours_until_booking):.0f} hours before booking"
            elif refund_percentage > 0:
                policy_message = f"{refund_percentage}% refund - based on cancellation policy"
            else:
                policy_message = "No refund - booking time has passed"
    
    return {
        "booking_id": booking_id,
        "current_status": booking.get("status", "pending"),
        "booking_price": price,
        "refund_percentage": refund_percentage,
        "refund_amount": refund_amount,
        "policy_message": policy_message,
        "can_cancel": booking.get("status") not in ["cancelled", "completed"]
    }
