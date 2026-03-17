from fastapi import FastAPI, HTTPException, Depends, Request, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from pydantic import BaseModel
import os
import httpx

from dotenv import load_dotenv
load_dotenv()

from database import (
    init_db, users_collection, priests_collection, astrologers_collection,
    shops_collection, products_collection, bookings_collection, orders_collection,
    payment_transactions_collection, cart_collection, reviews_collection,
    festivals_collection, temples_collection,
    deities_collection, mantras_collection, stotras_collection, daily_schedule_collection
)
from models import (
    UserCreate, UserLogin, UserResponse, UserUpdate, UserRole,
    PriestCreate, PriestResponse, PriestService,
    BookingCreate, BookingResponse, BookingStatus,
    ShopCreate, ProductCreate, ProductResponse,
    CartItem, OrderCreate, OrderResponse, OrderStatus,
    BirthDetails, HoroscopeResponse,
    AstrologerCreate, AstrologerResponse,
    ReviewCreate, PaymentCreate
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_optional_user, require_role
)
from horoscope_service import get_daily_horoscope as local_daily_horoscope, generate_birth_chart, get_zodiac_sign
from config import settings
import prokerala

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_initial_data()
    yield

app = FastAPI(title="Divine App API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================== FILE UPLOADS SETUP =====================
import uuid
import shutil
from pathlib import Path

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.post("/api/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload an image file and return the URL"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Get the base URL from environment or construct it
    backend_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    if not backend_url:
        backend_url = "https://temple-hub-7.preview.emergentagent.com"
    
    # Return the URL
    image_url = f"{backend_url}/api/uploads/{unique_filename}"
    
    return {"url": image_url, "filename": unique_filename}

@app.get("/api/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    from fastapi.responses import FileResponse
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@app.post("/api/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload a video file and return the URL"""
    # Validate file type
    allowed_types = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only MP4, WebM, MOV, AVI, and MPEG are allowed.")
    
    # Validate file size (max 50MB)
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
    unique_filename = f"video_{uuid.uuid4()}.{ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Get the base URL from environment or construct it
    backend_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    if not backend_url:
        backend_url = "https://temple-hub-7.preview.emergentagent.com"
    
    # Return the URL
    video_url = f"{backend_url}/api/uploads/{unique_filename}"
    
    return {"url": video_url, "filename": unique_filename}

# ===================== SEED DATA =====================
async def seed_initial_data():
    """Seed initial data if database is empty"""
    # Check if data exists
    if await users_collection.count_documents({}) > 0:
        return
    
    # Create admin user
    admin_data = {
        "email": "admin@divineapp.com",
        "password": get_password_hash("admin123"),
        "name": "Admin",
        "role": UserRole.ADMIN,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc)
    }
    admin_result = await users_collection.insert_one(admin_data)
    
    # Create sample priests
    priest_users = [
        {"email": "pandit.sharma@divineapp.com", "name": "Pandit Ramesh Sharma", "role": UserRole.PRIEST},
        {"email": "pandit.gupta@divineapp.com", "name": "Pandit Suresh Gupta", "role": UserRole.PRIEST},
        {"email": "pandit.iyer@divineapp.com", "name": "Pandit Venkatesh Iyer", "role": UserRole.PRIEST},
    ]
    
    priest_data = [
        {
            "specializations": ["Vedic Rituals", "Satyanarayana Pooja", "Griha Pravesh"],
            "experience_years": 15,
            "languages": ["Hindi", "Sanskrit", "English"],
            "services": [
                {"name": "Satyanarayana Pooja", "description": "Complete Satyanarayana Katha with all rituals", "duration_minutes": 120, "price": 2100.0, "category": "Pooja"},
                {"name": "Griha Pravesh", "description": "Housewarming ceremony with Vastu Pooja", "duration_minutes": 180, "price": 5100.0, "category": "Ceremony"},
                {"name": "Rudrabhishekam", "description": "Sacred abhishekam to Lord Shiva", "duration_minutes": 90, "price": 3100.0, "category": "Pooja"},
            ],
            "bio": "15+ years experience in Vedic rituals. Specialized in North Indian traditions.",
            "rating": 4.8,
            "total_reviews": 127,
            "is_verified": True,
            "available_online": True
        },
        {
            "specializations": ["Navagraha Pooja", "Homam", "Vastu Shanti"],
            "experience_years": 20,
            "languages": ["Hindi", "Sanskrit", "Marathi"],
            "services": [
                {"name": "Navagraha Shanti", "description": "Pooja to pacify all nine planets", "duration_minutes": 150, "price": 4500.0, "category": "Pooja"},
                {"name": "Ganapati Homam", "description": "Fire ritual for Lord Ganesha's blessings", "duration_minutes": 90, "price": 3500.0, "category": "Homam"},
                {"name": "Vastu Shanti", "description": "Vastu correction pooja for home/office", "duration_minutes": 120, "price": 5500.0, "category": "Ceremony"},
            ],
            "bio": "Expert in Homam and fire rituals. 20 years of dedicated service.",
            "rating": 4.9,
            "total_reviews": 203,
            "is_verified": True,
            "available_online": True
        },
        {
            "specializations": ["South Indian Rituals", "Lakshmi Pooja", "Wedding Ceremonies"],
            "experience_years": 18,
            "languages": ["Tamil", "Telugu", "Sanskrit", "English"],
            "services": [
                {"name": "Lakshmi Pooja", "description": "Worship of Goddess Lakshmi for prosperity", "duration_minutes": 90, "price": 2500.0, "category": "Pooja"},
                {"name": "Vivah Sanskar", "description": "Traditional wedding ceremony", "duration_minutes": 240, "price": 15000.0, "category": "Ceremony"},
                {"name": "Ayush Homam", "description": "Fire ritual for long life and health", "duration_minutes": 120, "price": 4000.0, "category": "Homam"},
            ],
            "bio": "South Indian priest specializing in Tamil and Telugu traditions.",
            "rating": 4.7,
            "total_reviews": 156,
            "is_verified": True,
            "available_online": True
        }
    ]
    
    for i, user_data in enumerate(priest_users):
        user = {
            "email": user_data["email"],
            "password": get_password_hash("priest123"),
            "name": user_data["name"],
            "role": user_data["role"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc)
        }
        result = await users_collection.insert_one(user)
        
        priest = {**priest_data[i], "user_id": str(result.inserted_id), "created_at": datetime.now(timezone.utc)}
        await priests_collection.insert_one(priest)
    
    # Create sample shop owner and products
    shop_owner = {
        "email": "shop@divineapp.com",
        "password": get_password_hash("shop123"),
        "name": "Shree Pooja Store",
        "role": UserRole.SHOP_OWNER,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc)
    }
    shop_result = await users_collection.insert_one(shop_owner)
    
    shop = {
        "owner_id": str(shop_result.inserted_id),
        "name": "Shree Pooja Store",
        "description": "Authentic pooja items and spiritual products",
        "address": "123 Temple Street",
        "city": "Mumbai",
        "phone": "+91 9876543210",
        "rating": 4.6,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc)
    }
    shop_insert = await shops_collection.insert_one(shop)
    
    products = [
        {"name": "Brass Diya Set (5 pcs)", "description": "Traditional brass oil lamps for daily pooja", "price": 599.0, "category": "Lamps", "stock": 50, "images": ["https://images.unsplash.com/photo-1606293926249-ed22e446d476"], "rating": 4.5},
        {"name": "Sandalwood Agarbatti Pack", "description": "Premium sandalwood incense sticks - 100 pcs", "price": 249.0, "category": "Incense", "stock": 100, "images": ["https://images.unsplash.com/photo-1600298881974-6be191ceeda1"], "rating": 4.7},
        {"name": "Brass Ganesha Idol", "description": "Handcrafted Lord Ganesha statue - 6 inches", "price": 1499.0, "category": "Idols", "stock": 25, "images": ["https://images.unsplash.com/photo-1567591370504-80c7e360ef58"], "rating": 4.8},
        {"name": "Pooja Thali Set", "description": "Complete brass pooja thali with accessories", "price": 899.0, "category": "Pooja Items", "stock": 30, "images": ["https://images.unsplash.com/photo-1652960018678-1f19799996c5"], "rating": 4.6},
        {"name": "Pure Kumkum (100g)", "description": "Traditional vermillion powder for pooja", "price": 99.0, "category": "Pooja Items", "stock": 200, "images": [], "rating": 4.4},
        {"name": "Camphor Tablets (50 pcs)", "description": "Pure camphor for aarti and pooja", "price": 149.0, "category": "Pooja Items", "stock": 150, "images": [], "rating": 4.5},
        {"name": "Tulsi Mala", "description": "Sacred tulsi bead rosary - 108 beads", "price": 299.0, "category": "Accessories", "stock": 75, "images": [], "rating": 4.7},
        {"name": "Satyanarayan Pooja Kit", "description": "Complete kit with all items for Satyanarayan Katha", "price": 799.0, "category": "Pooja Kits", "stock": 40, "images": [], "rating": 4.9},
    ]
    
    for product in products:
        product["shop_id"] = str(shop_insert.inserted_id)
        product["shop_name"] = "Shree Pooja Store"
        product["total_reviews"] = 0
        product["created_at"] = datetime.now(timezone.utc)
        await products_collection.insert_one(product)
    
    # Create sample astrologer
    astro_user = {
        "email": "astrologer@divineapp.com",
        "password": get_password_hash("astro123"),
        "name": "Dr. Acharya Vishnu Prasad",
        "role": UserRole.ASTROLOGER,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc)
    }
    astro_result = await users_collection.insert_one(astro_user)
    
    astrologer = {
        "user_id": str(astro_result.inserted_id),
        "specializations": ["Vedic Astrology", "Numerology", "Vastu Shastra"],
        "experience_years": 25,
        "languages": ["Hindi", "English", "Sanskrit"],
        "consultation_fee": 1500.0,
        "bio": "25+ years of experience in Jyotish Shastra. Gold medalist from BHU.",
        "rating": 4.9,
        "total_reviews": 342,
        "is_verified": True,
        "created_at": datetime.now(timezone.utc)
    }
    await astrologers_collection.insert_one(astrologer)
    
    # Seed festivals
    festivals = [
        {"name": "Maha Shivaratri", "date": "2025-02-26", "description": "The great night of Lord Shiva", "importance": "Major"},
        {"name": "Holi", "date": "2025-03-14", "description": "Festival of colors celebrating spring", "importance": "Major"},
        {"name": "Ram Navami", "date": "2025-04-06", "description": "Birthday of Lord Rama", "importance": "Major"},
        {"name": "Hanuman Jayanti", "date": "2025-04-12", "description": "Birthday of Lord Hanuman", "importance": "Medium"},
        {"name": "Akshaya Tritiya", "date": "2025-05-01", "description": "Auspicious day for new beginnings", "importance": "Major"},
        {"name": "Ganesh Chaturthi", "date": "2025-08-27", "description": "Birthday of Lord Ganesha", "importance": "Major"},
        {"name": "Navratri Begins", "date": "2025-09-22", "description": "Nine nights of Goddess Durga worship", "importance": "Major"},
        {"name": "Dussehra", "date": "2025-10-02", "description": "Victory of good over evil", "importance": "Major"},
        {"name": "Diwali", "date": "2025-10-20", "description": "Festival of lights", "importance": "Major"},
        {"name": "Karwa Chauth", "date": "2025-10-10", "description": "Fast for husband's longevity", "importance": "Medium"},
    ]
    for festival in festivals:
        festival["created_at"] = datetime.now(timezone.utc)
        await festivals_collection.insert_one(festival)
    
    # Seed temples
    temples = [
        {"name": "Siddhivinayak Temple", "city": "Mumbai", "state": "Maharashtra", "deity": "Lord Ganesha", "description": "One of the most visited temples in Mumbai"},
        {"name": "Tirupati Balaji", "city": "Tirupati", "state": "Andhra Pradesh", "deity": "Lord Venkateswara", "description": "The richest temple in the world"},
        {"name": "Vaishno Devi", "city": "Katra", "state": "Jammu & Kashmir", "deity": "Goddess Vaishno Devi", "description": "Holy cave shrine in Trikuta Mountains"},
        {"name": "Kashi Vishwanath", "city": "Varanasi", "state": "Uttar Pradesh", "deity": "Lord Shiva", "description": "One of the 12 Jyotirlingas"},
        {"name": "Meenakshi Temple", "city": "Madurai", "state": "Tamil Nadu", "deity": "Goddess Meenakshi", "description": "Historic Hindu temple with stunning architecture"},
    ]
    for temple in temples:
        temple["created_at"] = datetime.now(timezone.utc)
        await temples_collection.insert_one(temple)
    
    print("Database seeded with initial data")

# ===================== HEALTH CHECK =====================
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ===================== GOOGLE PLACES API =====================
GOOGLE_PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")

@app.get("/api/places/autocomplete")
async def places_autocomplete(query: str = Query(..., min_length=2)):
    """Search for places using Google Places Autocomplete API"""
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/autocomplete/json",
                params={
                    "input": query,
                    "types": "(cities)",
                    "key": GOOGLE_PLACES_API_KEY
                },
                timeout=10.0
            )
            data = response.json()
            
            if data.get("status") == "OK":
                results = []
                for prediction in data.get("predictions", [])[:5]:
                    results.append({
                        "place_id": prediction.get("place_id"),
                        "description": prediction.get("description"),
                        "main_text": prediction.get("structured_formatting", {}).get("main_text"),
                        "secondary_text": prediction.get("structured_formatting", {}).get("secondary_text")
                    })
                return {"status": "ok", "results": results}
            elif data.get("status") == "ZERO_RESULTS":
                return {"status": "ok", "results": []}
            else:
                return {"status": "error", "message": data.get("status"), "results": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Places API error: {str(e)}")

@app.get("/api/places/details/{place_id}")
async def place_details(place_id: str):
    """Get place details including coordinates using Google Places API"""
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/details/json",
                params={
                    "place_id": place_id,
                    "fields": "name,formatted_address,geometry,address_components",
                    "key": GOOGLE_PLACES_API_KEY
                },
                timeout=10.0
            )
            data = response.json()
            
            if data.get("status") == "OK":
                result = data.get("result", {})
                geometry = result.get("geometry", {}).get("location", {})
                
                # Extract city, state, country from address components
                address_components = result.get("address_components", [])
                city = state = country = ""
                for component in address_components:
                    types = component.get("types", [])
                    if "locality" in types:
                        city = component.get("long_name")
                    elif "administrative_area_level_1" in types:
                        state = component.get("long_name")
                    elif "country" in types:
                        country = component.get("long_name")
                
                return {
                    "status": "ok",
                    "data": {
                        "name": result.get("name"),
                        "formatted_address": result.get("formatted_address"),
                        "latitude": geometry.get("lat"),
                        "longitude": geometry.get("lng"),
                        "city": city,
                        "state": state,
                        "country": country
                    }
                }
            else:
                return {"status": "error", "message": data.get("status")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Places API error: {str(e)}")

# ===================== TRANSLATION API =====================
@app.post("/api/translate")
async def translate_text(request: Request):
    """Translate text using Google Translate API or fallback to MyMemory"""
    try:
        body = await request.json()
        text = body.get("text", "")
        target_lang = body.get("target_lang", "hi")  # Default to Hindi
        
        if not text:
            return {"status": "error", "message": "No text provided"}
        
        # Language codes mapping
        lang_codes = {
            "hindi": "hi",
            "telugu": "te",
            "kannada": "kn",
            "tamil": "ta",
            "malayalam": "ml",
            "english": "en"
        }
        
        target = lang_codes.get(target_lang.lower(), target_lang)
        
        # Try Google Translate first if API key available
        if GOOGLE_PLACES_API_KEY:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://translation.googleapis.com/language/translate/v2",
                        params={"key": GOOGLE_PLACES_API_KEY},
                        json={
                            "q": text,
                            "target": target,
                            "format": "text"
                        },
                        timeout=10.0
                    )
                    data = response.json()
                    
                    if "data" in data and "translations" in data["data"]:
                        translated = data["data"]["translations"][0]["translatedText"]
                        return {
                            "status": "ok",
                            "original": text,
                            "translated": translated,
                            "target_lang": target,
                            "provider": "google"
                        }
            except Exception as e:
                print(f"Google Translate failed: {e}")
        
        # Fallback to MyMemory API (free, no API key needed)
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.mymemory.translated.net/get",
                    params={
                        "q": text[:500],  # MyMemory has 500 char limit
                        "langpair": f"en|{target}"
                    },
                    timeout=10.0
                )
                data = response.json()
                
                if data.get("responseStatus") == 200:
                    translated = data.get("responseData", {}).get("translatedText", text)
                    return {
                        "status": "ok",
                        "original": text,
                        "translated": translated,
                        "target_lang": target,
                        "provider": "mymemory"
                    }
        except Exception as e:
            print(f"MyMemory translate failed: {e}")
        
        return {"status": "error", "message": "Translation services unavailable"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

# ===================== TEXT-TO-SPEECH (SARVAM AI - Indian Voices) =====================
from sarvamai import SarvamAI
import base64

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY")

# Sarvam AI voice options for Indian languages (compatible with bulbul:v2)
SARVAM_VOICES = [
    {"voice_id": "anushka", "name": "Anushka (Hindi Female)", "language": "hi-IN", "gender": "female", "recommended": True},
    {"voice_id": "manisha", "name": "Manisha (Hindi Female)", "language": "hi-IN", "gender": "female", "recommended": True},
    {"voice_id": "abhilash", "name": "Abhilash (Hindi Male)", "language": "hi-IN", "gender": "male", "recommended": True},
    {"voice_id": "karun", "name": "Karun (Hindi Male)", "language": "hi-IN", "gender": "male"},
    {"voice_id": "hitesh", "name": "Hitesh (Hindi Male)", "language": "hi-IN", "gender": "male"},
    {"voice_id": "vidya", "name": "Vidya (Kannada Female)", "language": "kn-IN", "gender": "female"},
    {"voice_id": "arya", "name": "Arya (Tamil Female)", "language": "ta-IN", "gender": "female"},
]

@app.get("/api/tts/voices")
async def get_tts_voices():
    """Get available Sarvam AI voices for Indian languages"""
    if not SARVAM_API_KEY:
        return {"status": "error", "message": "TTS service not configured", "voices": [], "use_browser": True}
    
    # Return predefined Sarvam voices
    return {
        "status": "ok", 
        "voices": SARVAM_VOICES,
        "use_browser": False,
        "provider": "sarvam"
    }

@app.post("/api/tts/speak")
async def text_to_speech(request: Request):
    """Convert text to speech using Sarvam AI (Indian voices)"""
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=503, detail="TTS service not configured")
    
    try:
        body = await request.json()
        text = body.get("text", "")
        voice_id = body.get("voice_id", "anushka")  # Default: Anushka (Hindi female)
        language = body.get("language", "hi-IN")  # Default: Hindi
        
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")
        
        # Limit text length (Sarvam supports up to 2500 chars)
        if len(text) > 2500:
            text = text[:2500]
        
        # Find the voice's language if not specified
        voice_info = next((v for v in SARVAM_VOICES if v["voice_id"] == voice_id), None)
        if voice_info:
            language = voice_info.get("language", "hi-IN")
        
        client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
        
        # Generate speech with Sarvam AI
        response = client.text_to_speech.convert(
            target_language_code=language,
            text=text,
            model="bulbul:v2",
            speaker=voice_id,
            pace=0.9  # Slightly slower for mantras
        )
        
        # Response contains base64 audio
        if hasattr(response, 'audios') and response.audios:
            audio_b64 = response.audios[0]
            return {
                "status": "ok",
                "audio": f"data:audio/wav;base64,{audio_b64}",
                "text": text,
                "voice_id": voice_id,
                "provider": "sarvam"
            }
        else:
            raise Exception("No audio generated")
        
    except Exception as e:
        print(f"Sarvam TTS Error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

# ===================== INTERNET ARCHIVE SHLOKAS/MANTRAS =====================

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

@app.get("/api/archive/library")
async def get_vedic_library():
    """Get the complete Vedic audio library organized by category"""
    return {"status": "ok", "data": VEDIC_AUDIO_LIBRARY}

@app.get("/api/archive/play/{item_id}")
async def get_audio_for_item(item_id: str):
    """Search Internet Archive for audio matching the item and return playable URL"""
    # Find the item in our library
    search_query = None
    item_title = None
    
    for category, items in VEDIC_AUDIO_LIBRARY.items():
        for item in items:
            if item["id"] == item_id:
                search_query = item["search_query"]
                item_title = item["title"]
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

@app.get("/api/archive/metadata/{identifier}")
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

# ===================== PANCHANG & FESTIVAL CALENDAR =====================
import swisseph as swe
from datetime import timedelta
import math

# Hindu month names
HINDU_MONTHS = [
    "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
    "Ashwin", "Kartik", "Margashirsha", "Pausha", "Magha", "Phalguna"
]

# Tithi names
TITHIS = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
]

# Nakshatra names
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

# Yoga names
YOGAS = [
    "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
    "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva",
    "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan",
    "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
    "Brahma", "Indra", "Vaidhriti"
]

# Karana names
KARANAS = [
    "Bava", "Balava", "Kaulava", "Taitila", "Garija", "Vanija", "Vishti",
    "Shakuni", "Chatushpada", "Naga", "Kimstughna"
]

# Weekday names
VARAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
VARA_DEITIES = ["Surya", "Chandra", "Mangal", "Budh", "Guru", "Shukra", "Shani"]

# Major Hindu Festivals with their lunar calendar dates
FESTIVALS = [
    {"name": "Makar Sankranti", "type": "solar", "month": 1, "day": 14, "description": "Sun enters Capricorn"},
    {"name": "Vasant Panchami", "type": "lunar", "month": "Magha", "paksha": "Shukla", "tithi": 5, "description": "Saraswati Puja"},
    {"name": "Maha Shivaratri", "type": "lunar", "month": "Magha", "paksha": "Krishna", "tithi": 14, "description": "Night of Shiva"},
    {"name": "Holi", "type": "lunar", "month": "Phalguna", "paksha": "Shukla", "tithi": 15, "description": "Festival of Colors"},
    {"name": "Ugadi/Gudi Padwa", "type": "lunar", "month": "Chaitra", "paksha": "Shukla", "tithi": 1, "description": "Hindu New Year"},
    {"name": "Ram Navami", "type": "lunar", "month": "Chaitra", "paksha": "Shukla", "tithi": 9, "description": "Birth of Lord Rama"},
    {"name": "Hanuman Jayanti", "type": "lunar", "month": "Chaitra", "paksha": "Shukla", "tithi": 15, "description": "Birth of Hanuman"},
    {"name": "Akshaya Tritiya", "type": "lunar", "month": "Vaishakha", "paksha": "Shukla", "tithi": 3, "description": "Auspicious day"},
    {"name": "Buddha Purnima", "type": "lunar", "month": "Vaishakha", "paksha": "Shukla", "tithi": 15, "description": "Birth of Buddha"},
    {"name": "Guru Purnima", "type": "lunar", "month": "Ashadha", "paksha": "Shukla", "tithi": 15, "description": "Honor the Guru"},
    {"name": "Raksha Bandhan", "type": "lunar", "month": "Shravana", "paksha": "Shukla", "tithi": 15, "description": "Brother-Sister bond"},
    {"name": "Krishna Janmashtami", "type": "lunar", "month": "Shravana", "paksha": "Krishna", "tithi": 8, "description": "Birth of Krishna"},
    {"name": "Ganesh Chaturthi", "type": "lunar", "month": "Bhadrapada", "paksha": "Shukla", "tithi": 4, "description": "Birth of Ganesha"},
    {"name": "Anant Chaturdashi", "type": "lunar", "month": "Bhadrapada", "paksha": "Shukla", "tithi": 14, "description": "Ganesh Visarjan"},
    {"name": "Navratri Begins", "type": "lunar", "month": "Ashwin", "paksha": "Shukla", "tithi": 1, "description": "Nine nights of Devi"},
    {"name": "Dussehra/Vijayadashami", "type": "lunar", "month": "Ashwin", "paksha": "Shukla", "tithi": 10, "description": "Victory of good"},
    {"name": "Karwa Chauth", "type": "lunar", "month": "Kartik", "paksha": "Krishna", "tithi": 4, "description": "Spousal devotion"},
    {"name": "Dhanteras", "type": "lunar", "month": "Kartik", "paksha": "Krishna", "tithi": 13, "description": "Wealth worship"},
    {"name": "Diwali", "type": "lunar", "month": "Kartik", "paksha": "Krishna", "tithi": 15, "description": "Festival of Lights"},
    {"name": "Govardhan Puja", "type": "lunar", "month": "Kartik", "paksha": "Shukla", "tithi": 1, "description": "Krishna lifted Govardhan"},
    {"name": "Bhai Dooj", "type": "lunar", "month": "Kartik", "paksha": "Shukla", "tithi": 2, "description": "Brother-Sister celebration"},
    {"name": "Dev Deepawali", "type": "lunar", "month": "Kartik", "paksha": "Shukla", "tithi": 15, "description": "Diwali of Gods"},
]

def get_julian_day(year, month, day, hour=12):
    """Convert Gregorian date to Julian Day"""
    return swe.julday(year, month, day, hour)

def get_sun_longitude(jd):
    """Get Sun's longitude"""
    sun = swe.calc_ut(jd, swe.SUN)[0]
    return sun[0]

def get_moon_longitude(jd):
    """Get Moon's longitude"""
    moon = swe.calc_ut(jd, swe.MOON)[0]
    return moon[0]

def calculate_tithi(jd):
    """Calculate tithi from Julian day"""
    sun_long = get_sun_longitude(jd)
    moon_long = get_moon_longitude(jd)
    diff = (moon_long - sun_long) % 360
    tithi_num = int(diff / 12) + 1
    if tithi_num > 30:
        tithi_num = 30
    paksha = "Shukla" if tithi_num <= 15 else "Krishna"
    tithi_in_paksha = tithi_num if tithi_num <= 15 else tithi_num - 15
    return {
        "number": tithi_num,
        "paksha": paksha,
        "tithi_in_paksha": tithi_in_paksha,
        "name": TITHIS[(tithi_in_paksha - 1) % 15]
    }

def calculate_nakshatra(jd):
    """Calculate nakshatra from Julian day"""
    moon_long = get_moon_longitude(jd)
    nakshatra_num = int(moon_long / (360/27)) + 1
    if nakshatra_num > 27:
        nakshatra_num = 1
    return {
        "number": nakshatra_num,
        "name": NAKSHATRAS[nakshatra_num - 1]
    }

def calculate_yoga(jd):
    """Calculate yoga from Julian day"""
    sun_long = get_sun_longitude(jd)
    moon_long = get_moon_longitude(jd)
    yoga_long = (sun_long + moon_long) % 360
    yoga_num = int(yoga_long / (360/27)) + 1
    if yoga_num > 27:
        yoga_num = 1
    return {
        "number": yoga_num,
        "name": YOGAS[yoga_num - 1]
    }

def calculate_karana(jd):
    """Calculate karana from Julian day"""
    sun_long = get_sun_longitude(jd)
    moon_long = get_moon_longitude(jd)
    diff = (moon_long - sun_long) % 360
    karana_num = int(diff / 6) + 1
    karana_num = ((karana_num - 1) % 11)
    return {
        "number": karana_num + 1,
        "name": KARANAS[karana_num]
    }

def get_hindu_month(jd):
    """Approximate Hindu month based on Sun's position"""
    sun_long = get_sun_longitude(jd)
    # Adjust for Chaitra starting around March-April
    month_index = int((sun_long + 360 - 23) / 30) % 12
    return HINDU_MONTHS[month_index]

@app.get("/api/panchang/today")
async def get_today_panchang(lat: float = 28.6139, lon: float = 77.2090):
    """Get today's Panchang (Hindu calendar details)"""
    try:
        now = datetime.now()
        jd = get_julian_day(now.year, now.month, now.day)
        
        tithi = calculate_tithi(jd)
        nakshatra = calculate_nakshatra(jd)
        yoga = calculate_yoga(jd)
        karana = calculate_karana(jd)
        hindu_month = get_hindu_month(jd)
        weekday = now.weekday()
        vara_index = (weekday + 1) % 7  # Adjust: Python Monday=0, Hindu Sunday=0
        
        # Approximate sunrise/sunset times for Indian locations
        # More precise calculations would require full ephemeris computation
        sunrise = "06:15"
        sunset = "18:30"
        
        return {
            "status": "ok",
            "date": now.strftime("%Y-%m-%d"),
            "day_name": now.strftime("%A"),
            "hindu_month": hindu_month,
            "vara": {
                "name": VARAS[vara_index],
                "deity": VARA_DEITIES[vara_index]
            },
            "tithi": tithi,
            "nakshatra": nakshatra,
            "yoga": yoga,
            "karana": karana,
            "sunrise": sunrise,
            "sunset": sunset,
            "location": {"lat": lat, "lon": lon}
        }
    except Exception as e:
        print(f"Panchang error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate Panchang: {str(e)}")

@app.get("/api/panchang/month")
async def get_month_panchang(year: int = None, month: int = None):
    """Get Panchang for entire month"""
    try:
        now = datetime.now()
        year = year or now.year
        month = month or now.month
        
        # Get number of days in month
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        first_day = datetime(year, month, 1)
        days_in_month = (next_month - first_day).days
        
        month_data = []
        for day in range(1, days_in_month + 1):
            jd = get_julian_day(year, month, day)
            tithi = calculate_tithi(jd)
            nakshatra = calculate_nakshatra(jd)
            weekday = datetime(year, month, day).weekday()
            vara_index = (weekday + 1) % 7
            
            month_data.append({
                "date": f"{year}-{month:02d}-{day:02d}",
                "day": day,
                "weekday": VARAS[vara_index],
                "tithi": tithi["name"],
                "paksha": tithi["paksha"],
                "nakshatra": nakshatra["name"]
            })
        
        return {
            "status": "ok",
            "year": year,
            "month": month,
            "month_name": datetime(year, month, 1).strftime("%B"),
            "days": month_data
        }
    except Exception as e:
        print(f"Month Panchang error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get month Panchang: {str(e)}")

@app.get("/api/festivals/upcoming")
async def get_upcoming_festivals(limit: int = 10):
    """Get upcoming Hindu festivals"""
    try:
        now = datetime.now()
        current_year = now.year
        
        # Generate festival dates for current and next year
        upcoming = []
        
        for year in [current_year, current_year + 1]:
            for festival in FESTIVALS:
                try:
                    if festival["type"] == "solar":
                        # Solar festivals have fixed Gregorian dates
                        fest_date = datetime(year, festival["month"], festival["day"])
                    else:
                        # Lunar festivals - approximate based on typical Gregorian occurrence
                        # This is a simplified mapping - production would need precise calculations
                        lunar_month_map = {
                            "Chaitra": (3, 22), "Vaishakha": (4, 21), "Jyeshtha": (5, 22),
                            "Ashadha": (6, 22), "Shravana": (7, 23), "Bhadrapada": (8, 23),
                            "Ashwin": (9, 23), "Kartik": (10, 23), "Margashirsha": (11, 22),
                            "Pausha": (12, 22), "Magha": (1, 20), "Phalguna": (2, 19)
                        }
                        
                        base_month, base_day = lunar_month_map.get(festival["month"], (1, 1))
                        tithi_offset = festival["tithi"] - 1
                        if festival["paksha"] == "Krishna":
                            tithi_offset += 15
                        
                        # Adjust year for months that span year boundary
                        adj_year = year if base_month > 2 else year
                        if festival["month"] in ["Magha", "Phalguna"] and base_month <= 2:
                            adj_year = year + 1
                            
                        fest_date = datetime(adj_year, base_month, base_day) + timedelta(days=tithi_offset)
                    
                    if fest_date >= now:
                        days_until = (fest_date - now).days
                        upcoming.append({
                            "name": festival["name"],
                            "date": fest_date.strftime("%Y-%m-%d"),
                            "display_date": fest_date.strftime("%B %d, %Y"),
                            "day_name": fest_date.strftime("%A"),
                            "description": festival["description"],
                            "days_until": days_until,
                            "is_today": days_until == 0,
                            "is_tomorrow": days_until == 1
                        })
                except:
                    continue
        
        # Sort by date and limit
        upcoming.sort(key=lambda x: x["date"])
        upcoming = upcoming[:limit]
        
        return {
            "status": "ok",
            "count": len(upcoming),
            "festivals": upcoming
        }
    except Exception as e:
        print(f"Festivals error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get festivals: {str(e)}")

@app.get("/api/festivals/year/{year}")
async def get_year_festivals(year: int):
    """Get all festivals for a specific year"""
    try:
        festivals_list = []
        
        for festival in FESTIVALS:
            try:
                if festival["type"] == "solar":
                    fest_date = datetime(year, festival["month"], festival["day"])
                else:
                    lunar_month_map = {
                        "Chaitra": (3, 22), "Vaishakha": (4, 21), "Jyeshtha": (5, 22),
                        "Ashadha": (6, 22), "Shravana": (7, 23), "Bhadrapada": (8, 23),
                        "Ashwin": (9, 23), "Kartik": (10, 23), "Margashirsha": (11, 22),
                        "Pausha": (12, 22), "Magha": (1, 20), "Phalguna": (2, 19)
                    }
                    
                    base_month, base_day = lunar_month_map.get(festival["month"], (1, 1))
                    tithi_offset = festival["tithi"] - 1
                    if festival["paksha"] == "Krishna":
                        tithi_offset += 15
                    
                    adj_year = year if base_month > 2 else year
                    fest_date = datetime(adj_year, base_month, base_day) + timedelta(days=tithi_offset)
                
                festivals_list.append({
                    "name": festival["name"],
                    "date": fest_date.strftime("%Y-%m-%d"),
                    "display_date": fest_date.strftime("%B %d"),
                    "month": fest_date.month,
                    "description": festival["description"]
                })
            except:
                continue
        
        festivals_list.sort(key=lambda x: x["date"])
        
        return {
            "status": "ok",
            "year": year,
            "count": len(festivals_list),
            "festivals": festivals_list
        }
    except Exception as e:
        print(f"Year festivals error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get year festivals: {str(e)}")

# ===================== WHISPER TRANSCRIPTION FOR KARAOKE =====================
from emergentintegrations.llm.openai import OpenAISpeechToText
import tempfile

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

@app.post("/api/transcribe/karaoke")
async def transcribe_for_karaoke(request: Request):
    """Transcribe audio from URL using Whisper for karaoke-style display"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Transcription service not configured")
    
    try:
        body = await request.json()
        audio_url = body.get("audio_url")
        
        if not audio_url:
            raise HTTPException(status_code=400, detail="No audio URL provided")
        
        # Download the audio file
        async with httpx.AsyncClient() as client:
            audio_response = await client.get(audio_url, timeout=60.0, follow_redirects=True)
            
            if audio_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to download audio")
            
            # Check file size (max 25MB for Whisper)
            content_length = len(audio_response.content)
            if content_length > 25 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
            temp_file.write(audio_response.content)
            temp_path = temp_file.name
        
        try:
            # Initialize Whisper
            stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
            
            # Transcribe with word-level timestamps
            with open(temp_path, "rb") as audio_file:
                response = await stt.transcribe(
                    file=audio_file,
                    model="whisper-1",
                    response_format="verbose_json",
                    timestamp_granularities=["word", "segment"]
                )
            
            # Format response for karaoke
            words = []
            if hasattr(response, 'words') and response.words:
                for word in response.words:
                    words.append({
                        "word": word.word if hasattr(word, 'word') else str(word.get('word', '')),
                        "start": word.start if hasattr(word, 'start') else float(word.get('start', 0)),
                        "end": word.end if hasattr(word, 'end') else float(word.get('end', 0))
                    })
            
            segments = []
            if hasattr(response, 'segments') and response.segments:
                for seg in response.segments:
                    segments.append({
                        "text": seg.text if hasattr(seg, 'text') else str(seg.get('text', '')),
                        "start": seg.start if hasattr(seg, 'start') else float(seg.get('start', 0)),
                        "end": seg.end if hasattr(seg, 'end') else float(seg.get('end', 0))
                    })
            
            return {
                "status": "ok",
                "text": response.text,
                "words": words,
                "segments": segments,
                "duration": response.duration if hasattr(response, 'duration') else None
            }
            
        finally:
            # Cleanup temp file
            import os as os_module
            os_module.unlink(temp_path)
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

# ===================== DEVOTIONAL CONTENT ROUTES =====================
@app.get("/api/devotional/deities")
async def get_deities():
    """Get all deities"""
    cursor = deities_collection.find({}, {"_id": 0})
    deities = await cursor.to_list(length=50)
    return {"status": "ok", "data": deities}

@app.get("/api/devotional/deities/{deity_id}")
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

@app.get("/api/devotional/mantras")
async def get_mantras(deity_id: Optional[str] = None, type: Optional[str] = None, tier: Optional[str] = None):
    """Get mantras with optional filters"""
    query = {"is_active": True}
    if deity_id:
        query["deity_id"] = deity_id
    if type:
        query["type"] = type
    if tier:
        query["tier"] = tier
    
    cursor = mantras_collection.find(query, {"_id": 0})
    mantras = await cursor.to_list(length=100)
    return {"status": "ok", "data": mantras, "count": len(mantras)}

@app.get("/api/devotional/mantras/{deity_id}/{mantra_type}")
async def get_specific_mantra(deity_id: str, mantra_type: str):
    """Get a specific mantra by deity and type"""
    mantra = await mantras_collection.find_one(
        {"deity_id": deity_id, "type": mantra_type},
        {"_id": 0}
    )
    if not mantra:
        raise HTTPException(status_code=404, detail="Mantra not found")
    return {"status": "ok", "data": mantra}

@app.get("/api/devotional/stotras")
async def get_stotras(deity_id: Optional[str] = None, type: Optional[str] = None, tier: Optional[str] = None):
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

@app.get("/api/devotional/daily-schedule")
async def get_daily_schedule():
    """Get daily worship schedule"""
    cursor = daily_schedule_collection.find({}, {"_id": 0})
    schedule = await cursor.to_list(length=7)
    return {"status": "ok", "data": schedule}

@app.get("/api/devotional/today")
async def get_today_devotional():
    """Get today's recommended deity and mantras based on day of week"""
    from datetime import datetime
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today = days[datetime.now().weekday()]
    
    # Get today's schedule
    schedule = await daily_schedule_collection.find_one({"day": today}, {"_id": 0})
    if not schedule:
        return {"status": "ok", "data": None}
    
    # Get primary deity details
    deity = await deities_collection.find_one({"id": schedule.get("primary_deity")}, {"_id": 0})
    
    # Get mantras for the deity
    cursor = mantras_collection.find({"deity_id": schedule.get("primary_deity"), "tier": "free"}, {"_id": 0}).limit(3)
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

# ===================== AUTH ROUTES =====================
@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    existing = await users_collection.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role,
        "is_verified": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await users_collection.insert_one(user_dict)
    token = create_access_token(data={"sub": str(result.inserted_id)})
    
    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "email": user_data.email,
            "name": user_data.name,
            "role": user_data.role
        }
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    user = await users_collection.find_one({"email": credentials.email})
    # Check both password fields (password_hash for new users, password for legacy)
    password_field = user.get("password_hash") or user.get("password") if user else None
    if not user or not password_field or not verify_password(credentials.password, password_field):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone"),
        "role": user["role"],
        "is_verified": user.get("is_verified", False),
        "address": user.get("address"),
        "city": user.get("city"),
        "pincode": user.get("pincode"),
        "date_of_birth": user.get("date_of_birth"),
        "gotra": user.get("gotra"),
        "nakshatra": user.get("nakshatra"),
        "profile_completed": user.get("profile_completed", False),
        "firebase_uid": user.get("firebase_uid")
    }

# ===================== USER PROFILE UPDATE =====================
class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    date_of_birth: Optional[str] = None
    gotra: Optional[str] = None
    nakshatra: Optional[str] = None
    profile_photo: Optional[str] = None

@app.put("/api/users/profile")
async def update_profile(data: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_data = {}
    
    if data.name:
        update_data["name"] = data.name
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.address is not None:
        update_data["address"] = data.address
    if data.city is not None:
        update_data["city"] = data.city
    if data.pincode is not None:
        update_data["pincode"] = data.pincode
    if data.date_of_birth is not None:
        update_data["date_of_birth"] = data.date_of_birth
    if data.gotra is not None:
        update_data["gotra"] = data.gotra
    if data.nakshatra is not None:
        update_data["nakshatra"] = data.nakshatra
    if data.profile_photo is not None:
        update_data["profile_photo"] = data.profile_photo
    
    # Mark profile as completed if key fields are filled
    if data.phone and data.city:
        update_data["profile_completed"] = True
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await users_collection.find_one({"_id": user["_id"]})
    
    return {
        "user": {
            "id": str(updated_user["_id"]),
            "email": updated_user["email"],
            "name": updated_user["name"],
            "phone": updated_user.get("phone"),
            "role": updated_user["role"],
            "is_verified": updated_user.get("is_verified", False),
            "address": updated_user.get("address"),
            "city": updated_user.get("city"),
            "pincode": updated_user.get("pincode"),
            "date_of_birth": updated_user.get("date_of_birth"),
            "gotra": updated_user.get("gotra"),
            "nakshatra": updated_user.get("nakshatra"),
            "profile_photo": updated_user.get("profile_photo"),
            "profile_completed": updated_user.get("profile_completed", False),
            "firebase_uid": updated_user.get("firebase_uid")
        }
    }

# ===================== FIREBASE AUTH ROUTES =====================

class FirebaseSyncRequest(BaseModel):
    firebase_uid: str
    email: str
    name: str
    photo_url: Optional[str] = None
    role: Optional[str] = None  # Optional role for new user registration

class FirebaseRegisterRequest(BaseModel):
    firebase_uid: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str = "devotee"

@app.post("/api/auth/firebase-sync")
async def firebase_sync(data: FirebaseSyncRequest):
    """Sync Firebase user with backend - create if not exists, return existing if found"""
    try:
        # Check if user already exists by firebase_uid or email
        user = await users_collection.find_one({
            "$or": [
                {"firebase_uid": data.firebase_uid},
                {"email": data.email}
            ]
        })
        
        if user:
            # Update firebase_uid if not set
            if not user.get("firebase_uid") or user.get("firebase_uid") != data.firebase_uid:
                await users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"firebase_uid": data.firebase_uid, "photo_url": data.photo_url}}
                )
            
            return {
                "user": {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "name": user["name"],
                    "role": user["role"],
                    "firebase_uid": data.firebase_uid,
                    "is_verified": user.get("is_verified", False),
                    "phone": user.get("phone"),
                    "address": user.get("address"),
                    "city": user.get("city"),
                    "pincode": user.get("pincode"),
                    "date_of_birth": user.get("date_of_birth"),
                    "gotra": user.get("gotra"),
                    "nakshatra": user.get("nakshatra"),
                    "profile_completed": user.get("profile_completed", False)
                }
            }
        
        # Create new user (use provided role or default to devotee)
        selected_role = UserRole.DEVOTEE
        if data.role:
            try:
                selected_role = UserRole(data.role)
            except ValueError:
                selected_role = UserRole.DEVOTEE
        
        user_dict = {
            "firebase_uid": data.firebase_uid,
            "email": data.email,
            "name": data.name,
            "photo_url": data.photo_url,
            "role": selected_role,
            "is_verified": True,  # Firebase users are pre-verified
            "profile_completed": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await users_collection.insert_one(user_dict)
        
        # If priest, create priest profile
        if selected_role == UserRole.PRIEST:
            priest_profile = {
                "user_id": str(result.inserted_id),
                "user_name": data.name,
                "specializations": [],
                "languages": ["Hindi", "Sanskrit"],
                "experience_years": 1,
                "bio": "",
                "services": [],
                "rating": 0.0,
                "total_reviews": 0,
                "is_verified": False,
                "created_at": datetime.now(timezone.utc)
            }
            await priests_collection.insert_one(priest_profile)
        
        return {
            "user": {
                "id": str(result.inserted_id),
                "email": data.email,
                "name": data.name,
                "role": selected_role,
                "firebase_uid": data.firebase_uid,
                "profile_completed": False
            }
        }
    except Exception as e:
        # Handle duplicate key error - user was created by another request
        if "duplicate key" in str(e).lower() or "E11000" in str(e):
            # Retry finding the user
            user = await users_collection.find_one({"email": data.email})
            if user:
                return {
                    "user": {
                        "id": str(user["_id"]),
                        "email": user["email"],
                        "name": user["name"],
                        "role": user["role"],
                        "firebase_uid": data.firebase_uid,
                        "is_verified": user.get("is_verified", False),
                        "phone": user.get("phone"),
                        "profile_completed": user.get("profile_completed", False)
                    }
                }
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/firebase-register")
async def firebase_register(data: FirebaseRegisterRequest):
    """Register a new user from Firebase with specific role"""
    # Check if user already exists
    existing = await users_collection.find_one({
        "$or": [
            {"firebase_uid": data.firebase_uid},
            {"email": data.email}
        ]
    })
    
    if existing:
        # Update role if needed
        if existing.get("role") != data.role:
            await users_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {"role": data.role, "firebase_uid": data.firebase_uid}}
            )
        
        return {
            "user": {
                "id": str(existing["_id"]),
                "email": existing["email"],
                "name": existing["name"],
                "role": data.role,
                "is_verified": existing.get("is_verified", False)
            }
        }
    
    # Create new user with specified role
    role_map = {
        "devotee": UserRole.DEVOTEE,
        "priest": UserRole.PRIEST,
        "astrologer": UserRole.ASTROLOGER,
        "shop_owner": UserRole.SHOP_OWNER,
        "admin": UserRole.ADMIN
    }
    
    user_dict = {
        "firebase_uid": data.firebase_uid,
        "email": data.email,
        "name": data.name,
        "phone": data.phone,
        "role": role_map.get(data.role, UserRole.DEVOTEE),
        "is_verified": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await users_collection.insert_one(user_dict)
    
    return {
        "user": {
            "id": str(result.inserted_id),
            "email": data.email,
            "name": data.name,
            "role": user_dict["role"]
        }
    }

@app.put("/api/auth/profile")
async def update_profile(update_data: UserUpdate, user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": update_dict}
        )
    updated_user = await users_collection.find_one({"_id": user["_id"]})
    return {"message": "Profile updated", "user": {**updated_user, "id": str(updated_user["_id"]), "_id": None}}

# ===================== PRIEST ROUTES =====================
@app.get("/api/priests")
async def get_priests(
    specialization: Optional[str] = None,
    language: Optional[str] = None,
    min_rating: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {"is_verified": True}
    if specialization:
        query["specializations"] = {"$regex": specialization, "$options": "i"}
    if language:
        query["languages"] = {"$regex": language, "$options": "i"}
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    
    cursor = priests_collection.find(query).skip(skip).limit(limit)
    priests = []
    async for priest in cursor:
        user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        priests.append({
            "id": str(priest["_id"]),
            "user_id": priest["user_id"],
            "user_name": user["name"] if user else "Unknown",
            "specializations": priest["specializations"],
            "experience_years": priest["experience_years"],
            "languages": priest["languages"],
            "services": priest["services"],
            "bio": priest["bio"],
            "rating": priest.get("rating", 0),
            "total_reviews": priest.get("total_reviews", 0),
            "is_verified": priest.get("is_verified", False),
            "available_online": priest.get("available_online", True)
        })
    return {"priests": priests, "total": await priests_collection.count_documents(query)}

@app.get("/api/priests/{priest_id}")
async def get_priest(priest_id: str):
    priest = await priests_collection.find_one({"_id": ObjectId(priest_id)})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest not found")
    
    user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
    return {
        "id": str(priest["_id"]),
        "user_id": priest["user_id"],
        "user_name": user["name"] if user else "Unknown",
        "specializations": priest["specializations"],
        "experience_years": priest["experience_years"],
        "languages": priest["languages"],
        "services": priest["services"],
        "bio": priest["bio"],
        "rating": priest.get("rating", 0),
        "total_reviews": priest.get("total_reviews", 0),
        "is_verified": priest.get("is_verified", False),
        "available_online": priest.get("available_online", True)
    }

@app.post("/api/priests/register")
async def register_as_priest(data: PriestCreate, user: dict = Depends(get_current_user)):
    existing = await priests_collection.find_one({"user_id": str(user["_id"])})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as priest")
    
    priest_dict = {
        "user_id": str(user["_id"]),
        "specializations": data.specializations,
        "experience_years": data.experience_years,
        "languages": data.languages,
        "services": [s.dict() for s in data.services],
        "bio": data.bio,
        "rating": 0.0,
        "total_reviews": 0,
        "is_verified": False,
        "available_online": data.available_online,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priests_collection.insert_one(priest_dict)
    await users_collection.update_one({"_id": user["_id"]}, {"$set": {"role": UserRole.PRIEST}})
    
    return {"message": "Registered as priest", "priest_id": str(result.inserted_id)}

# ===================== BOOKING ROUTES =====================
@app.post("/api/bookings")
async def create_booking(data: BookingCreate, user: dict = Depends(get_current_user)):
    priest = await priests_collection.find_one({"_id": ObjectId(data.priest_id)})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest not found")
    
    # Find service price
    service = next((s for s in priest["services"] if s["name"] == data.service_name), None)
    if not service:
        raise HTTPException(status_code=400, detail="Service not found")
    
    priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
    
    booking_dict = {
        "user_id": str(user["_id"]),
        "priest_id": data.priest_id,
        "priest_name": priest_user["name"] if priest_user else "Unknown",
        "service_name": data.service_name,
        "price": service["price"],
        "booking_date": data.booking_date,
        "booking_type": data.booking_type,
        "status": BookingStatus.PENDING,
        "address": data.address,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await bookings_collection.insert_one(booking_dict)
    return {"message": "Booking created", "booking_id": str(result.inserted_id), "price": service["price"]}

@app.get("/api/bookings")
async def get_user_bookings(user: dict = Depends(get_current_user)):
    cursor = bookings_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    bookings = []
    async for booking in cursor:
        bookings.append({
            "id": str(booking["_id"]),
            "priest_id": booking["priest_id"],
            "priest_name": booking["priest_name"],
            "service_name": booking["service_name"],
            "price": booking["price"],
            "booking_date": booking["booking_date"].isoformat() if isinstance(booking["booking_date"], datetime) else booking["booking_date"],
            "booking_type": booking["booking_type"],
            "status": booking["status"],
            "address": booking.get("address"),
            "notes": booking.get("notes"),
            "created_at": booking["created_at"].isoformat()
        })
    return {"bookings": bookings}

@app.get("/api/priest/bookings")
async def get_priest_bookings(user: dict = Depends(require_role([UserRole.PRIEST]))):
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    cursor = bookings_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    bookings = []
    async for booking in cursor:
        booker = await users_collection.find_one({"_id": ObjectId(booking["user_id"])})
        bookings.append({
            "id": str(booking["_id"]),
            "user_name": booker["name"] if booker else "Unknown",
            "user_phone": booker.get("phone") if booker else None,
            "service_name": booking["service_name"],
            "price": booking["price"],
            "booking_date": booking["booking_date"].isoformat() if isinstance(booking["booking_date"], datetime) else booking["booking_date"],
            "booking_type": booking["booking_type"],
            "status": booking["status"],
            "address": booking.get("address"),
            "notes": booking.get("notes"),
            "created_at": booking["created_at"].isoformat()
        })
    return {"bookings": bookings}

@app.put("/api/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: BookingStatus, user: dict = Depends(get_current_user)):
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify user is priest for this booking or booking owner
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not (priest and str(priest["_id"]) == booking["priest_id"]) and booking["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    old_status = booking.get("status", "pending")
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": status}}
    )
    
    # Auto-create chat room when booking is confirmed
    if status == BookingStatus.CONFIRMED and old_status != "confirmed":
        # Get devotee info
        devotee = await users_collection.find_one({"_id": ObjectId(booking["user_id"])})
        # Get priest info
        priest_doc = await priests_collection.find_one({"_id": ObjectId(booking["priest_id"])})
        priest_user = await users_collection.find_one({"_id": ObjectId(priest_doc["user_id"])}) if priest_doc else None
        
        if devotee and priest_user:
            booking_date = booking.get("booking_date")
            date_str = booking_date.strftime("%B %d, %Y") if hasattr(booking_date, 'strftime') else str(booking_date)
            context = f"{booking.get('service_name', 'Pooja')} on {date_str}"
            
            await create_chat_room(
                room_type="booking",
                reference_id=booking_id,
                participant1_id=str(devotee["_id"]),
                participant1_name=devotee.get("name", "Devotee"),
                participant2_id=str(priest_user["_id"]),
                participant2_name=priest_user.get("name", "Priest"),
                context=context
            )
    
    # Auto-deactivate chat room when booking is completed or cancelled
    if status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        await deactivate_chat_room("booking", booking_id)
    
    return {"message": "Booking status updated"}

# ===================== PRIEST DASHBOARD - CLASSES =====================
from database import priest_classes_collection, priest_availability_collection, priest_content_collection, priest_streams_collection, priest_portfolio_collection, priest_services_collection, priest_posts_collection, post_comments_collection, post_likes_collection

@app.get("/api/priest/classes")
async def get_priest_classes(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get all classes created by priest"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    cursor = priest_classes_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    classes = []
    async for cls in cursor:
        classes.append({
            "id": str(cls["_id"]),
            "title": cls["title"],
            "description": cls["description"],
            "class_type": cls["class_type"],
            "duration_minutes": cls["duration_minutes"],
            "price": cls["price"],
            "max_students": cls["max_students"],
            "enrolled_count": cls.get("enrolled_count", 0),
            "schedule": cls.get("schedule", []),
            "category": cls.get("category", "General"),
            "frequency": cls.get("frequency", "weekly"),
            "schedule_day": cls.get("schedule_day", ""),
            "schedule_time": cls.get("schedule_time", ""),
            "is_active": cls.get("is_active", True),
            "created_at": cls["created_at"].isoformat() if isinstance(cls["created_at"], datetime) else cls["created_at"]
        })
    return {"classes": classes}

@app.post("/api/priest/classes")
async def create_priest_class(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Create a new class"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    data = await request.json()
    
    class_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "title": data.get("title"),
        "description": data.get("description", ""),
        "class_type": data.get("class_type", "online"),  # online / offline / both
        "duration_minutes": data.get("duration_minutes", 60),
        "price": data.get("price", 0),
        "max_students": data.get("max_students", 20),
        "enrolled_count": 0,
        "schedule": data.get("schedule", []),  # [{"day": "Monday", "time": "10:00"}]
        "category": data.get("category", "General"),
        "frequency": data.get("frequency", "weekly"),  # once, daily, weekly, biweekly, monthly
        "schedule_day": data.get("schedule_day", ""),  # Day of week for weekly/biweekly
        "schedule_time": data.get("schedule_time", ""),  # Time of class
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_classes_collection.insert_one(class_dict)
    return {"message": "Class created", "class_id": str(result.inserted_id)}

@app.put("/api/priest/classes/{class_id}")
async def update_priest_class(class_id: str, request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update a class"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    
    if not cls or cls["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Class not found")
    
    data = await request.json()
    update_data = {k: v for k, v in data.items() if k in [
        "title", "description", "class_type", "duration_minutes", 
        "price", "max_students", "schedule", "category", "is_active",
        "frequency", "schedule_day", "schedule_time"
    ]}
    
    await priest_classes_collection.update_one(
        {"_id": ObjectId(class_id)},
        {"$set": update_data}
    )
    return {"message": "Class updated"}

@app.delete("/api/priest/classes/{class_id}")
async def delete_priest_class(class_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a class"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    
    if not cls or cls["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Class not found")
    
    await priest_classes_collection.delete_one({"_id": ObjectId(class_id)})
    return {"message": "Class deleted"}

# ===================== PRIEST DASHBOARD - AVAILABILITY =====================
@app.get("/api/priest/availability")
async def get_priest_availability(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's availability settings"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    availability = await priest_availability_collection.find_one({"priest_id": str(priest["_id"])})
    
    if not availability:
        # Return default availability
        return {
            "online_slots": [],
            "offline_slots": [],
            "blocked_dates": [],
            "default_duration": 60
        }
    
    return {
        "online_slots": availability.get("online_slots", []),
        "offline_slots": availability.get("offline_slots", []),
        "blocked_dates": availability.get("blocked_dates", []),
        "default_duration": availability.get("default_duration", 60)
    }

@app.post("/api/priest/availability")
async def update_priest_availability(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update priest's availability"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    data = await request.json()
    
    availability_dict = {
        "priest_id": str(priest["_id"]),
        "online_slots": data.get("online_slots", []),  # [{"day": "Monday", "start": "09:00", "end": "17:00"}]
        "offline_slots": data.get("offline_slots", []),
        "blocked_dates": data.get("blocked_dates", []),  # ["2026-03-20", "2026-03-21"]
        "default_duration": data.get("default_duration", 60),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await priest_availability_collection.update_one(
        {"priest_id": str(priest["_id"])},
        {"$set": availability_dict},
        upsert=True
    )
    return {"message": "Availability updated"}

# ===================== PRIEST DASHBOARD - ANALYTICS =====================
@app.get("/api/priest/analytics")
async def get_priest_analytics(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's dashboard analytics"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    priest_id = str(priest["_id"])
    
    # Get booking stats
    all_bookings = await bookings_collection.find({"priest_id": priest_id}).to_list(None)
    
    total_bookings = len(all_bookings)
    pending_bookings = len([b for b in all_bookings if b["status"] == "pending"])
    confirmed_bookings = len([b for b in all_bookings if b["status"] == "confirmed"])
    completed_bookings = len([b for b in all_bookings if b["status"] == "completed"])
    cancelled_bookings = len([b for b in all_bookings if b["status"] == "cancelled"])
    
    # Calculate earnings
    total_earnings = sum(b.get("price", 0) for b in all_bookings if b["status"] == "completed")
    
    # This month's earnings
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_bookings = [b for b in all_bookings if b["status"] == "completed" and b.get("created_at", now) >= month_start]
    monthly_earnings = sum(b.get("price", 0) for b in this_month_bookings)
    
    # Get classes stats
    classes = await priest_classes_collection.find({"priest_id": priest_id}).to_list(None)
    total_classes = len(classes)
    total_students = sum(c.get("enrolled_count", 0) for c in classes)
    
    # Get content stats
    content_count = await priest_content_collection.count_documents({"priest_id": priest_id})
    
    # Get ratings
    reviews = await reviews_collection.find({"priest_id": priest_id}).to_list(None)
    avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0
    
    # Recent bookings
    recent_bookings = sorted(all_bookings, key=lambda x: x.get("created_at", now), reverse=True)[:5]
    recent_list = []
    for b in recent_bookings:
        recent_list.append({
            "id": str(b["_id"]),
            "service_name": b["service_name"],
            "status": b["status"],
            "price": b.get("price", 0),
            "date": b.get("booking_date").isoformat() if isinstance(b.get("booking_date"), datetime) else b.get("booking_date", "")
        })
    
    return {
        "stats": {
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "confirmed_bookings": confirmed_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_earnings": total_earnings,
            "monthly_earnings": monthly_earnings,
            "total_classes": total_classes,
            "total_students": total_students,
            "content_count": content_count,
            "avg_rating": round(avg_rating, 1),
            "total_reviews": len(reviews)
        },
        "recent_bookings": recent_list
    }

# ===================== PRIEST DASHBOARD - CONTENT (MANTRAS/CHANTS) =====================
@app.get("/api/priest/content")
async def get_priest_content(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get all content posted by priest"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    cursor = priest_content_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    content_list = []
    async for content in cursor:
        content_list.append({
            "id": str(content["_id"]),
            "title": content["title"],
            "description": content.get("description", ""),
            "content_type": content["content_type"],  # text, audio, video
            "category": content.get("category", "General"),
            "text_content": content.get("text_content", ""),
            "media_url": content.get("media_url", ""),
            "views": content.get("views", 0),
            "likes": content.get("likes", 0),
            "is_published": content.get("is_published", True),
            "created_at": content["created_at"].isoformat() if isinstance(content["created_at"], datetime) else content["created_at"]
        })
    return {"content": content_list}

@app.post("/api/priest/content")
async def create_priest_content(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Post new content (mantra/chant)"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    data = await request.json()
    
    content_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "title": data.get("title"),
        "description": data.get("description", ""),
        "content_type": data.get("content_type", "text"),  # text, audio, video
        "category": data.get("category", "Mantra"),
        "text_content": data.get("text_content", ""),
        "media_url": data.get("media_url", ""),
        "views": 0,
        "likes": 0,
        "is_published": data.get("is_published", True),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_content_collection.insert_one(content_dict)
    return {"message": "Content posted", "content_id": str(result.inserted_id)}

@app.delete("/api/priest/content/{content_id}")
async def delete_priest_content(content_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete content"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    content = await priest_content_collection.find_one({"_id": ObjectId(content_id)})
    
    if not content or content["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Content not found")
    
    await priest_content_collection.delete_one({"_id": ObjectId(content_id)})
    return {"message": "Content deleted"}

# ===================== PRIEST DASHBOARD - LIVE STREAMING =====================
@app.get("/api/priest/streams")
async def get_priest_streams(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's live streams"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    cursor = priest_streams_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    streams = []
    async for stream in cursor:
        streams.append({
            "id": str(stream["_id"]),
            "title": stream["title"],
            "description": stream.get("description", ""),
            "stream_type": stream.get("stream_type", "puja"),
            "status": stream.get("status", "scheduled"),  # scheduled, live, ended
            "scheduled_at": stream.get("scheduled_at").isoformat() if isinstance(stream.get("scheduled_at"), datetime) else stream.get("scheduled_at", ""),
            "started_at": stream.get("started_at").isoformat() if isinstance(stream.get("started_at"), datetime) else stream.get("started_at"),
            "ended_at": stream.get("ended_at").isoformat() if isinstance(stream.get("ended_at"), datetime) else stream.get("ended_at"),
            "viewer_count": stream.get("viewer_count", 0),
            "max_viewers": stream.get("max_viewers", 0),
            "created_at": stream["created_at"].isoformat() if isinstance(stream["created_at"], datetime) else stream["created_at"]
        })
    return {"streams": streams}

@app.post("/api/priest/streams")
async def create_stream(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Schedule or start a live stream"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    data = await request.json()
    
    stream_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "title": data.get("title"),
        "description": data.get("description", ""),
        "stream_type": data.get("stream_type", "puja"),  # puja, class, discourse, aarti
        "status": "scheduled",
        "scheduled_at": datetime.fromisoformat(data["scheduled_at"]) if data.get("scheduled_at") else datetime.now(timezone.utc),
        "viewer_count": 0,
        "max_viewers": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_streams_collection.insert_one(stream_dict)
    return {"message": "Stream scheduled", "stream_id": str(result.inserted_id)}

@app.put("/api/priest/streams/{stream_id}/start")
async def start_stream(stream_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Start a live stream"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    await priest_streams_collection.update_one(
        {"_id": ObjectId(stream_id)},
        {"$set": {"status": "live", "started_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Stream started", "status": "live"}

@app.put("/api/priest/streams/{stream_id}/end")
async def end_stream(stream_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """End a live stream"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    await priest_streams_collection.update_one(
        {"_id": ObjectId(stream_id)},
        {"$set": {"status": "ended", "ended_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Stream ended", "status": "ended"}


# ===================== PRIEST PROFILE MANAGEMENT =====================
@app.get("/api/priest/profile")
async def get_priest_profile(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's own profile"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        # Create default profile
        priest = {
            "user_id": str(user["_id"]),
            "specializations": [],
            "languages": ["Hindi", "Sanskrit"],
            "experience_years": 1,
            "bio": "",
            "work_locations": [],
            "service_areas": [],
            "base_price": 1100,
            "profile_photo": None,
            "is_verified": False,
            "created_at": datetime.now(timezone.utc)
        }
        await priests_collection.insert_one(priest)
    
    return {
        "id": str(priest.get("_id", "")),
        "specializations": priest.get("specializations", []),
        "languages": priest.get("languages", ["Hindi", "Sanskrit"]),
        "experience_years": priest.get("experience_years", 1),
        "bio": priest.get("bio", ""),
        "work_locations": priest.get("work_locations", []),
        "service_areas": priest.get("service_areas", []),
        "base_price": priest.get("base_price", 1100),
        "profile_photo": priest.get("profile_photo"),
        "is_verified": priest.get("is_verified", False),
        "address": priest.get("address", ""),
        "city": priest.get("city", ""),
        "state": priest.get("state", ""),
        "pincode": priest.get("pincode", "")
    }

@app.put("/api/priest/profile")
async def update_priest_profile(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update priest's profile"""
    data = await request.json()
    
    update_data = {}
    allowed_fields = [
        "bio", "specializations", "languages", "experience_years", 
        "work_locations", "service_areas", "base_price", "profile_photo",
        "address", "city", "state", "pincode", "phone", "email"
    ]
    
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await priests_collection.update_one(
        {"user_id": str(user["_id"])},
        {"$set": update_data},
        upsert=True
    )
    
    # Also update user email/phone if provided
    if "email" in data or "phone" in data:
        user_update = {}
        if "email" in data:
            user_update["email"] = data["email"]
        if "phone" in data:
            user_update["phone"] = data["phone"]
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": user_update}
        )
    
    return {"message": "Profile updated successfully"}

# ===================== PRIEST REVIEWS =====================
@app.get("/api/priest/reviews")
async def get_priest_reviews(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get reviews for the priest"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        return {"reviews": [], "avg_rating": 0, "total_reviews": 0}
    
    # Get reviews from bookings collection
    cursor = bookings_collection.find({
        "priest_id": str(priest["_id"]),
        "review": {"$exists": True}
    }).sort("created_at", -1)
    
    reviews = []
    total_rating = 0
    async for booking in cursor:
        review = booking.get("review", {})
        if review:
            reviews.append({
                "id": str(booking["_id"]),
                "user_name": booking.get("user_name", "Anonymous"),
                "service_name": booking.get("service_name", ""),
                "rating": review.get("rating", 5),
                "comment": review.get("comment", ""),
                "created_at": review.get("created_at", booking.get("created_at")).isoformat() if isinstance(review.get("created_at", booking.get("created_at")), datetime) else str(review.get("created_at", booking.get("created_at")))
            })
            total_rating += review.get("rating", 5)
    
    avg_rating = round(total_rating / len(reviews), 1) if reviews else 0
    
    return {
        "reviews": reviews,
        "avg_rating": avg_rating,
        "total_reviews": len(reviews)
    }

# ===================== PRIEST PORTFOLIO =====================
@app.get("/api/priest/portfolio")
async def get_priest_portfolio(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's portfolio items"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        return {"items": []}
    
    cursor = priest_portfolio_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    items = []
    async for item in cursor:
        items.append({
            "id": str(item["_id"]),
            "title": item.get("title", ""),
            "description": item.get("description", ""),
            "type": item.get("type", "image"),
            "url": item.get("url", ""),
            "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else str(item.get("created_at"))
        })
    
    return {"items": items}

@app.post("/api/priest/portfolio")
async def add_portfolio_item(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Add portfolio item"""
    data = await request.json()
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    item = {
        "priest_id": str(priest["_id"]),
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "type": data.get("type", "image"),
        "url": data.get("url", ""),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_portfolio_collection.insert_one(item)
    return {"message": "Portfolio item added", "id": str(result.inserted_id)}

@app.delete("/api/priest/portfolio/{item_id}")
async def delete_portfolio_item(item_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete portfolio item"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    item = await priest_portfolio_collection.find_one({"_id": ObjectId(item_id)})
    
    if not item or item["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Item not found")
    
    await priest_portfolio_collection.delete_one({"_id": ObjectId(item_id)})
    return {"message": "Portfolio item deleted"}

# ===================== PRIEST SERVICES =====================
@app.get("/api/priest/services")
async def get_priest_services(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's services"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        return {"services": []}
    
    cursor = priest_services_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    services = []
    async for service in cursor:
        services.append({
            "id": str(service["_id"]),
            "name": service.get("name", ""),
            "description": service.get("description", ""),
            "category": service.get("category", "Pooja"),
            "duration_minutes": service.get("duration_minutes", 60),
            "price": service.get("price", 1100),
            "is_available": service.get("is_available", True),
            "created_at": service.get("created_at").isoformat() if isinstance(service.get("created_at"), datetime) else str(service.get("created_at"))
        })
    
    return {"services": services}

@app.post("/api/priest/services")
async def add_priest_service(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Add a new service"""
    data = await request.json()
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    service = {
        "priest_id": str(priest["_id"]),
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "category": data.get("category", "Pooja"),
        "duration_minutes": data.get("duration_minutes", 60),
        "price": data.get("price", 1100),
        "is_available": data.get("is_available", True),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_services_collection.insert_one(service)
    return {"message": "Service added", "id": str(result.inserted_id)}

@app.put("/api/priest/services/{service_id}")
async def update_priest_service(service_id: str, request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update a service"""
    data = await request.json()
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    service = await priest_services_collection.find_one({"_id": ObjectId(service_id)})
    
    if not service or service["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_fields = ["name", "description", "category", "duration_minutes", "price", "is_available"]
    update_data = {k: data[k] for k in update_fields if k in data}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await priest_services_collection.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": update_data}
    )
    return {"message": "Service updated"}

@app.delete("/api/priest/services/{service_id}")
async def delete_priest_service(service_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a service"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    service = await priest_services_collection.find_one({"_id": ObjectId(service_id)})
    
    if not service or service["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Service not found")
    
    await priest_services_collection.delete_one({"_id": ObjectId(service_id)})
    return {"message": "Service deleted"}

# ===================== PRIEST EARNINGS =====================
@app.get("/api/priest/earnings")
async def get_priest_earnings(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get priest's earnings summary and transactions"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        return {
            "total_earnings": 0,
            "monthly_earnings": 0,
            "pending_payouts": 0,
            "transactions": []
        }
    
    # Get completed bookings
    cursor = bookings_collection.find({
        "priest_id": str(priest["_id"]),
        "status": "completed"
    }).sort("created_at", -1).limit(50)
    
    total_earnings = 0
    monthly_earnings = 0
    transactions = []
    current_month = datetime.now(timezone.utc).month
    current_year = datetime.now(timezone.utc).year
    
    async for booking in cursor:
        amount = booking.get("price", 0)
        total_earnings += amount
        
        booking_date = booking.get("created_at")
        if isinstance(booking_date, datetime):
            if booking_date.month == current_month and booking_date.year == current_year:
                monthly_earnings += amount
        
        transactions.append({
            "id": str(booking["_id"]),
            "description": booking.get("service_name", "Booking"),
            "amount": amount,
            "type": "credit",
            "date": booking_date.isoformat() if isinstance(booking_date, datetime) else str(booking_date),
            "status": "completed"
        })
    
    return {
        "total_earnings": total_earnings,
        "monthly_earnings": monthly_earnings,
        "pending_payouts": 0,  # Would be calculated based on payout schedule
        "transactions": transactions[:20]  # Limit to 20 most recent
    }


# ===================== PRIEST DASHBOARD - DAILY POSTS/UPDATES =====================
@app.get("/api/priest/posts")
async def get_priest_posts(user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get all posts by the priest (daily updates)"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        return {"posts": []}
    
    cursor = priest_posts_collection.find({"priest_id": str(priest["_id"])}).sort("created_at", -1)
    posts = []
    async for post in cursor:
        posts.append({
            "id": str(post["_id"]),
            "content": post.get("content", ""),
            "image_url": post.get("image_url", ""),
            "likes": post.get("likes", 0),
            "comments": post.get("comments_count", 0),
            "views": post.get("views", 0),
            "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
        })
    return {"posts": posts}

@app.post("/api/priest/posts")
async def create_priest_post(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Create a new daily post/update"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    data = await request.json()
    
    if not data.get("content"):
        raise HTTPException(status_code=400, detail="Post content is required")
    
    post_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "content": data.get("content"),
        "image_url": data.get("image_url", ""),
        "likes": 0,
        "comments_count": 0,
        "views": 0,
        "is_published": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_posts_collection.insert_one(post_dict)
    return {"message": "Post created", "post_id": str(result.inserted_id)}

@app.delete("/api/priest/posts/{post_id}")
async def delete_priest_post(post_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a post"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    post = await priest_posts_collection.find_one({"_id": ObjectId(post_id)})
    
    if not post or post["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Post not found")
    
    await priest_posts_collection.delete_one({"_id": ObjectId(post_id)})
    return {"message": "Post deleted"}

# Public endpoint to get posts from a specific priest (for devotee feed)
@app.get("/api/posts/priest/{priest_id}")
async def get_public_priest_posts(priest_id: str, skip: int = 0, limit: int = 20):
    """Get published posts from a priest (public)"""
    cursor = priest_posts_collection.find({
        "priest_id": priest_id,
        "is_published": True
    }).skip(skip).limit(limit).sort("created_at", -1)
    
    posts = []
    async for post in cursor:
        posts.append({
            "id": str(post["_id"]),
            "content": post.get("content", ""),
            "image_url": post.get("image_url", ""),
            "priest_name": post.get("priest_name", ""),
            "likes": post.get("likes", 0),
            "comments": post.get("comments_count", 0),
            "views": post.get("views", 0),
            "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
        })
    return {"posts": posts}

# Get all priest posts feed (for devotee dashboard)
@app.get("/api/posts/feed")
async def get_posts_feed(skip: int = 0, limit: int = 50):
    """Get all priest posts feed (public - for devotees)"""
    cursor = priest_posts_collection.find({
        "is_published": True
    }).skip(skip).limit(limit).sort("created_at", -1)
    
    posts = []
    async for post in cursor:
        posts.append({
            "id": str(post["_id"]),
            "content": post.get("content", ""),
            "image_url": post.get("image_url", ""),
            "priest_id": post.get("priest_id", ""),
            "priest_name": post.get("priest_name", ""),
            "likes": post.get("likes", 0),
            "comments": post.get("comments_count", 0),
            "views": post.get("views", 0),
            "created_at": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"]
        })
    return {"posts": posts, "total": len(posts)}


# ===================== POST COMMENTS & LIKES =====================
@app.get("/api/posts/{post_id}/comments")
async def get_post_comments(post_id: str, skip: int = 0, limit: int = 50):
    """Get comments for a post"""
    cursor = post_comments_collection.find({"post_id": post_id}).skip(skip).limit(limit).sort("created_at", -1)
    comments = []
    async for comment in cursor:
        comments.append({
            "id": str(comment["_id"]),
            "post_id": comment["post_id"],
            "user_id": comment["user_id"],
            "user_name": comment.get("user_name", "Anonymous"),
            "user_photo": comment.get("user_photo", ""),
            "content": comment.get("content", ""),
            "image_url": comment.get("image_url", ""),
            "created_at": comment["created_at"].isoformat() if isinstance(comment["created_at"], datetime) else comment["created_at"]
        })
    return {"comments": comments, "total": len(comments)}

@app.post("/api/posts/{post_id}/comments")
async def add_post_comment(post_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Add a comment to a post"""
    # Verify post exists
    post = await priest_posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    data = await request.json()
    
    if not data.get("content") and not data.get("image_url"):
        raise HTTPException(status_code=400, detail="Comment must have text or image")
    
    comment_dict = {
        "post_id": post_id,
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "Anonymous"),
        "user_photo": user.get("profile_photo", ""),
        "content": data.get("content", ""),
        "image_url": data.get("image_url", ""),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await post_comments_collection.insert_one(comment_dict)
    
    # Update comment count on post
    await priest_posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"comments_count": 1}}
    )
    
    return {
        "message": "Comment added",
        "comment_id": str(result.inserted_id),
        "comment": {
            "id": str(result.inserted_id),
            "user_name": user.get("name", "Anonymous"),
            "user_photo": user.get("profile_photo", ""),
            "content": data.get("content", ""),
            "image_url": data.get("image_url", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    }

@app.delete("/api/posts/{post_id}/comments/{comment_id}")
async def delete_post_comment(post_id: str, comment_id: str, user: dict = Depends(get_current_user)):
    """Delete a comment (only by comment author or post author)"""
    comment = await post_comments_collection.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user is comment author
    if comment["user_id"] != str(user["_id"]):
        # Check if user is post author (priest)
        post = await priest_posts_collection.find_one({"_id": ObjectId(post_id)})
        priest = await priests_collection.find_one({"user_id": str(user["_id"])})
        if not post or not priest or post["priest_id"] != str(priest["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    await post_comments_collection.delete_one({"_id": ObjectId(comment_id)})
    
    # Update comment count on post
    await priest_posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"comments_count": -1}}
    )
    
    return {"message": "Comment deleted"}

@app.post("/api/posts/{post_id}/like")
async def like_post(post_id: str, user: dict = Depends(get_current_user)):
    """Like or unlike a post"""
    # Check if already liked
    existing_like = await post_likes_collection.find_one({
        "post_id": post_id,
        "user_id": str(user["_id"])
    })
    
    if existing_like:
        # Unlike - remove the like
        await post_likes_collection.delete_one({"_id": existing_like["_id"]})
        await priest_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"likes": -1}}
        )
        return {"message": "Post unliked", "liked": False}
    else:
        # Like - add the like
        await post_likes_collection.insert_one({
            "post_id": post_id,
            "user_id": str(user["_id"]),
            "created_at": datetime.now(timezone.utc)
        })
        await priest_posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"likes": 1}}
        )
        return {"message": "Post liked", "liked": True}

@app.get("/api/posts/{post_id}/like-status")
async def get_like_status(post_id: str, user: dict = Depends(get_current_user)):
    """Check if user has liked a post"""
    existing_like = await post_likes_collection.find_one({
        "post_id": post_id,
        "user_id": str(user["_id"])
    })
    return {"liked": existing_like is not None}


# ===================== PUBLIC - VIEW PRIEST CONTENT =====================
@app.get("/api/content/priest/{priest_id}")
async def get_public_priest_content(priest_id: str, skip: int = 0, limit: int = 20):
    """Get published content from a priest (public)"""
    cursor = priest_content_collection.find({
        "priest_id": priest_id,
        "is_published": True
    }).skip(skip).limit(limit).sort("created_at", -1)
    
    content_list = []
    async for content in cursor:
        content_list.append({
            "id": str(content["_id"]),
            "title": content["title"],
            "description": content.get("description", ""),
            "content_type": content["content_type"],
            "category": content.get("category", "General"),
            "text_content": content.get("text_content", ""),
            "media_url": content.get("media_url", ""),
            "priest_name": content.get("priest_name", ""),
            "views": content.get("views", 0),
            "likes": content.get("likes", 0),
            "created_at": content["created_at"].isoformat() if isinstance(content["created_at"], datetime) else content["created_at"]
        })
    return {"content": content_list}

@app.get("/api/streams/live")
async def get_live_streams():
    """Get all currently live streams (public)"""
    cursor = priest_streams_collection.find({"status": "live"})
    streams = []
    async for stream in cursor:
        streams.append({
            "id": str(stream["_id"]),
            "title": stream["title"],
            "description": stream.get("description", ""),
            "stream_type": stream.get("stream_type", "puja"),
            "priest_name": stream.get("priest_name", ""),
            "priest_id": stream["priest_id"],
            "viewer_count": stream.get("viewer_count", 0),
            "started_at": stream.get("started_at").isoformat() if isinstance(stream.get("started_at"), datetime) else stream.get("started_at")
        })
    return {"streams": streams}

# ===================== MARKETPLACE ROUTES =====================
@app.get("/api/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    cursor = products_collection.find(query).skip(skip).limit(limit)
    products = []
    async for product in cursor:
        products.append({
            "id": str(product["_id"]),
            "shop_id": product["shop_id"],
            "shop_name": product.get("shop_name", "Unknown"),
            "name": product["name"],
            "description": product["description"],
            "price": product["price"],
            "category": product["category"],
            "stock": product["stock"],
            "images": product.get("images", []),
            "rating": product.get("rating", 0),
            "total_reviews": product.get("total_reviews", 0)
        })
    return {"products": products, "total": await products_collection.count_documents(query)}

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": str(product["_id"]),
        "shop_id": product["shop_id"],
        "shop_name": product.get("shop_name", "Unknown"),
        "name": product["name"],
        "description": product["description"],
        "price": product["price"],
        "category": product["category"],
        "stock": product["stock"],
        "images": product.get("images", []),
        "rating": product.get("rating", 0),
        "total_reviews": product.get("total_reviews", 0)
    }

@app.get("/api/product-categories")
async def get_product_categories():
    categories = await products_collection.distinct("category")
    return {"categories": categories}

# ===================== CART ROUTES =====================
@app.get("/api/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    if not cart:
        return {"items": [], "total": 0}
    
    items = []
    total = 0
    for item in cart.get("items", []):
        product = await products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            item_total = product["price"] * item["quantity"]
            total += item_total
            items.append({
                "product_id": item["product_id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": item["quantity"],
                "subtotal": item_total,
                "image": product.get("images", [""])[0] if product.get("images") else ""
            })
    
    return {"items": items, "total": total}

@app.post("/api/cart/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    product = await products_collection.find_one({"_id": ObjectId(item.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product["stock"] < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    
    if cart:
        existing_item = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
        if existing_item:
            await cart_collection.update_one(
                {"user_id": str(user["_id"]), "items.product_id": item.product_id},
                {"$set": {"items.$.quantity": existing_item["quantity"] + item.quantity}}
            )
        else:
            await cart_collection.update_one(
                {"user_id": str(user["_id"])},
                {"$push": {"items": {"product_id": item.product_id, "quantity": item.quantity}}}
            )
    else:
        await cart_collection.insert_one({
            "user_id": str(user["_id"]),
            "items": [{"product_id": item.product_id, "quantity": item.quantity}],
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"message": "Item added to cart"}

@app.put("/api/cart/update")
async def update_cart_item(item: CartItem, user: dict = Depends(get_current_user)):
    if item.quantity <= 0:
        await cart_collection.update_one(
            {"user_id": str(user["_id"])},
            {"$pull": {"items": {"product_id": item.product_id}}}
        )
    else:
        await cart_collection.update_one(
            {"user_id": str(user["_id"]), "items.product_id": item.product_id},
            {"$set": {"items.$.quantity": item.quantity}}
        )
    return {"message": "Cart updated"}

@app.delete("/api/cart/clear")
async def clear_cart(user: dict = Depends(get_current_user)):
    await cart_collection.delete_one({"user_id": str(user["_id"])})
    return {"message": "Cart cleared"}

# ===================== ORDER ROUTES =====================
@app.post("/api/orders")
async def create_order(data: OrderCreate, user: dict = Depends(get_current_user)):
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = []
    total = 0
    shop_ids = set()
    for cart_item in cart["items"]:
        product = await products_collection.find_one({"_id": ObjectId(cart_item["product_id"])})
        if product:
            item_total = product["price"] * cart_item["quantity"]
            total += item_total
            items.append({
                "product_id": cart_item["product_id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": cart_item["quantity"],
                "subtotal": item_total,
                "shop_id": product.get("shop_id")
            })
            if product.get("shop_id"):
                shop_ids.add(product.get("shop_id"))
    
    order_dict = {
        "user_id": str(user["_id"]),
        "items": items,
        "total_amount": total,
        "shipping_address": data.shipping_address,
        "status": OrderStatus.PENDING,
        "payment_method": data.payment_method,
        "payment_status": "pending",
        "shop_ids": list(shop_ids),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await orders_collection.insert_one(order_dict)
    order_id = str(result.inserted_id)
    
    # Create chat rooms with each shop owner
    for shop_id in shop_ids:
        shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
        if shop:
            shop_owner = await users_collection.find_one({"_id": ObjectId(shop["owner_id"])})
            if shop_owner:
                context = f"Order #{order_id[:8]} - {len(items)} item(s)"
                await create_chat_room(
                    room_type="order",
                    reference_id=order_id,
                    participant1_id=str(user["_id"]),
                    participant1_name=user.get("name", "Customer"),
                    participant2_id=str(shop_owner["_id"]),
                    participant2_name=shop.get("name", shop_owner.get("name", "Shop")),
                    context=context
                )
    
    await cart_collection.delete_one({"user_id": str(user["_id"])})
    
    return {"message": "Order created", "order_id": order_id, "total": total}

@app.put("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Update order status (shop owner or admin)"""
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization - shop owner or admin
    is_shop_owner = False
    for shop_id in order.get("shop_ids", []):
        shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
        if shop and shop["owner_id"] == str(user["_id"]):
            is_shop_owner = True
            break
    
    if not is_shop_owner and user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    new_status = data.get("status")
    
    valid_statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status}}
    )
    
    # Deactivate chat when order is delivered or cancelled
    if new_status in ["delivered", "cancelled"]:
        await deactivate_chat_room("order", order_id)
    
    return {"message": "Order status updated"}

@app.get("/api/orders")
async def get_user_orders(user: dict = Depends(get_current_user)):
    cursor = orders_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    orders = []
    async for order in cursor:
        orders.append({
            "id": str(order["_id"]),
            "items": order["items"],
            "total_amount": order["total_amount"],
            "shipping_address": order["shipping_address"],
            "status": order["status"],
            "payment_method": order["payment_method"],
            "payment_status": order["payment_status"],
            "created_at": order["created_at"].isoformat()
        })
    return {"orders": orders}

# ===================== HOROSCOPE ROUTES =====================
@app.get("/api/horoscope/daily/{zodiac_sign}")
async def get_daily_horoscope_api(zodiac_sign: str):
    """Get daily horoscope for a zodiac sign using Prokerala API"""
    try:
        horoscope = await prokerala.get_daily_horoscope(zodiac_sign.lower())
        return horoscope
    except Exception as e:
        print(f"Prokerala API error, using fallback: {e}")
        return prokerala.get_fallback_horoscope(zodiac_sign.lower())

@app.get("/api/horoscope/personalized")
async def get_personalized_horoscope(user: dict = Depends(get_current_user)):
    """Get personalized daily horoscope based on user's nakshatra or DOB"""
    # Determine the user's zodiac sign
    sign = None
    
    # First try nakshatra (Vedic astrology)
    if user.get("nakshatra"):
        sign = prokerala.get_rashi_from_nakshatra(user["nakshatra"])
    
    # Fallback to DOB (Western astrology)
    if not sign and user.get("date_of_birth"):
        sign = prokerala.get_rashi_from_date(user["date_of_birth"])
    
    if not sign:
        sign = "aries"  # Default fallback
    
    try:
        horoscope = await prokerala.get_daily_horoscope(sign)
        rashi_info = prokerala.RASHI_NAMES.get(sign, {"en": sign.title(), "hi": sign.title()})
        horoscope["user_sign"] = sign
        horoscope["user_sign_name"] = rashi_info["en"]
        horoscope["user_sign_hindi"] = rashi_info["hi"]
        horoscope["user_nakshatra"] = user.get("nakshatra")
        return horoscope
    except Exception as e:
        print(f"Error getting personalized horoscope: {e}")
        fallback = prokerala.get_fallback_horoscope(sign)
        fallback["user_sign"] = sign
        fallback["user_nakshatra"] = user.get("nakshatra")
        return fallback

class KundaliRequest(BaseModel):
    datetime: str  # ISO format: 2004-02-12T15:19:21+05:30
    latitude: float
    longitude: float
    ayanamsa: int = 1

@app.post("/api/astrology/birth-kundali")
async def get_birth_kundali(data: KundaliRequest, user: dict = Depends(get_optional_user)):
    """Get birth kundali (birth chart) using Prokerala API"""
    try:
        result = await prokerala.get_birth_kundali(
            data.datetime,
            data.latitude,
            data.longitude,
            data.ayanamsa
        )
        
        # Save to user profile if logged in
        if user:
            await users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "birth_kundali": result,
                    "birth_coordinates": {"lat": data.latitude, "lon": data.longitude}
                }}
            )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class KundaliMatchingRequest(BaseModel):
    bride_datetime: str
    bride_latitude: float
    bride_longitude: float
    groom_datetime: str
    groom_latitude: float
    groom_longitude: float
    ayanamsa: int = 1

@app.post("/api/astrology/kundali-matching")
async def get_kundali_matching(data: KundaliMatchingRequest, user: dict = Depends(get_optional_user)):
    """Get kundali matching for marriage compatibility using Prokerala API"""
    try:
        result = await prokerala.get_kundali_matching(
            data.bride_datetime,
            data.bride_latitude,
            data.bride_longitude,
            data.groom_datetime,
            data.groom_latitude,
            data.groom_longitude,
            data.ayanamsa
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/astrology/panchang")
async def get_panchang(
    latitude: float = Query(default=28.6139),  # Default: Delhi
    longitude: float = Query(default=77.2090)
):
    """Get today's Panchang (Hindu calendar)"""
    try:
        today = datetime.now(timezone.utc)
        datetime_str = today.strftime("%Y-%m-%dT%H:%M:%S+00:00")
        
        result = await prokerala.get_panchang(datetime_str, latitude, longitude)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/astrology/mangal-dosha")
async def check_mangal_dosha(data: KundaliRequest, user: dict = Depends(get_optional_user)):
    """Check for Mangal Dosha (Mars affliction)"""
    try:
        result = await prokerala.get_mangal_dosha(
            data.datetime,
            data.latitude,
            data.longitude
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/horoscope/nakshatras")
async def get_nakshatras():
    """Get list of all 27 Nakshatras with their details"""
    nakshatras = [
        {"name": "Ashwini", "rashi": "Aries", "lord": "Ketu", "symbol": "Horse head"},
        {"name": "Bharani", "rashi": "Aries", "lord": "Venus", "symbol": "Yoni"},
        {"name": "Krittika", "rashi": "Aries/Taurus", "lord": "Sun", "symbol": "Razor"},
        {"name": "Rohini", "rashi": "Taurus", "lord": "Moon", "symbol": "Cart"},
        {"name": "Mrigashira", "rashi": "Taurus/Gemini", "lord": "Mars", "symbol": "Deer head"},
        {"name": "Ardra", "rashi": "Gemini", "lord": "Rahu", "symbol": "Teardrop"},
        {"name": "Punarvasu", "rashi": "Gemini/Cancer", "lord": "Jupiter", "symbol": "Bow"},
        {"name": "Pushya", "rashi": "Cancer", "lord": "Saturn", "symbol": "Flower"},
        {"name": "Ashlesha", "rashi": "Cancer", "lord": "Mercury", "symbol": "Serpent"},
        {"name": "Magha", "rashi": "Leo", "lord": "Ketu", "symbol": "Throne"},
        {"name": "Purva Phalguni", "rashi": "Leo", "lord": "Venus", "symbol": "Hammock"},
        {"name": "Uttara Phalguni", "rashi": "Leo/Virgo", "lord": "Sun", "symbol": "Bed"},
        {"name": "Hasta", "rashi": "Virgo", "lord": "Moon", "symbol": "Hand"},
        {"name": "Chitra", "rashi": "Virgo/Libra", "lord": "Mars", "symbol": "Pearl"},
        {"name": "Swati", "rashi": "Libra", "lord": "Rahu", "symbol": "Coral"},
        {"name": "Vishakha", "rashi": "Libra/Scorpio", "lord": "Jupiter", "symbol": "Archway"},
        {"name": "Anuradha", "rashi": "Scorpio", "lord": "Saturn", "symbol": "Lotus"},
        {"name": "Jyeshtha", "rashi": "Scorpio", "lord": "Mercury", "symbol": "Earring"},
        {"name": "Mula", "rashi": "Sagittarius", "lord": "Ketu", "symbol": "Root"},
        {"name": "Purva Ashadha", "rashi": "Sagittarius", "lord": "Venus", "symbol": "Fan"},
        {"name": "Uttara Ashadha", "rashi": "Sagittarius/Capricorn", "lord": "Sun", "symbol": "Tusk"},
        {"name": "Shravana", "rashi": "Capricorn", "lord": "Moon", "symbol": "Ear"},
        {"name": "Dhanishta", "rashi": "Capricorn/Aquarius", "lord": "Mars", "symbol": "Drum"},
        {"name": "Shatabhisha", "rashi": "Aquarius", "lord": "Rahu", "symbol": "Circle"},
        {"name": "Purva Bhadrapada", "rashi": "Aquarius/Pisces", "lord": "Jupiter", "symbol": "Sword"},
        {"name": "Uttara Bhadrapada", "rashi": "Pisces", "lord": "Saturn", "symbol": "Twins"},
        {"name": "Revati", "rashi": "Pisces", "lord": "Mercury", "symbol": "Fish"}
    ]
    return {"nakshatras": nakshatras}

@app.post("/api/horoscope/birth-chart")
async def generate_birth_chart_api(data: BirthDetails, user: dict = Depends(get_optional_user)):
    chart = generate_birth_chart(data.date_of_birth, data.time_of_birth, data.place_of_birth)
    
    # Save if user is logged in
    if user:
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"birth_chart": chart, "birth_details": data.dict()}}
        )
    
    return chart

@app.get("/api/horoscope/zodiac-signs")
async def get_zodiac_signs():
    signs = [
        {"name": "Aries", "symbol": "Ram", "element": "Fire", "dates": "Mar 21 - Apr 19"},
        {"name": "Taurus", "symbol": "Bull", "element": "Earth", "dates": "Apr 20 - May 20"},
        {"name": "Gemini", "symbol": "Twins", "element": "Air", "dates": "May 21 - Jun 20"},
        {"name": "Cancer", "symbol": "Crab", "element": "Water", "dates": "Jun 21 - Jul 22"},
        {"name": "Leo", "symbol": "Lion", "element": "Fire", "dates": "Jul 23 - Aug 22"},
        {"name": "Virgo", "symbol": "Virgin", "element": "Earth", "dates": "Aug 23 - Sep 22"},
        {"name": "Libra", "symbol": "Scales", "element": "Air", "dates": "Sep 23 - Oct 22"},
        {"name": "Scorpio", "symbol": "Scorpion", "element": "Water", "dates": "Oct 23 - Nov 21"},
        {"name": "Sagittarius", "symbol": "Archer", "element": "Fire", "dates": "Nov 22 - Dec 21"},
        {"name": "Capricorn", "symbol": "Goat", "element": "Earth", "dates": "Dec 22 - Jan 19"},
        {"name": "Aquarius", "symbol": "Water Bearer", "element": "Air", "dates": "Jan 20 - Feb 18"},
        {"name": "Pisces", "symbol": "Fish", "element": "Water", "dates": "Feb 19 - Mar 20"},
    ]
    return {"signs": signs}

# ===================== ASTROLOGER ROUTES =====================
@app.get("/api/astrologers")
async def get_astrologers(skip: int = 0, limit: int = 20):
    cursor = astrologers_collection.find({"is_verified": True}).skip(skip).limit(limit)
    astrologers = []
    async for astro in cursor:
        user = await users_collection.find_one({"_id": ObjectId(astro["user_id"])})
        astrologers.append({
            "id": str(astro["_id"]),
            "user_id": astro["user_id"],
            "user_name": user["name"] if user else "Unknown",
            "specializations": astro["specializations"],
            "experience_years": astro["experience_years"],
            "languages": astro["languages"],
            "consultation_fee": astro["consultation_fee"],
            "bio": astro["bio"],
            "rating": astro.get("rating", 0),
            "is_verified": astro.get("is_verified", False)
        })
    return {"astrologers": astrologers}

# ===================== FESTIVAL & TEMPLE ROUTES =====================
@app.get("/api/festivals")
async def get_festivals():
    cursor = festivals_collection.find({}).sort("date", 1)
    festivals = []
    async for festival in cursor:
        festivals.append({
            "id": str(festival["_id"]),
            "name": festival["name"],
            "date": festival["date"],
            "description": festival["description"],
            "importance": festival.get("importance", "Medium")
        })
    return {"festivals": festivals}

@app.get("/api/temples")
async def get_temples(city: Optional[str] = None, state: Optional[str] = None):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    
    cursor = temples_collection.find(query)
    temples = []
    async for temple in cursor:
        temples.append({
            "id": str(temple["_id"]),
            "name": temple["name"],
            "city": temple["city"],
            "state": temple["state"],
            "deity": temple["deity"],
            "description": temple["description"]
        })
    return {"temples": temples}

# ===================== PAYMENT ROUTES (STRIPE) =====================
class StripeIntentRequest(BaseModel):
    amount: int  # in cents
    currency: str = "usd"
    description: Optional[str] = None
    metadata: Optional[dict] = None

class RazorpayOrderRequest(BaseModel):
    amount: int  # in paise
    currency: str = "INR"
    description: Optional[str] = None
    metadata: Optional[dict] = None

@app.post("/api/payments/stripe/create-intent")
async def create_stripe_payment_intent(data: StripeIntentRequest, user: dict = Depends(get_current_user)):
    """Create a Stripe payment intent"""
    import stripe
    
    # Get Stripe credentials from system config or env
    stripe_creds = await get_stripe_credentials()
    stripe.api_key = stripe_creds["secret_key"]
    
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=data.amount,
            currency=data.currency,
            metadata={
                "user_id": str(user["_id"]),
                **(data.metadata or {})
            }
        )
        
        # Record the transaction
        await payment_transactions_collection.insert_one({
            "user_id": str(user["_id"]),
            "payment_intent_id": intent.id,
            "amount": data.amount / 100,  # Convert back to dollars
            "currency": data.currency.upper(),
            "payment_method": "stripe",
            "payment_status": "pending",
            "description": data.description,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/payments/razorpay/create-order")
async def create_razorpay_order(data: RazorpayOrderRequest, user: dict = Depends(get_current_user)):
    """Create a Razorpay order"""
    import razorpay
    
    # Get Razorpay credentials from system config or env
    razorpay_creds = await get_razorpay_credentials()
    
    if not razorpay_creds["key_id"] or not razorpay_creds["key_secret"]:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
    
    try:
        client = razorpay.Client(auth=(razorpay_creds["key_id"], razorpay_creds["key_secret"]))
        
        order_data = {
            "amount": data.amount,
            "currency": data.currency,
            "notes": {
                "user_id": str(user["_id"]),
                **(data.metadata or {})
            }
        }
        
        order = client.order.create(data=order_data)
        
        # Record the transaction
        await payment_transactions_collection.insert_one({
            "user_id": str(user["_id"]),
            "order_id": order["id"],
            "amount": data.amount / 100,  # Convert back to rupees
            "currency": data.currency,
            "payment_method": "razorpay",
            "payment_status": "pending",
            "description": data.description,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {
            "order_id": order["id"],
            "razorpay_key": razorpay_creds["key_id"],
            "amount": data.amount,
            "currency": data.currency
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/payments/create-checkout")
async def create_stripe_checkout(request: Request, payment: PaymentCreate, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    # Get Stripe credentials from system config or env
    stripe_creds = await get_stripe_credentials()
    
    if not stripe_creds["secret_key"]:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    stripe_checkout = StripeCheckout(
        api_key=stripe_creds["secret_key"],
        webhook_url=webhook_url
    )
    
    # Determine success/cancel URLs
    origin = request.headers.get("origin", host_url)
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(payment.amount),
        currency=payment.currency.lower(),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": str(user["_id"]),
            "payment_type": payment.payment_type,
            "reference_id": payment.reference_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await payment_transactions_collection.insert_one({
        "user_id": str(user["_id"]),
        "session_id": session.session_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "payment_type": payment.payment_type,
        "reference_id": payment.reference_id,
        "payment_method": "stripe",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"url": session.url, "session_id": session.session_id}

@app.get("/api/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    # Get Stripe credentials from system config or env
    stripe_creds = await get_stripe_credentials()
    
    if not stripe_creds["secret_key"]:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    stripe_checkout = StripeCheckout(
        api_key=stripe_creds["secret_key"],
        webhook_url=webhook_url
    )
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction
    await payment_transactions_collection.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": status.payment_status, "status": status.status}}
    )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")
    
    # Process webhook (simplified)
    return {"received": True}

# ===================== ADMIN ROUTES =====================
@app.get("/api/admin/stats")
async def get_admin_stats(user: dict = Depends(require_role([UserRole.ADMIN]))):
    stats = {
        "total_users": await users_collection.count_documents({}),
        "total_priests": await priests_collection.count_documents({}),
        "total_astrologers": await astrologers_collection.count_documents({}),
        "total_products": await products_collection.count_documents({}),
        "total_bookings": await bookings_collection.count_documents({}),
        "total_orders": await orders_collection.count_documents({}),
        "pending_verifications": await priests_collection.count_documents({"is_verified": False})
    }
    return stats

@app.get("/api/admin/users")
async def get_all_users(user: dict = Depends(require_role([UserRole.ADMIN])), skip: int = 0, limit: int = 50):
    cursor = users_collection.find({}, {"password": 0}).skip(skip).limit(limit)
    users = []
    async for u in cursor:
        users.append({
            "id": str(u["_id"]),
            "email": u["email"],
            "name": u["name"],
            "role": u["role"],
            "is_verified": u.get("is_verified", False),
            "created_at": u["created_at"].isoformat() if isinstance(u.get("created_at"), datetime) else None
        })
    return {"users": users, "total": await users_collection.count_documents({})}

@app.put("/api/admin/verify-priest/{priest_id}")
async def verify_priest(priest_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    result = await priests_collection.update_one(
        {"_id": ObjectId(priest_id)},
        {"$set": {"is_verified": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Priest not found")
    return {"message": "Priest verified"}

@app.put("/api/admin/verify-astrologer/{astrologer_id}")
async def verify_astrologer(astrologer_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    result = await astrologers_collection.update_one(
        {"_id": ObjectId(astrologer_id)},
        {"$set": {"is_verified": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Astrologer not found")
    return {"message": "Astrologer verified"}

@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, admin: dict = Depends(require_role([UserRole.ADMIN]))):
    """Admin endpoint to update a user's role"""
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update the user's role
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role}}
    )
    
    # If changing to priest, create priest profile if not exists
    if role == UserRole.PRIEST:
        existing_priest = await priests_collection.find_one({"user_id": user_id})
        if not existing_priest:
            priest_profile = {
                "user_id": user_id,
                "specializations": [],
                "languages": ["Hindi", "Sanskrit"],
                "experience_years": 1,
                "bio": "",
                "services": [],
                "rating": 0.0,
                "total_reviews": 0,
                "is_verified": False,
                "created_at": datetime.now(timezone.utc)
            }
            await priests_collection.insert_one(priest_profile)
    
    return {"message": f"User role updated to {role}"}



# ===================== SHOP OWNER ROUTES =====================
@app.post("/api/shop/register")
async def register_shop(data: ShopCreate, user: dict = Depends(get_current_user)):
    existing = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if existing:
        raise HTTPException(status_code=400, detail="Already have a shop")
    
    shop_dict = {
        "owner_id": str(user["_id"]),
        "name": data.name,
        "description": data.description,
        "address": data.address,
        "city": data.city,
        "phone": data.phone,
        "rating": 0.0,
        "is_verified": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await shops_collection.insert_one(shop_dict)
    await users_collection.update_one({"_id": user["_id"]}, {"$set": {"role": UserRole.SHOP_OWNER}})
    
    return {"message": "Shop registered", "shop_id": str(result.inserted_id)}

@app.post("/api/shop/products")
async def add_product(data: ProductCreate, user: dict = Depends(require_role([UserRole.SHOP_OWNER, UserRole.ADMIN]))):
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    product_dict = {
        "shop_id": str(shop["_id"]),
        "shop_name": shop["name"],
        "name": data.name,
        "description": data.description,
        "price": data.price,
        "category": data.category,
        "stock": data.stock,
        "images": data.images,
        "video_url": data.video_url,
        "rating": 0.0,
        "total_reviews": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await products_collection.insert_one(product_dict)
    return {"message": "Product added", "product_id": str(result.inserted_id)}

@app.get("/api/shop/my-products")
async def get_my_products(user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    cursor = products_collection.find({"shop_id": str(shop["_id"])})
    products = []
    async for product in cursor:
        products.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "description": product["description"],
            "price": product["price"],
            "category": product["category"],
            "stock": product["stock"],
            "images": product.get("images", []),
            "video_url": product.get("video_url"),
            "rating": product.get("rating", 0)
        })
    return {"products": products}

# ===================== SHOP OWNER DASHBOARD APIs =====================

@app.get("/api/shop/profile")
async def get_shop_profile(user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Get shop profile for shop owner"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return {
        "id": str(shop["_id"]),
        "name": shop.get("name"),
        "description": shop.get("description"),
        "address": shop.get("address"),
        "city": shop.get("city"),
        "phone": shop.get("phone"),
        "email": shop.get("email", user.get("email")),
        "logo": shop.get("logo"),
        "banner": shop.get("banner"),
        "shipping_cost": shop.get("shipping_cost", 50),
        "free_shipping_above": shop.get("free_shipping_above", 0),
        "rating": shop.get("rating", 0),
        "is_verified": shop.get("is_verified", False),
        "created_at": shop.get("created_at", datetime.now(timezone.utc)).isoformat()
    }

@app.put("/api/shop/profile")
async def update_shop_profile(request: Request, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Update shop profile"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    data = await request.json()
    allowed_fields = ["name", "description", "address", "city", "phone", "email", 
                      "logo", "banner", "shipping_cost", "free_shipping_above"]
    
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await shops_collection.update_one(
        {"_id": shop["_id"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated"}

@app.get("/api/shop/orders")
async def get_shop_orders(
    status: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.SHOP_OWNER]))
):
    """Get all orders for shop owner's products"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop_id = str(shop["_id"])
    
    # Build query to find orders containing this shop's products
    query = {"shop_ids": shop_id}
    if status:
        query["status"] = status
    
    cursor = orders_collection.find(query).sort("created_at", -1)
    orders = []
    async for order in cursor:
        # Get customer info
        customer = await users_collection.find_one({"_id": ObjectId(order["user_id"])}) if ObjectId.is_valid(order["user_id"]) else None
        
        # Filter items to only this shop's products
        shop_items = [item for item in order["items"] if item.get("shop_id") == shop_id]
        shop_total = sum(item.get("subtotal", 0) for item in shop_items)
        
        orders.append({
            "id": str(order["_id"]),
            "order_number": str(order["_id"])[-8:].upper(),
            "customer_name": customer.get("name", "Unknown") if customer else "Unknown",
            "customer_phone": customer.get("phone", "N/A") if customer else "N/A",
            "customer_email": customer.get("email", "") if customer else "",
            "items": shop_items,
            "item_count": len(shop_items),
            "shop_total": shop_total,
            "shipping_address": order.get("shipping_address"),
            "status": order.get("status"),
            "payment_status": order.get("payment_status"),
            "payment_method": order.get("payment_method"),
            "created_at": order.get("created_at", datetime.now(timezone.utc)).isoformat()
        })
    
    return {"orders": orders}

@app.get("/api/shop/dashboard")
async def get_shop_dashboard(user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Get dashboard statistics for shop owner"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop_id = str(shop["_id"])
    
    # Get product count
    product_count = await products_collection.count_documents({"shop_id": shop_id})
    
    # Get low stock products (stock < 10)
    low_stock_count = await products_collection.count_documents({"shop_id": shop_id, "stock": {"$lt": 10}})
    
    # Get orders statistics
    all_orders = await orders_collection.count_documents({"shop_ids": shop_id})
    pending_orders = await orders_collection.count_documents({"shop_ids": shop_id, "status": "pending"})
    processing_orders = await orders_collection.count_documents({"shop_ids": shop_id, "status": "paid"})
    shipped_orders = await orders_collection.count_documents({"shop_ids": shop_id, "status": "shipped"})
    delivered_orders = await orders_collection.count_documents({"shop_ids": shop_id, "status": "delivered"})
    
    # Calculate revenue
    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Today's revenue
    today_pipeline = [
        {"$match": {"shop_ids": shop_id, "status": {"$in": ["paid", "shipped", "delivered"]}, "created_at": {"$gte": start_of_today}}},
        {"$unwind": "$items"},
        {"$match": {"items.shop_id": shop_id}},
        {"$group": {"_id": None, "total": {"$sum": "$items.subtotal"}}}
    ]
    today_result = await orders_collection.aggregate(today_pipeline).to_list(1)
    today_revenue = today_result[0]["total"] if today_result else 0
    
    # Monthly revenue
    month_pipeline = [
        {"$match": {"shop_ids": shop_id, "status": {"$in": ["paid", "shipped", "delivered"]}, "created_at": {"$gte": start_of_month}}},
        {"$unwind": "$items"},
        {"$match": {"items.shop_id": shop_id}},
        {"$group": {"_id": None, "total": {"$sum": "$items.subtotal"}}}
    ]
    month_result = await orders_collection.aggregate(month_pipeline).to_list(1)
    monthly_revenue = month_result[0]["total"] if month_result else 0
    
    # Total revenue
    total_pipeline = [
        {"$match": {"shop_ids": shop_id, "status": {"$in": ["paid", "shipped", "delivered"]}}},
        {"$unwind": "$items"},
        {"$match": {"items.shop_id": shop_id}},
        {"$group": {"_id": None, "total": {"$sum": "$items.subtotal"}}}
    ]
    total_result = await orders_collection.aggregate(total_pipeline).to_list(1)
    total_revenue = total_result[0]["total"] if total_result else 0
    
    # Recent orders
    recent_cursor = orders_collection.find({"shop_ids": shop_id}).sort("created_at", -1).limit(5)
    recent_orders = []
    async for order in recent_cursor:
        customer = await users_collection.find_one({"_id": ObjectId(order["user_id"])}) if ObjectId.is_valid(order["user_id"]) else None
        shop_items = [item for item in order["items"] if item.get("shop_id") == shop_id]
        recent_orders.append({
            "id": str(order["_id"]),
            "order_number": str(order["_id"])[-8:].upper(),
            "customer_name": customer.get("name", "Unknown") if customer else "Unknown",
            "items_count": len(shop_items),
            "total": sum(item.get("subtotal", 0) for item in shop_items),
            "status": order.get("status"),
            "created_at": order.get("created_at", datetime.now(timezone.utc)).isoformat()
        })
    
    # Top selling products
    top_pipeline = [
        {"$match": {"shop_ids": shop_id, "status": {"$in": ["paid", "shipped", "delivered"]}}},
        {"$unwind": "$items"},
        {"$match": {"items.shop_id": shop_id}},
        {"$group": {"_id": "$items.product_id", "name": {"$first": "$items.name"}, "sold": {"$sum": "$items.quantity"}, "revenue": {"$sum": "$items.subtotal"}}},
        {"$sort": {"sold": -1}},
        {"$limit": 5}
    ]
    top_products = await orders_collection.aggregate(top_pipeline).to_list(5)
    
    return {
        "stats": {
            "total_products": product_count,
            "low_stock": low_stock_count,
            "total_orders": all_orders,
            "pending_orders": pending_orders,
            "processing_orders": processing_orders,
            "shipped_orders": shipped_orders,
            "delivered_orders": delivered_orders,
            "today_revenue": today_revenue,
            "monthly_revenue": monthly_revenue,
            "total_revenue": total_revenue
        },
        "recent_orders": recent_orders,
        "top_products": [{"id": p["_id"], "name": p["name"], "sold": p["sold"], "revenue": p["revenue"]} for p in top_products]
    }

@app.put("/api/shop/products/{product_id}")
async def update_product(product_id: str, request: Request, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Update a product"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    product = await products_collection.find_one({"_id": ObjectId(product_id), "shop_id": str(shop["_id"])})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    data = await request.json()
    allowed_fields = ["name", "description", "price", "category", "stock", "images", "video_url"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    
    return {"message": "Product updated"}

@app.delete("/api/shop/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Delete a product"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    result = await products_collection.delete_one({"_id": ObjectId(product_id), "shop_id": str(shop["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}

@app.get("/api/shop/inventory")
async def get_shop_inventory(user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Get inventory with low stock alerts"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    cursor = products_collection.find({"shop_id": str(shop["_id"])}).sort("stock", 1)
    products = []
    async for product in cursor:
        products.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "category": product["category"],
            "price": product["price"],
            "stock": product["stock"],
            "images": product.get("images", []),
            "is_low_stock": product["stock"] < 10,
            "is_out_of_stock": product["stock"] == 0
        })
    
    return {
        "products": products,
        "total": len(products),
        "low_stock_count": sum(1 for p in products if p["is_low_stock"]),
        "out_of_stock_count": sum(1 for p in products if p["is_out_of_stock"])
    }

@app.put("/api/shop/products/{product_id}/stock")
async def update_product_stock(product_id: str, request: Request, user: dict = Depends(require_role([UserRole.SHOP_OWNER]))):
    """Update product stock"""
    shop = await shops_collection.find_one({"owner_id": str(user["_id"])})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    data = await request.json()
    new_stock = data.get("stock", 0)
    
    result = await products_collection.update_one(
        {"_id": ObjectId(product_id), "shop_id": str(shop["_id"])},
        {"$set": {"stock": new_stock, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Stock updated"}

# Enhanced order creation with shipping calculation
class CheckoutData(BaseModel):
    shipping_address: str
    shipping_city: str
    shipping_phone: str
    shipping_name: str
    payment_method: str = "stripe"
    notes: Optional[str] = None

@app.post("/api/checkout")
async def create_checkout(data: CheckoutData, user: dict = Depends(get_current_user)):
    """Create order with full checkout flow"""
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = []
    subtotal = 0
    shop_shipping = {}  # Track shipping per shop
    shop_names = {}
    
    for cart_item in cart["items"]:
        product = await products_collection.find_one({"_id": ObjectId(cart_item["product_id"])})
        if not product:
            continue
        
        # Check stock
        if product["stock"] < cart_item["quantity"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product['name']}. Available: {product['stock']}"
            )
        
        item_total = product["price"] * cart_item["quantity"]
        subtotal += item_total
        
        shop_id = product.get("shop_id")
        items.append({
            "product_id": cart_item["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": cart_item["quantity"],
            "subtotal": item_total,
            "shop_id": shop_id,
            "image": product.get("images", [None])[0]
        })
        
        # Get shop shipping info
        if shop_id and shop_id not in shop_shipping:
            shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
            if shop:
                shop_shipping[shop_id] = {
                    "cost": shop.get("shipping_cost", 50),
                    "free_above": shop.get("free_shipping_above", 0)
                }
                shop_names[shop_id] = shop.get("name", "Shop")
    
    # Calculate shipping
    total_shipping = 0
    for shop_id, shipping_info in shop_shipping.items():
        shop_subtotal = sum(item["subtotal"] for item in items if item.get("shop_id") == shop_id)
        if shipping_info["free_above"] > 0 and shop_subtotal >= shipping_info["free_above"]:
            # Free shipping
            pass
        else:
            total_shipping += shipping_info["cost"]
    
    total_amount = subtotal + total_shipping
    
    # Create order
    order_dict = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "items": items,
        "subtotal": subtotal,
        "shipping_cost": total_shipping,
        "total_amount": total_amount,
        "shipping_address": data.shipping_address,
        "shipping_city": data.shipping_city,
        "shipping_phone": data.shipping_phone,
        "shipping_name": data.shipping_name,
        "notes": data.notes,
        "status": OrderStatus.PENDING,
        "payment_method": data.payment_method,
        "payment_status": "pending",
        "shop_ids": list(shop_shipping.keys()),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await orders_collection.insert_one(order_dict)
    order_id = str(result.inserted_id)
    
    # Reduce stock for all items
    for item in items:
        await products_collection.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock": -item["quantity"]}}
        )
    
    # Create chat rooms with each shop owner
    for shop_id in shop_shipping.keys():
        shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
        if shop:
            shop_owner = await users_collection.find_one({"_id": ObjectId(shop["owner_id"])})
            if shop_owner:
                shop_items_count = len([i for i in items if i.get("shop_id") == shop_id])
                context = f"Order #{order_id[-8:].upper()} - {shop_items_count} item(s)"
                await create_chat_room(
                    room_type="order",
                    reference_id=order_id,
                    participant1_id=str(user["_id"]),
                    participant1_name=user.get("name", "Customer"),
                    participant2_id=str(shop_owner["_id"]),
                    participant2_name=shop.get("name", shop_owner.get("name", "Shop")),
                    context=context
                )
    
    # Clear cart
    await cart_collection.delete_one({"user_id": str(user["_id"])})
    
    return {
        "message": "Order created",
        "order_id": order_id,
        "order_number": order_id[-8:].upper(),
        "subtotal": subtotal,
        "shipping": total_shipping,
        "total": total_amount,
        "payment_method": data.payment_method
    }

@app.get("/api/orders/{order_id}")
async def get_order_details(order_id: str, user: dict = Depends(get_current_user)):
    """Get single order details"""
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    is_owner = order["user_id"] == str(user["_id"])
    is_shop_owner = False
    if not is_owner:
        for shop_id in order.get("shop_ids", []):
            shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
            if shop and shop["owner_id"] == str(user["_id"]):
                is_shop_owner = True
                break
    
    if not is_owner and not is_shop_owner and user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get shop info
    shops = {}
    for shop_id in order.get("shop_ids", []):
        shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
        if shop:
            shops[shop_id] = {"name": shop.get("name"), "phone": shop.get("phone")}
    
    return {
        "id": str(order["_id"]),
        "order_number": str(order["_id"])[-8:].upper(),
        "items": order["items"],
        "subtotal": order.get("subtotal", order.get("total_amount", 0)),
        "shipping_cost": order.get("shipping_cost", 0),
        "total_amount": order["total_amount"],
        "shipping_address": order.get("shipping_address"),
        "shipping_city": order.get("shipping_city"),
        "shipping_phone": order.get("shipping_phone"),
        "shipping_name": order.get("shipping_name"),
        "notes": order.get("notes"),
        "status": order.get("status"),
        "payment_method": order.get("payment_method"),
        "payment_status": order.get("payment_status"),
        "shops": shops,
        "created_at": order.get("created_at", datetime.now(timezone.utc)).isoformat()
    }

@app.post("/api/orders/{order_id}/pay")
async def pay_for_order(order_id: str, user: dict = Depends(get_current_user)):
    """Mark order as paid (after successful payment)"""
    order = await orders_collection.find_one({"_id": ObjectId(order_id), "user_id": str(user["_id"])})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": OrderStatus.PAID, "payment_status": "paid", "paid_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Payment confirmed", "status": "paid"}

@app.get("/api/cart/summary")
async def get_cart_summary(user: dict = Depends(get_current_user)):
    """Get cart with shipping calculation preview"""
    cart = await cart_collection.find_one({"user_id": str(user["_id"])})
    if not cart or not cart.get("items"):
        return {"items": [], "subtotal": 0, "shipping": 0, "total": 0}
    
    items = []
    subtotal = 0
    shop_shipping = {}
    
    for cart_item in cart["items"]:
        product = await products_collection.find_one({"_id": ObjectId(cart_item["product_id"])})
        if not product:
            continue
        
        item_total = product["price"] * cart_item["quantity"]
        subtotal += item_total
        
        shop_id = product.get("shop_id")
        items.append({
            "product_id": cart_item["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": cart_item["quantity"],
            "subtotal": item_total,
            "stock": product["stock"],
            "shop_id": shop_id,
            "shop_name": product.get("shop_name", "Shop"),
            "image": product.get("images", [None])[0]
        })
        
        if shop_id and shop_id not in shop_shipping:
            shop = await shops_collection.find_one({"_id": ObjectId(shop_id)})
            if shop:
                shop_shipping[shop_id] = {
                    "name": shop.get("name"),
                    "cost": shop.get("shipping_cost", 50),
                    "free_above": shop.get("free_shipping_above", 0)
                }
    
    # Calculate shipping
    total_shipping = 0
    shipping_breakdown = []
    for shop_id, shipping_info in shop_shipping.items():
        shop_subtotal = sum(item["subtotal"] for item in items if item.get("shop_id") == shop_id)
        if shipping_info["free_above"] > 0 and shop_subtotal >= shipping_info["free_above"]:
            shipping_breakdown.append({"shop": shipping_info["name"], "cost": 0, "reason": "Free shipping"})
        else:
            total_shipping += shipping_info["cost"]
            free_msg = f"Free above ₹{shipping_info['free_above']}" if shipping_info["free_above"] > 0 else ""
            shipping_breakdown.append({"shop": shipping_info["name"], "cost": shipping_info["cost"], "reason": free_msg})
    
    return {
        "items": items,
        "item_count": sum(item["quantity"] for item in items),
        "subtotal": subtotal,
        "shipping": total_shipping,
        "shipping_breakdown": shipping_breakdown,
        "total": subtotal + total_shipping
    }

# ===================== REAL-TIME CHAT SYSTEM =====================
from fastapi import WebSocket, WebSocketDisconnect
from database import chat_rooms_collection, chat_messages_collection
import json

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}  # room_id -> list of websockets
    
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
        "context": context,  # e.g., "Satyanarayana Pooja on March 20, 2026"
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

@app.websocket("/ws/chat/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: str):
    """WebSocket endpoint for real-time chat"""
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return
    
    # Verify token and get user
    try:
        from auth import decode_token
        payload = decode_token(token)
        user_id = payload.get("sub")
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            await websocket.close(code=4001)
            return
    except:
        await websocket.close(code=4001)
        return
    
    # Verify user is participant in this room
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room or str(user["_id"]) not in room["participants"]:
        await websocket.close(code=4003)
        return
    
    await manager.connect(websocket, room_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                # Save message to database
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
                other_participant = [p for p in room["participants"] if p != str(user["_id"])][0]
                await chat_rooms_collection.update_one(
                    {"_id": ObjectId(room_id)},
                    {
                        "$set": {"last_message_at": datetime.now(timezone.utc)},
                        "$inc": {f"unread_count.{other_participant}": 1}
                    }
                )
                
                # Broadcast to all participants
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
            
            elif data.get("type") == "typing":
                # Broadcast typing indicator
                await manager.broadcast_to_room(room_id, {
                    "type": "typing",
                    "user_id": str(user["_id"]),
                    "user_name": user.get("name", "User")
                })
            
            elif data.get("type") == "read":
                # Mark messages as read
                await chat_messages_collection.update_many(
                    {"room_id": room_id, "read_by": {"$ne": str(user["_id"])}},
                    {"$addToSet": {"read_by": str(user["_id"])}}
                )
                await chat_rooms_collection.update_one(
                    {"_id": ObjectId(room_id)},
                    {"$set": {f"unread_count.{str(user['_id'])}": 0}}
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

# REST API endpoints for chat
@app.get("/api/chat/rooms")
async def get_chat_rooms(user: dict = Depends(get_current_user)):
    """Get all chat rooms for the current user"""
    cursor = chat_rooms_collection.find({
        "participants": str(user["_id"])
    }).sort("last_message_at", -1)
    
    rooms = []
    async for room in cursor:
        # Get last message
        last_message = await chat_messages_collection.find_one(
            {"room_id": str(room["_id"])},
            sort=[("created_at", -1)]
        )
        
        # Get other participant details
        other_id = [p for p in room["participants"] if p != str(user["_id"])][0]
        other_details = room.get("participant_details", {}).get(other_id, {"name": "User", "role": "unknown"})
        
        rooms.append({
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
            "unread_count": room.get("unread_count", {}).get(str(user["_id"]), 0),
            "last_message": {
                "content": last_message.get("content", "") if last_message else "",
                "sender_id": last_message.get("sender_id", "") if last_message else "",
                "created_at": last_message["created_at"].isoformat() if last_message else None
            } if last_message else None,
            "created_at": room["created_at"].isoformat(),
            "last_message_at": room.get("last_message_at", room["created_at"]).isoformat()
        })
    
    return {"rooms": rooms}

@app.get("/api/chat/rooms/{room_id}")
async def get_chat_room(room_id: str, user: dict = Depends(get_current_user)):
    """Get a specific chat room"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if str(user["_id"]) not in room["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
    
    # Get other participant details
    other_id = [p for p in room["participants"] if p != str(user["_id"])][0]
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

@app.get("/api/chat/rooms/{room_id}/messages")
async def get_chat_messages(room_id: str, skip: int = 0, limit: int = 50, user: dict = Depends(get_current_user)):
    """Get messages for a chat room"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if str(user["_id"]) not in room["participants"]:
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
    
    return {"messages": list(reversed(messages))}  # Return in chronological order

@app.post("/api/chat/rooms/{room_id}/messages")
async def send_chat_message(room_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Send a message to a chat room (REST fallback for WebSocket)"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if str(user["_id"]) not in room["participants"]:
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
    other_participant = [p for p in room["participants"] if p != str(user["_id"])][0]
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

@app.put("/api/chat/rooms/{room_id}/read")
async def mark_messages_read(room_id: str, user: dict = Depends(get_current_user)):
    """Mark all messages in a room as read"""
    room = await chat_rooms_collection.find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if str(user["_id"]) not in room["participants"]:
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

@app.get("/api/chat/unread-count")
async def get_total_unread_count(user: dict = Depends(get_current_user)):
    """Get total unread message count across all rooms"""
    cursor = chat_rooms_collection.find({"participants": str(user["_id"])})
    total = 0
    async for room in cursor:
        total += room.get("unread_count", {}).get(str(user["_id"]), 0)
    return {"unread_count": total}

# ===================== VIDEO CONSULTATION APIs =====================
from video_consultation import (
    get_system_settings, update_system_settings,
    get_user_wallet, add_wallet_balance, get_wallet_transactions,
    get_astrologer_profile, update_astrologer_profile, get_available_astrologers,
    start_consultation_call, process_call_minute, end_consultation_call, get_call_history,
    get_astrologer_dashboard_stats, get_astrologer_earnings_report
)

# Admin Settings Endpoints
@app.get("/api/admin/consultation-settings")
async def get_consultation_settings(user: dict = Depends(get_current_user)):
    """Get consultation system settings (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    settings = await get_system_settings()
    return {k: v for k, v in settings.items() if k != "_id"}

@app.put("/api/admin/consultation-settings")
async def update_consultation_settings(request: Request, user: dict = Depends(get_current_user)):
    """Update consultation system settings (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    data = await request.json()
    settings = await update_system_settings(data)
    return {k: v for k, v in settings.items() if k != "_id"}

# System Configuration Endpoints (API Keys, App Settings, etc.)
from system_config import (
    get_all_config, get_config_value, update_config, update_multiple_configs,
    get_config_by_category, CONFIG_CATEGORIES, init_system_config,
    is_maintenance_mode, get_app_branding,
    get_stripe_credentials, get_razorpay_credentials
)

@app.get("/api/admin/system-config")
async def get_system_config(user: dict = Depends(get_current_user)):
    """Get all system configuration (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = await get_all_config(include_sensitive=False)
    return {
        "config": config,
        "categories": CONFIG_CATEGORIES
    }

@app.get("/api/admin/system-config/{category}")
async def get_system_config_by_category(category: str, user: dict = Depends(get_current_user)):
    """Get system config by category (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if category not in CONFIG_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    config = await get_config_by_category(category, include_sensitive=False)
    return {
        "category": category,
        "category_info": CONFIG_CATEGORIES[category],
        "config": config
    }

@app.put("/api/admin/system-config")
async def update_system_config(request: Request, user: dict = Depends(get_current_user)):
    """Update system configuration (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    data = await request.json()
    result = await update_multiple_configs(data)
    return {"message": "Configuration updated", **result}

@app.put("/api/admin/system-config/{key}")
async def update_single_config(key: str, request: Request, user: dict = Depends(get_current_user)):
    """Update a single config value (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    data = await request.json()
    value = data.get("value")
    
    try:
        result = await update_config(key, value)
        return {"message": "Configuration updated", **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/admin/system-config/init")
async def initialize_system_config(user: dict = Depends(get_current_user)):
    """Initialize system config from env variables (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await init_system_config()
    return {"message": "System configuration initialized"}

# Public endpoints for app settings
@app.get("/api/app/branding")
async def get_branding():
    """Get public app branding info"""
    return await get_app_branding()

@app.get("/api/app/status")
async def get_app_status():
    """Check if app is in maintenance mode"""
    maintenance = await is_maintenance_mode()
    if maintenance:
        from system_config import get_config_value
        message = await get_config_value("maintenance_message", "We are currently performing scheduled maintenance.")
        return {"maintenance": True, "message": message}
    return {"maintenance": False}

# Wallet Endpoints
@app.get("/api/wallet")
async def get_wallet(user: dict = Depends(get_current_user)):
    """Get current user's wallet"""
    return await get_user_wallet(str(user["_id"]))

@app.get("/api/wallet/transactions")
async def get_transactions(skip: int = 0, limit: int = 50, user: dict = Depends(get_current_user)):
    """Get wallet transaction history"""
    transactions = await get_wallet_transactions(str(user["_id"]), limit, skip)
    return {"transactions": transactions}

@app.post("/api/wallet/recharge")
async def recharge_wallet(request: Request, user: dict = Depends(get_current_user)):
    """Add balance to wallet after successful payment"""
    data = await request.json()
    amount = data.get("amount", 0)
    payment_id = data.get("payment_id")
    payment_method = data.get("payment_method", "razorpay")
    
    settings = await get_system_settings()
    if amount < settings["min_recharge_amount"]:
        raise HTTPException(status_code=400, detail=f"Minimum recharge amount is ₹{settings['min_recharge_amount']}")
    
    wallet = await add_wallet_balance(str(user["_id"]), amount, payment_id, payment_method)
    return {"message": "Wallet recharged successfully", "wallet": wallet}

# Astrologer Endpoints
@app.get("/api/astrologers/available")
async def list_available_astrologers():
    """Get list of available astrologers"""
    astrologers = await get_available_astrologers()
    return {"astrologers": astrologers}

@app.get("/api/astrologer/profile")
async def get_my_astrologer_profile(user: dict = Depends(get_current_user)):
    """Get current astrologer's profile"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    profile = await get_astrologer_profile(str(user["_id"]))
    if not profile:
        # Create default profile
        profile = await update_astrologer_profile(str(user["_id"]), {
            "rate_per_minute": 10,
            "is_available": False
        })
    return profile

@app.put("/api/astrologer/profile")
async def update_my_astrologer_profile(request: Request, user: dict = Depends(get_current_user)):
    """Update current astrologer's profile"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    data = await request.json()
    profile = await update_astrologer_profile(str(user["_id"]), data)
    return profile

@app.put("/api/astrologer/availability")
async def set_astrologer_availability(request: Request, user: dict = Depends(get_current_user)):
    """Set astrologer online/offline status"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    data = await request.json()
    is_available = data.get("is_available", False)
    profile = await update_astrologer_profile(str(user["_id"]), {"is_available": is_available})
    return {"is_available": profile["is_available"]}

# Astrologer Dashboard Endpoints
@app.get("/api/astrologer/dashboard")
async def get_astrologer_dashboard(user: dict = Depends(get_current_user)):
    """Get astrologer dashboard with stats"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    
    data = await get_astrologer_dashboard_stats(str(user["_id"]))
    if not data:
        raise HTTPException(status_code=404, detail="Astrologer profile not found")
    return data

@app.get("/api/astrologer/earnings")
async def get_astrologer_earnings(period: str = "week", user: dict = Depends(get_current_user)):
    """Get astrologer earnings report"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    
    if period not in ["day", "week", "month"]:
        period = "week"
    
    return await get_astrologer_earnings_report(str(user["_id"]), period)

@app.get("/api/astrologer/calls")
async def get_astrologer_calls(skip: int = 0, limit: int = 20, user: dict = Depends(get_current_user)):
    """Get astrologer's call history"""
    if user.get("role") != "astrologer":
        raise HTTPException(status_code=403, detail="Astrologer access required")
    
    calls = await get_call_history(str(user["_id"]), "astrologer", limit, skip)
    return {"calls": calls}

# Video Consultation Endpoints
@app.post("/api/consultation/start")
async def start_call(request: Request, user: dict = Depends(get_current_user)):
    """Start a video consultation with an astrologer"""
    data = await request.json()
    astrologer_user_id = data.get("astrologer_user_id")
    
    if not astrologer_user_id:
        raise HTTPException(status_code=400, detail="Astrologer ID required")
    
    try:
        result = await start_consultation_call(str(user["_id"]), astrologer_user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/consultation/{call_id}/process-minute")
async def process_minute(call_id: str, user: dict = Depends(get_current_user)):
    """Process billing for one minute of consultation"""
    result = await process_call_minute(call_id)
    return result

@app.post("/api/consultation/{call_id}/end")
async def end_call(call_id: str, request: Request, user: dict = Depends(get_current_user)):
    """End a consultation call"""
    data = await request.json()
    reason = data.get("reason", "normal")
    
    try:
        result = await end_consultation_call(call_id, reason)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/consultation/history")
async def consultation_history(skip: int = 0, limit: int = 20, user: dict = Depends(get_current_user)):
    """Get user's consultation history"""
    role = "astrologer" if user.get("role") == "astrologer" else "user"
    calls = await get_call_history(str(user["_id"]), role, limit, skip)
    return {"calls": calls}

@app.get("/api/consultation/settings")
async def get_public_consultation_settings():
    """Get public consultation settings (for frontend)"""
    settings = await get_system_settings()
    return {
        "min_recharge_amount": settings["min_recharge_amount"],
        "low_balance_warning": settings["low_balance_warning"],
        "grace_period_seconds": settings["grace_period_seconds"],
        "free_minutes_new_users": settings["free_minutes_new_users"] if settings["free_minutes_enabled"] else 0
    }

# WebSocket for Real-time Billing Updates
active_call_connections: dict = {}  # call_id -> list of websockets

@app.websocket("/ws/consultation/{call_id}")
async def websocket_consultation(websocket: WebSocket, call_id: str):
    """WebSocket for real-time billing updates during consultation"""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return
    
    try:
        from auth import decode_token
        payload = decode_token(token)
        user_id = payload.get("sub")
    except:
        await websocket.close(code=4001)
        return
    
    await websocket.accept()
    
    if call_id not in active_call_connections:
        active_call_connections[call_id] = []
    active_call_connections[call_id].append(websocket)
    
    try:
        # Start billing loop for this connection
        while True:
            # Wait for 60 seconds then process billing
            await asyncio.sleep(60)
            
            # Process minute billing
            result = await process_call_minute(call_id)
            
            # Broadcast to all connections for this call
            for ws in active_call_connections.get(call_id, []):
                try:
                    await ws.send_json({
                        "type": "billing_update",
                        **result
                    })
                except:
                    pass
            
            # Check if call should end
            if result.get("status") == "insufficient_balance":
                # Start grace period
                settings = await get_system_settings()
                grace_period = settings["grace_period_seconds"]
                
                # Send grace period warning
                for ws in active_call_connections.get(call_id, []):
                    try:
                        await ws.send_json({
                            "type": "grace_period",
                            "seconds_remaining": grace_period,
                            "message": f"Balance exhausted! Call will end in {grace_period} seconds. Recharge now!"
                        })
                    except:
                        pass
                
                # Wait for grace period
                await asyncio.sleep(grace_period)
                
                # Check balance again
                from video_consultation import get_user_wallet
                wallet = await get_user_wallet(user_id)
                
                if wallet["balance"] <= 0 and wallet.get("free_minutes", 0) <= 0:
                    # End the call
                    await end_consultation_call(call_id, "insufficient_balance")
                    
                    for ws in active_call_connections.get(call_id, []):
                        try:
                            await ws.send_json({
                                "type": "call_ended",
                                "reason": "insufficient_balance",
                                "message": "Call ended due to insufficient balance"
                            })
                        except:
                            pass
                    break
    
    except WebSocketDisconnect:
        pass
    finally:
        if call_id in active_call_connections:
            if websocket in active_call_connections[call_id]:
                active_call_connections[call_id].remove(websocket)
            if not active_call_connections[call_id]:
                del active_call_connections[call_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
