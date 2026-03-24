import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
import os

load_dotenv()
client = AsyncIOMotorClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME", "divine_app")]

KEEP_PRIEST_USER_IDS = [
    "69b5ffd7c2ec019012b3751e",  # pandit.sharma@divineapp.com
    "69b60be7a1d6add44276803d",  # nanda.km08@gmail.com
    "69b6cce5fc522eadda7261e8",  # manoore@offika.com
]


async def cleanup():
    keep_oids = [ObjectId(uid) for uid in KEEP_PRIEST_USER_IDS]

    result = await db["priests"].delete_many({"user_id": {"$nin": keep_oids}})
    print(f"Deleted {result.deleted_count} orphan priest profiles")

    remaining = await db["priests"].count_documents({})
    print(f"Remaining priest profiles: {remaining}")

    cursor = db["priests"].find({})
    docs = await cursor.to_list(None)
    for d in docs:
        user = await db["users"].find_one({"_id": ObjectId(d["user_id"])}, {"name": 1, "email": 1})
        print(f'  {user.get("name")} | {user.get("email")}')

    # Clean astrologer profiles for deleted users
    astro_keep = [ObjectId("69b5ffd7c2ec019012b37520")]
    result2 = await db["astrologer_profiles"].delete_many({"user_id": {"$nin": astro_keep}})
    print(f"\nDeleted {result2.deleted_count} orphan astrologer profiles")

    # Clean shop profiles for deleted users
    shop_keep = [ObjectId("69b5ffd7c2ec019012b37521")]
    result3 = await db["shops"].delete_many({"owner_id": {"$nin": shop_keep}})
    print(f"Deleted {result3.deleted_count} orphan shop profiles")

    client.close()


asyncio.run(cleanup())
