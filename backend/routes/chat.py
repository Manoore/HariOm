"""
Real-time Chat System Routes
Handles chat rooms, messages, and WebSocket connections for bookings and orders
"""
from fastapi import APIRouter, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
from typing import Dict, List
from bson import ObjectId

from database import (
    chat_rooms_collection, chat_messages_collection, 
    bookings_collection, orders_collection, users_collection, priests_collection
)
from models import UserRole
from auth import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["Chat"])


def is_participant(user_id: str, participants: list) -> bool:
    """Check if user is a participant in a chat room (supports both formats)"""
    for p in participants:
        if isinstance(p, dict):
            if p.get("user_id") == user_id:
                return True
        elif p == user_id:
            return True
    return False


def get_other_participant_id(user_id: str, participants: list) -> str:
    """Get the other participant's user_id from a chat room"""
    for p in participants:
        pid = p.get("user_id") if isinstance(p, dict) else p
        if pid != user_id:
            return pid
    return None


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}  # room_id -> list of websockets
    
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# Helper function to create chat room
async def create_chat_room(room_type: str, reference_id: str, participant1_id: str, participant1_name: str, 
                           participant2_id: str, participant2_name: str, context: str = ""):
    """Create a new chat room for booking or order"""
    # Check if room already exists
    existing_query = {"booking_id": reference_id} if room_type == "booking" else {"order_id": reference_id}
    existing = await chat_rooms_collection.find_one(existing_query)
    if existing:
        return str(existing["_id"])
    
    room_data = {
        "type": room_type,  # "booking" or "order"
        "booking_id": reference_id if room_type == "booking" else None,
        "order_id": reference_id if room_type == "order" else None,
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
    result = await chat_rooms_collection.insert_one(room_data)
    return str(result.inserted_id)

# Helper function to deactivate chat room
async def deactivate_chat_room(room_type: str, reference_id: str):
    """Deactivate a chat room when booking/order is completed"""
    query = {"booking_id": reference_id} if room_type == "booking" else {"order_id": reference_id}
    await chat_rooms_collection.update_one(
        query,
        {"$set": {"is_active": False, "deactivated_at": datetime.now(timezone.utc)}}
    )

async def reactivate_chat_room(room_type: str, reference_id: str):
    """Reactivate a chat room"""
    query = {"booking_id": reference_id} if room_type == "booking" else {"order_id": reference_id}
    await chat_rooms_collection.update_one(
        query,
        {"$set": {"is_active": True}, "$unset": {"deactivated_at": ""}}
    )

@router.put("/admin/chat/reactivate/{room_id}")
async def admin_reactivate_chat(room_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Reactivate a chat room (admin only)"""
    result = await chat_rooms_collection.update_one(
        {"_id": ObjectId(room_id)},
        {"$set": {"is_active": True}, "$unset": {"deactivated_at": ""}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Chat room not found")
    return {"message": "Chat room reactivated"}

@router.put("/chat/reactivate/{booking_id}")
async def reactivate_booking_chat(booking_id: str, user: dict = Depends(get_current_user)):
    """Reactivate chat for a booking (priest or devotee who is part of the booking)"""
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is part of this booking
    priest = await priests_collection.find_one({"_id": ObjectId(booking["priest_id"])})
    if str(user["_id"]) != booking["user_id"] and (not priest or str(user["_id"]) != priest["user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await reactivate_chat_room("booking", booking_id)
    return {"message": "Chat reactivated"}

# REST API endpoints for chat
@router.get("/chat/rooms")
async def get_chat_rooms(user: dict = Depends(get_current_user)):
    """Get all chat rooms for the current user"""
    user_id = str(user["_id"])
    
    # Query for rooms where user is a participant (supports both old and new format)
    cursor = chat_rooms_collection.find({
        "$or": [
            {"participants.user_id": user_id},
            {"participants": user_id}
        ]
    }).sort("last_message_at", -1)
    
    CHAT_WINDOW_DAYS = 5
    
    rooms = []
    async for room in cursor:
        is_active = room.get("is_active", True)
        chat_expired = False
        chat_expiry_reason = None
        
        # Check booking status and expiry
        if room.get("booking_id"):
            booking = await bookings_collection.find_one({"_id": ObjectId(room["booking_id"])})
            if booking:
                if booking.get("status") == "cancelled":
                    is_active = False
                    chat_expiry_reason = "cancelled"
                elif booking.get("status") == "completed":
                    completed_at = booking.get("completed_at")
                    if completed_at:
                        days_since_completion = (datetime.now(timezone.utc) - completed_at).days
                        if days_since_completion > CHAT_WINDOW_DAYS:
                            is_active = False
                            chat_expired = True
                            chat_expiry_reason = "expired"
                    else:
                        is_active = True
                else:
                    is_active = True
        
        # Check order status and expiry
        elif room.get("order_id"):
            order = await orders_collection.find_one({"_id": ObjectId(room["order_id"])})
            if order:
                if order.get("status") == "cancelled":
                    is_active = False
                    chat_expiry_reason = "cancelled"
                elif order.get("status") == "delivered":
                    delivered_at = order.get("delivered_at")
                    if delivered_at:
                        days_since_delivery = (datetime.now(timezone.utc) - delivered_at).days
                        if days_since_delivery > CHAT_WINDOW_DAYS:
                            is_active = False
                            chat_expired = True
                            chat_expiry_reason = "expired"
                    else:
                        is_active = True
                else:
                    is_active = True
        
        # Update DB if status changed
        if is_active != room.get("is_active", True):
            await chat_rooms_collection.update_one(
                {"_id": room["_id"]},
                {"$set": {"is_active": is_active}}
            )
        
        # Get last message
        last_message = await chat_messages_collection.find_one(
            {"room_id": str(room["_id"])},
            sort=[("created_at", -1)]
        )
        
        # Get other participant details
        participants = room.get("participants", [])
        other_id = None
        other_name = "User"
        other_role = "unknown"
        
        for p in participants:
            if isinstance(p, dict):
                if p.get("user_id") != user_id:
                    other_id = p.get("user_id")
                    other_name = p.get("name", "User")
                    break
            else:
                if p != user_id:
                    other_id = p
                    other_details = room.get("participant_details", {}).get(other_id, {})
                    other_name = other_details.get("name", "User")
                    other_role = other_details.get("role", "unknown")
                    break
        
        # Get role from user collection if not available
        if other_id and other_role == "unknown":
            other_user = await users_collection.find_one({"_id": ObjectId(other_id)})
            if other_user:
                other_role = other_user.get("role", "unknown")
                if not other_name or other_name == "User":
                    other_name = other_user.get("name", "User")
        
        rooms.append({
            "id": str(room["_id"]),
            "type": room.get("type", "booking"),
            "reference_id": room.get("reference_id"),
            "booking_id": room.get("booking_id") or room.get("reference_id") if room.get("type") == "booking" else None,
            "order_id": room.get("order_id") or room.get("reference_id") if room.get("type") == "order" else None,
            "context": room.get("context", ""),
            "is_active": is_active,
            "chat_expired": chat_expired,
            "chat_expiry_reason": chat_expiry_reason,
            "other_participant": {
                "id": other_id or "",
                "name": other_name,
                "role": other_role
            },
            "unread_count": room.get("unread_count", {}).get(user_id, 0),
            "last_message": {
                "content": last_message.get("content", "") if last_message else "",
                "sender_id": last_message.get("sender_id", "") if last_message else "",
                "created_at": last_message["created_at"].isoformat() if last_message else None
            } if last_message else None,
            "created_at": room["created_at"].isoformat() if room.get("created_at") else None,
            "last_message_at": room.get("last_message_at", room.get("created_at")).isoformat() if room.get("last_message_at") or room.get("created_at") else None
        })
    
    return {"rooms": rooms}

@router.get("/chat/rooms/{room_id}")
async def get_chat_room(room_id: str, user: dict = Depends(get_current_user)):
    """Get a specific chat room"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if not is_participant(str(user["_id"]), room["participants"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
    
    other_id = get_other_participant_id(str(user["_id"]), room["participants"])
    other_details = room.get("participant_details", {}).get(other_id, {"name": "User", "role": "unknown"})
    
    return {
        "id": str(room["_id"]),
        "type": room["type"],
        "booking_id": room.get("booking_id"),
        "order_id": room.get("order_id"),
        "context": room.get("context", ""),
        "is_active": room.get("is_active", True),
        "other_participant": {
            "id": other_id,
            "name": other_details.get("name", "User"),
            "role": other_details.get("role", "unknown")
        },
        "created_at": room["created_at"].isoformat()
    }

@router.get("/chat/rooms/{room_id}/messages")
async def get_chat_messages(room_id: str, skip: int = 0, limit: int = 50, user: dict = Depends(get_current_user)):
    """Get messages for a chat room"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if not is_participant(str(user["_id"]), room["participants"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
    
    cursor = chat_messages_collection.find({"room_id": room_id}).sort("created_at", -1).skip(skip).limit(limit)
    
    messages = []
    async for msg in cursor:
        messages.append({
            "id": str(msg["_id"]),
            "sender_id": msg["sender_id"],
            "sender_name": msg.get("sender_name", "User"),
            "content": msg.get("content", ""),
            "image_url": msg.get("image_url", ""),
            "created_at": msg["created_at"].isoformat(),
            "is_read": str(user["_id"]) in msg.get("read_by", [])
        })
    
    # Mark messages as read
    await chat_messages_collection.update_many(
        {"room_id": room_id, "read_by": {"$ne": str(user["_id"])}},
        {"$addToSet": {"read_by": str(user["_id"])}}
    )
    await chat_rooms_collection.update_one(
        {"_id": ObjectId(room_id)},
        {"$set": {f"unread_count.{str(user['_id'])}": 0}}
    )
    
    return {"messages": list(reversed(messages))}

@router.post("/chat/rooms/{room_id}/messages")
async def send_chat_message(room_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Send a message to a chat room (REST fallback for WebSocket)"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if not is_participant(str(user["_id"]), room["participants"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not room.get("is_active", True):
        raise HTTPException(status_code=400, detail="This chat has ended")
    
    data = await request.json()
    
    if not data.get("content") and not data.get("image_url"):
        raise HTTPException(status_code=400, detail="Message must have content or image")
    
    message_data = {
        "room_id": room_id,
        "sender_id": str(user["_id"]),
        "sender_name": user.get("name", "User"),
        "content": data.get("content", ""),
        "image_url": data.get("image_url", ""),
        "created_at": datetime.now(timezone.utc),
        "read_by": [str(user["_id"])]
    }
    result = await chat_messages_collection.insert_one(message_data)
    
    # Update room's last message time and unread counts
    other_participant = get_other_participant_id(str(user["_id"]), room["participants"])
    await chat_rooms_collection.update_one(
        {"_id": ObjectId(room_id)},
        {
            "$set": {"last_message_at": datetime.now(timezone.utc)},
            "$inc": {f"unread_count.{other_participant}": 1}
        }
    )
    
    # Broadcast via WebSocket if connected
    broadcast_message = {
        "type": "new_message",
        "message": {
            "id": str(result.inserted_id),
            "sender_id": str(user["_id"]),
            "sender_name": user.get("name", "User"),
            "content": data.get("content", ""),
            "image_url": data.get("image_url", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    }
    await manager.broadcast_to_room(room_id, broadcast_message)
    
    return {
        "message": "Message sent",
        "data": broadcast_message["message"]
    }

@router.put("/chat/rooms/{room_id}/read")
async def mark_messages_read(room_id: str, user: dict = Depends(get_current_user)):
    """Mark all messages in a room as read"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if not is_participant(str(user["_id"]), room["participants"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await chat_messages_collection.update_many(
        {"room_id": room_id, "read_by": {"$ne": str(user["_id"])}},
        {"$addToSet": {"read_by": str(user["_id"])}}
    )
    await chat_rooms_collection.update_one(
        {"_id": ObjectId(room_id)},
        {"$set": {f"unread_count.{str(user['_id'])}": 0}}
    )
    
    return {"message": "Messages marked as read"}

@router.get("/chat/unread-count")
async def get_total_unread_count(user: dict = Depends(get_current_user)):
    """Get total unread message count across all rooms"""
    cursor = chat_rooms_collection.find({"participants": str(user["_id"])})
    total = 0
    async for room in cursor:
        total += room.get("unread_count", {}).get(str(user["_id"]), 0)
    return {"unread_count": total}
