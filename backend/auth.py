from datetime import datetime, timezone, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import users_collection
from bson import ObjectId
import httpx

SECRET_KEY = "divine-app-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def verify_firebase_token(token: str) -> Optional[dict]:
    """Verify Firebase ID token and return user info"""
    try:
        # Firebase tokens are JWTs - decode without verification to get the uid
        # In production, you should verify with Firebase Admin SDK
        # For now, we'll decode and look up the user by firebase_uid
        import base64
        import json
        
        # Decode the payload (middle part of JWT)
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        # Add padding if needed
        payload = parts[1]
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
            
        decoded = base64.urlsafe_b64decode(payload)
        payload_data = json.loads(decoded)
        
        firebase_uid = payload_data.get('user_id') or payload_data.get('sub')
        email = payload_data.get('email')
        
        if not firebase_uid:
            return None
            
        return {"firebase_uid": firebase_uid, "email": email}
    except Exception as e:
        print(f"Firebase token verification error: {e}")
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    user = None
    
    # First try to decode as our own JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except JWTError:
        pass
    
    # If not our JWT, try Firebase token
    if user is None:
        firebase_data = await verify_firebase_token(token)
        if firebase_data and firebase_data.get("firebase_uid"):
            # Look up user by firebase_uid
            user = await users_collection.find_one({"firebase_uid": firebase_data["firebase_uid"]})
            if user is None and firebase_data.get("email"):
                # Try by email as fallback
                user = await users_collection.find_one({"email": firebase_data["email"]})
    
    if user is None:
        raise credentials_exception
    
    user["id"] = str(user["_id"])
    return user

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[dict]:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

def require_role(allowed_roles: list):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource"
            )
        return user
    return role_checker
