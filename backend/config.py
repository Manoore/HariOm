import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGO_URL: str = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.environ.get("DB_NAME", "divine_app")
    STRIPE_API_KEY: str = os.environ.get("STRIPE_API_KEY", "")
    RAZORPAY_KEY_ID: str = os.environ.get("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.environ.get("RAZORPAY_KEY_SECRET", "")
    FIREBASE_PROJECT_ID: str = os.environ.get("FIREBASE_PROJECT_ID", "")
    FIREBASE_WEB_API_KEY: str = os.environ.get("FIREBASE_WEB_API_KEY", "")
    HOROSCOPE_API_URL: str = os.environ.get("HOROSCOPE_API_URL", "")

settings = Settings()
