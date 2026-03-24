import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
from datetime import datetime, timezone
import os

load_dotenv()
client = AsyncIOMotorClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME", "divine_app")]


async def restore():
    # Get priest users
    cursor = db["users"].find({"role": "priest"})
    priests = await cursor.to_list(None)

    for p in priests:
        uid = str(p["_id"])
        existing = await db["priests"].find_one({"user_id": uid})
        if existing:
            print(f"  Profile already exists for {p.get('email')}")
            continue

        profile = {
            "user_id": uid,
            "email": p.get("email", ""),
            "name": p.get("name", ""),
            "phone": p.get("phone", ""),
            "experience_years": p.get("experience_years", 5),
            "specializations": p.get("specializations", ["Vedic Rituals"]),
            "languages": p.get("languages", ["Hindi", "Sanskrit"]),
            "work_locations": p.get("work_locations", []),
            "bio": p.get("bio", ""),
            "rating": 0,
            "total_reviews": 0,
            "total_bookings": 0,
            "is_available": True,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc),
        }
        await db["priests"].insert_one(profile)
        print(f"  Restored profile for {p.get('email')} ({p.get('name')})")

    # Also restore astrologer profile
    astro = await db["users"].find_one({"role": "astrologer"})
    if astro:
        uid = str(astro["_id"])
        existing = await db["astrologer_profiles"].find_one({"user_id": uid})
        if not existing:
            await db["astrologer_profiles"].insert_one({
                "user_id": uid,
                "name": astro.get("name", ""),
                "email": astro.get("email", ""),
                "specializations": ["Kundali Reading", "Vastu Consultation"],
                "languages": ["Hindi", "English"],
                "experience_years": 10,
                "rating": 4.7,
                "total_reviews": 0,
                "is_available": True,
                "is_verified": True,
                "per_minute_rate": 15,
                "created_at": datetime.now(timezone.utc),
            })
            print(f"  Restored astrologer profile for {astro.get('email')}")

    # Restore shop profile
    shop = await db["users"].find_one({"role": "shop_owner"})
    if shop:
        uid = str(shop["_id"])
        existing = await db["shops"].find_one({"owner_id": uid})
        if not existing:
            await db["shops"].insert_one({
                "owner_id": uid,
                "name": shop.get("name", "Pooja Mart"),
                "email": shop.get("email", ""),
                "description": "Your one-stop shop for all spiritual needs",
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
            })
            print(f"  Restored shop profile for {shop.get('email')}")

    print("\nDone! Profiles restored.")
    client.close()


asyncio.run(restore())
