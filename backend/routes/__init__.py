# Routes package for Divine App Backend
# This package contains modular route files for better organization

from fastapi import APIRouter

# Import all routers
from .auth import router as auth_router
from .users import router as users_router
from .shop import router as shop_router
from .products import router as products_router
from .orders import router as orders_router
from .cart import router as cart_router
from .chat import router as chat_router
from .admin import router as admin_router
from .posts import router as posts_router
from .uploads import router as uploads_router
from .reviews import router as reviews_router

__all__ = [
    'auth_router',
    'users_router', 
    'shop_router',
    'products_router',
    'orders_router',
    'cart_router',
    'chat_router',
    'admin_router',
    'posts_router',
    'uploads_router',
    'reviews_router',
]
