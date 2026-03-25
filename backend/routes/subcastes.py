from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/subcastes", tags=["Subcastes"])
subcastes_collection = db["subcastes"]


@router.get("")
async def list_subcastes():
    """Public: Get all subcastes"""
    cursor = subcastes_collection.find({}, {"_id": 0, "name": 1}).sort("name", 1)
    subcastes = [doc["name"] async for doc in cursor]
    return {"subcastes": subcastes, "total": len(subcastes)}


@router.post("")
async def add_subcaste(data: dict, user: dict = Depends(get_current_user)):
    """Admin: Add a new subcaste"""
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    name = data.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    existing = await subcastes_collection.find_one({"name": name})
    if existing:
        raise HTTPException(status_code=400, detail="Subcaste already exists")
    await subcastes_collection.insert_one({
        "name": name,
        "created_at": datetime.now(timezone.utc),
    })
    return {"message": f"Subcaste '{name}' added"}


@router.put("/{name}")
async def update_subcaste(name: str, data: dict, user: dict = Depends(get_current_user)):
    """Admin: Update a subcaste name"""
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    new_name = data.get("name", "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="New name is required")
    result = await subcastes_collection.update_one({"name": name}, {"$set": {"name": new_name}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subcaste not found")
    return {"message": f"Updated to '{new_name}'"}


@router.delete("/{name}")
async def delete_subcaste(name: str, user: dict = Depends(get_current_user)):
    """Admin: Delete a subcaste"""
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    result = await subcastes_collection.delete_one({"name": name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subcaste not found")
    return {"message": f"Deleted '{name}'"}
