from fastapi import FastAPI, HTTPException, Depends, Request, Query, UploadFile, File, WebSocket, WebSocketDisconnect
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
from routes.shop import router as shop_router, marketplace_router
from routes.cart import router as cart_router
from routes.chat import router as chat_router, manager as chat_manager, create_chat_room, deactivate_chat_room
from routes.payments import router as payments_router
from routes.orders_new import router as orders_new_router
from routes.astrology import router as astrology_router
from routes.devotional import router as devotional_router
from routes.panchang import router as panchang_router
from routes.uploads import router as uploads_router
from routes.places import router as places_router
from routes.translate import router as translate_router
from routes.video_library import router as video_library_router
from routes.classes import router as classes_router
from routes.feedback import router as feedback_router
from routes.consultation import router as consultation_router
from routes.archive import router as archive_router
from routes.posts import router as posts_router

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

# File uploads moved to routes/uploads.py

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
app.include_router(marketplace_router)
app.include_router(cart_router)
app.include_router(chat_router)
app.include_router(payments_router)
app.include_router(orders_new_router)
app.include_router(astrology_router)
app.include_router(devotional_router)
app.include_router(panchang_router)
app.include_router(uploads_router)
app.include_router(places_router)
app.include_router(translate_router)
app.include_router(video_library_router)
app.include_router(classes_router)
app.include_router(feedback_router)
app.include_router(consultation_router)
app.include_router(archive_router)
app.include_router(posts_router)

# Upload routes moved to routes/uploads.py

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

# Places API routes moved to routes/places.py

# Translation API moved to routes/translate.py

# Internet Archive / Vedic Library routes moved to routes/archive.py

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

# Devotional content routes moved to routes/devotional.py

# Scripture routes moved to routes/devotional.py

# Auth, Priest, and Booking routes moved to routes/auth_new.py, routes/priests_new.py, routes/bookings_new.py
# Priest Dashboard routes (classes, availability, analytics, content, streams) moved to routes/priest_dashboard.py
from database import priest_classes_collection, priest_availability_collection, priest_content_collection, priest_streams_collection, priest_portfolio_collection, priest_services_collection, priest_posts_collection, post_comments_collection, post_likes_collection, class_enrollments_collection

# IMPORTANT: The following endpoints are now served by routes/priest_dashboard.py
# If you see 404s for /api/priest/* endpoints, ensure priest_dashboard_router is included in app

# Classes & Live Streams routes moved to routes/classes.py

# Priest profile/reviews/portfolio/services/earnings/posts routes moved to routes/priest_dashboard.py

# Marketplace routes moved to routes/shop.py (marketplace_router)

# Order routes moved to routes/orders_new.py
# Horoscope/Astrology routes moved to routes/astrology.py

# Consultation, Wallet, System Config routes moved to routes/consultation.py

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


# Feedback & Testimonials routes moved to routes/feedback.py


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
