from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    DEVOTEE = "devotee"
    PRIEST = "priest"
    ASTROLOGER = "astrologer"
    SHOP_OWNER = "shop_owner"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    RECEIVED = "received"
    ACCEPTED = "accepted"
    PROCESSING = "processing"
    SHIPPING = "shipping"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.DEVOTEE

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: UserRole
    is_verified: bool = False
    created_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    profile_image: Optional[str] = None

# Priest Models
class PriestService(BaseModel):
    name: str
    description: str
    duration_minutes: int
    price: float
    category: str

class PriestCreate(BaseModel):
    specializations: List[str]
    experience_years: int
    languages: List[str]
    services: List[PriestService]
    bio: str
    available_online: bool = True

class PriestResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    specializations: List[str]
    experience_years: int
    languages: List[str]
    services: List[PriestService]
    bio: str
    rating: float = 0.0
    total_reviews: int = 0
    is_verified: bool = False
    available_online: bool = True

# Booking Models
class BookingCreate(BaseModel):
    priest_id: str
    service_name: str
    booking_date: datetime
    booking_type: str = "online"  # online or home_visit
    address: Optional[str] = None
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: str
    user_id: str
    priest_id: str
    priest_name: str
    service_name: str
    price: float
    booking_date: datetime
    booking_type: str
    status: BookingStatus
    address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

# Shop & Product Models
class ShopCreate(BaseModel):
    name: str
    description: str
    address: str
    city: str
    phone: str

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock: int
    images: List[str] = []
    video_url: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    shop_id: str
    shop_name: str
    name: str
    description: str
    price: float
    category: str
    stock: int
    images: List[str]
    video_url: Optional[str] = None
    rating: float = 0.0
    total_reviews: int = 0

# Cart & Order Models
class CartItem(BaseModel):
    product_id: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: str
    payment_method: str = "stripe"  # stripe or razorpay

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[dict]
    total_amount: float
    shipping_address: str
    status: OrderStatus
    payment_method: str
    payment_status: str
    created_at: datetime

# Horoscope Models
class BirthDetails(BaseModel):
    name: str
    date_of_birth: str  # YYYY-MM-DD
    time_of_birth: str  # HH:MM
    place_of_birth: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class HoroscopeResponse(BaseModel):
    zodiac_sign: str
    daily_prediction: str
    lucky_number: int
    lucky_color: str
    mood: str
    compatibility: str

# Astrologer Models
class AstrologerCreate(BaseModel):
    specializations: List[str]
    experience_years: int
    languages: List[str]
    consultation_fee: float
    bio: str

class AstrologerResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    specializations: List[str]
    experience_years: int
    languages: List[str]
    consultation_fee: float
    bio: str
    rating: float = 0.0
    is_verified: bool = False

# Review Model
class ReviewCreate(BaseModel):
    target_type: str  # priest, astrologer, product, shop
    target_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

# Payment Models
class PaymentCreate(BaseModel):
    amount: float
    currency: str = "INR"
    payment_type: str  # booking or order
    reference_id: str
    payment_method: str = "stripe"
