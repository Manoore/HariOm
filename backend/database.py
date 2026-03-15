from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client = AsyncIOMotorClient(settings.MONGO_URL)
db = client[settings.DB_NAME]

# Devotional Content Database
devotional_db = client["devotional_content"]

# Collections - Main Database
users_collection = db["users"]
priests_collection = db["priests"]
astrologers_collection = db["astrologers"]
shops_collection = db["shops"]
products_collection = db["products"]
bookings_collection = db["bookings"]
orders_collection = db["orders"]
payment_transactions_collection = db["payment_transactions"]
horoscopes_collection = db["horoscopes"]
festivals_collection = db["festivals"]
temples_collection = db["temples"]
reviews_collection = db["reviews"]
cart_collection = db["carts"]

# Priest Dashboard Collections
priest_classes_collection = db["priest_classes"]
priest_availability_collection = db["priest_availability"]
priest_content_collection = db["priest_content"]
priest_streams_collection = db["priest_streams"]
priest_portfolio_collection = db["priest_portfolio"]
priest_services_collection = db["priest_services"]
priest_posts_collection = db["priest_posts"]
post_comments_collection = db["post_comments"]
post_likes_collection = db["post_likes"]

# Chat Collections
chat_rooms_collection = db["chat_rooms"]
chat_messages_collection = db["chat_messages"]

# Video Consultation Collections
system_settings_collection = db["system_settings"]
user_wallets_collection = db["user_wallets"]
wallet_transactions_collection = db["wallet_transactions"]
consultation_calls_collection = db["consultation_calls"]
astrologer_profiles_collection = db["astrologer_profiles"]

# System Configuration Collection (for admin-editable settings)
system_config_collection = db["system_config"]

# Product Reviews Collection
product_reviews_collection = db["product_reviews"]

# Collections - Devotional Content
deities_collection = devotional_db["deities"]
mantras_collection = devotional_db["mantras"]
stotras_collection = devotional_db["stotras"]
daily_schedule_collection = devotional_db["daily_schedule"]

async def init_db():
    """Initialize database indexes"""
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("firebase_uid", unique=True, sparse=True)
    await priests_collection.create_index("user_id")
    await astrologers_collection.create_index("user_id")
    await shops_collection.create_index("owner_id")
    await products_collection.create_index("shop_id")
    await bookings_collection.create_index([("user_id", 1), ("status", 1)])
    await orders_collection.create_index([("user_id", 1), ("created_at", -1)])
    # Chat indexes
    await chat_rooms_collection.create_index([("participants", 1)])
    await chat_rooms_collection.create_index([("booking_id", 1)])
    await chat_rooms_collection.create_index([("order_id", 1)])
    await chat_messages_collection.create_index([("room_id", 1), ("created_at", -1)])
    # Wallet indexes
    await user_wallets_collection.create_index("user_id", unique=True)
    await wallet_transactions_collection.create_index([("user_id", 1), ("created_at", -1)])
    await consultation_calls_collection.create_index([("user_id", 1), ("created_at", -1)])
    await consultation_calls_collection.create_index([("astrologer_id", 1), ("created_at", -1)])
    await astrologer_profiles_collection.create_index("user_id", unique=True)
    # Product reviews indexes
    await product_reviews_collection.create_index([("product_id", 1), ("created_at", -1)])
    await product_reviews_collection.create_index([("user_id", 1)])
    await product_reviews_collection.create_index([("product_id", 1), ("user_id", 1)], unique=True)
