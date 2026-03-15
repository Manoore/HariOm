from fastapi import FastAPI, HTTPException, Depends, Request, Query
from fastapi.middleware.cors import CORSMiddleware
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
        
        # Create new user (default role: devotee)
        user_dict = {
            "firebase_uid": data.firebase_uid,
            "email": data.email,
            "name": data.name,
            "photo_url": data.photo_url,
            "role": UserRole.DEVOTEE,
            "is_verified": True,  # Firebase users are pre-verified
            "profile_completed": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await users_collection.insert_one(user_dict)
        
        return {
            "user": {
                "id": str(result.inserted_id),
                "email": data.email,
                "name": data.name,
                "role": UserRole.DEVOTEE,
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
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": status}}
    )
    return {"message": "Booking status updated"}

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
                "subtotal": item_total
            })
    
    order_dict = {
        "user_id": str(user["_id"]),
        "items": items,
        "total_amount": total,
        "shipping_address": data.shipping_address,
        "status": OrderStatus.PENDING,
        "payment_method": data.payment_method,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await orders_collection.insert_one(order_dict)
    await cart_collection.delete_one({"user_id": str(user["_id"])})
    
    return {"message": "Order created", "order_id": str(result.inserted_id), "total": total}

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
    stripe.api_key = settings.STRIPE_API_KEY
    
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
    
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
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
            "razorpay_key": settings.RAZORPAY_KEY_ID,
            "amount": data.amount,
            "currency": data.currency
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/payments/create-checkout")
async def create_stripe_checkout(request: Request, payment: PaymentCreate, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(
        api_key=settings.STRIPE_API_KEY,
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
    
    stripe_checkout = StripeCheckout(
        api_key=settings.STRIPE_API_KEY,
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
            "rating": product.get("rating", 0)
        })
    return {"products": products}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
