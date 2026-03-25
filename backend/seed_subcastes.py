import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv
import os

load_dotenv()
client = AsyncIOMotorClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME", "divine_app")]

SUBCASTES = [
    "Adi Goud", "Ahiwasi / Ahwasi (Haiwasi)", "Agachi", "Anavil", "Aravattokkalu",
    "Ashtasahasram Iyer", "Audichya", "Awasthi", "Babburkamme Smartha",
    "Badaganadu Smartha", "Badaganadu Madhwa", "Bagaria (Parchuniya)",
    "Barendra (Bengal)", "Basotra", "Beyal", "Bhargava (Bundelkhand/MP)",
    "Bhumihar", "Bilwar", "Bral", "Brahatcharanam Iyer", "Brahmabhat", "Byas",
    "Chitpavan / Konkanastha", "Daivajna", "Dasadwipi", "Dehra Dun", "Deshastha",
    "Devrukhe", "Dhima", "Dravida", "Embranthiri", "Garhwali", "Gaur", "Gautam",
    "Golapurab", "Gouda Saraswat", "Gurjar Gaur", "Gurukkal / Shivacharya",
    "Halenadu Karnataka (Muguru Karnataka)", "Havyaka", "Hebbar Iyengar",
    "Hoysala Karnataka", "Jangid", "Jangra", "Jijhotia", "Kandavara",
    "Kanyakubja / Kanaujia", "Karhada / Karade",
    "Kashmiri Saraswat / Kashmiri Pandit", "Kayastha", "Kerala Iyer", "Khandelwal",
    "Khedawal", "Khajuria / Dogra", "Konkani Saraswat", "Kota", "Koteshwara",
    "Kudaldeshkar", "Kumaoni", "Kurmachali", "Lrikhishwar", "Lyariya", "Madhwa",
    "Madras Iyengar", "Magadh", "Maithil", "Malwa / Malwi", "Mandyam Iyengar",
    "Mathur", "Modh", "Mohyal", "Muluknadu", "Myale", "Nade", "Nagar",
    "Naipali / Nepali", "Namboothiri", "Nandimukh / Nandwana",
    "Naramdeo / Narmdiya", "Niyogi", "Padia", "Paliwal", "Palashe", "Pancharatra",
    "Pangotra", "Pottee", "Punjabi Saraswat", "Pushkarna", "Rahri / Rarhi",
    "Rajapur Saraswat", "Rigvedi Deshastha", "Sadotra", "Sakaldwipi", "Saklapuri",
    "Sanadhya", "Sankahar", "Sanketi", "Saraswat", "Sarwaria",
    "Saryupari / Saryupareen", "Sengardaro", "Shenevi", "Shrimali", "Shrotriya",
    "Sirinadu Smartha", "Smartha", "Srigaur", "Sthanika", "Suryadwij", "Sapt-Shati",
    "Thatiya", "Thenkalai Iyengar", "Tuluva", "Tyagi", "Uluchakamme Smartha",
    "Unwariya", "Uppal", "Upreti", "Utkal", "Vadagalai Iyengar", "Vadama Iyer",
    "Vaidiki / Vaidik", "Vaishnava", "Vaikhanasa", "Vathima Iyer",
    "Yajurvedi Deshastha",
]


async def seed():
    col = db["subcastes"]
    existing = await col.count_documents({})
    if existing > 0:
        print(f"Subcastes already seeded ({existing}). Dropping and re-seeding...")
        await col.drop()

    docs = [{"name": name, "created_at": datetime.now(timezone.utc)} for name in SUBCASTES]
    result = await col.insert_many(docs)
    print(f"Seeded {len(result.inserted_ids)} subcastes")
    await col.create_index("name", unique=True)
    client.close()


asyncio.run(seed())
