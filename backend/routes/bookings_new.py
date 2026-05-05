"""
Booking Routes Module
Contains all booking-related endpoints for the Divine App.
Includes: create booking, get bookings, update status
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from database import (
    users_collection, priests_collection, bookings_collection,
    priest_services_collection, chat_rooms_collection, system_settings_collection,
    priest_availability_collection
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

# Helper function to create chat room (compatible with chat.py schema)
async def create_chat_room(room_type: str, reference_id: str, participant1_id: str, 
                          participant1_name: str, participant2_id: str, 
                          participant2_name: str, context: str = None):
    """Create a chat room for booking communication"""
    # Check if room already exists (check both field names for compat)
    existing = await chat_rooms_collection.find_one({
        "$or": [
            {"booking_id": reference_id},
            {"reference_id": reference_id}
        ]
    })
    
    if existing:
        return str(existing["_id"])
    
    room = {
        "type": room_type,
        "booking_id": reference_id if room_type == "booking" else None,
        "order_id": reference_id if room_type == "order" else None,
        "reference_id": reference_id,
        "participants": [participant1_id, participant2_id],
        "participant_details": {
            participant1_id: {"name": participant1_name, "role": "devotee"},
            participant2_id: {"name": participant2_name, "role": "priest" if room_type == "booking" else "shop_owner"}
        },
        "context": context,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "last_message_at": datetime.now(timezone.utc),
        "unread_count": {participant1_id: 0, participant2_id: 0}
    }
    
    result = await chat_rooms_collection.insert_one(room)
    return str(result.inserted_id)

async def deactivate_chat_room(room_type: str, reference_id: str):
    """Deactivate a chat room"""
    await chat_rooms_collection.update_one(
        {"$or": [{"booking_id": reference_id}, {"reference_id": reference_id}]},
        {"$set": {"is_active": False}}
    )

# ===================== AVAILABILITY & SLOT ENDPOINTS =====================

DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

def generate_time_slots(start_str: str, end_str: str, duration_minutes: int):
    """Generate time slots between start and end with given duration"""
    slots = []
    start_h, start_m = map(int, start_str.split(":"))
    end_h, end_m = map(int, end_str.split(":"))
    current = start_h * 60 + start_m
    end_total = end_h * 60 + end_m
    while current + duration_minutes <= end_total:
        slot_start = f"{current // 60:02d}:{current % 60:02d}"
        slot_end_min = current + duration_minutes
        slot_end = f"{slot_end_min // 60:02d}:{slot_end_min % 60:02d}"
        slots.append({"start": slot_start, "end": slot_end})
        current += duration_minutes
    return slots


@router.get("/priests/{priest_id}/available-slots")
async def get_available_slots(priest_id: str, date: str = Query(..., description="Date in YYYY-MM-DD format")):
    """Get available booking slots for a priest on a given date"""
    # Validate priest ID format
    try:
        priest_oid = ObjectId(priest_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid priest ID format")
    
    # Validate priest exists
    priest = await priests_collection.find_one({"_id": priest_oid})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest not found")
    
    # Parse date
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    day_name = target_date.strftime("%A")  # e.g. "Monday"
    
    # Get priest availability settings
    availability = await priest_availability_collection.find_one({"priest_id": priest_id})
    
    if not availability:
        # Default: Mon-Sat 9AM-6PM, 60min slots
        if day_name == "Sunday":
            return {"date": date, "day": day_name, "slots": [], "message": "Priest is not available on Sundays"}
        default_slots = generate_time_slots("09:00", "18:00", 60)
    else:
        # Check if date is blocked
        blocked_dates = availability.get("blocked_dates", [])
        if date in blocked_dates:
            return {"date": date, "day": day_name, "slots": [], "message": "Priest is not available on this date"}
        
        # Get schedule for this day of week
        schedule = availability.get("weekly_schedule", [])
        day_schedule = [s for s in schedule if s.get("day") == day_name and s.get("enabled", True)]
        
        if not day_schedule:
            # Also check online_slots for backward compat
            online_slots = availability.get("online_slots", [])
            day_schedule = [s for s in online_slots if s.get("day") == day_name]
        
        if not day_schedule:
            return {"date": date, "day": day_name, "slots": [], "message": f"Priest is not available on {day_name}s"}
        
        duration = availability.get("default_duration", 60)
        default_slots = []
        for sched in day_schedule:
            start = sched.get("start", "09:00")
            end = sched.get("end", "18:00")
            default_slots.extend(generate_time_slots(start, end, duration))
    
    # Get existing bookings for this date (exclude cancelled)
    date_start = target_date.replace(hour=0, minute=0, second=0)
    date_end = target_date.replace(hour=23, minute=59, second=59)
    
    booked_cursor = bookings_collection.find({
        "priest_id": priest_id,
        "status": {"$nin": ["cancelled"]},
        "booking_date": {"$gte": date_start, "$lte": date_end}
    })
    
    booked_times = set()
    async for booking in booked_cursor:
        bd = booking.get("booking_date")
        if bd:
            # Mark the slot that contains this booking time
            if isinstance(bd, datetime):
                booked_time = f"{bd.hour:02d}:{bd.minute:02d}"
                booked_times.add(booked_time)
                # Also mark the slot_start if present
                if booking.get("slot_start"):
                    booked_times.add(booking["slot_start"])
    
    # Filter out booked slots and past slots
    now = datetime.now(timezone.utc)
    available_slots = []
    for slot in default_slots:
        if slot["start"] in booked_times:
            continue
        # If today, skip past time slots
        if target_date.date() == now.date():
            slot_h, slot_m = map(int, slot["start"].split(":"))
            slot_time = now.replace(hour=slot_h, minute=slot_m, second=0, microsecond=0, tzinfo=None)
            if slot_time <= now.replace(tzinfo=None):
                continue
        available_slots.append(slot)
    
    return {
        "date": date,
        "day": day_name,
        "slots": available_slots,
        "total_slots": len(default_slots),
        "available_count": len(available_slots)
    }


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
            service = {
                "name": svc["name"], 
                "price": svc.get("price", 0),
                "samagri_list": svc.get("samagri_list", [])
            }
            break
    
    # Fallback to embedded services
    if not service and priest.get("services"):
        service = next((s for s in priest["services"] if s["name"] == data.service_name), None)
    
    if not service:
        raise HTTPException(status_code=400, detail="Service not found")
    
    # Slot conflict check — prevent double booking
    booking_dt = data.booking_date
    slot_start_str = data.slot_start if hasattr(data, 'slot_start') and data.slot_start else None
    
    if slot_start_str:
        # Check if this exact slot is already taken
        slot_date = booking_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        slot_end_date = slot_date + timedelta(days=1)
        
        conflict = await bookings_collection.find_one({
            "priest_id": data.priest_id,
            "status": {"$nin": ["cancelled"]},
            "booking_date": {"$gte": slot_date, "$lt": slot_end_date},
            "slot_start": slot_start_str
        })
        if conflict:
            raise HTTPException(status_code=409, detail="This time slot is no longer available. Please choose another slot.")
    else:
        # Fallback: check by exact booking_date time
        conflict = await bookings_collection.find_one({
            "priest_id": data.priest_id,
            "status": {"$nin": ["cancelled"]},
            "booking_date": booking_dt
        })
        if conflict:
            raise HTTPException(status_code=409, detail="This time slot is already booked. Please choose a different time.")
    
    priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
    
    booking_dict = {
        "user_id": str(user["_id"]),
        "priest_id": data.priest_id,
        "priest_name": priest_user["name"] if priest_user else "Unknown",
        "service_name": data.service_name,
        "price": service["price"],
        "booking_date": data.booking_date,
        "booking_type": data.booking_type,
        "slot_start": data.slot_start if hasattr(data, 'slot_start') and data.slot_start else None,
        "slot_end": data.slot_end if hasattr(data, 'slot_end') and data.slot_end else None,
        "samagri_list": service.get("samagri_list", []),
        "status": BookingStatus.PENDING,
        "address": data.address,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await bookings_collection.insert_one(booking_dict)
    booking_id = str(result.inserted_id)
    
    # Create Razorpay order for payment (notifications sent AFTER payment confirmation)
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
                "payment_capture": 1,
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
    
    # Validate ObjectId format
    try:
        booking_oid = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID format")
    
    booking = await bookings_collection.find_one({"_id": booking_oid, "user_id": str(user["_id"])})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify Razorpay payment
    try:
        rz_creds = await get_razorpay_credentials()
        rz_client = razorpay.Client(auth=(rz_creds["key_id"], rz_creds["key_secret"]))
        payment = rz_client.payment.fetch(payment_id)
        if payment.get("status") not in ("captured", "authorized"):
            raise HTTPException(status_code=400, detail="Payment not verified")
        # Auto-capture if only authorized
        if payment.get("status") == "authorized":
            try:
                rz_client.payment.capture(payment_id, payment.get("amount"))
            except Exception:
                pass
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")
    
    # Update booking to confirmed
    await bookings_collection.update_one(
        {"_id": booking_oid},
        {"$set": {
            "status": "confirmed",
            "payment_id": payment_id,
            "payment_method": "razorpay",
            "paid_at": datetime.now(timezone.utc),
        }}
    )
    
    # Fetch priest & devotee details (used for notifications + chat room)
    priest_doc = await priests_collection.find_one({"_id": ObjectId(booking["priest_id"])})
    priest_user = await users_collection.find_one({"_id": ObjectId(priest_doc["user_id"])}) if priest_doc else None
    devotee = await users_collection.find_one({"_id": ObjectId(booking["user_id"])})
    booking_date = booking.get("booking_date")
    date_str = booking_date.strftime("%B %d, %Y") if hasattr(booking_date, 'strftime') else str(booking_date)
    
    # Send notifications AFTER successful payment
    if NOTIFICATIONS_ENABLED:
        try:
            await notify_booking_confirmed(booking["user_id"], {
                "service_name": booking.get("service_name", "Puja"),
                "priest_name": priest_user.get("name", "Priest") if priest_user else "Priest",
                "booking_date": date_str
            })
            if priest_doc and priest_doc.get("user_id"):
                await notify_priest_new_booking(priest_doc["user_id"], {
                    "devotee_name": devotee.get("name", "A devotee") if devotee else "A devotee",
                    "service_name": booking.get("service_name", "Puja"),
                    "booking_date": date_str,
                    "amount": booking.get("price", 0)
                })
        except Exception as e:
            print(f"Post-payment notification error (non-blocking): {e}")
    
    # Create chat room between devotee and priest after payment
    chat_room_id = None
    try:
        if devotee and priest_user:
            context = f"{booking.get('service_name', 'Pooja')} on {date_str}"
            chat_room_id = await create_chat_room(
                room_type="booking",
                reference_id=booking_id,
                participant1_id=str(devotee["_id"]),
                participant1_name=devotee.get("name", "Devotee"),
                participant2_id=str(priest_user["_id"]),
                participant2_name=priest_user.get("name", "Priest"),
                context=context
            )
            print(f"Chat room created: {chat_room_id} for booking {booking_id}")
    except Exception as e:
        print(f"Chat room creation error (non-blocking): {e}")
    
    return {
        "message": "Payment verified. Booking confirmed!", 
        "booking_id": booking_id,
        "chat_room_id": chat_room_id
    }


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
            "slot_start": booking.get("slot_start"),
            "slot_end": booking.get("slot_end"),
            "samagri_list": booking.get("samagri_list", []),
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
            "slot_start": booking.get("slot_start"),
            "slot_end": booking.get("slot_end"),
            "samagri_list": booking.get("samagri_list", []),
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
