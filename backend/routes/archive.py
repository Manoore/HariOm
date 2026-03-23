"""
Internet Archive / Vedic Audio Library Routes
Handles Vedic mantras, shlokas, and audio from Internet Archive
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import httpx

from database import audio_library_collection

router = APIRouter(prefix="/api", tags=["Archive"])

# Comprehensive Vedic Audio Library - Organized by Category
VEDIC_AUDIO_LIBRARY = {
    "VEDAS": [
        {"id": "rigveda", "title": "Rigveda", "search_query": "rigveda chanting"},
        {"id": "yajurveda", "title": "Yajurveda", "search_query": "yajurveda chanting"},
        {"id": "samaveda", "title": "Samaveda", "search_query": "samaveda chanting"},
        {"id": "atharvaveda", "title": "Atharvaveda", "search_query": "atharvaveda chanting"},
    ],
    "MUKHYA UPANISHADS": [
        {"id": "isha-upanishad", "title": "Isha Upanishad", "search_query": "isha upanishad"},
        {"id": "kena-upanishad", "title": "Kena Upanishad", "search_query": "kena upanishad"},
        {"id": "katha-upanishad", "title": "Katha Upanishad", "search_query": "katha upanishad"},
        {"id": "prashna-upanishad", "title": "Prashna Upanishad", "search_query": "prashna upanishad"},
        {"id": "mundaka-upanishad", "title": "Mundaka Upanishad", "search_query": "mundaka upanishad"},
        {"id": "mandukya-upanishad", "title": "Mandukya Upanishad", "search_query": "mandukya upanishad"},
        {"id": "taittiriya-upanishad", "title": "Taittiriya Upanishad", "search_query": "taittiriya upanishad"},
        {"id": "aitareya-upanishad", "title": "Aitareya Upanishad", "search_query": "aitareya upanishad"},
        {"id": "chandogya-upanishad", "title": "Chandogya Upanishad", "search_query": "chandogya upanishad"},
        {"id": "brihadaranyaka-upanishad", "title": "Brihadaranyaka Upanishad", "search_query": "brihadaranyaka upanishad"},
    ],
    "MINOR UPANISHADS": [
        {"id": "shvetashvatara-upanishad", "title": "Shvetashvatara Upanishad", "search_query": "shvetashvatara upanishad"},
        {"id": "kaushitaki-upanishad", "title": "Kaushitaki Upanishad", "search_query": "kaushitaki upanishad"},
        {"id": "maitri-upanishad", "title": "Maitri (Maitrayani) Upanishad", "search_query": "maitri upanishad"},
        {"id": "kaivalya-upanishad", "title": "Kaivalya Upanishad", "search_query": "kaivalya upanishad"},
        {"id": "jabala-upanishad", "title": "Jabala Upanishad", "search_query": "jabala upanishad"},
    ],
    "VEDIC SUKTAS": [
        {"id": "purusha-sukta", "title": "Purusha Sukta", "search_query": "purusha sukta"},
        {"id": "nasadiya-sukta", "title": "Nasadiya Sukta", "search_query": "nasadiya sukta"},
        {"id": "sri-sukta", "title": "Sri Sukta", "search_query": "sri sukta lakshmi"},
        {"id": "devi-sukta", "title": "Devi Sukta", "search_query": "devi sukta"},
        {"id": "medha-sukta", "title": "Medha Sukta", "search_query": "medha sukta"},
        {"id": "durga-sukta", "title": "Durga Sukta", "search_query": "durga sukta"},
        {"id": "narayana-sukta", "title": "Narayana Sukta", "search_query": "narayana sukta"},
        {"id": "vishnu-sukta", "title": "Vishnu Sukta", "search_query": "vishnu sukta"},
        {"id": "ratri-sukta", "title": "Ratri Sukta", "search_query": "ratri sukta"},
        {"id": "bhagya-sukta", "title": "Bhagya Sukta", "search_query": "bhagya sukta"},
        {"id": "manyu-sukta", "title": "Manyu Sukta", "search_query": "manyu sukta"},
    ],
    "MAHAVAKYAS": [
        {"id": "prajnanam-brahma", "title": "Prajnanam Brahma", "search_query": "prajnanam brahma"},
        {"id": "tat-tvam-asi", "title": "Tat Tvam Asi", "search_query": "tat tvam asi"},
        {"id": "ayam-atma-brahma", "title": "Ayam Atma Brahma", "search_query": "ayam atma brahma"},
        {"id": "aham-brahmasmi", "title": "Aham Brahmasmi", "search_query": "aham brahmasmi"},
    ],
    "ESSENTIAL DAILY MANTRAS": [
        {"id": "pranava-mantra", "title": "Pranava Mantra (Om)", "search_query": "om mantra chanting"},
        {"id": "gayatri-mantra", "title": "Gayatri Mantra", "search_query": "gayatri mantra"},
        {"id": "mahamrityunjaya", "title": "Mahamrityunjaya Mantra", "search_query": "mahamrityunjaya mantra"},
        {"id": "shanti-mantra", "title": "Shanti Mantra (Sahana Vavatu)", "search_query": "sahana vavatu shanti mantra"},
        {"id": "asato-ma", "title": "Asato Ma Sadgamaya (Pavamana Mantra)", "search_query": "asato ma sadgamaya"},
        {"id": "om-namah-shivaya", "title": "Om Namah Shivaya (Panchakshari)", "search_query": "om namah shivaya"},
        {"id": "om-namo-narayanaya", "title": "Om Namo Narayanaya (Ashtakshari)", "search_query": "om namo narayanaya"},
        {"id": "om-namo-bhagavate", "title": "Om Namo Bhagavate Vasudevaya", "search_query": "om namo bhagavate vasudevaya"},
        {"id": "hare-krishna", "title": "Hare Krishna Mahamantra", "search_query": "hare krishna mahamantra"},
    ],
    "GANESH MANTRAS": [
        {"id": "vakratunda", "title": "Vakratunda Mahakaya", "search_query": "vakratunda mahakaya"},
        {"id": "ganesh-gayatri", "title": "Ganesh Gayatri", "search_query": "ganesh gayatri mantra"},
    ],
    "SHIVA MANTRAS": [
        {"id": "shiva-panchakshari", "title": "Shiva Panchakshari Stotram", "search_query": "shiva panchakshari stotram"},
        {"id": "shantakaram", "title": "Shantakaram Bhujagashayanam", "search_query": "shantakaram bhujagashayanam"},
    ],
    "VISHNU MANTRAS": [
        {"id": "vishnu-shanti", "title": "Vishnu Shanti Mantra", "search_query": "vishnu shanti mantra"},
        {"id": "mangalam-bhagwan", "title": "Mangalam Bhagwan Vishnu", "search_query": "mangalam bhagwan vishnu"},
    ],
    "LAKSHMI MANTRAS": [
        {"id": "mahalakshmi-mantra", "title": "Mahalakshmi Mantra (Om Shreem)", "search_query": "om shreem mahalakshmi"},
        {"id": "lakshmi-gayatri", "title": "Lakshmi Gayatri", "search_query": "lakshmi gayatri mantra"},
    ],
    "SARASWATI MANTRAS": [
        {"id": "saraswati-vandana", "title": "Saraswati Vandana (Ya Kundendu)", "search_query": "ya kundendu saraswati"},
        {"id": "saraswati-gayatri", "title": "Saraswati Gayatri", "search_query": "saraswati gayatri"},
        {"id": "saraswati-beeja", "title": "Saraswati Beeja Mantra (Om Aim)", "search_query": "om aim saraswati"},
    ],
    "HANUMAN MANTRAS": [
        {"id": "hanuman-moola", "title": "Hanuman Moola Mantra", "search_query": "hanuman moola mantra"},
        {"id": "hanuman-gayatri", "title": "Hanuman Gayatri", "search_query": "hanuman gayatri"},
    ],
    "NAVAGRAHA MANTRAS": [
        {"id": "surya-mantra", "title": "Surya Mantra", "search_query": "surya mantra"},
        {"id": "chandra-mantra", "title": "Chandra Mantra", "search_query": "chandra mantra"},
        {"id": "mangala-mantra", "title": "Mangala Mantra", "search_query": "mangal mantra mars"},
        {"id": "budha-mantra", "title": "Budha Mantra", "search_query": "budha mantra mercury"},
        {"id": "guru-mantra", "title": "Guru Mantra", "search_query": "guru mantra jupiter brihaspati"},
        {"id": "shukra-mantra", "title": "Shukra Mantra", "search_query": "shukra mantra venus"},
        {"id": "shani-mantra", "title": "Shani Mantra", "search_query": "shani mantra saturn"},
        {"id": "rahu-mantra", "title": "Rahu Mantra", "search_query": "rahu mantra"},
        {"id": "ketu-mantra", "title": "Ketu Mantra", "search_query": "ketu mantra"},
    ],
    "DAILY SHLOKAS": [
        {"id": "karagre-vasate", "title": "Karagre Vasate Lakshmi", "search_query": "karagre vasate lakshmi"},
        {"id": "deepa-jyoti", "title": "Deepa Jyoti Parabrahma", "search_query": "deepa jyoti parabrahma"},
        {"id": "shanti-path", "title": "Shanti Path (Om Dyauh Shantir)", "search_query": "om dyauh shantir"},
        {"id": "sarve-bhavantu", "title": "Sarve Bhavantu Sukhinah", "search_query": "sarve bhavantu sukhinah"},
        {"id": "annapurna-stotram", "title": "Annapurna Stotram", "search_query": "annapurna stotram"},
        {"id": "guru-stotram", "title": "Guru Stotram (Gurur Brahma)", "search_query": "gurur brahma guru stotram"},
        {"id": "hayagriva-shloka", "title": "Hayagriva Shloka", "search_query": "hayagriva shloka"},
    ],
    "PHILOSOPHICAL SHLOKAS": [
        {"id": "karmanye-vadhikaraste", "title": "Karmanye Vadhikaraste (Gita 2.47)", "search_query": "karmanye vadhikaraste gita"},
        {"id": "yada-yada-hi", "title": "Yada Yada Hi Dharmasya (Gita 4.7-8)", "search_query": "yada yada hi dharmasya"},
        {"id": "vasudhaiva-kutumbakam", "title": "Vasudhaiva Kutumbakam", "search_query": "vasudhaiva kutumbakam"},
        {"id": "satyameva-jayate", "title": "Satyameva Jayate", "search_query": "satyameva jayate"},
        {"id": "kshamapana-stotram", "title": "Kshamapana Stotram", "search_query": "kshamapana stotram"},
    ],
    "POWERFUL STOTRAS": [
        {"id": "vishnu-sahasranamam", "title": "Vishnu Sahasranamam", "search_query": "vishnu sahasranamam"},
        {"id": "lalitha-sahasranamam", "title": "Lalitha Sahasranamam", "search_query": "lalitha sahasranamam"},
        {"id": "aditya-hridayam", "title": "Aditya Hridayam", "search_query": "aditya hridayam"},
        {"id": "hanuman-chalisa", "title": "Hanuman Chalisa", "search_query": "hanuman chalisa"},
        {"id": "rudram-chamakam", "title": "Rudram Chamakam", "search_query": "rudram chamakam"},
        {"id": "durga-saptashati", "title": "Durga Saptashati", "search_query": "durga saptashati"},
        {"id": "soundarya-lahari", "title": "Soundarya Lahari", "search_query": "soundarya lahari"},
    ],
    "POOJA RITUAL MANTRAS": [
        {"id": "achamanam", "title": "Achamanam Mantras", "search_query": "achamanam mantra"},
        {"id": "sankalpam", "title": "Sankalpam Mantra", "search_query": "sankalpam mantra"},
        {"id": "kalasha-sthapana", "title": "Kalasha Sthapana Mantra", "search_query": "kalasha sthapana"},
        {"id": "ganapati-avahana", "title": "Ganapati Avahana Mantra", "search_query": "ganapati avahana"},
        {"id": "prana-pratishtha", "title": "Prana Pratishtha Mantra", "search_query": "prana pratishtha"},
        {"id": "shodasopachara", "title": "Shodasopachara", "search_query": "shodasopachara puja"},
        {"id": "aarti-mantras", "title": "Aarti Mantras", "search_query": "aarti mantra"},
        {"id": "mangala-harati", "title": "Mangala Harati", "search_query": "mangala harati"},
        {"id": "pushpanjali", "title": "Pushpanjali Mantra", "search_query": "pushpanjali mantra"},
        {"id": "visarjana", "title": "Visarjana Mantra", "search_query": "visarjana mantra"},
    ],
    "KEY SECTIONS FROM EPICS": [
        {"id": "bhagavad-gita", "title": "Bhagavad Gita", "search_query": "bhagavad gita chanting"},
        {"id": "sundara-kanda", "title": "Sundara Kanda", "search_query": "sundara kanda"},
        {"id": "devi-mahatmyam", "title": "Durga Saptashati (Devi Mahatmyam)", "search_query": "devi mahatmyam"},
        {"id": "narayaneeyam", "title": "Narayaneeyam", "search_query": "narayaneeyam"},
    ],
}

@router.get("/archive/library")
async def get_vedic_library():
    """Get the complete Vedic audio library organized by category"""
    # Check if we have items in the database
    count = await audio_library_collection.count_documents({"is_active": True})
    
    if count == 0:
        # Seed from hardcoded data
        for category, items in VEDIC_AUDIO_LIBRARY.items():
            for item in items:
                doc = {
                    "item_id": item["id"],
                    "title": item["title"],
                    "search_query": item["search_query"],
                    "category": category,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc)
                }
                try:
                    await audio_library_collection.insert_one(doc)
                except:
                    pass  # Skip duplicates
    
    # Fetch from database grouped by category
    cursor = audio_library_collection.find({"is_active": True}).sort([("category", 1), ("title", 1)])
    
    library = {}
    async for item in cursor:
        cat = item.get("category", "UNCATEGORIZED")
        if cat not in library:
            library[cat] = []
        library[cat].append({
            "id": item.get("item_id"),
            "title": item.get("title"),
            "search_query": item.get("search_query")
        })
    
    return {"status": "ok", "data": library}

@router.get("/archive/play/{item_id}")
async def get_audio_for_item(item_id: str):
    """Search Internet Archive for audio matching the item and return playable URL"""
    # Find the item in database first
    item = await audio_library_collection.find_one({"item_id": item_id, "is_active": True})
    
    if item:
        search_query = item.get("search_query")
        item_title = item.get("title")
    else:
        # Fallback to hardcoded library
        search_query = None
        item_title = None
        for category, items in VEDIC_AUDIO_LIBRARY.items():
            for i in items:
                if i["id"] == item_id:
                    search_query = i["search_query"]
                    item_title = i["title"]
                    break
            if search_query:
                break
    
    if not search_query:
        raise HTTPException(status_code=404, detail="Item not found")
    
    try:
        # Search Internet Archive
        search_url = f"https://archive.org/advancedsearch.php?q={search_query}+mediatype:audio&fl=identifier,title&rows=1&output=json"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(search_url, timeout=10.0)
            data = response.json()
        
        docs = data.get("response", {}).get("docs", [])
        
        if not docs:
            raise HTTPException(status_code=404, detail="No audio found for this item")
        
        identifier = docs[0].get("identifier")
        
        # Get metadata for the first result
        metadata_url = f"https://archive.org/metadata/{identifier}"
        async with httpx.AsyncClient() as client:
            meta_response = await client.get(metadata_url, timeout=10.0)
            meta_data = meta_response.json()
        
        # Find MP3 files
        files = meta_data.get("files", [])
        audio_files = []
        
        for f in files:
            name = f.get("name", "")
            format_type = f.get("format", "")
            if name.endswith(".mp3") or format_type in ["VBR MP3", "MP3", "128Kbps MP3"]:
                audio_files.append({
                    "name": name,
                    "url": f"https://archive.org/download/{identifier}/{name}",
                    "format": format_type
                })
        
        if not audio_files:
            raise HTTPException(status_code=404, detail="No playable audio files found")
        
        return {
            "status": "ok",
            "item_id": item_id,
            "title": item_title,
            "identifier": identifier,
            "archive_title": docs[0].get("title"),
            "audio_url": audio_files[0]["url"],
            "all_files": audio_files
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching audio: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch audio: {str(e)}")

@router.get("/archive/metadata/{identifier}")
async def get_archive_metadata(identifier: str):
    """Get metadata and audio files for an Internet Archive item"""
    try:
        metadata_url = f"https://archive.org/metadata/{identifier}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(metadata_url, timeout=10.0)
            data = response.json()
        
        # Extract audio files (MP3 preferred)
        files = data.get("files", [])
        audio_files = []
        
        for f in files:
            name = f.get("name", "")
            format_type = f.get("format", "")
            
            # Look for MP3 files
            if name.endswith(".mp3") or format_type in ["VBR MP3", "MP3", "128Kbps MP3"]:
                audio_files.append({
                    "name": name,
                    "format": format_type,
                    "size": f.get("size", ""),
                    "length": f.get("length", ""),
                    "url": f"https://archive.org/download/{identifier}/{name}"
                })
        
        metadata = data.get("metadata", {})
        
        return {
            "status": "ok",
            "identifier": identifier,
            "title": metadata.get("title", "Unknown"),
            "creator": metadata.get("creator", "Unknown"),
            "description": metadata.get("description", ""),
            "thumbnail": f"https://archive.org/services/img/{identifier}",
            "page_url": f"https://archive.org/details/{identifier}",
            "embed_url": f"https://archive.org/embed/{identifier}",
            "audio_files": audio_files
        }
    except Exception as e:
        print(f"Archive metadata error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get metadata: {str(e)}")

# Video Library routes moved to routes/video_library.py

# Panchang & Festival routes moved to routes/panchang.py

# Helper functions moved to routes/panchang.py

# Month panchang and festival routes moved to routes/panchang.py

