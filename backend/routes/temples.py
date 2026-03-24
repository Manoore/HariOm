from fastapi import APIRouter, Query
from typing import Optional
from bson import ObjectId
from database import db

router = APIRouter(prefix="/api/temples", tags=["temples"])

temples_collection = db["temples"]
deities_collection = db["temple_deities"]


def serialize_temple(t):
    return {
        "id": str(t["_id"]),
        "name": t.get("name", ""),
        "state": t.get("state", ""),
        "deity": t.get("deity", ""),
        "info": t.get("info", ""),
        "story": t.get("story", ""),
        "visiting_guide": t.get("visiting_guide", ""),
        "architecture": t.get("architecture", ""),
        "mention_in_scripture": t.get("mention_in_scripture", ""),
    }


@router.get("/list")
async def list_temples(
    state: Optional[str] = None,
    deity: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List temples with optional filters"""
    query = {}
    if state:
        query["state"] = state
    if deity:
        query["deity"] = deity
    if search:
        query["$text"] = {"$search": search}

    skip = (page - 1) * limit
    total = await temples_collection.count_documents(query)
    cursor = temples_collection.find(query).skip(skip).limit(limit).sort("name", 1)
    temples = [serialize_temple(t) async for t in cursor]

    return {
        "temples": temples,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/states")
async def list_states():
    """Get all states with temple counts"""
    pipeline = [
        {"$group": {"_id": "$state", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    results = await temples_collection.aggregate(pipeline).to_list(None)
    return {
        "states": [{"name": r["_id"], "count": r["count"]} for r in results],
    }


@router.get("/deities")
async def list_deities():
    """Get all deities with temple counts"""
    pipeline = [
        {"$match": {"deity": {"$ne": ""}}},
        {"$group": {"_id": "$deity", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = await temples_collection.aggregate(pipeline).to_list(None)
    return {
        "deities": [{"name": r["_id"], "count": r["count"]} for r in results],
    }


@router.get("/stats")
async def temple_stats():
    """Get overall temple statistics"""
    total = await temples_collection.count_documents({})
    states_pipeline = [{"$group": {"_id": "$state"}}, {"$count": "total"}]
    states_result = await temples_collection.aggregate(states_pipeline).to_list(1)
    deities_pipeline = [{"$match": {"deity": {"$ne": ""}}}, {"$group": {"_id": "$deity"}}, {"$count": "total"}]
    deities_result = await temples_collection.aggregate(deities_pipeline).to_list(1)

    return {
        "total_temples": total,
        "total_states": states_result[0]["total"] if states_result else 0,
        "total_deities": deities_result[0]["total"] if deities_result else 0,
    }


@router.get("/{temple_id}")
async def get_temple(temple_id: str):
    """Get a single temple by ID"""
    temple = await temples_collection.find_one({"_id": ObjectId(temple_id)})
    if not temple:
        return {"error": "Temple not found"}, 404
    return {"temple": serialize_temple(temple)}
