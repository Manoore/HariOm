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
import stripe

from dotenv import load_dotenv
load_dotenv()

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

from database import (
    init_db, users_collection, priests_collection, astrologers_collection,
    shops_collection, products_collection, bookings_collection, orders_collection,
    payment_transactions_collection, cart_collection, reviews_collection,
    festivals_collection, temples_collection,
    deities_collection, mantras_collection, stotras_collection, daily_schedule_collection,
    product_reviews_collection, feedback_collection, testimonials_collection,
    puja_types_collection, service_reviews_collection, audio_library_collection,
    stream_reminders_collection, user_notifications_collection, class_requests_collection,
    math_mutt_collection,
    scriptures_collection, scripture_verses_collection, video_library_collection
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

# Import modular routers
from routes.reviews import router as reviews_router
from routes.admin_new import router as admin_router
from routes.auth_new import router as auth_router
from routes.priests_new import router as priests_router
from routes.bookings_new import router as bookings_router
from routes.notifications import router as notifications_router
from routes.users import router as users_router
from routes.priest_dashboard import router as priest_dashboard_router
from routes.shop import router as shop_router
from routes.cart import router as cart_router
from routes.chat import router as chat_router, manager as chat_manager, create_chat_room, deactivate_chat_room
from routes.payments import router as payments_router
from routes.orders_new import router as orders_new_router
from routes.astrology import router as astrology_router
from routes.devotional import router as devotional_router
from routes.panchang import router as panchang_router

# Import notification service
try:
    from services.notification_service import (
        notify_class_enrolled, notify_payment_success
    )
    NOTIFICATIONS_ENABLED = True
except ImportError:
    NOTIFICATIONS_ENABLED = False

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

# Create uploads directory if it doesn't exist - use relative path for Docker compatibility
UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Include modular routers
# Note: The reviews router is new and modular
# Other routes remain in this file for backward compatibility
# Future refactoring will move more routes to the routes/ directory
app.include_router(reviews_router)
app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(priests_router)
app.include_router(bookings_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.include_router(priest_dashboard_router)
app.include_router(shop_router)
app.include_router(cart_router)
app.include_router(chat_router)
app.include_router(payments_router)
app.include_router(orders_new_router)
app.include_router(astrology_router)
app.include_router(devotional_router)
app.include_router(panchang_router)

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
        backend_url = "https://divine-refactor.preview.emergentagent.com"
    
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
        backend_url = "https://divine-refactor.preview.emergentagent.com"
    
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
        "role": UserRole.SUPER_ADMIN,
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
    """Translate text using FREE translation APIs"""
    try:
        body = await request.json()
        text = body.get("text", "")
        target_lang = body.get("target_lang") or body.get("target_language", "en")
        
        if not text:
            return {"status": "error", "message": "No text provided"}
        
        # Try Google Translate free endpoint (no API key needed)
        try:
            import urllib.parse
            async with httpx.AsyncClient() as client:
                encoded_text = urllib.parse.quote(text[:1500])
                url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={encoded_text}"
                
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    # Google returns nested arrays: [[["translated text","original text",...]]]
                    if data and isinstance(data, list) and data[0]:
                        translated_parts = []
                        for part in data[0]:
                            if part and part[0]:
                                translated_parts.append(part[0])
                        translated = "".join(translated_parts)
                        if translated:
                            return {
                                "status": "ok",
                                "original": text,
                                "translated": translated,
                                "target_lang": target_lang,
                                "provider": "google-free"
                            }
        except Exception as e:
            print(f"Google free translate failed: {e}")
        
        # Fallback: MyMemory API (FREE - 5000 words/day)
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.mymemory.translated.net/get",
                    params={
                        "q": text[:500],
                        "langpair": f"hi|{target_lang}"
                    },
                    timeout=10.0
                )
                data = response.json()
                
                if data.get("responseStatus") == 200:
                    translated = data.get("responseData", {}).get("translatedText", "")
                    if translated:
                        return {
                            "status": "ok",
                            "original": text,
                            "translated": translated,
                            "target_lang": target_lang,
                            "provider": "mymemory"
                        }
        except Exception as e:
            print(f"MyMemory translate failed: {e}")
        
        return {"status": "error", "message": "Translation services unavailable. Please try again."}
    except Exception as e:
        print(f"Translation error: {e}")
        return {"status": "error", "message": "Translation failed"}

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

@app.get("/api/archive/play/{item_id}")
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

# ===================== VIDEO LIBRARY (Devotional YouTube) =====================

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

@app.get("/api/video-library")
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

@app.get("/api/video-library/categories")
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

@app.post("/api/video-library/add")
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
async def get_mantras(deity_id: Optional[str] = None, type: Optional[str] = None, tier: Optional[str] = None, category: Optional[str] = None):
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

@app.get("/api/devotional/mantras/all")
async def get_all_mantras(category: Optional[str] = None, search: Optional[str] = None, limit: int = 50, skip: int = 0):
    """Get all mantras from stotra-sangrahah collection with pagination and search"""
    # Only get mantras from stotra-sangrahah source (the new imported ones)
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

@app.get("/api/devotional/mantras/debug")
async def debug_mantras():
    """Debug endpoint to check mantras collection"""
    try:
        # Count all
        total = await mantras_collection.count_documents({})
        active = await mantras_collection.count_documents({"is_active": True})
        with_category = await mantras_collection.count_documents({"category": {"$exists": True}})
        
        # Get a sample
        sample = await mantras_collection.find_one({"source": "stotra-sangrahah"}, {"_id": 0, "title": 1, "category": 1, "deity": 1})
        
        return {
            "total": total,
            "active": active,
            "with_category": with_category,
            "sample": sample
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/devotional/mantras/categories")
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
        
        print(f"DEBUG: Found {len(results)} category groups")
        
        for item in results:
            if item["_id"]:  # Skip null categories
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

# ===================== SCRIPTURES / DHARMIC DATA API =====================

@app.get("/api/scriptures")
async def get_all_scriptures():
    """Get all available scriptures with their metadata"""
    try:
        cursor = scriptures_collection.find({"is_active": True}, {"_id": 0})
        scriptures = await cursor.to_list(length=20)
        return {"status": "ok", "data": scriptures, "count": len(scriptures)}
    except Exception as e:
        print(f"ERROR fetching scriptures: {e}")
        return {"status": "error", "message": str(e), "data": []}

@app.get("/api/scriptures/{scripture_id}")
async def get_scripture_details(scripture_id: str):
    """Get detailed info about a specific scripture including sections"""
    try:
        # Get scripture metadata
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

@app.get("/api/scriptures/{scripture_id}/sections/{section_num}")
async def get_scripture_section(
    scripture_id: str, 
    section_num: int,
    skip: int = 0,
    limit: int = 50
):
    """Get verses from a specific section of a scripture"""
    try:
        # Verify scripture exists
        scripture = await scriptures_collection.find_one(
            {"scripture_id": scripture_id, "is_active": True}
        )
        if not scripture:
            raise HTTPException(status_code=404, detail="Scripture not found")
        
        # Get verses from this section
        query = {"scripture_id": scripture_id, "section_num": section_num}
        total = await scripture_verses_collection.count_documents(query)
        
        # Build sort order based on scripture type
        sort_fields = [("verse_num", 1)]
        if scripture_id in ["valmiki_ramayana"]:
            sort_fields = [("sarga_num", 1), ("verse_num", 1)]
        elif scripture_id == "mahabharata":
            sort_fields = [("chapter_num", 1), ("verse_num", 1)]
        
        cursor = scripture_verses_collection.find(
            query, 
            {"_id": 0}
        ).sort(sort_fields).skip(skip).limit(limit)
        
        verses = await cursor.to_list(length=limit)
        
        # Get section info
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

@app.get("/api/scriptures/{scripture_id}/search")
async def search_scripture(
    scripture_id: str,
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = 50
):
    """Search within a specific scripture"""
    try:
        # Verify scripture exists
        scripture = await scriptures_collection.find_one(
            {"scripture_id": scripture_id, "is_active": True}
        )
        if not scripture:
            raise HTTPException(status_code=404, detail="Scripture not found")
        
        # Search in text field
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

@app.get("/api/scriptures/verse/random")
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

# Auth, Priest, and Booking routes moved to routes/auth_new.py, routes/priests_new.py, routes/bookings_new.py
# Priest Dashboard routes (classes, availability, analytics, content, streams) moved to routes/priest_dashboard.py
from database import priest_classes_collection, priest_availability_collection, priest_content_collection, priest_streams_collection, priest_portfolio_collection, priest_services_collection, priest_posts_collection, post_comments_collection, post_likes_collection, class_enrollments_collection

# IMPORTANT: The following endpoints are now served by routes/priest_dashboard.py
# If you see 404s for /api/priest/* endpoints, ensure priest_dashboard_router is included in app

# ===================== PUBLIC CLASSES & LIVE STREAMS (FOR DEVOTEES) =====================
def safe_isoformat(value):
    """Safely convert datetime or string to ISO format string"""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return str(value)

@app.get("/api/classes")
async def get_public_classes(
    skip: int = 0,
    limit: int = 20,
    upcoming_only: bool = True
):
    """Get all public classes for devotees to browse and join"""
    query = {}
    if upcoming_only:
        # Don't filter by date if schedule_time might be string - just get all and filter in code
        pass
    
    cursor = priest_classes_collection.find(query).sort("schedule_time", 1).skip(skip).limit(limit)
    classes = []
    
    async for cls in cursor:
        # Get priest info
        priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
        priest_user = None
        if priest:
            priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        
        classes.append({
            "id": str(cls["_id"]),
            "priest_id": cls.get("priest_id", ""),
            "priest_name": priest_user["name"] if priest_user else "Unknown Priest",
            "priest_photo": priest.get("profile_photo") if priest else None,
            "title": cls.get("title", ""),
            "description": cls.get("description", ""),
            "category": cls.get("category", "General"),
            "schedule_time": safe_isoformat(cls.get("schedule_time")),
            "duration_minutes": cls.get("duration_minutes", 60),
            "frequency": cls.get("frequency", "one_time"),
            "frequency_days": cls.get("frequency_days", []),
            "price": cls.get("price", 0),
            "max_students": cls.get("max_students", 50),
            "available_slots": cls.get("available_slots", cls.get("max_students", 50) - cls.get("enrolled_count", 0)),
            "enrolled_count": cls.get("enrolled_count", 0),
            "is_free": cls.get("is_free", cls.get("price", 0) == 0),
            "meeting_link": cls.get("meeting_link", ""),
            "created_at": safe_isoformat(cls.get("created_at"))
        })
    
    total = await priest_classes_collection.count_documents(query)
    return {"classes": classes, "total": total}

@app.get("/api/classes/{class_id}")
async def get_class_details(class_id: str):
    """Get details of a specific class"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
    priest_user = None
    if priest:
        priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
    
    return {
        "id": str(cls["_id"]),
        "priest_id": cls.get("priest_id", ""),
        "priest_name": priest_user["name"] if priest_user else "Unknown Priest",
        "priest_photo": priest.get("profile_photo") if priest else None,
        "priest_bio": priest.get("bio", "") if priest else "",
        "title": cls.get("title", ""),
        "description": cls.get("description", ""),
        "category": cls.get("category", "General"),
        "schedule_time": safe_isoformat(cls.get("schedule_time")),
        "duration_minutes": cls.get("duration_minutes", 60),
        "frequency": cls.get("frequency", "one_time"),
        "frequency_days": cls.get("frequency_days", []),
        "price": cls.get("price", 0),
        "max_students": cls.get("max_students", 50),
        "enrolled_count": cls.get("enrolled_count", 0),
        "is_free": cls.get("price", 0) == 0,
        "meeting_link": cls.get("meeting_link", ""),
        "syllabus": cls.get("syllabus", []),
        "requirements": cls.get("requirements", [])
    }

@app.post("/api/classes/{class_id}/enroll")
async def enroll_in_class(class_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Enroll in a class - free classes enroll directly, paid classes require payment"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if already enrolled
    enrollments = cls.get("enrollments", [])
    if str(user["_id"]) in enrollments:
        raise HTTPException(status_code=400, detail="Already enrolled in this class")
    
    # Check capacity using available_slots
    available_slots = cls.get("available_slots", cls.get("max_students", 50) - cls.get("enrolled_count", 0))
    if available_slots <= 0:
        raise HTTPException(status_code=400, detail="Class is full - no slots available")
    
    # Check if class is free or paid
    is_free = cls.get("is_free", cls.get("price", 0) == 0)
    
    if is_free:
        # Free class - enroll directly
        await priest_classes_collection.update_one(
            {"_id": ObjectId(class_id)},
            {
                "$push": {"enrollments": str(user["_id"])},
                "$inc": {"enrolled_count": 1, "available_slots": -1}
            }
        )
        return {"message": "Successfully enrolled in class", "class_id": class_id, "is_free": True}
    else:
        # Paid class - create payment intent
        try:
            data = await request.json() if request else {}
        except:
            data = {}
        
        # Check if payment_intent_id is provided (payment already completed)
        if data.get("payment_intent_id"):
            # Verify payment was successful
            # For now, trust the frontend - in production, verify with Stripe
            await priest_classes_collection.update_one(
                {"_id": ObjectId(class_id)},
                {
                    "$push": {"enrollments": str(user["_id"])},
                    "$inc": {"enrolled_count": 1, "available_slots": -1}
                }
            )
            
            # Record the class enrollment payment
            await class_enrollments_collection.insert_one({
                "user_id": str(user["_id"]),
                "class_id": class_id,
                "priest_id": cls["priest_id"],
                "amount": cls.get("price", 0),
                "payment_intent_id": data.get("payment_intent_id"),
                "status": "completed",
                "enrolled_at": datetime.now(timezone.utc)
            })
            
            # Send notification
            if NOTIFICATIONS_ENABLED:
                try:
                    priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])})
                    priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])}) if priest else None
                    schedule_time = cls.get("schedule_time")
                    schedule_str = schedule_time.strftime("%B %d, %Y at %I:%M %p") if hasattr(schedule_time, 'strftime') else str(schedule_time)
                    
                    await notify_class_enrolled(str(user["_id"]), {
                        "class_name": cls.get("title", "Vedic Class"),
                        "teacher_name": priest_user.get("name", "Teacher") if priest_user else "Teacher",
                        "schedule": schedule_str,
                        "amount": cls.get("price", 0)
                    })
                except Exception:
                    pass
            
            return {"message": "Successfully enrolled in class", "class_id": class_id, "is_free": False, "paid": True}
        else:
            # Create payment intent for the class with platform fee and taxes
            import stripe
            stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
            
            try:
                base_price = cls.get("price", 0)
                
                # Get admin-configurable fees from system config
                from system_config import get_fees_and_taxes, calculate_fees_and_taxes
                fees_config = await get_fees_and_taxes()
                fees_calc = calculate_fees_and_taxes(base_price, fees_config)
                
                platform_fee = fees_calc["platform_fee"]
                gst_amount = fees_calc["tax_amount"]
                platform_fee_percent = fees_config["platform_fee"]["value"] if fees_config["platform_fee"]["enabled"] else 0
                gst_percent = fees_calc["tax_percentage"]
                tax_label = fees_calc["tax_label"]
                
                # Total amount = base price + platform fee + GST
                total_amount = base_price + platform_fee + gst_amount
                
                payment_intent = stripe.PaymentIntent.create(
                    amount=int(total_amount * 100),  # Convert to paise
                    currency="inr",
                    metadata={
                        "type": "class_enrollment",
                        "class_id": class_id,
                        "user_id": str(user["_id"]),
                        "priest_id": cls["priest_id"],
                        "base_price": str(base_price),
                        "platform_fee": str(platform_fee),
                        "gst": str(gst_amount)
                    }
                )
                
                return {
                    "message": "Payment required for this class",
                    "requires_payment": True,
                    "is_free": False,
                    "price_breakdown": {
                        "base_price": base_price,
                        "platform_fee": platform_fee,
                        "platform_fee_percent": platform_fee_percent,
                        "gst": gst_amount,
                        "gst_percent": gst_percent,
                        "tax_label": tax_label,
                        "total": total_amount
                    },
                    "price": total_amount,
                    "client_secret": payment_intent.client_secret,
                    "payment_intent_id": payment_intent.id
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")

@app.get("/api/live-streams")
async def get_public_live_streams(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None  # "live", "scheduled", or None for all
):
    """Get all public live streams for devotees"""
    query = {}
    if status:
        query["status"] = status
    else:
        # Show live and upcoming scheduled streams
        query["status"] = {"$in": ["live", "scheduled"]}
    
    cursor = priest_streams_collection.find(query).sort("scheduled_time", 1).skip(skip).limit(limit)
    streams = []
    
    async for stream in cursor:
        # Get priest info
        priest = await priests_collection.find_one({"_id": ObjectId(stream["priest_id"])}) if stream.get("priest_id") else None
        priest_user = None
        if priest:
            priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        
        # Extract YouTube video ID for embedding
        youtube_url = stream.get("youtube_url", "")
        youtube_video_id = None
        if youtube_url:
            if "youtu.be/" in youtube_url:
                youtube_video_id = youtube_url.split("youtu.be/")[1].split("?")[0]
            elif "youtube.com/watch?v=" in youtube_url:
                youtube_video_id = youtube_url.split("v=")[1].split("&")[0]
            elif "youtube.com/live/" in youtube_url:
                youtube_video_id = youtube_url.split("/live/")[1].split("?")[0]
        
        streams.append({
            "id": str(stream["_id"]),
            "priest_id": stream.get("priest_id", ""),
            "priest_name": priest_user["name"] if priest_user else "Unknown Priest",
            "priest_photo": priest.get("profile_photo") if priest else None,
            "title": stream.get("title", ""),
            "description": stream.get("description", ""),
            "scheduled_time": safe_isoformat(stream.get("scheduled_time")),
            "status": stream.get("status", "scheduled"),
            "viewer_count": stream.get("viewer_count", 0),
            "youtube_url": youtube_url,
            "youtube_video_id": youtube_video_id,
            "thumbnail": stream.get("thumbnail") or (f"https://img.youtube.com/vi/{youtube_video_id}/maxresdefault.jpg" if youtube_video_id else ""),
            "created_at": safe_isoformat(stream.get("created_at"))
        })
    
    total = await priest_streams_collection.count_documents(query)
    return {"streams": streams, "total": total}

# ===================== CLASS REQUESTS (Devotee requests for classes) =====================

class ClassRequestCreate(BaseModel):
    topic: str
    category: Optional[str] = "General"
    description: Optional[str] = ""
    preferred_days: Optional[List[str]] = []  # e.g., ["Monday", "Wednesday"]
    preferred_time: Optional[str] = ""  # e.g., "Morning", "Evening", "6:00 PM"
    budget_min: Optional[int] = 0
    budget_max: Optional[int] = 5000
    language: Optional[str] = "Hindi"
    duration_preference: Optional[str] = "1 hour"  # e.g., "30 mins", "1 hour", "2 hours"
    meeting_type: Optional[str] = "one_on_one"  # one_on_one, group
    frequency: Optional[str] = "weekly"  # once, weekly, biweekly, monthly

@app.post("/api/class-requests")
async def create_class_request(request: ClassRequestCreate, user: dict = Depends(get_current_user)):
    """Devotee submits a request for a class they want"""
    class_request = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "Anonymous"),
        "user_email": user.get("email", ""),
        "topic": request.topic,
        "category": request.category,
        "description": request.description,
        "preferred_days": request.preferred_days,
        "preferred_time": request.preferred_time,
        "budget_min": request.budget_min,
        "budget_max": request.budget_max,
        "language": request.language,
        "duration_preference": request.duration_preference,
        "meeting_type": request.meeting_type,  # one_on_one or group
        "frequency": request.frequency,  # once, weekly, biweekly, monthly
        "status": "open",  # open, matched, closed
        "responses": [],  # Priests who responded
        "matched_class_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await class_requests_collection.insert_one(class_request)
    
    # Notify priests about new class request (optional: filter by topic/category)
    # This could be enhanced to only notify priests who teach this category
    
    return {
        "message": "Class request submitted successfully",
        "request_id": str(result.inserted_id)
    }

@app.get("/api/class-requests")
async def get_my_class_requests(user: dict = Depends(get_current_user)):
    """Get all class requests for the current devotee"""
    cursor = class_requests_collection.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    requests = []
    async for req in cursor:
        requests.append({
            "id": str(req["_id"]),
            "topic": req["topic"],
            "category": req.get("category", "General"),
            "description": req.get("description", ""),
            "preferred_days": req.get("preferred_days", []),
            "preferred_time": req.get("preferred_time", ""),
            "budget_min": req.get("budget_min", 0),
            "budget_max": req.get("budget_max", 5000),
            "language": req.get("language", "Hindi"),
            "duration_preference": req.get("duration_preference", "1 hour"),
            "meeting_type": req.get("meeting_type", "one_on_one"),
            "frequency": req.get("frequency", "weekly"),
            "status": req.get("status", "open"),
            "responses_count": len(req.get("responses", [])),
            "matched_class_id": req.get("matched_class_id"),
            "created_at": safe_isoformat(req.get("created_at"))
        })
    return {"requests": requests}

@app.get("/api/class-requests/all")
async def get_all_class_requests(user: dict = Depends(get_current_user)):
    """Get all open class requests (for priests to see)"""
    if user.get("role") not in ["priest", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only priests can view class requests")
    
    cursor = class_requests_collection.find({"status": "open"}).sort("created_at", -1)
    requests = []
    async for req in cursor:
        requests.append({
            "id": str(req["_id"]),
            "user_name": req.get("user_name", "Anonymous"),
            "topic": req["topic"],
            "category": req.get("category", "General"),
            "description": req.get("description", ""),
            "preferred_days": req.get("preferred_days", []),
            "preferred_time": req.get("preferred_time", ""),
            "budget_min": req.get("budget_min", 0),
            "budget_max": req.get("budget_max", 5000),
            "language": req.get("language", "Hindi"),
            "duration_preference": req.get("duration_preference", "1 hour"),
            "meeting_type": req.get("meeting_type", "one_on_one"),
            "frequency": req.get("frequency", "weekly"),
            "responses_count": len(req.get("responses", [])),
            "created_at": safe_isoformat(req.get("created_at"))
        })
    return {"requests": requests}

@app.post("/api/class-requests/{request_id}/respond")
async def respond_to_class_request(request_id: str, user: dict = Depends(get_current_user)):
    """Priest expresses interest in fulfilling a class request"""
    if user.get("role") != "priest":
        raise HTTPException(status_code=403, detail="Only priests can respond to class requests")
    
    class_request = await class_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not class_request:
        raise HTTPException(status_code=404, detail="Class request not found")
    
    # Add priest to responses
    response = {
        "priest_id": str(user["_id"]),
        "priest_name": user.get("name", ""),
        "responded_at": datetime.now(timezone.utc)
    }
    
    await class_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$push": {"responses": response},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    # Notify the devotee
    await user_notifications_collection.insert_one({
        "user_id": class_request["user_id"],
        "type": "class_request_response",
        "title": "Priest interested in your request!",
        "message": f"{user.get('name', 'A priest')} is interested in teaching '{class_request['topic']}'",
        "data": {"request_id": request_id, "priest_id": str(user["_id"])},
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Response submitted successfully"}

@app.post("/api/class-requests/{request_id}/accept/{priest_id}")
async def accept_priest_for_class(request_id: str, priest_id: str, user: dict = Depends(get_current_user)):
    """Devotee accepts a priest's interest - auto-creates a class"""
    from database import priest_classes_collection
    
    # Get the class request
    class_request = await class_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not class_request:
        raise HTTPException(status_code=404, detail="Class request not found")
    
    # Verify the user is the one who created the request
    if class_request["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get priest info
    priest_user = await users_collection.find_one({"_id": ObjectId(priest_id)})
    if not priest_user:
        raise HTTPException(status_code=404, detail="Priest not found")
    
    priest_profile = await priests_collection.find_one({"user_id": priest_id})
    
    # Create a new class automatically
    new_class = {
        "priest_id": str(priest_profile["_id"]) if priest_profile else priest_id,
        "priest_name": priest_user.get("name", ""),
        "title": class_request["topic"],
        "description": class_request.get("description", f"Class requested by {class_request.get('user_name', 'a devotee')}"),
        "class_type": "online",
        "location_type": "online",
        "temple_name": "",
        "duration_minutes": 60 if class_request.get("duration_preference") == "1 hour" else 
                          30 if "30" in class_request.get("duration_preference", "") else
                          90 if "1.5" in class_request.get("duration_preference", "") else
                          120 if "2" in class_request.get("duration_preference", "") else 60,
        "is_free": False,
        "price": class_request.get("budget_min", 500),
        "max_students": 1 if class_request.get("meeting_type") == "one_on_one" else 20,
        "available_slots": 1 if class_request.get("meeting_type") == "one_on_one" else 19,
        "enrolled_count": 1,
        "enrollments": [str(user["_id"])],  # Auto-enroll the devotee
        "schedule": [],
        "category": class_request.get("category", "General"),
        "frequency": class_request.get("frequency", "weekly"),
        "schedule_day": class_request.get("preferred_days", ["Monday"])[0] if class_request.get("preferred_days") else "Monday",
        "schedule_time": "10:00",
        "meeting_link": "",  # Priest will add this later
        "is_active": True,
        "created_from_request": True,
        "original_request_id": request_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_classes_collection.insert_one(new_class)
    class_id = str(result.inserted_id)
    
    # Update the class request as matched
    await class_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "matched",
                "matched_priest_id": priest_id,
                "matched_class_id": class_id,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Notify the priest that they were accepted
    await user_notifications_collection.insert_one({
        "user_id": priest_id,
        "type": "class_request_accepted",
        "title": "Your interest was accepted!",
        "message": f"{user.get('name', 'A devotee')} accepted you for '{class_request['topic']}'. A class has been created.",
        "data": {"request_id": request_id, "class_id": class_id},
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Notify the devotee
    await user_notifications_collection.insert_one({
        "user_id": str(user["_id"]),
        "type": "class_created",
        "title": "Class Created!",
        "message": f"Your class '{class_request['topic']}' with {priest_user.get('name', 'the priest')} has been created. The priest will add the meeting link soon.",
        "data": {"class_id": class_id},
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {
        "message": "Priest accepted! Class has been created.",
        "class_id": class_id
    }

@app.get("/api/class-requests/{request_id}/interested-priests")
async def get_interested_priests(request_id: str, user: dict = Depends(get_current_user)):
    """Get list of priests who showed interest in a class request"""
    class_request = await class_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not class_request:
        raise HTTPException(status_code=404, detail="Class request not found")
    
    # Verify the user is the one who created the request
    if class_request["user_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    responses = class_request.get("responses", [])
    priests = []
    
    for resp in responses:
        priest_user = await users_collection.find_one({"_id": ObjectId(resp["priest_id"])})
        priest_profile = await priests_collection.find_one({"user_id": resp["priest_id"]})
        
        if priest_user:
            priests.append({
                "priest_id": resp["priest_id"],
                "name": priest_user.get("name", ""),
                "profile_photo": priest_profile.get("profile_photo") if priest_profile else None,
                "experience_years": priest_profile.get("experience_years", 0) if priest_profile else 0,
                "specializations": priest_profile.get("specializations", []) if priest_profile else [],
                "math_mutt": priest_profile.get("math_mutt", "") if priest_profile else "",
                "responded_at": resp.get("responded_at").isoformat() if resp.get("responded_at") else None
            })
    
    return {"priests": priests}

@app.delete("/api/class-requests/{request_id}")
async def delete_class_request(request_id: str, user: dict = Depends(get_current_user)):
    """Devotee cancels their class request"""
    result = await class_requests_collection.delete_one({
        "_id": ObjectId(request_id),
        "user_id": str(user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or not authorized")
    
    return {"message": "Class request cancelled"}

# Stream Reminders API

@app.get("/api/stream-reminders")
async def get_stream_reminders(user: dict = Depends(get_current_user)):
    """Get all stream reminders for the current user"""
    cursor = stream_reminders_collection.find({"user_id": str(user["_id"])})
    reminders = []
    async for reminder in cursor:
        reminders.append({
            "id": str(reminder["_id"]),
            "stream_id": reminder["stream_id"],
            "created_at": safe_isoformat(reminder.get("created_at"))
        })
    return {"reminders": reminders}

@app.post("/api/stream-reminders")
async def set_stream_reminder(
    data: dict,
    user: dict = Depends(get_current_user)
):
    """Set a reminder for an upcoming live stream"""
    stream_id = data.get("stream_id")
    if not stream_id:
        raise HTTPException(status_code=400, detail="stream_id is required")
    
    # Check if stream exists
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Check if already reminded
    existing = await stream_reminders_collection.find_one({
        "user_id": str(user["_id"]),
        "stream_id": stream_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Reminder already set for this stream")
    
    # Create reminder
    reminder = {
        "user_id": str(user["_id"]),
        "stream_id": stream_id,
        "stream_title": stream.get("title", ""),
        "scheduled_time": stream.get("scheduled_time"),
        "notified": False,
        "created_at": datetime.now(timezone.utc)
    }
    result = await stream_reminders_collection.insert_one(reminder)
    
    # Create in-app notification for confirmation
    await user_notifications_collection.insert_one({
        "user_id": str(user["_id"]),
        "title": "Reminder Set",
        "message": f"You'll be notified before \"{stream.get('title', 'the stream')}\" starts.",
        "is_read": False,
        "created_at": datetime.now(timezone.utc),
        "link": "/dashboard?tab=live"
    })
    
    return {"message": "Reminder set successfully", "reminder_id": str(result.inserted_id)}

@app.delete("/api/stream-reminders/{stream_id}")
async def remove_stream_reminder(
    stream_id: str,
    user: dict = Depends(get_current_user)
):
    """Remove a stream reminder"""
    result = await stream_reminders_collection.delete_one({
        "user_id": str(user["_id"]),
        "stream_id": stream_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder removed successfully"}

# ===================== CLASS ROOM MANAGEMENT (100ms) =====================
from class_rooms import generate_class_room, get_student_token, start_scheduler

@app.get("/api/classes/{class_id}/join")
async def join_class_room(class_id: str, user: dict = Depends(get_current_user)):
    """Get 100ms token to join a class - verifies enrollment and payment"""
    try:
        result = await get_student_token(class_id, str(user["_id"]))
        return result
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

@app.get("/api/classes/{class_id}/room-status")
async def get_class_room_status(class_id: str, user: dict = Depends(get_current_user)):
    """Check if class room is ready to join"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if user is enrolled
    enrollments = cls.get("enrollments", [])
    is_enrolled = str(user["_id"]) in enrollments
    
    # Check if user is the priest
    is_priest = cls.get("priest_id") == str(user["_id"]) or (
        await priests_collection.find_one({"user_id": str(user["_id"]), "_id": ObjectId(cls.get("priest_id", "000000000000000000000000"))})
    ) is not None
    
    room_ready = bool(cls.get("room_id"))
    schedule_time = cls.get("schedule_time")
    
    # Calculate time until class
    now = datetime.now(timezone.utc)
    if schedule_time:
        if schedule_time.tzinfo is None:
            schedule_time = schedule_time.replace(tzinfo=timezone.utc)
        time_until = (schedule_time - now).total_seconds() / 60  # minutes
    else:
        time_until = None
    
    return {
        "class_id": class_id,
        "room_ready": room_ready,
        "is_enrolled": is_enrolled,
        "is_priest": is_priest,
        "minutes_until_class": round(time_until, 1) if time_until else None,
        "can_join": room_ready and (is_enrolled or is_priest)
    }

@app.post("/api/priest/classes/{class_id}/create-room")
async def priest_create_class_room(class_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Priest can manually create room for their class"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify priest owns this class
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest or str(priest["_id"]) != cls.get("priest_id"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        result = await generate_class_room(class_id)
        
        # Notify enrolled students
        from class_rooms import notify_students_class_starting
        await notify_students_class_starting(class_id)
        
        return {
            "message": "Room created successfully",
            "room_id": result["room_id"],
            "priest_token": result.get("priest_token")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/priest/classes/{class_id}/host-token")
async def get_priest_host_token(class_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Get host token for priest to join their class"""
    cls = await priest_classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify priest owns this class
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest or str(priest["_id"]) != cls.get("priest_id"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    room_id = cls.get("room_id")
    if not room_id:
        raise HTTPException(status_code=400, detail="Room not created yet")
    
    # Generate fresh host token
    from video_consultation import generate_100ms_token
    token = await generate_100ms_token(room_id, str(user["_id"]), "host")
    
    return {
        "room_id": room_id,
        "token": token,
        "class_title": cls.get("title", "")
    }

@app.on_event("startup")
async def startup_class_scheduler():
    """Start the background scheduler for class rooms"""
    start_scheduler()

@app.get("/api/my-enrollments")
async def get_my_enrollments(user: dict = Depends(get_current_user)):
    """Get classes the current user is enrolled in"""
    cursor = priest_classes_collection.find({"enrollments": str(user["_id"])}).sort("schedule_time", 1)
    classes = []
    
    now = datetime.now(timezone.utc)
    
    async for cls in cursor:
        priest = await priests_collection.find_one({"_id": ObjectId(cls["priest_id"])}) if cls.get("priest_id") else None
        priest_user = None
        if priest:
            priest_user = await users_collection.find_one({"_id": ObjectId(priest["user_id"])})
        
        # Check if class is free
        is_free = cls.get("is_free", False) or cls.get("price", 0) == 0
        
        # Check room status - only for PAID classes
        room_ready = bool(cls.get("room_id")) if not is_free else False
        schedule_time = cls.get("schedule_time")
        
        # Calculate if class is starting soon (within 15 mins)
        is_starting_soon = False
        if schedule_time:
            if schedule_time.tzinfo is None:
                schedule_time = schedule_time.replace(tzinfo=timezone.utc)
            time_diff = (schedule_time - now).total_seconds() / 60
            is_starting_soon = -30 <= time_diff <= 15  # 15 mins before to 30 mins after
        
        classes.append({
            "id": str(cls["_id"]),
            "priest_name": priest_user["name"] if priest_user else "Unknown Priest",
            "title": cls.get("title", ""),
            "schedule_time": safe_isoformat(cls.get("schedule_time")),
            "duration_minutes": cls.get("duration_minutes", 60),
            "meeting_link": cls.get("meeting_link", ""),
            "is_free": is_free,
            "price": cls.get("price", 0),
            "room_ready": room_ready,
            "is_starting_soon": is_starting_soon,
            "can_join": room_ready and is_starting_soon and not is_free  # Free classes use meeting_link
        })
    
    return {"enrollments": classes}


# ===================== PRIEST CLASSES MANAGEMENT =====================
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
            "description": cls.get("description", ""),
            "class_type": cls.get("class_type", "online"),
            "duration_minutes": cls.get("duration_minutes", 60),
            "price": cls.get("price", 0),
            "is_free": cls.get("is_free", False) or cls.get("price", 0) == 0,
            "max_students": cls.get("max_students", 20),
            "enrolled_count": cls.get("enrolled_count", 0),
            "enrollments": cls.get("enrollments", []),
            "schedule": cls.get("schedule", []),
            "category": cls.get("category", "General"),
            "frequency": cls.get("frequency", "weekly"),
            "schedule_day": cls.get("schedule_day", ""),
            "schedule_time": safe_isoformat(cls.get("schedule_time")),
            "meeting_link": cls.get("meeting_link", ""),
            "room_id": cls.get("room_id"),
            "is_active": cls.get("is_active", True),
            "location_type": cls.get("location_type", "online"),
            "temple_name": cls.get("temple_name", ""),
            "created_at": safe_isoformat(cls.get("created_at"))
        })
    return {"classes": classes}

@app.post("/api/priest/classes")
async def create_priest_class(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Create a new class"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    data = await request.json()
    
    # Parse schedule_time if provided
    schedule_time = None
    if data.get("schedule_time"):
        try:
            schedule_time = datetime.fromisoformat(data["schedule_time"].replace("Z", "+00:00"))
        except:
            pass
    
    # Determine if free class
    is_free = data.get("is_free", False)
    price = 0 if is_free else data.get("price", 500)
    
    class_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user["name"],
        "title": data.get("title"),
        "description": data.get("description", ""),
        "class_type": data.get("class_type", "online"),
        "location_type": data.get("location_type", "online"),
        "temple_name": data.get("temple_name", ""),
        "duration_minutes": data.get("duration_minutes", 60),
        "price": price,
        "is_free": is_free,
        "max_students": data.get("max_students", 20),
        "enrolled_count": 0,
        "enrollments": [],
        "schedule": data.get("schedule", []),
        "category": data.get("category", "General"),
        "frequency": data.get("frequency", "once"),
        "schedule_day": data.get("schedule_day", ""),
        "schedule_time": schedule_time,
        "meeting_link": data.get("meeting_link", ""),  # External link for free classes
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
    update_data = {}
    
    # Handle allowed fields
    allowed_fields = [
        "title", "description", "class_type", "duration_minutes", 
        "price", "max_students", "schedule", "category", "is_active",
        "frequency", "schedule_day", "meeting_link", "is_free",
        "location_type", "temple_name"
    ]
    
    for k, v in data.items():
        if k in allowed_fields:
            update_data[k] = v
    
    # Handle schedule_time specially
    if "schedule_time" in data and data["schedule_time"]:
        try:
            update_data["schedule_time"] = datetime.fromisoformat(data["schedule_time"].replace("Z", "+00:00"))
        except:
            pass
    
    # If is_free is set to True, set price to 0
    if update_data.get("is_free", False):
        update_data["price"] = 0
    
    if update_data:
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


# ===================== PRIEST PROFILE MANAGEMENT =====================
# Note: Profile routes (GET/PUT /api/priest/profile) moved to routes/priest_dashboard.py

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
            "location_type": service.get("location_type", "online"),
            "temple_name": service.get("temple_name", ""),
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
        "location_type": data.get("location_type", "online"),  # online, home_visit, temple
        "temple_name": data.get("temple_name", ""),  # If location_type is temple
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
    
    update_fields = ["name", "description", "category", "duration_minutes", "price", "is_available", "location_type", "temple_name"]
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

# ===================== PRIEST LIVE STREAMS MANAGEMENT =====================
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
            "status": stream.get("status", "scheduled"),
            "youtube_url": stream.get("youtube_url", ""),  # YouTube Live URL
            "scheduled_time": safe_isoformat(stream.get("scheduled_time")),
            "started_at": safe_isoformat(stream.get("started_at")),
            "ended_at": safe_isoformat(stream.get("ended_at")),
            "viewer_count": stream.get("viewer_count", 0),
            "created_at": safe_isoformat(stream.get("created_at"))
        })
    return {"streams": streams}

@app.post("/api/priest/streams")
async def create_priest_stream(request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Schedule a live stream with optional YouTube Live URL"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    if not priest:
        raise HTTPException(status_code=404, detail="Priest profile not found")
    
    data = await request.json()
    
    # Parse scheduled time
    scheduled_time = None
    if data.get("scheduled_time"):
        try:
            scheduled_time = datetime.fromisoformat(data["scheduled_time"].replace("Z", "+00:00"))
        except:
            scheduled_time = datetime.now(timezone.utc)
    else:
        scheduled_time = datetime.now(timezone.utc)
    
    stream_dict = {
        "priest_id": str(priest["_id"]),
        "priest_name": user.get("name", "Priest"),
        "title": data.get("title", "Live Stream"),
        "description": data.get("description", ""),
        "stream_type": data.get("stream_type", "puja"),
        "youtube_url": data.get("youtube_url", ""),  # Optional YouTube Live URL
        "status": "scheduled",
        "scheduled_time": scheduled_time,
        "viewer_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await priest_streams_collection.insert_one(stream_dict)
    return {"message": "Stream scheduled", "stream_id": str(result.inserted_id)}

@app.put("/api/priest/streams/{stream_id}")
async def update_priest_stream(stream_id: str, request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Update stream details including YouTube URL"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    data = await request.json()
    update_fields = {}
    
    if "title" in data:
        update_fields["title"] = data["title"]
    if "description" in data:
        update_fields["description"] = data["description"]
    if "youtube_url" in data:
        update_fields["youtube_url"] = data["youtube_url"]
    if "scheduled_time" in data:
        try:
            update_fields["scheduled_time"] = datetime.fromisoformat(data["scheduled_time"].replace("Z", "+00:00"))
        except:
            pass
    
    if update_fields:
        await priest_streams_collection.update_one(
            {"_id": ObjectId(stream_id)},
            {"$set": update_fields}
        )
    
    return {"message": "Stream updated"}

@app.put("/api/priest/streams/{stream_id}/start")
async def start_priest_stream(stream_id: str, request: Request, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Start a live stream - optionally add YouTube URL at start time"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Allow setting YouTube URL when starting
    data = {}
    try:
        data = await request.json()
    except:
        pass
    
    update_data = {
        "status": "live",
        "started_at": datetime.now(timezone.utc)
    }
    
    if data.get("youtube_url"):
        update_data["youtube_url"] = data["youtube_url"]
    
    await priest_streams_collection.update_one(
        {"_id": ObjectId(stream_id)},
        {"$set": update_data}
    )
    return {"message": "Stream started", "status": "live"}

@app.put("/api/priest/streams/{stream_id}/end")
async def end_priest_stream(stream_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
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

@app.delete("/api/priest/streams/{stream_id}")
async def delete_priest_stream(stream_id: str, user: dict = Depends(require_role([UserRole.PRIEST]))):
    """Delete a scheduled stream"""
    priest = await priests_collection.find_one({"user_id": str(user["_id"])})
    stream = await priest_streams_collection.find_one({"_id": ObjectId(stream_id)})
    
    if not stream or stream["priest_id"] != str(priest["_id"]):
        raise HTTPException(status_code=404, detail="Stream not found")
    
    await priest_streams_collection.delete_one({"_id": ObjectId(stream_id)})
    return {"message": "Stream deleted"}

@app.get("/api/streams/live")
async def get_live_streams():
    """Get all currently live streams (public)"""
    cursor = priest_streams_collection.find({"status": "live"})
    streams = []
    async for stream in cursor:
        # Extract YouTube video ID for embedding
        youtube_url = stream.get("youtube_url", "")
        youtube_video_id = None
        if youtube_url:
            # Parse YouTube URL to get video ID
            if "youtu.be/" in youtube_url:
                youtube_video_id = youtube_url.split("youtu.be/")[1].split("?")[0]
            elif "youtube.com/watch?v=" in youtube_url:
                youtube_video_id = youtube_url.split("v=")[1].split("&")[0]
            elif "youtube.com/live/" in youtube_url:
                youtube_video_id = youtube_url.split("/live/")[1].split("?")[0]
        
        streams.append({
            "id": str(stream["_id"]),
            "title": stream["title"],
            "description": stream.get("description", ""),
            "stream_type": stream.get("stream_type", "puja"),
            "priest_name": stream.get("priest_name", ""),
            "priest_id": stream["priest_id"],
            "youtube_url": youtube_url,
            "youtube_video_id": youtube_video_id,
            "viewer_count": stream.get("viewer_count", 0),
            "started_at": safe_isoformat(stream.get("started_at"))
        })
    return {"streams": streams}

# ===================== MARKETPLACE ROUTES =====================
@app.get("/api/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    # First, get all approved shop IDs
    approved_shops_query = {
        "$or": [
            {"approval_status": "approved"},
            {"is_verified": True, "approval_status": {"$exists": False}}  # Legacy support
        ]
    }
    approved_shops_cursor = shops_collection.find(approved_shops_query, {"_id": 1})
    approved_shop_ids = []
    async for shop in approved_shops_cursor:
        approved_shop_ids.append(str(shop["_id"]))
    
    # Only show products from approved shops
    query = {"shop_id": {"$in": approved_shop_ids}} if approved_shop_ids else {"shop_id": {"$in": []}}
    
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
    
    # If location filter is provided, first get approved shops in that location
    shop_ids_in_location = None
    if location:
        location_query = {
            "$and": [
                approved_shops_query,
                {"$or": [
                    {"city": {"$regex": location, "$options": "i"}},
                    {"state": {"$regex": location, "$options": "i"}},
                    {"address": {"$regex": location, "$options": "i"}},
                    {"pincode": location},
                    {"location.city": {"$regex": location, "$options": "i"}},
                    {"location.state": {"$regex": location, "$options": "i"}}
                ]}
            ]
        }
        shops_cursor = shops_collection.find(location_query)
        shop_ids_in_location = []
        async for shop in shops_cursor:
            shop_ids_in_location.append(str(shop["_id"]))
        
        if shop_ids_in_location:
            query["shop_id"] = {"$in": shop_ids_in_location}
        else:
            # No shops found in location, return empty
            return {"products": [], "total": 0}
    
    cursor = products_collection.find(query).skip(skip).limit(limit)
    products = []
    async for product in cursor:
        # Get shop location info
        shop = await shops_collection.find_one({"_id": ObjectId(product["shop_id"])}) if product.get("shop_id") else None
        products.append({
            "id": str(product["_id"]),
            "shop_id": product["shop_id"],
            "shop_name": product.get("shop_name", "Unknown"),
            "shop_city": shop.get("city", "") if shop else "",
            "shop_state": shop.get("state", "") if shop else "",
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

# Order routes moved to routes/orders_new.py
# Horoscope/Astrology routes moved to routes/astrology.py

# ===================== ASTROLOGER ROUTES =====================
@app.get("/api/astrologers")
async def get_astrologers(skip: int = 0, limit: int = 20):
    # Only show astrologers that are approved by admin
    query = {
        "$or": [
            {"approval_status": "approved"},
            {"is_verified": True, "approval_status": {"$exists": False}}  # Legacy support
        ]
    }
    cursor = astrologers_collection.find(query).skip(skip).limit(limit)
    astrologers = []
    async for astro in cursor:
        try:
            user = await users_collection.find_one({"_id": ObjectId(astro["user_id"])})
            astrologers.append({
                "id": str(astro["_id"]),
                "user_id": astro["user_id"],
                "user_name": user["name"] if user else "Unknown",
                "specializations": astro.get("specializations", []),
                "experience_years": astro.get("experience_years", 0),
                "languages": astro.get("languages", []),
                "consultation_fee": astro.get("consultation_fee", 0),
                "bio": astro.get("bio", ""),
                "rating": astro.get("rating", 0),
                "is_verified": astro.get("is_verified", False)
            })
        except Exception as e:
            print(f"Error processing astrologer {astro.get('_id')}: {e}")
            continue
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

# Stripe webhook (kept in server.py for global routing)
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")
    
    # Process webhook (simplified)
    return {"received": True}

# Admin routes moved to routes/admin_new.py
# ===================== SERVICE REVIEWS (Priests & Astrologers) =====================

@app.post("/api/bookings/{booking_id}/review")
async def create_service_review(booking_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Create a review for a completed booking (priest or astrologer service)"""
    data = await request.json()
    
    # Get booking
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify user owns this booking
    if booking.get("user_id") != str(user["_id"]):
        raise HTTPException(status_code=403, detail="This is not your booking")
    
    # Verify booking is completed
    if booking.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    
    # Check if already reviewed
    existing_review = await service_reviews_collection.find_one({"booking_id": booking_id})
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this booking")
    
    rating = data.get("rating")
    if not rating or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    comment = data.get("comment", "").strip()
    
    # Determine provider type and ID
    provider_type = booking.get("provider_type", "priest")
    provider_id = booking.get("priest_id") or booking.get("astrologer_id")
    
    if not provider_id:
        raise HTTPException(status_code=400, detail="Provider not found for this booking")
    
    review = {
        "booking_id": booking_id,
        "provider_id": provider_id,
        "provider_type": provider_type,  # "priest" or "astrologer"
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "Anonymous"),
        "service_name": booking.get("service_name", ""),
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await service_reviews_collection.insert_one(review)
    
    # Update booking with review flag
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"has_review": True, "review_id": str(result.inserted_id)}}
    )
    
    # Update provider's average rating
    await update_provider_rating(provider_id, provider_type)
    
    return {
        "message": "Review submitted successfully",
        "review_id": str(result.inserted_id)
    }

# ===================== PUBLIC PUJA TYPES =====================
@app.get("/api/puja-types")
async def get_puja_types_public():
    """Get all active puja types (public endpoint for devotee and priest screens)"""
    # Seed default puja types if collection is empty
    count = await puja_types_collection.count_documents({})
    if count == 0:
        default_puja_types = [
            {"name": "Satyanarayan Pooja", "category": "Worship"},
            {"name": "Griha Pravesh", "category": "Home"},
            {"name": "Ganesh Pooja", "category": "Worship"},
            {"name": "Lakshmi Pooja", "category": "Worship"},
            {"name": "Durga Pooja", "category": "Worship"},
            {"name": "Rudrabhishekam", "category": "Shiva"},
            {"name": "Navagraha Shanti", "category": "Planetary"},
            {"name": "Vastu Shanti", "category": "Home"},
            {"name": "Marriage Ceremony", "category": "Life Events"},
            {"name": "Engagement Ceremony", "category": "Life Events"},
            {"name": "Mundan Ceremony", "category": "Life Events"},
            {"name": "Naming Ceremony", "category": "Life Events"},
            {"name": "Thread Ceremony (Upanayana)", "category": "Life Events"},
            {"name": "Last Rites (Antim Sanskar)", "category": "Life Events"},
            {"name": "Shraddh/Tarpan", "category": "Ancestral"},
            {"name": "Homam/Havan", "category": "Fire Rituals"},
            {"name": "Kaal Sarp Dosh Puja", "category": "Planetary"},
            {"name": "Mangal Dosh Shanti", "category": "Planetary"},
            {"name": "Sunderkand Path", "category": "Recitation"},
            {"name": "Hanuman Chalisa", "category": "Recitation"},
            {"name": "Vishnu Sahasranama", "category": "Recitation"},
            {"name": "Lalita Sahasranama", "category": "Recitation"},
            {"name": "Satyanarayana Katha", "category": "Recitation"},
            {"name": "Birthday Pooja", "category": "Personal"},
            {"name": "Anniversary Pooja", "category": "Personal"},
            {"name": "Vehicle Pooja", "category": "Blessing"},
            {"name": "Office/Shop Pooja", "category": "Blessing"},
            {"name": "Other", "category": "Custom"}
        ]
        for puja in default_puja_types:
            puja["is_active"] = True
            puja["created_at"] = datetime.now(timezone.utc)
        await puja_types_collection.insert_many(default_puja_types)
    
    # Fetch only active puja types
    cursor = puja_types_collection.find({"is_active": {"$ne": False}}).sort("name", 1)
    puja_types = []
    categories = {}
    
    async for puja in cursor:
        puja_item = {
            "id": str(puja["_id"]),
            "name": puja["name"],
            "category": puja.get("category", "General")
        }
        puja_types.append(puja_item)
        
        # Group by category for dropdown
        cat = puja.get("category", "General")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(puja_item)
    
    # Sort categories alphabetically
    sorted_categories = dict(sorted(categories.items()))
    
    return {"puja_types": puja_types, "categories": sorted_categories}

# ===================== MATH/MUTT (PRIEST AFFILIATIONS) =====================
DEFAULT_MATH_MUTTS = [
    {"name": "Sringeri Sharada Peetham", "category": "Advaita"},
    {"name": "Dwarka Sharada Peeth", "category": "Advaita"},
    {"name": "Govardhan Math", "category": "Advaita"},
    {"name": "Jyotir Math", "category": "Advaita"},
    {"name": "Kanchi Kamakoti Peetham", "category": "Advaita"},
    {"name": "Chinmaya Mission", "category": "Advaita"},
    {"name": "Ahobila Mutt", "category": "Sri Vaishnavism"},
    {"name": "Parakala Mutt", "category": "Sri Vaishnavism"},
    {"name": "Srimad Andavan Ashramam", "category": "Sri Vaishnavism"},
    {"name": "Srimad Poundarikapuram Andavan Ashramam", "category": "Sri Vaishnavism"},
    {"name": "Vanamamalai Mutt", "category": "Sri Vaishnavism"},
    {"name": "Yadugiri Yathiraja Mutt", "category": "Sri Vaishnavism"},
    {"name": "Embar Jeeyar Mutt", "category": "Sri Vaishnavism"},
    {"name": "Mantralayam Raghavendra Swamy Mutt", "category": "Dvaita"},
    {"name": "Uttaradi Mutt", "category": "Dvaita"},
    {"name": "Vyasaraja Mutt", "category": "Dvaita"},
    {"name": "Pejavara Matha", "category": "Dvaita (Udupi)"},
    {"name": "Palimaru Matha", "category": "Dvaita (Udupi)"},
    {"name": "Admaru Matha", "category": "Dvaita (Udupi)"},
    {"name": "Krishnapura Matha", "category": "Dvaita (Udupi)"},
    {"name": "Puttige Matha", "category": "Dvaita (Udupi)"},
    {"name": "Shirur Matha", "category": "Dvaita (Udupi)"},
    {"name": "Sodhe Matha", "category": "Dvaita (Udupi)"},
    {"name": "Kaniyoor Matha", "category": "Dvaita (Udupi)"},
    {"name": "Udupi Sri Krishna Matha", "category": "Dvaita (Udupi)"},
    {"name": "Gokarna Partagali Jeevottama Mutt", "category": "Dvaita"},
    {"name": "Sripadaraja Matha", "category": "Dvaita"},
    {"name": "Kanva Matha", "category": "Dvaita"},
    {"name": "Baligaru Matha", "category": "Dvaita"},
    {"name": "Kudli Matha", "category": "Dvaita"},
    {"name": "Tambehalli Matha", "category": "Dvaita"},
    {"name": "Kundapur Matha", "category": "Dvaita"},
    {"name": "Sagarakatte Matha", "category": "Dvaita"},
    {"name": "Nimbarka Peeth", "category": "Nimbarka"},
    {"name": "Vallabhacharya Pushtimarg", "category": "Pushtimarg"},
    {"name": "Dharmapuram Adheenam", "category": "Shaiva Siddhanta"},
    {"name": "Thiruvaduthurai Adheenam", "category": "Shaiva Siddhanta"},
    {"name": "Madurai Adheenam", "category": "Shaiva Siddhanta"},
    {"name": "Thiruppanandal Adheenam", "category": "Shaiva Siddhanta"},
    {"name": "Kashi Mutt", "category": "Smarta"},
    {"name": "Suttur Mutt", "category": "Veerashaiva"},
    {"name": "Siddaganga Mutt", "category": "Veerashaiva"},
    {"name": "Gaudiya Math", "category": "Gaudiya Vaishnavism"},
    {"name": "ISKCON", "category": "Gaudiya Vaishnavism"},
    {"name": "Ramakrishna Math", "category": "Modern"},
    {"name": "Art of Living Ashram", "category": "Modern"},
    {"name": "Isha Foundation", "category": "Modern"},
    {"name": "Mata Amritanandamayi Math", "category": "Modern"},
    {"name": "Other", "category": "Other"}
]

@app.get("/api/math-mutt")
async def get_math_mutt_public():
    """Get all active Math/Mutt options (public endpoint for priest registration/profile)"""
    # Seed default Math/Mutt if collection is empty
    count = await math_mutt_collection.count_documents({})
    if count == 0:
        for mutt in DEFAULT_MATH_MUTTS:
            mutt["is_active"] = True
            mutt["created_at"] = datetime.now(timezone.utc)
        await math_mutt_collection.insert_many(DEFAULT_MATH_MUTTS.copy())
    
    # Fetch only active entries
    cursor = math_mutt_collection.find({"is_active": {"$ne": False}}).sort("name", 1)
    math_mutts = []
    categories = {}
    
    async for mutt in cursor:
        mutt_item = {
            "id": str(mutt["_id"]),
            "name": mutt["name"],
            "category": mutt.get("category", "Other")
        }
        math_mutts.append(mutt_item)
        
        # Group by category for dropdown
        cat = mutt.get("category", "Other")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(mutt_item)
    
    # Sort categories alphabetically
    sorted_categories = dict(sorted(categories.items()))
    
    return {"math_mutts": math_mutts, "categories": sorted_categories}

@app.post("/api/admin/math-mutt")
async def add_math_mutt(request: Request, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Admin: Add a new Math/Mutt"""
    data = await request.json()
    mutt = {
        "name": data.get("name"),
        "category": data.get("category", "Other"),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    result = await math_mutt_collection.insert_one(mutt)
    return {"message": "Math/Mutt added", "id": str(result.inserted_id)}

@app.put("/api/admin/math-mutt/{mutt_id}")
async def update_math_mutt(mutt_id: str, request: Request, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Admin: Update a Math/Mutt"""
    data = await request.json()
    update_data = {k: v for k, v in data.items() if k in ["name", "category", "is_active"]}
    update_data["updated_at"] = datetime.now(timezone.utc)
    await math_mutt_collection.update_one({"_id": ObjectId(mutt_id)}, {"$set": update_data})
    return {"message": "Math/Mutt updated"}

@app.delete("/api/admin/math-mutt/{mutt_id}")
async def delete_math_mutt(mutt_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Admin: Delete a Math/Mutt"""
    await math_mutt_collection.delete_one({"_id": ObjectId(mutt_id)})
    return {"message": "Math/Mutt deleted"}

# Admin approval endpoints moved to routes/admin_new.py

@app.get("/api/priests/{priest_id}/reviews")
async def get_priest_reviews_public(priest_id: str, limit: int = 20, skip: int = 0):
    """Get reviews for a priest (public)"""
    cursor = service_reviews_collection.find({
        "provider_id": priest_id,
        "provider_type": "priest"
    }).sort("created_at", -1).skip(skip).limit(limit)
    
    reviews = []
    async for review in cursor:
        reviews.append({
            "id": str(review["_id"]),
            "user_name": review.get("user_name", "Anonymous"),
            "service_name": review.get("service_name", ""),
            "rating": review.get("rating"),
            "comment": review.get("comment"),
            "created_at": review.get("created_at").isoformat() if review.get("created_at") else None
        })
    
    total = await service_reviews_collection.count_documents({
        "provider_id": priest_id,
        "provider_type": "priest"
    })
    
    # Get rating summary
    rating_summary = await get_provider_rating_summary(priest_id, "priest")
    
    return {
        "reviews": reviews,
        "total": total,
        "rating_summary": rating_summary
    }

@app.get("/api/astrologers/{astrologer_id}/reviews")
async def get_astrologer_reviews(astrologer_id: str, limit: int = 20, skip: int = 0):
    """Get reviews for an astrologer (public)"""
    cursor = service_reviews_collection.find({
        "provider_id": astrologer_id,
        "provider_type": "astrologer"
    }).sort("created_at", -1).skip(skip).limit(limit)
    
    reviews = []
    async for review in cursor:
        reviews.append({
            "id": str(review["_id"]),
            "user_name": review.get("user_name", "Anonymous"),
            "service_name": review.get("service_name", ""),
            "rating": review.get("rating"),
            "comment": review.get("comment"),
            "created_at": review.get("created_at").isoformat() if review.get("created_at") else None
        })
    
    total = await service_reviews_collection.count_documents({
        "provider_id": astrologer_id,
        "provider_type": "astrologer"
    })
    
    rating_summary = await get_provider_rating_summary(astrologer_id, "astrologer")
    
    return {
        "reviews": reviews,
        "total": total,
        "rating_summary": rating_summary
    }

@app.get("/api/bookings/{booking_id}/can-review")
async def can_review_booking(booking_id: str, user: dict = Depends(get_current_user)):
    """Check if user can review a booking"""
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return {"can_review": False, "reason": "Booking not found"}
    
    if booking.get("user_id") != str(user["_id"]):
        return {"can_review": False, "reason": "Not your booking"}
    
    if booking.get("status") != "completed":
        return {"can_review": False, "reason": "Booking not completed yet"}
    
    if booking.get("has_review"):
        return {"can_review": False, "reason": "Already reviewed"}
    
    return {"can_review": True}

async def update_provider_rating(provider_id: str, provider_type: str):
    """Recalculate and update provider's average rating"""
    pipeline = [
        {"$match": {"provider_id": provider_id, "provider_type": provider_type}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1}
        }}
    ]
    
    result = await service_reviews_collection.aggregate(pipeline).to_list(1)
    
    if result:
        avg_rating = round(result[0]["avg_rating"], 1)
        total_reviews = result[0]["total_reviews"]
    else:
        avg_rating = 0
        total_reviews = 0
    
    # Update the appropriate collection
    if provider_type == "priest":
        await priests_collection.update_one(
            {"_id": ObjectId(provider_id)},
            {"$set": {"rating": avg_rating, "total_reviews": total_reviews}}
        )
    elif provider_type == "astrologer":
        await astrologers_collection.update_one(
            {"_id": ObjectId(provider_id)},
            {"$set": {"rating": avg_rating, "total_reviews": total_reviews}}
        )

async def get_provider_rating_summary(provider_id: str, provider_type: str):
    """Get rating distribution for a provider"""
    pipeline = [
        {"$match": {"provider_id": provider_id, "provider_type": provider_type}},
        {"$group": {
            "_id": "$rating",
            "count": {"$sum": 1}
        }}
    ]
    
    result = await service_reviews_collection.aggregate(pipeline).to_list(5)
    
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for item in result:
        if item["_id"]:
            distribution[item["_id"]] = item["count"]
    
    return {"distribution": distribution}

# Checkout and Order routes moved to routes/orders_new.py

# ===================== WEBSOCKET FOR CHAT =====================
# Note: REST APIs for chat are in routes/chat.py
# WebSocket endpoint remains here as it needs @app.websocket decorator
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/chat/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: str):
    """WebSocket endpoint for real-time chat"""
    from database import chat_rooms_collection, chat_messages_collection
    
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
    
    await chat_manager.connect(websocket, room_id)
    
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
                await chat_manager.broadcast_to_room(room_id, broadcast_message)
            
            elif data.get("type") == "typing":
                # Broadcast typing indicator
                await chat_manager.broadcast_to_room(room_id, {
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
        chat_manager.disconnect(websocket, room_id)

# ===================== ADDRESS / PINCODE API =====================
@app.get("/api/pincode/{pincode}")
async def get_pincode_details(pincode: str):
    """Get location details from Indian pincode using postal API"""
    try:
        if len(pincode) != 6 or not pincode.isdigit():
            raise HTTPException(status_code=400, detail="Invalid pincode format")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.postalpincode.in/pincode/{pincode}",
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and data[0].get("Status") == "Success":
                    post_offices = data[0].get("PostOffice", [])
                    if post_offices:
                        # Get unique districts and states
                        first_po = post_offices[0]
                        return {
                            "success": True,
                            "pincode": pincode,
                            "city": first_po.get("District", ""),
                            "state": first_po.get("State", ""),
                            "country": first_po.get("Country", "India"),
                            "areas": [po.get("Name") for po in post_offices],
                            "post_offices": [
                                {
                                    "name": po.get("Name"),
                                    "branch_type": po.get("BranchType"),
                                    "delivery_status": po.get("DeliveryStatus"),
                                    "division": po.get("Division"),
                                    "region": po.get("Region"),
                                    "block": po.get("Block"),
                                }
                                for po in post_offices
                            ]
                        }
                
                return {
                    "success": False,
                    "message": "No data found for this pincode"
                }
            else:
                raise HTTPException(status_code=503, detail="Pincode service unavailable")
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Pincode service timeout")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

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
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    settings = await get_system_settings()
    return {k: v for k, v in settings.items() if k != "_id"}

@app.put("/api/admin/consultation-settings")
async def update_consultation_settings(request: Request, user: dict = Depends(get_current_user)):
    """Update consultation system settings (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    data = await request.json()
    settings = await update_system_settings(data)
    return {k: v for k, v in settings.items() if k != "_id"}

# System Configuration Endpoints (API Keys, App Settings, etc.)
from system_config import (
    get_all_config, get_config_value, update_config, update_multiple_configs,
    get_config_by_category, CONFIG_CATEGORIES, init_system_config,
    is_maintenance_mode, get_app_branding,
    get_stripe_credentials, get_razorpay_credentials,
    get_fees_and_taxes, calculate_fees_and_taxes
)

# checkout/fees-taxes endpoint moved to routes/orders_new.py

@app.get("/api/admin/system-config")
async def get_system_config(user: dict = Depends(get_current_user)):
    """Get all system configuration (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = await get_all_config(include_sensitive=False)
    return {
        "config": config,
        "categories": CONFIG_CATEGORIES
    }

@app.get("/api/admin/system-config/{category}")
async def get_system_config_by_category(category: str, user: dict = Depends(get_current_user)):
    """Get system config by category (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
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
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    data = await request.json()
    result = await update_multiple_configs(data)
    return {"message": "Configuration updated", **result}

@app.put("/api/admin/system-config/{key}")
async def update_single_config(key: str, request: Request, user: dict = Depends(get_current_user)):
    """Update a single config value (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
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
    if user.get("role") not in ["admin", "super_admin"]:
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


# ==================== FEEDBACK & TESTIMONIALS ENDPOINTS ====================

class FeedbackCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str
    rating: Optional[int] = None

class TestimonialCreate(BaseModel):
    content: str
    rating: int

@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackCreate):
    """Submit feedback/contact form - no auth required"""
    feedback_doc = {
        "name": feedback.name,
        "email": feedback.email,
        "subject": feedback.subject,
        "message": feedback.message,
        "rating": feedback.rating,
        "created_at": datetime.now(timezone.utc),
        "status": "new"
    }
    result = await feedback_collection.insert_one(feedback_doc)
    return {"success": True, "message": "Thank you for your feedback!", "id": str(result.inserted_id)}

@app.get("/api/feedback")
async def get_all_feedback(user: dict = Depends(require_role(["admin"]))):
    """Get all feedback - admin only"""
    feedback_list = await feedback_collection.find().sort("created_at", -1).to_list(100)
    for f in feedback_list:
        f["id"] = str(f.pop("_id"))
    return {"feedback": feedback_list}

@app.post("/api/testimonials")
async def submit_testimonial(testimonial: TestimonialCreate, user: dict = Depends(get_current_user)):
    """Submit a testimonial - requires login"""
    testimonial_doc = {
        "user_id": str(user["_id"]),
        "user_name": user.get("name", "Anonymous"),
        "user_role": user.get("role", "devotee"),
        "content": testimonial.content,
        "rating": testimonial.rating,
        "created_at": datetime.now(timezone.utc),
        "is_approved": False  # Admin needs to approve
    }
    result = await testimonials_collection.insert_one(testimonial_doc)
    return {"success": True, "message": "Thank you! Your testimonial will be reviewed.", "id": str(result.inserted_id)}

@app.get("/api/testimonials")
async def get_testimonials(approved_only: bool = True):
    """Get testimonials - public endpoint"""
    query = {"is_approved": True} if approved_only else {}
    testimonials = await testimonials_collection.find(query).sort("created_at", -1).to_list(50)
    for t in testimonials:
        t["id"] = str(t.pop("_id"))
    return {"testimonials": testimonials}

@app.put("/api/testimonials/{testimonial_id}/approve")
async def approve_testimonial(testimonial_id: str, user: dict = Depends(require_role(["admin"]))):
    """Approve a testimonial - admin only"""
    result = await testimonials_collection.update_one(
        {"_id": ObjectId(testimonial_id)},
        {"$set": {"is_approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"success": True, "message": "Testimonial approved"}

@app.delete("/api/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, user: dict = Depends(require_role(["admin"]))):
    """Delete a testimonial - admin only"""
    result = await testimonials_collection.delete_one({"_id": ObjectId(testimonial_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"success": True, "message": "Testimonial deleted"}

@app.get("/api/contact-info")
async def get_contact_info():
    """Get public contact information - no auth required"""
    from system_config import get_config_value
    return {
        "email": await get_config_value("support_email") or "support@divineapp.com",
        "phone": await get_config_value("support_phone") or "+91 98765 43210",
        "address": await get_config_value("contact_address") or "Hyderabad, Telangana, India",
        "app_name": await get_config_value("app_name") or "Divine App"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
