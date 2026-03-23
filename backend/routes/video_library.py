"""
Video Library Routes
Handles devotional YouTube video library
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone

from database import video_library_collection

router = APIRouter(prefix="/api", tags=["Video Library"])

# Curated devotional YouTube channels and playlists - VERIFIED WORKING VIDEOS
DEVOTIONAL_VIDEO_LIBRARY = {
    "bhajans": [
        {"video_id": "AETFvQonfV8", "title": "Hanuman Chalisa - Hariharan", "artist": "T-Series Bhakti Sagar", "duration": "8:51", "thumbnail": "https://img.youtube.com/vi/AETFvQonfV8/mqdefault.jpg"},
        {"video_id": "0gc-vG2P7k8", "title": "Shree Hanuman Chalisa - Rasraj Ji Maharaj", "artist": "T-Series Bhakti Sagar", "duration": "9:40", "thumbnail": "https://img.youtube.com/vi/0gc-vG2P7k8/mqdefault.jpg"},
        {"video_id": "4k3ZRQ5Hi6c", "title": "Morning Bhakti Bhajans - Anuradha Paudwal", "artist": "T-Series Bhakti Sagar", "duration": "1:02:33", "thumbnail": "https://img.youtube.com/vi/4k3ZRQ5Hi6c/mqdefault.jpg"},
        {"video_id": "u74fLskHMlg", "title": "Best of 2025 Devi Bhajans - Sonu Nigam", "artist": "T-Series Bhakti Sagar", "duration": "51:20", "thumbnail": "https://img.youtube.com/vi/u74fLskHMlg/mqdefault.jpg"},
        {"video_id": "eugBGS2QjwQ", "title": "Kismat Ko Badalte Dekha - Latest Bhajans 2025", "artist": "T-Series Bhakti Sagar", "duration": "52:15", "thumbnail": "https://img.youtube.com/vi/eugBGS2QjwQ/mqdefault.jpg"},
    ],
    "aarti": [
        {"video_id": "Kbm4gwDcI0k", "title": "Om Jai Jagdish Hare - Full Aarti", "artist": "T-Series Bhakti Sagar", "duration": "5:43", "thumbnail": "https://img.youtube.com/vi/Kbm4gwDcI0k/mqdefault.jpg"},
        {"video_id": "hPl8gNNdJes", "title": "Jai Ganesh Deva Aarti - Anuradha Paudwal", "artist": "T-Series Bhakti Sagar", "duration": "4:37", "thumbnail": "https://img.youtube.com/vi/hPl8gNNdJes/mqdefault.jpg"},
        {"video_id": "y-3L5FJMsAY", "title": "Om Jai Laxmi Mata - Full Aarti", "artist": "T-Series Bhakti Sagar", "duration": "5:33", "thumbnail": "https://img.youtube.com/vi/y-3L5FJMsAY/mqdefault.jpg"},
        {"video_id": "LDNJXUdy5wE", "title": "Om Jai Shiv Omkara - Full Aarti", "artist": "T-Series Bhakti Sagar", "duration": "6:45", "thumbnail": "https://img.youtube.com/vi/LDNJXUdy5wE/mqdefault.jpg"},
        {"video_id": "ScBmn8kNRUU", "title": "Aarti Kunj Bihari Ki - Krishna Aarti", "artist": "T-Series Bhakti Sagar", "duration": "4:32", "thumbnail": "https://img.youtube.com/vi/ScBmn8kNRUU/mqdefault.jpg"},
    ],
    "mantras": [
        {"video_id": "qLBdhNdpBao", "title": "Gayatri Mantra 108 Times - Powerful", "artist": "T-Series Bhakti Sagar", "duration": "55:20", "thumbnail": "https://img.youtube.com/vi/qLBdhNdpBao/mqdefault.jpg"},
        {"video_id": "NHVt4r8G6_c", "title": "Mahamrityunjaya Mantra 108 Times", "artist": "T-Series Bhakti Sagar", "duration": "52:02", "thumbnail": "https://img.youtube.com/vi/NHVt4r8G6_c/mqdefault.jpg"},
        {"video_id": "W-fLuSANdJM", "title": "Om Namah Shivaya - Peaceful Chanting", "artist": "T-Series Bhakti Sagar", "duration": "28:43", "thumbnail": "https://img.youtube.com/vi/W-fLuSANdJM/mqdefault.jpg"},
        {"video_id": "EQ5fHdVLbxA", "title": "Ganesh Mantra - Om Gan Ganpataye Namo Namah", "artist": "T-Series Bhakti Sagar", "duration": "30:15", "thumbnail": "https://img.youtube.com/vi/EQ5fHdVLbxA/mqdefault.jpg"},
        {"video_id": "JfFcEMEjJUE", "title": "Lakshmi Mantra - Om Shreem Mahalakshmiyei", "artist": "T-Series Bhakti Sagar", "duration": "28:50", "thumbnail": "https://img.youtube.com/vi/JfFcEMEjJUE/mqdefault.jpg"},
    ],
    "kirtans": [
        {"video_id": "EW5ypgVcYhM", "title": "Hare Krishna Mahamantra - ISKCON", "artist": "ISKCON", "duration": "15:30", "thumbnail": "https://img.youtube.com/vi/EW5ypgVcYhM/mqdefault.jpg"},
        {"video_id": "qAu4RnfZ_ac", "title": "Radhe Radhe Japo Chale Aayenge Bihari", "artist": "T-Series Bhakti Sagar", "duration": "7:02", "thumbnail": "https://img.youtube.com/vi/qAu4RnfZ_ac/mqdefault.jpg"},
        {"video_id": "BBdTlHqtBXk", "title": "Shri Krishna Govind Hare Murari", "artist": "T-Series Bhakti Sagar", "duration": "28:11", "thumbnail": "https://img.youtube.com/vi/BBdTlHqtBXk/mqdefault.jpg"},
        {"video_id": "pCaY-2z0joY", "title": "Raghupati Raghav Raja Ram", "artist": "T-Series Bhakti Sagar", "duration": "27:30", "thumbnail": "https://img.youtube.com/vi/pCaY-2z0joY/mqdefault.jpg"},
    ],
    "spiritual_talks": [
        {"video_id": "EphUHp3hd10", "title": "How to Live Peacefully - Sadhguru", "artist": "Sadhguru", "duration": "18:47", "thumbnail": "https://img.youtube.com/vi/EphUHp3hd10/mqdefault.jpg"},
        {"video_id": "AHZ2yi-xbKs", "title": "The Secret of Karma - Sadhguru", "artist": "Sadhguru", "duration": "12:32", "thumbnail": "https://img.youtube.com/vi/AHZ2yi-xbKs/mqdefault.jpg"},
        {"video_id": "mCGdwAgR0Qc", "title": "How to Meditate - Sri Sri Ravi Shankar", "artist": "Art of Living", "duration": "15:15", "thumbnail": "https://img.youtube.com/vi/mCGdwAgR0Qc/mqdefault.jpg"},
    ],
    "chalisas": [
        {"video_id": "AETFvQonfV8", "title": "Shri Hanuman Chalisa - Hariharan", "artist": "T-Series Bhakti Sagar", "duration": "8:51", "thumbnail": "https://img.youtube.com/vi/AETFvQonfV8/mqdefault.jpg"},
        {"video_id": "HiLmUZaJw0w", "title": "Shiv Chalisa - Anuradha Paudwal", "artist": "T-Series Bhakti Sagar", "duration": "10:55", "thumbnail": "https://img.youtube.com/vi/HiLmUZaJw0w/mqdefault.jpg"},
        {"video_id": "uGgYxIKB03g", "title": "Durga Chalisa - Anuradha Paudwal", "artist": "T-Series Bhakti Sagar", "duration": "8:37", "thumbnail": "https://img.youtube.com/vi/uGgYxIKB03g/mqdefault.jpg"},
        {"video_id": "WyHFSjN0miU", "title": "Ganesh Chalisa - Anuradha Paudwal", "artist": "T-Series Bhakti Sagar", "duration": "9:08", "thumbnail": "https://img.youtube.com/vi/WyHFSjN0miU/mqdefault.jpg"},
        {"video_id": "otWnO-2pwuM", "title": "Lakshmi Chalisa - Anuradha Paudwal", "artist": "T-Series Bhakti Sagar", "duration": "9:51", "thumbnail": "https://img.youtube.com/vi/otWnO-2pwuM/mqdefault.jpg"},
        {"video_id": "-8JHyhZTwvY", "title": "Saraswati Chalisa - Anuradha Paudwal", "artist": "T-Series Bhakti Sagar", "duration": "9:36", "thumbnail": "https://img.youtube.com/vi/-8JHyhZTwvY/mqdefault.jpg"},
    ]
}


@router.get("/video-library")
async def get_video_library():
    """Get all devotional videos organized by category"""
    try:
        # Check if we have videos in database
        count = await video_library_collection.count_documents({"is_active": True})
        
        if count == 0:
            # Seed from default library
            for category, videos in DEVOTIONAL_VIDEO_LIBRARY.items():
                for video in videos:
                    doc = {
                        "video_id": video["video_id"],
                        "title": video["title"],
                        "artist": video.get("artist", "Unknown"),
                        "duration": video.get("duration", ""),
                        "thumbnail": video.get("thumbnail", f"https://img.youtube.com/vi/{video['video_id']}/mqdefault.jpg"),
                        "category": category,
                        "is_active": True,
                        "created_at": datetime.now(timezone.utc)
                    }
                    # Check if already exists
                    existing = await video_library_collection.find_one({"video_id": video["video_id"]})
                    if not existing:
                        await video_library_collection.insert_one(doc)
        
        # Fetch from database
        cursor = video_library_collection.find({"is_active": True}).sort([("category", 1), ("title", 1)])
        videos = await cursor.to_list(length=200)
        
        # Organize by category
        library = {}
        for video in videos:
            category = video.get("category", "other")
            if category not in library:
                library[category] = []
            library[category].append({
                "video_id": video["video_id"],
                "title": video["title"],
                "artist": video.get("artist", "Unknown"),
                "duration": video.get("duration", ""),
                "thumbnail": video.get("thumbnail", f"https://img.youtube.com/vi/{video['video_id']}/mqdefault.jpg"),
                "category": category
            })
        
        return {"status": "ok", "data": library}
    except Exception as e:
        print(f"Error fetching video library: {e}")
        # Return default library on error
        return {"status": "ok", "data": DEVOTIONAL_VIDEO_LIBRARY}


@router.get("/video-library/categories")
async def get_video_categories():
    """Get video library categories with counts"""
    try:
        pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        cursor = video_library_collection.aggregate(pipeline)
        categories = []
        async for doc in cursor:
            categories.append({
                "category": doc["_id"],
                "count": doc["count"],
                "label": doc["_id"].replace("_", " ").title()
            })
        
        if not categories:
            # Return default categories
            categories = [
                {"category": "bhajans", "count": 5, "label": "Bhajans"},
                {"category": "aarti", "count": 5, "label": "Aarti"},
                {"category": "mantras", "count": 5, "label": "Mantras"},
                {"category": "kirtans", "count": 4, "label": "Kirtans"},
                {"category": "spiritual_talks", "count": 3, "label": "Spiritual Talks"},
                {"category": "chalisas", "count": 5, "label": "Chalisas"}
            ]
        
        return {"status": "ok", "data": categories}
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/video-library/add")
async def add_video_to_library(request: Request):
    """Admin: Add a new video to the library"""
    try:
        body = await request.json()
        video_id = body.get("video_id")
        title = body.get("title")
        category = body.get("category", "bhajans")
        artist = body.get("artist", "Unknown")
        
        if not video_id or not title:
            raise HTTPException(status_code=400, detail="video_id and title are required")
        
        # Check if already exists
        existing = await video_library_collection.find_one({"video_id": video_id})
        if existing:
            raise HTTPException(status_code=400, detail="Video already exists")
        
        doc = {
            "video_id": video_id,
            "title": title,
            "artist": artist,
            "category": category,
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        
        await video_library_collection.insert_one(doc)
        return {"status": "ok", "message": "Video added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding video: {e}")
        raise HTTPException(status_code=500, detail=str(e))
