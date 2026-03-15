"""
Chat Routes
Handles real-time chat WebSocket and REST APIs
"""
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
from typing import Optional, Dict, List
from bson import ObjectId
import json

from database import chat_rooms_collection, chat_messages_collection, users_collection
from auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
    
    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

@router.get("/rooms")
async def get_chat_rooms(user: dict = Depends(get_current_user)):
    """Get all chat rooms for current user"""
    user_id = str(user["_id"])
    
    cursor = chat_rooms_collection.find({
        "participants": user_id,
        "is_active": True
    }).sort("last_message_at", -1)
    
    rooms = []
    async for room in cursor:
        other_id = [p for p in room["participants"] if p != user_id][0]
        other_name = room.get("participant_names", {}).get(other_id, "Unknown")
        
        # Get unread count
        unread_count = await chat_messages_collection.count_documents({
            "room_id": str(room["_id"]),
            "sender_id": {"$ne": user_id},
            "read": False
        })
        
        # Get last message
        last_message = await chat_messages_collection.find_one(
            {"room_id": str(room["_id"])},
            sort=[("created_at", -1)]
        )
        
        rooms.append({
            "id": str(room["_id"]),
            "room_type": room.get("room_type"),
            "reference_id": room.get("reference_id"),
            "context": room.get("context"),
            "other_participant": {
                "id": other_id,
                "name": other_name
            },
            "unread_count": unread_count,
            "last_message": {
                "text": last_message.get("text", "") if last_message else None,
                "created_at": last_message.get("created_at").isoformat() if last_message and last_message.get("created_at") else None
            } if last_message else None,
            "last_message_at": room.get("last_message_at").isoformat() if room.get("last_message_at") else None
        })
    
    return {"rooms": rooms}

@router.get("/rooms/{room_id}")
async def get_chat_room(room_id: str, user: dict = Depends(get_current_user)):
    """Get single chat room details"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    user_id = str(user["_id"])
    if user_id not in room["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    other_id = [p for p in room["participants"] if p != user_id][0]
    other_name = room.get("participant_names", {}).get(other_id, "Unknown")
    
    return {
        "id": str(room["_id"]),
        "room_type": room.get("room_type"),
        "reference_id": room.get("reference_id"),
        "context": room.get("context"),
        "other_participant": {
            "id": other_id,
            "name": other_name
        },
        "is_active": room.get("is_active", True)
    }

@router.get("/rooms/{room_id}/messages")
async def get_chat_messages(room_id: str, limit: int = 50, user: dict = Depends(get_current_user)):
    """Get messages for a chat room"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    user_id = str(user["_id"])
    if user_id not in room["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    cursor = chat_messages_collection.find({"room_id": room_id}).sort("created_at", -1).limit(limit)
    messages = []
    async for msg in cursor:
        messages.append({
            "id": str(msg["_id"]),
            "sender_id": msg["sender_id"],
            "sender_name": msg.get("sender_name"),
            "text": msg.get("text"),
            "image_url": msg.get("image_url"),
            "read": msg.get("read", False),
            "created_at": msg.get("created_at").isoformat() if msg.get("created_at") else None
        })
    
    messages.reverse()
    return {"messages": messages}

@router.post("/rooms/{room_id}/messages")
async def send_message(room_id: str, data: dict, user: dict = Depends(get_current_user)):
    """Send a message to a chat room"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    user_id = str(user["_id"])
    if user_id not in room["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    text = data.get("text", "").strip()
    image_url = data.get("image_url")
    
    if not text and not image_url:
        raise HTTPException(status_code=400, detail="Message text or image required")
    
    message = {
        "room_id": room_id,
        "sender_id": user_id,
        "sender_name": user.get("name", "User"),
        "text": text,
        "image_url": image_url,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await chat_messages_collection.insert_one(message)
    
    # Update room's last_message_at
    await chat_rooms_collection.update_one(
        {"_id": ObjectId(room_id)},
        {"$set": {"last_message_at": datetime.now(timezone.utc)}}
    )
    
    # Broadcast via WebSocket
    broadcast_msg = {
        "type": "new_message",
        "message": {
            "id": str(result.inserted_id),
            "sender_id": user_id,
            "sender_name": user.get("name", "User"),
            "text": text,
            "image_url": image_url,
            "created_at": message["created_at"].isoformat()
        }
    }
    await manager.broadcast(room_id, broadcast_msg)
    
    return {
        "id": str(result.inserted_id),
        "sender_id": user_id,
        "text": text,
        "image_url": image_url,
        "created_at": message["created_at"].isoformat()
    }

@router.put("/rooms/{room_id}/read")
async def mark_messages_read(room_id: str, user: dict = Depends(get_current_user)):
    """Mark all messages in a room as read"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    user_id = str(user["_id"])
    if user_id not in room["participants"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    await chat_messages_collection.update_many(
        {"room_id": room_id, "sender_id": {"$ne": user_id}},
        {"$set": {"read": True}}
    )
    
    return {"message": "Messages marked as read"}

@router.get("/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get total unread message count"""
    user_id = str(user["_id"])
    
    # Get user's rooms
    rooms = await chat_rooms_collection.find({
        "participants": user_id,
        "is_active": True
    }).to_list(100)
    
    total_unread = 0
    for room in rooms:
        count = await chat_messages_collection.count_documents({
            "room_id": str(room["_id"]),
            "sender_id": {"$ne": user_id},
            "read": False
        })
        total_unread += count
    
    return {"unread_count": total_unread}
