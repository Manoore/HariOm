"""
Booking Routes Module
Contains all booking-related endpoints for the Divine App.
Includes: create booking, get bookings, update status
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId

from database import (
    users_collection, priests_collection, bookings_collection,
    priest_services_collection, chat_rooms_collection
)
from models import BookingCreate, BookingStatus, UserRole
from auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["Bookings"])

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
    return {
        "message": "Booking created",
        "booking_id": str(result.inserted_id),
        "price": service["price"]
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
    
    # Deactivate chat room on cancellation
    if status == BookingStatus.CANCELLED:
        await deactivate_chat_room("booking", booking_id)
    
    return {"message": "Booking status updated"}
