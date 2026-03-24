"""
Notification Routes Module
API endpoints for fetching and managing user notifications
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId

from database import notification_logs_collection
from auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def get_user_notifications(
    user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False
):
    """Get notifications for the current user"""
    query = {
        "user_id": str(user["_id"]),
        "is_log": {"$ne": True}  # Exclude log entries, only get actual notifications
    }
    
    if unread_only:
        query["is_read"] = False
    
    cursor = notification_logs_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    
    notifications = []
    async for notif in cursor:
        notifications.append({
            "id": str(notif["_id"]),
            "type": notif.get("type"),
            "title": notif.get("title", "Notification"),
            "message": notif.get("message", ""),
            "icon": notif.get("icon", "bell"),
            "is_read": notif.get("is_read", False),
            "data": notif.get("data", {}),
            "created_at": notif["created_at"].isoformat() if notif.get("created_at") else None
        })
    
    # Get unread count
    unread_count = await notification_logs_collection.count_documents({
        "user_id": str(user["_id"]),
        "is_read": False,
        "is_log": {"$ne": True}
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total": await notification_logs_collection.count_documents(query)
    }


@router.get("/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await notification_logs_collection.count_documents({
        "user_id": str(user["_id"]),
        "is_read": False,
        "is_log": {"$ne": True}
    })
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    result = await notification_logs_collection.update_one(
        {
            "_id": ObjectId(notification_id),
            "user_id": str(user["_id"])
        },
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    result = await notification_logs_collection.update_many(
        {
            "user_id": str(user["_id"]),
            "is_read": False,
            "is_log": {"$ne": True}
        },
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": f"{result.modified_count} notifications marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, user: dict = Depends(get_current_user)):
    """Delete a notification"""
    result = await notification_logs_collection.delete_one({
        "_id": ObjectId(notification_id),
        "user_id": str(user["_id"]),
        "is_log": {"$ne": True}
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}



@router.post("/test")
async def create_test_notification(user: dict = Depends(get_current_user)):
    """Create a test notification for the current user (for testing)"""
    notification = {
        "user_id": str(user["_id"]),
        "type": "test",
        "title": "Welcome to Divine!",
        "message": "Your notification system is working. You'll receive updates about bookings, classes, and more here.",
        "icon": "bell",
        "data": {},
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    result = await notification_logs_collection.insert_one(notification)
    return {"message": "Test notification created", "id": str(result.inserted_id)}


@router.post("/admin/announce")
async def send_admin_announcement(
    title: str,
    message: str,
    user: dict = Depends(get_current_user)
):
    """Admin: Send announcement notification to all users"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    from database import users_collection
    
    users_cursor = users_collection.find({}, {"_id": 1})
    count = 0
    async for u in users_cursor:
        notification = {
            "user_id": str(u["_id"]),
            "type": "announcement",
            "title": title,
            "message": message,
            "icon": "bell",
            "data": {"from": "admin"},
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        }
        await notification_logs_collection.insert_one(notification)
        count += 1
    
    return {"message": f"Announcement sent to {count} users"}
