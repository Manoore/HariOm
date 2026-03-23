"""
Feedback and Testimonials Routes
Handles user feedback, contact forms, and testimonials
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel

from database import feedback_collection, testimonials_collection
from auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["Feedback"])


class FeedbackCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str
    rating: Optional[int] = None


class TestimonialCreate(BaseModel):
    content: str
    rating: int


@router.post("/feedback")
async def submit_feedback(feedback: FeedbackCreate):
    """Submit feedback/contact form - no auth required"""
    feedback_doc = {
        "name": feedback.name,
        "email": feedback.email,
        "subject": feedback.subject,
        "message": feedback.message,
        "rating": feedback.rating,
        "created_at": datetime.now(timezone.utc),
        "status": "new"
    }
    result = await feedback_collection.insert_one(feedback_doc)
    return {"success": True, "message": "Thank you for your feedback!", "id": str(result.inserted_id)}


@router.get("/feedback")
async def get_all_feedback(user: dict = Depends(require_role(["admin"]))):
    """Get all feedback - admin only"""
    feedback_list = await feedback_collection.find().sort("created_at", -1).to_list(100)
    for f in feedback_list:
        f["id"] = str(f.pop("_id"))
    return {"feedback": feedback_list}


@router.post("/testimonials")
async def submit_testimonial(testimonial: TestimonialCreate, user: dict = Depends(get_current_user)):
    """Submit a testimonial - requires login"""
    testimonial_doc = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "Anonymous"),
        "user_role": user.get("role", "devotee"),
        "content": testimonial.content,
        "rating": testimonial.rating,
        "created_at": datetime.now(timezone.utc),
        "is_approved": False
    }
    result = await testimonials_collection.insert_one(testimonial_doc)
    return {"success": True, "message": "Thank you! Your testimonial will be reviewed.", "id": str(result.inserted_id)}


@router.get("/testimonials")
async def get_testimonials(approved_only: bool = True):
    """Get testimonials - public endpoint"""
    query = {"is_approved": True} if approved_only else {}
    testimonials = await testimonials_collection.find(query).sort("created_at", -1).to_list(50)
    for t in testimonials:
        t["id"] = str(t.pop("_id"))
    return {"testimonials": testimonials}


@router.put("/testimonials/{testimonial_id}/approve")
async def approve_testimonial(testimonial_id: str, user: dict = Depends(require_role(["admin"]))):
    """Approve a testimonial - admin only"""
    result = await testimonials_collection.update_one(
        {"_id": ObjectId(testimonial_id)},
        {"$set": {"is_approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"success": True, "message": "Testimonial approved"}


@router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, user: dict = Depends(require_role(["admin"]))):
    """Delete a testimonial - admin only"""
    result = await testimonials_collection.delete_one({"_id": ObjectId(testimonial_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"success": True, "message": "Testimonial deleted"}


@router.get("/contact-info")
async def get_contact_info():
    """Get public contact information - no auth required"""
    from system_config import get_config_value
    return {
        "email": await get_config_value("support_email") or "support@divineapp.com",
        "phone": await get_config_value("support_phone") or "+91 98765 43210",
        "address": await get_config_value("contact_address") or "Hyderabad, Telangana, India",
        "app_name": await get_config_value("app_name") or "Divine App"
    }
