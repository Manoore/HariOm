"""
Devotional Content Routes
Handles deities, mantras, stotras, scriptures, and daily worship schedules
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from database import (
    deities_collection, mantras_collection, stotras_collection,
    daily_schedule_collection, scriptures_collection, scripture_verses_collection
)
from auth import get_optional_user

router = APIRouter(prefix="/api", tags=["Devotional"])


# ===================== DEITY ROUTES =====================

@router.get("/devotional/deities")
async def get_deities():
    """Get all deities"""
    cursor = deities_collection.find({}, {"_id": 0})
    deities = await cursor.to_list(length=50)
    return {"status": "ok", "data": deities}


@router.get("/devotional/deities/{deity_id}")
async def get_deity(deity_id: str):
    """Get a specific deity with its mantras"""
    deity = await deities_collection.find_one({"id": deity_id}, {"_id": 0})
    if not deity:
        raise HTTPException(status_code=404, detail="Deity not found")
    
    # Get mantras for this deity
    cursor = mantras_collection.find({"deity_id": deity_id}, {"_id": 0})
    mantras = await cursor.to_list(length=50)
    
    # Get stotras for this deity
    cursor = stotras_collection.find({"deity_id": deity_id}, {"_id": 0})
    stotras = await cursor.to_list(length=50)
    
    return {
        "status": "ok",
        "data": {
            **deity,
            "mantras": mantras,
            "stotras": stotras
        }
    }


# ===================== MANTRA ROUTES =====================

@router.get("/devotional/mantras")
async def get_mantras(
    deity_id: Optional[str] = None, 
    type: Optional[str] = None, 
    tier: Optional[str] = None, 
    category: Optional[str] = None
):
    """Get mantras with optional filters"""
    query = {"is_active": True}
    if deity_id:
        query["deity_id"] = deity_id
    if type:
        query["type"] = type
    if tier:
        query["tier"] = tier
    if category:
        query["category"] = category
    
    cursor = mantras_collection.find(query, {"_id": 0})
    mantras = await cursor.to_list(length=100)
    return {"status": "ok", "data": mantras, "count": len(mantras)}


@router.get("/devotional/mantras/all")
async def get_all_mantras(
    category: Optional[str] = None, 
    search: Optional[str] = None, 
    limit: int = 50, 
    skip: int = 0
):
    """Get all mantras from stotra-sangrahah collection with pagination and search"""
    query = {"is_active": True, "source": "stotra-sangrahah"}
    
    if category and category != "all":
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"title_english": {"$regex": search, "$options": "i"}},
            {"deity": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await mantras_collection.count_documents(query)
    
    # Get paginated mantras
    cursor = mantras_collection.find(query, {"_id": 0}).skip(skip).limit(limit).sort("title", 1)
    mantras = await cursor.to_list(length=limit)
    
    return {
        "status": "ok", 
        "data": mantras, 
        "total": total,
        "limit": limit,
        "skip": skip,
        "has_more": skip + len(mantras) < total
    }


@router.get("/devotional/mantras/debug")
async def debug_mantras():
    """Debug endpoint to check mantras collection"""
    try:
        total = await mantras_collection.count_documents({})
        active = await mantras_collection.count_documents({"is_active": True})
        with_category = await mantras_collection.count_documents({"category": {"$exists": True}})
        
        sample = await mantras_collection.find_one(
            {"source": "stotra-sangrahah"}, 
            {"_id": 0, "title": 1, "category": 1, "deity": 1}
        )
        
        return {
            "total": total,
            "active": active,
            "with_category": with_category,
            "sample": sample
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/devotional/mantras/categories")
async def get_mantra_categories():
    """Get all unique mantra categories with counts"""
    try:
        pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {
                "_id": "$category", 
                "count": {"$sum": 1}, 
                "deity": {"$first": "$deity"}, 
                "deity_hindi": {"$first": "$deity_hindi"}
            }},
            {"$sort": {"count": -1}}
        ]
        
        categories = []
        cursor = mantras_collection.aggregate(pipeline)
        results = await cursor.to_list(length=50)
        
        for item in results:
            if item["_id"]:
                categories.append({
                    "id": item["_id"],
                    "name": item.get("deity") or item["_id"],
                    "name_hindi": item.get("deity_hindi") or "",
                    "count": item["count"]
                })
        
        return {"status": "ok", "data": categories}
    except Exception as e:
        print(f"ERROR in categories: {e}")
        return {"status": "error", "message": str(e), "data": []}


@router.get("/devotional/mantras/{deity_id}/{mantra_type}")
async def get_specific_mantra(deity_id: str, mantra_type: str):
    """Get a specific mantra by deity and type"""
    mantra = await mantras_collection.find_one(
        {"deity_id": deity_id, "type": mantra_type},
        {"_id": 0}
    )
    if not mantra:
        raise HTTPException(status_code=404, detail="Mantra not found")
    return {"status": "ok", "data": mantra}


# ===================== STOTRA ROUTES =====================

@router.get("/devotional/stotras")
async def get_stotras(
    deity_id: Optional[str] = None, 
    type: Optional[str] = None, 
    tier: Optional[str] = None
):
    """Get stotras with optional filters"""
    query = {"is_active": True}
    if deity_id:
        query["deity_id"] = deity_id
    if type:
        query["type"] = type
    if tier:
        query["tier"] = tier
    
    cursor = stotras_collection.find(query, {"_id": 0})
    stotras = await cursor.to_list(length=50)
    return {"status": "ok", "data": stotras, "count": len(stotras)}


# ===================== DAILY SCHEDULE ROUTES =====================

@router.get("/devotional/daily-schedule")
async def get_daily_schedule():
    """Get daily worship schedule"""
    cursor = daily_schedule_collection.find({}, {"_id": 0})
    schedule = await cursor.to_list(length=7)
    return {"status": "ok", "data": schedule}


@router.get("/devotional/today")
async def get_today_devotional():
    """Get today's recommended deity and mantras based on day of week"""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today = days[datetime.now().weekday()]
    
    # Get today's schedule
    schedule = await daily_schedule_collection.find_one({"day": today}, {"_id": 0})
    if not schedule:
        return {"status": "ok", "data": None}
    
    # Get primary deity details
    deity = await deities_collection.find_one({"id": schedule.get("primary_deity")}, {"_id": 0})
    
    # Get mantras for the deity
    cursor = mantras_collection.find(
        {"deity_id": schedule.get("primary_deity"), "tier": "free"}, 
        {"_id": 0}
    ).limit(3)
    mantras = await cursor.to_list(length=3)
    
    return {
        "status": "ok",
        "data": {
            "day": today,
            "day_hindi": schedule.get("day_hindi"),
            "color": schedule.get("color"),
            "planet": schedule.get("planet"),
            "deity": deity,
            "mantras": mantras
        }
    }


# ===================== SCRIPTURES ROUTES =====================

@router.get("/scriptures")
async def get_all_scriptures():
    """Get all available scriptures with their metadata"""
    try:
        cursor = scriptures_collection.find({"is_active": True}, {"_id": 0})
        scriptures = await cursor.to_list(length=20)
        return {"status": "ok", "data": scriptures, "count": len(scriptures)}
    except Exception as e:
        print(f"ERROR fetching scriptures: {e}")
        return {"status": "error", "message": str(e), "data": []}


@router.get("/scriptures/{scripture_id}")
async def get_scripture_details(scripture_id: str):
    """Get detailed info about a specific scripture including sections"""
    try:
        scripture = await scriptures_collection.find_one(
            {"scripture_id": scripture_id, "is_active": True}, 
            {"_id": 0}
        )
        if not scripture:
            raise HTTPException(status_code=404, detail="Scripture not found")
        
        # Get unique sections for this scripture
        pipeline = [
            {"$match": {"scripture_id": scripture_id}},
            {"$group": {
                "_id": "$section_num",
                "section_name": {"$first": "$section_name"},
                "section_name_hindi": {"$first": "$section_name_hindi"},
                "section_type": {"$first": "$section_type"},
                "verse_count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        cursor = scripture_verses_collection.aggregate(pipeline)
        sections = []
        async for section in cursor:
            sections.append({
                "section_num": section["_id"],
                "section_name": section.get("section_name", f"Section {section['_id']}"),
                "section_name_hindi": section.get("section_name_hindi", ""),
                "section_type": section.get("section_type", "section"),
                "verse_count": section["verse_count"]
            })
        
        scripture["sections"] = sections
        return {"status": "ok", "data": scripture}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR fetching scripture details: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/scriptures/{scripture_id}/sections/{section_num}")
async def get_scripture_section(
    scripture_id: str, 
    section_num: int,
    skip: int = 0,
    limit: int = 50
):
    """Get verses from a specific section of a scripture"""
    try:
        scripture = await scriptures_collection.find_one(
            {"scripture_id": scripture_id, "is_active": True}
        )
        if not scripture:
            raise HTTPException(status_code=404, detail="Scripture not found")
        
        query = {"scripture_id": scripture_id, "section_num": section_num}
        total = await scripture_verses_collection.count_documents(query)
        
        # Build sort order based on scripture type
        sort_fields = [("verse_num", 1)]
        if scripture_id in ["valmiki_ramayana"]:
            sort_fields = [("sarga_num", 1), ("verse_num", 1)]
        elif scripture_id == "mahabharata":
            sort_fields = [("chapter_num", 1), ("verse_num", 1)]
        
        cursor = scripture_verses_collection.find(
            query, {"_id": 0}
        ).sort(sort_fields).skip(skip).limit(limit)
        
        verses = await cursor.to_list(length=limit)
        
        section_info = None
        if verses:
            section_info = {
                "section_num": verses[0].get("section_num"),
                "section_name": verses[0].get("section_name"),
                "section_name_hindi": verses[0].get("section_name_hindi", ""),
                "section_type": verses[0].get("section_type")
            }
        
        return {
            "status": "ok",
            "data": {
                "scripture_id": scripture_id,
                "scripture_name": scripture.get("name"),
                "section": section_info,
                "verses": verses,
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": skip + len(verses) < total
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR fetching section: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/scriptures/{scripture_id}/search")
async def search_scripture(
    scripture_id: str,
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = 50
):
    """Search within a specific scripture"""
    try:
        scripture = await scriptures_collection.find_one(
            {"scripture_id": scripture_id, "is_active": True}
        )
        if not scripture:
            raise HTTPException(status_code=404, detail="Scripture not found")
        
        query = {
            "scripture_id": scripture_id,
            "text": {"$regex": q, "$options": "i"}
        }
        
        cursor = scripture_verses_collection.find(query, {"_id": 0}).limit(limit)
        results = await cursor.to_list(length=limit)
        
        return {
            "status": "ok",
            "data": {
                "scripture_id": scripture_id,
                "query": q,
                "results": results,
                "count": len(results)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR searching scripture: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/scriptures/verse/random")
async def get_random_verse(scripture_id: Optional[str] = None):
    """Get a random verse, optionally from a specific scripture"""
    try:
        match_stage = {}
        if scripture_id:
            match_stage["scripture_id"] = scripture_id
        
        pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {"$sample": {"size": 1}},
            {"$project": {"_id": 0}}
        ]
        
        cursor = scripture_verses_collection.aggregate(pipeline)
        results = await cursor.to_list(length=1)
        
        if not results:
            return {"status": "ok", "data": None}
        
        verse = results[0]
        
        # Get scripture name
        scripture = await scriptures_collection.find_one(
            {"scripture_id": verse.get("scripture_id")},
            {"_id": 0, "name": 1, "name_hindi": 1}
        )
        
        if scripture:
            verse["scripture_name"] = scripture.get("name")
            verse["scripture_name_hindi"] = scripture.get("name_hindi")
        
        return {"status": "ok", "data": verse}
    except Exception as e:
        print(f"ERROR getting random verse: {e}")
        return {"status": "error", "message": str(e)}
