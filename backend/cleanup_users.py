import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "divine_app")

KEEP_IDS = [
    "69b605238fa5ce38c55a09b5",  # nandakishore.nandu@gmail.com
    "69b60be7a1d6add44276803d",  # nanda.km08@gmail.com
    "69b6cce5fc522eadda7261e8",  # manoore@offika.com
    "69b743790862ce94a9f00e9f",  # +14054129590
    "69bc4412aef02e2c93d4c272",  # +919701270318
    "69bc4c25aef02e2c93d4c275",  # srikanthmanur@gmail.com
    "69bc148df02de9ce2e3c2813",  # +13612289626
    "69bcd093ba2ed4d279c76c92",  # vishalmadakashira2219@gmail.com
    "69bec6a3a7493ae7537420ed",  # +919550345616
    "69c246a4bbbd6f5a4e0e0a2c",  # +919948821404
    "69c2e0459e0ceab3d4d9e435",  # vibhaharitas@gmail.com
    "69b5ffd7c2ec019012b3751d",  # admin@divineapp.com (super_admin)
    "69bef3873a4953e90ca29e6b",  # admin@divine.com (admin)
    "69b5ffd7c2ec019012b37522",  # devotee@divineapp.com (devotee)
    "69b5ffd7c2ec019012b3751e",  # pandit.sharma@divineapp.com (priest)
    "69b5ffd7c2ec019012b37520",  # astro.joshi@divineapp.com (astrologer)
    "69b5ffd7c2ec019012b37521",  # shop.poojamart@divineapp.com (shop_owner)
]


async def cleanup():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    keep_oids = [ObjectId(id) for id in KEEP_IDS]

    result = await db["users"].delete_many({"_id": {"$nin": keep_oids}})
    print(f"Deleted {result.deleted_count} test users")

    remaining = await db["users"].count_documents({})
    print(f"Remaining users: {remaining}")

    cursor = db["users"].find({}, {"_id": 0, "name": 1, "email": 1, "role": 1})
    users = await cursor.to_list(None)
    for u in sorted(users, key=lambda x: x.get("role", "")):
        print(f'  {u.get("role")} | {u.get("email")} | {u.get("name")}')

    client.close()


asyncio.run(cleanup())
