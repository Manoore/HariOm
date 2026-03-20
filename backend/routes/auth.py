"""
Authentication Routes
Handles user registration, login, and Firebase sync
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
import bcrypt
import jwt
import os

from database import users_collection
from models import UserCreate, UserLogin, UserRole
from auth import get_current_user, create_access_token, verify_password, get_password_hash

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
async def register(user_data: UserCreate):
    """Register a new user with email/password"""
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    
    user_dict = {
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "role": user_data.role or UserRole.DEVOTEE,
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    }
    
    result = await users_collection.insert_one(user_dict)
    
    token = create_access_token({"sub": str(result.inserted_id)})
    
    return {
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "email": user_data.email,
            "name": user_data.name,
            "role": user_dict["role"]
        }
    }

@router.post("/login")
async def login(credentials: UserLogin):
    """Login with email/password"""
    user = await users_collection.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    password_field = user.get("password_hash") or user.get("password")
    if not password_field or not verify_password(credentials.password, password_field):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user["_id"])})
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", UserRole.DEVOTEE)
        }
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "role": user.get("role", UserRole.DEVOTEE),
        "phone": user.get("phone"),
        "dob": user.get("dob"),
        "gotra": user.get("gotra"),
        "nakshatra": user.get("nakshatra"),
        "city": user.get("city"),
        "pincode": user.get("pincode"),
        "address": user.get("address"),
        "profile_image": user.get("profile_image"),
        "wallet_balance": user.get("wallet_balance", 0),
        "free_minutes": user.get("free_minutes", 0)
    }

@router.post("/firebase-sync")
async def firebase_sync(data: dict):
    """Sync Firebase user with backend database"""
    firebase_uid = data.get("firebase_uid")
    email = data.get("email")
    name = data.get("name")
    photo_url = data.get("photo_url")
    
    if not firebase_uid or not email:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Check if user exists
    existing_user = await users_collection.find_one({"firebase_uid": firebase_uid})
    
    if existing_user:
        # Update existing user
        await users_collection.update_one(
            {"firebase_uid": firebase_uid},
            {"$set": {
                "email": email,
                "name": name or existing_user.get("name"),
                "profile_image": photo_url or existing_user.get("profile_image"),
                "last_login": datetime.now(timezone.utc)
            }}
        )
        user = await users_collection.find_one({"firebase_uid": firebase_uid})
    else:
        # Create new user
        user_dict = {
            "firebase_uid": firebase_uid,
            "email": email,
            "name": name or email.split("@")[0],
            "role": UserRole.DEVOTEE,
            "profile_image": photo_url,
            "created_at": datetime.now(timezone.utc),
            "is_active": True,
            "wallet_balance": 0,
            "free_minutes": 5  # Welcome bonus
        }
        result = await users_collection.insert_one(user_dict)
        user = await users_collection.find_one({"_id": result.inserted_id})
    
    token = create_access_token({"sub": str(user["_id"])})
    
    return {
        "message": "Firebase sync successful",
        "token": token,
        "is_new_user": not existing_user,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", UserRole.DEVOTEE),
            "profile_image": user.get("profile_image")
        }
    }
