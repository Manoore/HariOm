"""
Class Room Management - 100ms Integration for Vedic Classes
Auto-generates meeting rooms 10 minutes before class starts
"""
import os
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId

from database import (
    priest_classes_collection, class_enrollments_collection,
    users_collection, priests_collection, user_notifications_collection
)
from video_consultation import generate_100ms_token, create_100ms_room, end_100ms_room

# Alias for clarity
notifications_collection = user_notifications_collection

# ===================== ROOM GENERATION =====================

async def generate_class_room(class_id: str) -> Dict[str, Any]:
    """Generate a 100ms room for a class - ONLY for PAID classes"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise Exception("Class not found")
    
    # Skip room generation for FREE classes - they use external meeting links
    is_free = cls.get("is_free", False) or cls.get("price", 0) == 0
    if is_free:
        raise Exception("Free classes use external meeting links, not 100ms rooms")
    
    # Check if room already exists
    if cls.get("room_id"):
        return {
            "room_id": cls["room_id"],
            "already_exists": True
        }
    
    # Get priest info for room name
    priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
    priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])}) if priest else None
    priest_name = priest_user.get("name", "Teacher") if priest_user else "Teacher"
    
    # Create 100ms room
    room_title = f"{cls.get('title', 'Vedic Class')} - {priest_name}"
    room_data = await create_100ms_room(room_title)
    room_id = room_data.get("id")
    
    # Generate host token for priest
    priest_token = await generate_100ms_token(room_id, cls["priest_id"], "host")
    
    # Update class with room info
    await priest_classes_collection.update_one(
        {"_id": ObjectId(class_id)},
        {
            "$set": {
                "room_id": room_id,
                "room_created_at": datetime.now(timezone.utc),
                "priest_token": priest_token,
                "room_status": "ready"
            }
        }
    )
    
    return {
        "room_id": room_id,
        "priest_token": priest_token,
        "already_exists": False
    }


async def get_student_token(class_id: str, user_id: str) -> Dict[str, Any]:
    """Get 100ms token for a student - verifies payment first"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise Exception("Class not found")
    
    # Check if user is enrolled
    enrollments = cls.get("enrollments", [])
    if user_id not in enrollments:
        raise Exception("Not enrolled in this class")
    
    # For paid classes, verify payment
    is_free = cls.get("is_free", cls.get("price", 0) == 0)
    if not is_free:
        # Check payment record
        payment = await class_enrollments_collection.find_one({
            "class_id": class_id,
            "user_id": user_id,
            "status": "completed"
        })
        if not payment:
            raise Exception("Payment not verified for this class")
    
    # Check if room exists
    room_id = cls.get("room_id")
    if not room_id:
        raise Exception("Class room not yet created. Please wait for class to start.")
    
    # Generate student token
    student_token = await generate_100ms_token(room_id, user_id, "guest")
    
    return {
        "room_id": room_id,
        "token": student_token,
        "class_title": cls.get("title", ""),
        "priest_name": cls.get("priest_name", "Teacher")
    }


async def notify_students_class_starting(class_id: str) -> int:
    """Send in-app notification to all enrolled students"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        return 0
    
    enrollments = cls.get("enrollments", [])
    priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
    priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])}) if priest else None
    priest_name = priest_user.get("name", "Teacher") if priest_user else "Teacher"
    
    notified = 0
    for user_id in enrollments:
        try:
            notification = {
                "user_id": user_id,
                "type": "class_starting",
                "title": "Class Starting Soon!",
                "message": f"Your class '{cls.get('title', 'Vedic Class')}' with {priest_name} is starting in 10 minutes. Click to join!",
                "data": {
                    "class_id": class_id,
                    "action": "join_class"
                },
                "read": False,
                "created_at": datetime.now(timezone.utc)
            }
            await notifications_collection.insert_one(notification)
            notified += 1
        except Exception as e:
            print(f"Failed to notify user {user_id}: {e}")
    
    # Also notify priest
    if priest:
        try:
            priest_notification = {
                "user_id": priest["user_id"],
                "type": "class_starting",
                "title": "Your Class is Starting!",
                "message": f"Your class '{cls.get('title', 'Vedic Class')}' starts in 10 minutes. {len(enrollments)} students enrolled.",
                "data": {
                    "class_id": class_id,
                    "action": "start_class"
                },
                "read": False,
                "created_at": datetime.now(timezone.utc)
            }
            await notifications_collection.insert_one(priest_notification)
        except Exception:
            pass
    
    return notified


async def check_and_create_upcoming_rooms():
    """
    Background task: Check for classes starting in ~10 minutes
    and create rooms + send notifications
    ONLY for PAID classes - free classes use external meeting links
    """
    now = datetime.now(timezone.utc)
    ten_mins_later = now + timedelta(minutes=10)
    twelve_mins_later = now + timedelta(minutes=12)  # 2 min buffer
    
    # Find PAID classes starting in 10-12 minutes that don't have a room yet
    # Skip free classes (is_free=True or price=0)
    query = {
        "schedule_time": {
            "$gte": ten_mins_later,
            "$lte": twelve_mins_later
        },
        "room_id": {"$exists": False},
        "enrolled_count": {"$gt": 0},  # Only if someone enrolled
        "$and": [
            {"$or": [{"is_free": False}, {"is_free": {"$exists": False}}]},
            {"$or": [{"price": {"$gt": 0}}, {"price": {"$exists": False}}]}
        ]
    }
    
    cursor = priest_classes_collection.find(query)
    rooms_created = 0
    
    async for cls in cursor:
        try:
            # Double-check it's not a free class
            is_free = cls.get("is_free", False) or cls.get("price", 0) == 0
            if is_free:
                print(f"Skipping free class: {cls.get('title')} (uses external link)")
                continue
                
            class_id = str(cls["_id"])
            print(f"Creating room for PAID class: {cls.get('title')} (ID: {class_id})")
            
            # Generate room
            await generate_class_room(class_id)
            
            # Notify students
            notified = await notify_students_class_starting(class_id)
            print(f"Notified {notified} students for class {class_id}")
            
            rooms_created += 1
        except Exception as e:
            print(f"Error creating room for class {cls.get('_id')}: {e}")
    
    return rooms_created


async def cleanup_expired_rooms():
    """
    Background task: End rooms for classes that ended 2+ hours ago
    """
    two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
    
    query = {
        "room_id": {"$exists": True},
        "room_status": "ready",
        "schedule_time": {"$lt": two_hours_ago}
    }
    
    cursor = priest_classes_collection.find(query)
    cleaned = 0
    
    async for cls in cursor:
        try:
            room_id = cls.get("room_id")
            if room_id:
                await end_100ms_room(room_id, "Class ended")
                await priest_classes_collection.update_one(
                    {"_id": cls["_id"]},
                    {"$set": {"room_status": "ended"}}
                )
                cleaned += 1
        except Exception as e:
            print(f"Error cleaning room for class {cls.get('_id')}: {e}")
    
    return cleaned


# ===================== BACKGROUND SCHEDULER =====================

_scheduler_running = False

async def room_scheduler():
    """Background scheduler that runs every minute"""
    global _scheduler_running
    
    if _scheduler_running:
        return
    
    _scheduler_running = True
    print("Class room scheduler started")
    
    while _scheduler_running:
        try:
            # Check for upcoming classes
            rooms = await check_and_create_upcoming_rooms()
            if rooms > 0:
                print(f"Created {rooms} class rooms")
            
            # Cleanup old rooms (run less frequently)
            if datetime.now().minute % 30 == 0:  # Every 30 mins
                cleaned = await cleanup_expired_rooms()
                if cleaned > 0:
                    print(f"Cleaned up {cleaned} expired rooms")
                    
        except Exception as e:
            print(f"Scheduler error: {e}")
        
        # Wait 1 minute before next check
        await asyncio.sleep(60)


def start_scheduler():
    """Start the background scheduler"""
    asyncio.create_task(room_scheduler())


def stop_scheduler():
    """Stop the background scheduler"""
    global _scheduler_running
    _scheduler_running = False
