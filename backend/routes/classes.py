"""
Classes and Live Streams Routes
Handles public classes, class enrollment, class requests, class rooms (100ms), and priest class management
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from pydantic import BaseModel
import os
import stripe

from database import (
    priest_classes_collection, priests_collection, users_collection,
    priest_streams_collection, class_requests_collection, class_enrollments_collection,
    stream_reminders_collection, class_reminders_collection
)
from auth import get_current_user, require_role
from models import UserRole

# Import notification service
try:
    from services.notification_service import (
        notify_class_enrolled, notify_payment_success,
        notify_class_reminder, notify_priest_class_reminder
    )
    NOTIFICATIONS_ENABLED = True
except ImportError:
    NOTIFICATIONS_ENABLED = False

router = APIRouter(prefix="/api", tags=["Classes"])

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")


def safe_isoformat(value):
    """Safely convert datetime or string to ISO format string"""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return str(value)


# ===================== PUBLIC CLASSES =====================

@router.get("/classes")
async def get_public_classes(
    skip: int = 0,
    limit: int = 20,
    upcoming_only: bool = True
):
    """Get all public classes for devotees to browse and join"""
    query = {}
    if upcoming_only:
        pass
    
    cursor = priest_classes_collection.find(query).sort("schedule_time", 1).skip(skip).limit(limit)
    classes = []
    
    async for cls in cursor:
        priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
        priest_user = None
        if priest:
            priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        
        classes.append({
            "id": str(cls["_id"]),
            "priest_id": cls.get("priest_id", ""),
            "priest_name": priest_user["name"] if priest_user else "Unknown Priest",
            "priest_photo": priest.get("profile_photo") if priest else None,
            "title": cls.get("title", ""),
            "description": cls.get("description", ""),
            "category": cls.get("category", "General"),
            "schedule_time": safe_isoformat(cls.get("schedule_time")),
            "duration_minutes": cls.get("duration_minutes", 60),
            "frequency": cls.get("frequency", "one_time"),
            "frequency_days": cls.get("frequency_days", []),
            "price": cls.get("price", 0),
            "max_students": cls.get("max_students", 50),
            "available_slots": cls.get("available_slots", cls.get("max_students", 50) - cls.get("enrolled_count", 0)),
            "enrolled_count": cls.get("enrolled_count", 0),
            "is_free": cls.get("is_free", cls.get("price", 0) == 0),
            "meeting_link": cls.get("meeting_link", ""),
            "created_at": safe_isoformat(cls.get("created_at"))
        })
    
    total = await priest_classes_collection.count_documents(query)
    return {"classes": classes, "total": total}


@router.get("/classes/{class_id}")
async def get_class_details(class_id: str):
    """Get details of a specific class"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
    priest_user = None
    if priest:
        priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
    
    return {
        "id": str(cls["_id"]),
        "priest_id": cls.get("priest_id", ""),
        "priest_name": priest_user["name"] if priest_user else "Unknown Priest",
        "priest_photo": priest.get("profile_photo") if priest else None,
        "priest_bio": priest.get("bio", "") if priest else "",
        "title": cls.get("title", ""),
        "description": cls.get("description", ""),
        "category": cls.get("category", "General"),
        "schedule_time": safe_isoformat(cls.get("schedule_time")),
        "duration_minutes": cls.get("duration_minutes", 60),
        "frequency": cls.get("frequency", "one_time"),
        "frequency_days": cls.get("frequency_days", []),
        "price": cls.get("price", 0),
        "max_students": cls.get("max_students", 50),
        "enrolled_count": cls.get("enrolled_count", 0),
        "is_free": cls.get("price", 0) == 0,
        "meeting_link": cls.get("meeting_link", ""),
        "syllabus": cls.get("syllabus", []),
        "requirements": cls.get("requirements", [])
    }


@router.post("/classes/{class_id}/enroll")
async def enroll_in_class(class_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Enroll in a class - free classes enroll directly, paid classes require payment"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    enrollments = cls.get("enrollments", [])
    if str(user["_id"]) in enrollments:
        raise HTTPException(status_code=400, detail="You are already enrolled in this class")
    
    available_slots = cls.get("available_slots", cls.get("max_students", 50) - cls.get("enrolled_count", 0))
    if available_slots <= 0:
        raise HTTPException(status_code=400, detail="Class is full - no slots available")
    
    is_free = cls.get("is_free", cls.get("price", 0) == 0)
    
    if is_free:
        await priest_classes_collection.update_one(
            {"_id": ObjectId(class_id)},
            {
                "$push": {"enrollments": str(user["_id"])},
                "$inc": {"enrolled_count": 1, "available_slots": -1}
            }
        )
        
        await class_enrollments_collection.insert_one({
            "user_id": str(user["_id"]),
            "class_id": class_id,
            "priest_id": cls["priest_id"],
            "amount": 0,
            "status": "completed",
            "is_free": True,
            "enrolled_at": datetime.now(timezone.utc)
        })
        
        # Auto-set 1-hour reminder for the enrolled student
        try:
            await class_reminders_collection.update_one(
                {"user_id": str(user["_id"]), "class_id": class_id},
                {"$set": {
                    "user_id": str(user["_id"]),
                    "class_id": class_id,
                    "remind_before_minutes": 60,
                    "enabled": True,
                    "role": "student",
                    "last_sent_for": None,
                    "updated_at": datetime.now(timezone.utc),
                }, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}},
                upsert=True
            )
        except Exception:
            pass
        
        return {"message": "Successfully enrolled in free class", "class_id": class_id, "is_free": True}
    
    # Check if this is a payment confirmation callback
    try:
        data = await request.json()
    except:
        data = {}
    
    if data.get("payment_confirmed") and data.get("payment_id"):
        # Verify Razorpay payment before enrollment
        import razorpay
        from system_config import get_razorpay_credentials
        try:
            rz_creds = await get_razorpay_credentials()
            rz_client = razorpay.Client(auth=(rz_creds["key_id"], rz_creds["key_secret"]))
            payment = rz_client.payment.fetch(data["payment_id"])
            if payment.get("status") != "captured":
                raise HTTPException(status_code=400, detail="Payment not verified")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

        await priest_classes_collection.update_one(
            {"_id": ObjectId(class_id)},
            {
                "$push": {"enrollments": str(user["_id"])},
                "$inc": {"enrolled_count": 1, "available_slots": -1}
            }
        )
        
        await class_enrollments_collection.insert_one({
            "user_id": str(user["_id"]),
            "class_id": class_id,
            "priest_id": cls["priest_id"],
            "amount": cls.get("price", 0),
            "payment_id": data.get("payment_id"),
            "payment_method": "razorpay",
            "status": "completed",
            "enrolled_at": datetime.now(timezone.utc)
        })
        
        # Auto-set 1-hour reminder for the enrolled student
        try:
            await class_reminders_collection.update_one(
                {"user_id": str(user["_id"]), "class_id": class_id},
                {"$set": {
                    "user_id": str(user["_id"]),
                    "class_id": class_id,
                    "remind_before_minutes": 60,
                    "enabled": True,
                    "role": "student",
                    "last_sent_for": None,
                    "updated_at": datetime.now(timezone.utc),
                }, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}},
                upsert=True
            )
        except Exception:
            pass
        
        if NOTIFICATIONS_ENABLED:
            try:
                priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])})
                priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])}) if priest else None
                schedule_time = cls.get("schedule_time")
                schedule_str = schedule_time.strftime("%B %d, %Y at %I:%M %p") if hasattr(schedule_time, 'strftime') else str(schedule_time)
                
                await notify_class_enrolled(str(user["_id"]), {
                    "class_name": cls.get("title", "Vedic Class"),
                    "teacher_name": priest_user.get("name", "Teacher") if priest_user else "Teacher",
                    "schedule": schedule_str,
                    "amount": cls.get("price", 0)
                })
            except Exception:
                pass
        
        return {"message": "Successfully enrolled in class", "class_id": class_id, "is_free": False, "paid": True}
    else:
        try:
            base_price = cls.get("price", 0)
            
            from system_config import get_fees_and_taxes, calculate_fees_and_taxes, get_razorpay_credentials
            import razorpay
            fees_config = await get_fees_and_taxes()
            fees_calc = calculate_fees_and_taxes(base_price, fees_config)
            
            platform_fee = fees_calc["platform_fee"]
            gst_amount = fees_calc["tax_amount"]
            platform_fee_percent = fees_config["platform_fee"]["value"] if fees_config["platform_fee"]["enabled"] else 0
            gst_percent = fees_calc["tax_percentage"]
            tax_label = fees_calc["tax_label"]
            
            total_amount = base_price + platform_fee + gst_amount
            
            # Create Razorpay order (Stripe removed from active flow)
            rz_creds = await get_razorpay_credentials()
            if not rz_creds["key_id"] or not rz_creds["key_secret"]:
                raise HTTPException(status_code=500, detail="Payment gateway not configured")
            
            rz_client = razorpay.Client(auth=(rz_creds["key_id"], rz_creds["key_secret"]))
            rz_order = rz_client.order.create(data={
                "amount": int(total_amount * 100),
                "currency": "INR",
                "notes": {
                    "type": "class_enrollment",
                    "class_id": class_id,
                    "user_id": str(user["_id"]),
                    "priest_id": cls["priest_id"],
                }
            })
            
            return {
                "message": "Payment required for this class",
                "requires_payment": True,
                "is_free": False,
                "price_breakdown": {
                    "base_price": base_price,
                    "platform_fee": platform_fee,
                    "platform_fee_percent": platform_fee_percent,
                    "gst": gst_amount,
                    "gst_percent": gst_percent,
                    "tax_label": tax_label,
                    "total": total_amount
                },
                "price": total_amount,
                "razorpay_order_id": rz_order["id"],
                "razorpay_key": rz_creds["key_id"]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")


# ===================== LIVE STREAMS =====================

@router.get("/live-streams")
async def get_public_live_streams(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None
):
    """Get all public live streams for devotees"""
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["live", "scheduled"]}
    
    cursor = priest_streams_collection.find(query).sort("scheduled_time", 1).skip(skip).limit(limit)
    streams = []
    
    async for stream in cursor:
        priest = await priests_collection.find_one({"_id": ObjectId(stream["priest_id"])}) if stream.get("priest_id") else None
        priest_user = None
        if priest:
            priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        
        youtube_url = stream.get("youtube_url", "")
        youtube_video_id = None
        if youtube_url:
            if "youtu.be/" in youtube_url:
                youtube_video_id = youtube_url.split("youtu.be/")[1].split("?")[0]
            elif "youtube.com/watch?v=" in youtube_url:
                youtube_video_id = youtube_url.split("v=")[1].split("&")[0]
            elif "youtube.com/live/" in youtube_url:
                youtube_video_id = youtube_url.split("/live/")[1].split("?")[0]
        
        streams.append({
            "id": str(stream["_id"]),
            "priest_id": stream.get("priest_id", ""),
            "priest_name": priest_user["name"] if priest_user else "Unknown Priest",
            "priest_photo": priest.get("profile_photo") if priest else None,
            "title": stream.get("title", ""),
            "description": stream.get("description", ""),
            "scheduled_time": safe_isoformat(stream.get("scheduled_time")),
            "status": stream.get("status", "scheduled"),
            "viewer_count": stream.get("viewer_count", 0),
            "youtube_url": youtube_url,
            "youtube_video_id": youtube_video_id,
            "thumbnail": stream.get("thumbnail") or (f"https://img.youtube.com/vi/{youtube_video_id}/maxresdefault.jpg" if youtube_video_id else ""),
            "created_at": safe_isoformat(stream.get("created_at"))
        })
    
    total = await priest_streams_collection.count_documents(query)
    return {"streams": streams, "total": total}


# ===================== CLASS REQUESTS =====================

class ClassRequestCreate(BaseModel):
    topic: str
    category: Optional[str] = "General"
    description: Optional[str] = ""
    preferred_days: Optional[List[str]] = []
    preferred_time: Optional[str] = ""
    budget_min: Optional[int] = 0
    budget_max: Optional[int] = 5000
    language: Optional[str] = "Hindi"
    duration_preference: Optional[str] = "1 hour"
    meeting_type: Optional[str] = "one_on_one"
    frequency: Optional[str] = "weekly"


@router.post("/class-requests")
async def create_class_request(request: ClassRequestCreate, user: dict = Depends(get_current_user)):
    """Devotee submits a request for a class they want"""
    class_request = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "Anonymous"),
        "user_email": user.get("email", ""),
        "topic": request.topic,
        "category": request.category,
        "description": request.description,
        "preferred_days": request.preferred_days,
        "preferred_time": request.preferred_time,
        "budget_min": request.budget_min,
        "budget_max": request.budget_max,
        "language": request.language,
        "duration_preference": request.duration_preference,
        "meeting_type": request.meeting_type,
        "frequency": request.frequency,
        "status": "open",
        "responses": [],
        "matched_class_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await class_requests_collection.insert_one(class_request)
    
    return {
        "message": "Class request submitted successfully",
        "request_id": str(result.inserted_id)
    }


@router.get("/class-requests")
async def get_my_class_requests(user: dict = Depends(get_current_user)):
    """Get all class requests for the current devotee"""
    cursor = class_requests_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    requests = []
    async for req in cursor:
        requests.append({
            "id": str(req["_id"]),
            "topic": req["topic"],
            "category": req.get("category", "General"),
            "description": req.get("description", ""),
            "preferred_days": req.get("preferred_days", []),
            "preferred_time": req.get("preferred_time", ""),
            "budget_min": req.get("budget_min", 0),
            "budget_max": req.get("budget_max", 5000),
            "language": req.get("language", "Hindi"),
            "duration_preference": req.get("duration_preference", "1 hour"),
            "meeting_type": req.get("meeting_type", "one_on_one"),
            "frequency": req.get("frequency", "weekly"),
            "status": req.get("status", "open"),
            "response_count": len(req.get("responses", [])),
            "created_at": safe_isoformat(req.get("created_at"))
        })
    return {"requests": requests}


@router.get("/class-requests/all")
async def get_all_class_requests(user: dict = Depends(get_current_user)):
    """Get all open class requests - for priests to browse and respond"""
    cursor = class_requests_collection.find({"status": "open"}).sort("created_at", -1)
    requests = []
    async for req in cursor:
        priest = await priests_collection.find_one({"user_id": str(user["_id"])})
        priest_id = str(priest["_id"]) if priest else None
        
        already_responded = False
        if priest_id:
            for response in req.get("responses", []):
                if response.get("priest_id") == priest_id:
                    already_responded = True
                    break
        
        requests.append({
            "id": str(req["_id"]),
            "topic": req["topic"],
            "category": req.get("category", "General"),
            "description": req.get("description", ""),
            "preferred_days": req.get("preferred_days", []),
            "preferred_time": req.get("preferred_time", ""),
            "budget_min": req.get("budget_min", 0),
            "budget_max": req.get("budget_max", 5000),
            "language": req.get("language", "Hindi"),
            "duration_preference": req.get("duration_preference", "1 hour"),
            "meeting_type": req.get("meeting_type", "one_on_one"),
            "frequency": req.get("frequency", "weekly"),
            "user_name": req.get("user_name", "Anonymous"),
            "response_count": len(req.get("responses", [])),
            "already_responded": already_responded,
            "created_at": safe_isoformat(req.get("created_at"))
        })
    return {"requests": requests}


@router.post("/class-requests/{request_id}/respond")
async def respond_to_class_request(request_id: str, user: dict = Depends(get_current_user)):
    """Priest responds/shows interest in a class request"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=403, detail="Only priests can respond to class requests")
    
    class_req = await class_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not class_req:
        raise HTTPException(status_code=404, detail="Class request not found")
    
    priest_id = str(priest["_id"])
    for response in class_req.get("responses", []):
        if response.get("priest_id") == priest_id:
            raise HTTPException(status_code=400, detail="You have already responded to this request")
    
    response = {
        "priest_id": priest_id,
        "priest_name": user.get("name", ""),
        "priest_photo": priest.get("profile_photo"),
        "specializations": priest.get("specializations", []),
        "experience": priest.get("experience", ""),
        "responded_at": datetime.now(timezone.utc)
    }
    
    await class_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$push": {"responses": response}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Successfully showed interest in the class request"}


@router.post("/class-requests/{request_id}/accept/{priest_id}")
async def accept_priest_for_class(request_id: str, priest_id: str, user: dict = Depends(get_current_user)):
    """Devotee accepts a priest's response and creates a class"""
    class_req = await class_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not class_req:
        raise HTTPException(status_code=404, detail="Class request not found")
    
    if class_req["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="You can only accept responses to your own requests")
    
    priest_response = None
    for response in class_req.get("responses", []):
        if response.get("priest_id") == priest_id:
            priest_response = response
            break
    
    if not priest_response:
        raise HTTPException(status_code=404, detail="Priest response not found")
    
    priest = await priests_collection.find_one({"_id": ObjectId(priest_id)})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest not found")
    
    price = (class_req.get("budget_min", 0) + class_req.get("budget_max", 5000)) // 2
    
    new_class = {
        "priest_id": priest_id,
        "title": class_req["topic"],
        "description": class_req.get("description", ""),
        "category": class_req.get("category", "General"),
        "schedule_time": datetime.now(timezone.utc),
        "duration_minutes": 60 if class_req.get("duration_preference") == "1 hour" else 30,
        "frequency": class_req.get("frequency", "weekly"),
        "frequency_days": class_req.get("preferred_days", []),
        "price": price,
        "is_free": price == 0,
        "max_students": 1 if class_req.get("meeting_type") == "one_on_one" else 10,
        "available_slots": 1 if class_req.get("meeting_type") == "one_on_one" else 10,
        "enrolled_count": 0,
        "enrollments": [],
        "meeting_link": "",
        "room_id": None,
        "created_from_request": request_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await priest_classes_collection.insert_one(new_class)
    class_id = str(result.inserted_id)
    
    await class_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "matched",
                "matched_class_id": class_id,
                "matched_priest_id": priest_id,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "message": "Successfully matched with priest! Class created.",
        "class_id": class_id,
        "priest_name": priest_response.get("priest_name", "")
    }


@router.get("/class-requests/{request_id}/interested-priests")
async def get_interested_priests(request_id: str, user: dict = Depends(get_current_user)):
    """Get all priests who have shown interest in a class request"""
    class_req = await class_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not class_req:
        raise HTTPException(status_code=404, detail="Class request not found")
    
    if class_req["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="You can only view responses to your own requests")
    
    priests = []
    for response in class_req.get("responses", []):
        priests.append({
            "priest_id": response.get("priest_id"),
            "priest_name": response.get("priest_name", "Unknown"),
            "priest_photo": response.get("priest_photo"),
            "specializations": response.get("specializations", []),
            "experience": response.get("experience", ""),
            "responded_at": safe_isoformat(response.get("responded_at"))
        })
    
    return {"priests": priests, "count": len(priests)}


@router.delete("/class-requests/{request_id}")
async def delete_class_request(request_id: str, user: dict = Depends(get_current_user)):
    """Delete a class request"""
    class_req = await class_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not class_req:
        raise HTTPException(status_code=404, detail="Class request not found")
    
    if class_req["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="You can only delete your own requests")
    
    await class_requests_collection.delete_one({"_id": ObjectId(request_id)})
    return {"message": "Class request deleted successfully"}


# ===================== CLASS REMINDERS =====================

REMINDER_OPTIONS = [
    {"value": 15, "label": "15 minutes before"},
    {"value": 30, "label": "30 minutes before"},
    {"value": 60, "label": "1 hour before"},
    {"value": 120, "label": "2 hours before"},
    {"value": 1440, "label": "1 day before"},
]


@router.get("/class-reminders")
async def get_class_reminders(user: dict = Depends(get_current_user)):
    """Get all class reminders for the current user"""
    cursor = class_reminders_collection.find({"user_id": str(user["_id"])})
    reminders = []
    async for r in cursor:
        reminders.append({
            "class_id": r["class_id"],
            "remind_before_minutes": r["remind_before_minutes"],
            "enabled": r.get("enabled", True),
            "created_at": safe_isoformat(r.get("created_at")),
        })
    return {"reminders": reminders, "options": REMINDER_OPTIONS}


@router.post("/class-reminders")
async def set_class_reminder(request: Request, user: dict = Depends(get_current_user)):
    """Set or update a class reminder"""
    data = await request.json()
    class_id = data.get("class_id")
    remind_before_minutes = data.get("remind_before_minutes", 60)

    if not class_id:
        raise HTTPException(status_code=400, detail="class_id is required")

    valid_minutes = [opt["value"] for opt in REMINDER_OPTIONS]
    if remind_before_minutes not in valid_minutes:
        raise HTTPException(status_code=400, detail=f"remind_before_minutes must be one of {valid_minutes}")

    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Check if user is enrolled or is the priest
    user_id = str(user["_id"])
    is_enrolled = user_id in cls.get("enrollments", [])
    priest = await priests_collection.find_one({"user_id": user_id})
    is_priest = priest and cls.get("priest_id") == str(priest["_id"])

    if not is_enrolled and not is_priest:
        raise HTTPException(status_code=403, detail="You must be enrolled in the class or be the instructor")

    role = "priest" if is_priest else "student"

    await class_reminders_collection.update_one(
        {"user_id": user_id, "class_id": class_id},
        {"$set": {
            "user_id": user_id,
            "class_id": class_id,
            "remind_before_minutes": remind_before_minutes,
            "enabled": True,
            "role": role,
            "last_sent_for": None,
            "updated_at": datetime.now(timezone.utc),
        }, "$setOnInsert": {
            "created_at": datetime.now(timezone.utc),
        }},
        upsert=True
    )
    label = next((o["label"] for o in REMINDER_OPTIONS if o["value"] == remind_before_minutes), f"{remind_before_minutes} min before")
    return {"message": f"Reminder set: {label}", "remind_before_minutes": remind_before_minutes}


@router.delete("/class-reminders/{class_id}")
async def remove_class_reminder(class_id: str, user: dict = Depends(get_current_user)):
    """Remove a class reminder"""
    result = await class_reminders_collection.delete_one({
        "user_id": str(user["_id"]),
        "class_id": class_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder removed"}


# ===================== STREAM REMINDERS =====================

@router.get("/stream-reminders")
async def get_stream_reminders(user: dict = Depends(get_current_user)):
    """Get user's stream reminders"""
    cursor = stream_reminders_collection.find({"user_id": str(user["_id"])})
    reminders = []
    async for reminder in cursor:
        reminders.append({
            "stream_id": reminder["stream_id"],
            "created_at": safe_isoformat(reminder.get("created_at"))
        })
    return {"reminders": reminders}


@router.post("/stream-reminders")
async def set_stream_reminder(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Set a reminder for a live stream"""
    try:
        data = await request.json()
        stream_id = data.get("stream_id")
        
        if not stream_id:
            raise HTTPException(status_code=400, detail="stream_id is required")
        
        stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
        if not stream:
            raise HTTPException(status_code=404, detail="Stream not found")
        
        existing = await stream_reminders_collection.find_one({
            "user_id": str(user["_id"]),
            "stream_id": stream_id
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Reminder already set for this stream")
        
        await stream_reminders_collection.insert_one({
            "user_id": str(user["_id"]),
            "stream_id": stream_id,
            "stream_title": stream.get("title", ""),
            "scheduled_time": stream.get("scheduled_time"),
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"message": "Reminder set successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/stream-reminders/{stream_id}")
async def remove_stream_reminder(
    stream_id: str,
    user: dict = Depends(get_current_user)
):
    """Remove a stream reminder"""
    result = await stream_reminders_collection.delete_one({
        "user_id": str(user["_id"]),
        "stream_id": stream_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"message": "Reminder removed successfully"}


# ===================== MY ENROLLMENTS =====================

@router.get("/my-enrollments")
async def get_my_enrollments(user: dict = Depends(get_current_user)):
    """Get all classes the user is enrolled in"""
    cursor = class_enrollments_collection.find({"user_id": str(user["_id"])}).sort("enrolled_at", -1)
    enrollments = []
    
    async for enrollment in cursor:
        cls = await priest_classes_collection.find_one({"_id": ObjectId(enrollment["class_id"])})
        if cls:
            priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
            priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])}) if priest else None
            
            enrollments.append({
                "enrollment_id": str(enrollment["_id"]),
                "class_id": enrollment["class_id"],
                "class_title": cls.get("title", ""),
                "priest_name": priest_user["name"] if priest_user else "Unknown",
                "schedule_time": safe_isoformat(cls.get("schedule_time")),
                "duration_minutes": cls.get("duration_minutes", 60),
                "meeting_link": cls.get("meeting_link", ""),
                "room_id": cls.get("room_id"),
                "is_free": enrollment.get("is_free", cls.get("price", 0) == 0),
                "amount_paid": enrollment.get("amount", 0),
                "enrolled_at": safe_isoformat(enrollment.get("enrolled_at"))
            })
    
    return {"enrollments": enrollments, "count": len(enrollments)}


# ===================== PRIEST CLASSES MANAGEMENT =====================

@router.get("/priest/classes")
async def get_priest_classes(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get all classes created by the current priest"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    cursor = priest_classes_collection.find({"priest_id": str(priest["_id"])}).sort("schedule_time", -1)
    classes = []
    
    async for cls in cursor:
        classes.append({
            "id": str(cls["_id"]),
            "title": cls.get("title", ""),
            "description": cls.get("description", ""),
            "category": cls.get("category", "General"),
            "schedule_time": safe_isoformat(cls.get("schedule_time")),
            "duration_minutes": cls.get("duration_minutes", 60),
            "frequency": cls.get("frequency", "one_time"),
            "frequency_days": cls.get("frequency_days", []),
            "price": cls.get("price", 0),
            "is_free": cls.get("is_free", cls.get("price", 0) == 0),
            "max_students": cls.get("max_students", 50),
            "available_slots": cls.get("available_slots", cls.get("max_students", 50) - cls.get("enrolled_count", 0)),
            "enrolled_count": cls.get("enrolled_count", 0),
            "meeting_link": cls.get("meeting_link", ""),
            "room_id": cls.get("room_id"),
            "created_at": safe_isoformat(cls.get("created_at"))
        })
    
    return {"classes": classes, "count": len(classes)}


@router.post("/priest/classes")
async def create_priest_class(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Create a new class"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    try:
        data = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid request body")
    
    price = data.get("price", 0)
    is_free = data.get("is_free", price == 0)
    max_students = data.get("max_students", 50)
    
    new_class = {
        "priest_id": str(priest["_id"]),
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "category": data.get("category", "General"),
        "schedule_time": data.get("schedule_time"),
        "duration_minutes": data.get("duration_minutes", 60),
        "frequency": data.get("frequency", "one_time"),
        "frequency_days": data.get("frequency_days", []),
        "price": 0 if is_free else price,
        "is_free": is_free,
        "max_students": max_students,
        "available_slots": max_students,
        "enrolled_count": 0,
        "enrollments": [],
        "meeting_link": data.get("meeting_link", ""),
        "room_id": None,
        "syllabus": data.get("syllabus", []),
        "requirements": data.get("requirements", []),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await priest_classes_collection.insert_one(new_class)
    
    return {"message": "Class created successfully", "class_id": str(result.inserted_id)}


@router.put("/priest/classes/{class_id}")
async def update_priest_class(class_id: str, request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update a class"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if cls["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=403, detail="You can only update your own classes")
    
    try:
        data = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid request body")
    
    update_data = {k: v for k, v in data.items() if k not in ["_id", "priest_id", "enrollments", "enrolled_count"]}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    if "price" in update_data:
        update_data["is_free"] = update_data["price"] == 0
    
    await priest_classes_collection.update_one(
        {"_id": ObjectId(class_id)},
        {"$set": update_data}
    )
    
    return {"message": "Class updated successfully"}


@router.delete("/priest/classes/{class_id}")
async def delete_priest_class(class_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a class"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if cls["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=403, detail="You can only delete your own classes")
    
    await priest_classes_collection.delete_one({"_id": ObjectId(class_id)})
    return {"message": "Class deleted successfully"}
