"""
System Configuration Module - Admin-editable settings stored in database
Includes API keys, app settings, payment configs, and more
"""
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from database import system_config_collection
from cryptography.fernet import Fernet
import base64
import hashlib

# Generate encryption key from a secret (use JWT secret as base)
def get_encryption_key():
    secret = os.environ.get("JWT_SECRET", "divine-app-secret-key-2024")
    # Create a valid Fernet key from the secret
    key = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(key)

# Encrypt sensitive data
def encrypt_value(value: str) -> str:
    if not value:
        return ""
    try:
        f = Fernet(get_encryption_key())
        return f.encrypt(value.encode()).decode()
    except Exception:
        return value

# Decrypt sensitive data
def decrypt_value(encrypted: str) -> str:
    if not encrypted:
        return ""
    try:
        f = Fernet(get_encryption_key())
        return f.decrypt(encrypted.encode()).decode()
    except Exception:
        return encrypted

# Mask sensitive values for display
def mask_value(value: str, show_chars: int = 4) -> str:
    if not value or len(value) <= show_chars:
        return "****"
    return value[:show_chars] + "*" * (len(value) - show_chars)

# Default configuration structure
DEFAULT_CONFIG = {
    # API Keys - 100ms Video
    "hms_access_key": {
        "value": "",
        "category": "video",
        "label": "100ms Access Key",
        "description": "100ms App Access Key for video calls",
        "sensitive": True,
        "required": True
    },
    "hms_secret": {
        "value": "",
        "category": "video",
        "label": "100ms Secret",
        "description": "100ms App Secret for video calls",
        "sensitive": True,
        "required": True
    },
    
    # API Keys - Stripe
    "stripe_publishable_key": {
        "value": "",
        "category": "payment",
        "label": "Stripe Publishable Key",
        "description": "Stripe public key (starts with pk_)",
        "sensitive": False,
        "required": True
    },
    "stripe_secret_key": {
        "value": "",
        "category": "payment",
        "label": "Stripe Secret Key",
        "description": "Stripe secret key (starts with sk_)",
        "sensitive": True,
        "required": True
    },
    
    # API Keys - Razorpay
    "razorpay_key_id": {
        "value": "",
        "category": "payment",
        "label": "Razorpay Key ID",
        "description": "Razorpay Key ID for Indian payments",
        "sensitive": False,
        "required": True
    },
    "razorpay_key_secret": {
        "value": "",
        "category": "payment",
        "label": "Razorpay Key Secret",
        "description": "Razorpay Secret Key",
        "sensitive": True,
        "required": True
    },
    
    # API Keys - Firebase
    "firebase_api_key": {
        "value": "",
        "category": "firebase",
        "label": "Firebase API Key",
        "description": "Firebase Web API Key",
        "sensitive": True,
        "required": True
    },
    "firebase_auth_domain": {
        "value": "",
        "category": "firebase",
        "label": "Firebase Auth Domain",
        "description": "Firebase Authentication Domain",
        "sensitive": False,
        "required": True
    },
    "firebase_project_id": {
        "value": "",
        "category": "firebase",
        "label": "Firebase Project ID",
        "description": "Firebase Project ID",
        "sensitive": False,
        "required": True
    },
    
    # Payment Settings
    "payment_gateway_mode": {
        "value": "auto",
        "category": "payment_settings",
        "label": "Payment Gateway Mode",
        "description": "auto = IP-based, stripe = force Stripe, razorpay = force Razorpay",
        "sensitive": False,
        "options": ["auto", "stripe", "razorpay"],
        "required": False
    },
    "currency_inr": {
        "value": "INR",
        "category": "payment_settings",
        "label": "Indian Currency",
        "description": "Currency code for Indian users",
        "sensitive": False,
        "required": False
    },
    "currency_international": {
        "value": "USD",
        "category": "payment_settings",
        "label": "International Currency",
        "description": "Currency code for international users",
        "sensitive": False,
        "required": False
    },
    
    # Platform Fees & Taxes
    "platform_fee_type": {
        "value": "percentage",
        "category": "fees_taxes",
        "label": "Platform Fee Type",
        "description": "How to calculate platform fee - fixed amount or percentage",
        "sensitive": False,
        "options": ["percentage", "fixed"],
        "required": False
    },
    "platform_fee_value": {
        "value": "2.5",
        "category": "fees_taxes",
        "label": "Platform Fee Value",
        "description": "Platform fee amount (in % or ₹ based on type)",
        "sensitive": False,
        "required": False,
        "type": "number"
    },
    "platform_fee_enabled": {
        "value": True,
        "category": "fees_taxes",
        "label": "Enable Platform Fee",
        "description": "Enable/disable platform fee on orders",
        "sensitive": False,
        "type": "boolean",
        "required": False
    },
    "gst_enabled": {
        "value": True,
        "category": "fees_taxes",
        "label": "Enable GST",
        "description": "Enable/disable GST on orders",
        "sensitive": False,
        "type": "boolean",
        "required": False
    },
    "gst_percentage": {
        "value": "18",
        "category": "fees_taxes",
        "label": "GST Percentage",
        "description": "GST rate applied to orders (%)",
        "sensitive": False,
        "required": False,
        "type": "number"
    },
    "gst_on_platform_fee": {
        "value": True,
        "category": "fees_taxes",
        "label": "GST on Platform Fee",
        "description": "Include platform fee in GST calculation",
        "sensitive": False,
        "type": "boolean",
        "required": False
    },
    "gst_registration_number": {
        "value": "",
        "category": "fees_taxes",
        "label": "GST Registration Number",
        "description": "Your GST registration number (shown on invoices)",
        "sensitive": False,
        "required": False
    },
    "tax_label": {
        "value": "GST",
        "category": "fees_taxes",
        "label": "Tax Label",
        "description": "Label shown for tax (e.g., GST, VAT, Tax)",
        "sensitive": False,
        "required": False
    },
    
    # App Branding
    "app_name": {
        "value": "Divine App",
        "category": "branding",
        "label": "App Name",
        "description": "Application name displayed to users",
        "sensitive": False,
        "required": True
    },
    "app_tagline": {
        "value": "Your Spiritual Journey Begins Here",
        "category": "branding",
        "label": "App Tagline",
        "description": "Tagline shown on landing page",
        "sensitive": False,
        "required": False
    },
    "support_email": {
        "value": "support@divineapp.com",
        "category": "branding",
        "label": "Support Email",
        "description": "Customer support email address",
        "sensitive": False,
        "required": True
    },
    "support_phone": {
        "value": "+91-1234567890",
        "category": "branding",
        "label": "Support Phone",
        "description": "Customer support phone number",
        "sensitive": False,
        "required": False
    },
    "contact_address": {
        "value": "Hyderabad, Telangana, India",
        "category": "branding",
        "label": "Contact Address",
        "description": "Physical address shown on contact page",
        "sensitive": False,
        "required": False
    },
    
    # Maintenance Mode
    "maintenance_mode": {
        "value": False,
        "category": "maintenance",
        "label": "Maintenance Mode",
        "description": "Enable to show maintenance page to users",
        "sensitive": False,
        "required": False,
        "type": "boolean"
    },
    "maintenance_message": {
        "value": "We are currently performing scheduled maintenance. Please check back soon.",
        "category": "maintenance",
        "label": "Maintenance Message",
        "description": "Message shown during maintenance",
        "sensitive": False,
        "required": False
    },
    
    # Notification Settings
    "enable_email_notifications": {
        "value": True,
        "category": "notifications",
        "label": "Email Notifications",
        "description": "Enable email notifications to users",
        "sensitive": False,
        "type": "boolean",
        "required": False
    },
    "enable_sms_notifications": {
        "value": False,
        "category": "notifications",
        "label": "SMS Notifications",
        "description": "Enable SMS notifications to users",
        "sensitive": False,
        "type": "boolean",
        "required": False
    },
    "enable_push_notifications": {
        "value": True,
        "category": "notifications",
        "label": "Push Notifications",
        "description": "Enable browser push notifications",
        "sensitive": False,
        "type": "boolean",
        "required": False
    },
    
    # SMS Provider (Twilio/MSG91)
    "sms_provider": {
        "value": "twilio",
        "category": "notifications",
        "label": "SMS Provider",
        "description": "SMS service provider",
        "sensitive": False,
        "options": ["twilio", "msg91", "none"],
        "required": False
    },
    "twilio_account_sid": {
        "value": "",
        "category": "notifications",
        "label": "Twilio Account SID",
        "description": "Twilio Account SID for SMS",
        "sensitive": True,
        "required": False
    },
    "twilio_auth_token": {
        "value": "",
        "category": "notifications",
        "label": "Twilio Auth Token",
        "description": "Twilio Auth Token",
        "sensitive": True,
        "required": False
    },
    "twilio_phone_number": {
        "value": "",
        "category": "notifications",
        "label": "Twilio Phone Number",
        "description": "Twilio sender phone number",
        "sensitive": False,
        "required": False
    },
    
    # Email Provider (SendGrid/SMTP)
    "email_provider": {
        "value": "sendgrid",
        "category": "notifications",
        "label": "Email Provider",
        "description": "Email service provider",
        "sensitive": False,
        "options": ["sendgrid", "smtp", "none"],
        "required": False
    },
    "sendgrid_api_key": {
        "value": "",
        "category": "notifications",
        "label": "SendGrid API Key",
        "description": "SendGrid API Key for emails",
        "sensitive": True,
        "required": False
    },
    "email_from_address": {
        "value": "noreply@divineapp.com",
        "category": "notifications",
        "label": "Email From Address",
        "description": "Sender email address",
        "sensitive": False,
        "required": False
    },
    "email_from_name": {
        "value": "Divine App",
        "category": "notifications",
        "label": "Email From Name",
        "description": "Sender name for emails",
        "sensitive": False,
        "required": False
    },
}

# ===================== CONFIG MANAGEMENT =====================

async def init_system_config():
    """Initialize system config with defaults and env values"""
    existing = await system_config_collection.find_one({"_id": "system_config"})
    
    if not existing:
        # First time setup - populate from env and defaults
        config_data = {"_id": "system_config", "settings": {}}
        
        for key, config in DEFAULT_CONFIG.items():
            value = config["value"]
            
            # Try to get from environment variables
            env_key = key.upper()
            env_value = os.environ.get(env_key)
            
            # Special mappings for env vars
            env_mappings = {
                "hms_access_key": "HMS_ACCESS_KEY",
                "hms_secret": "HMS_SECRET",
                "stripe_publishable_key": "STRIPE_PUBLISHABLE_KEY",
                "stripe_secret_key": "STRIPE_SECRET_KEY",
                "razorpay_key_id": "RAZORPAY_KEY_ID",
                "razorpay_key_secret": "RAZORPAY_KEY_SECRET",
            }
            
            if key in env_mappings:
                env_value = os.environ.get(env_mappings[key], env_value)
            
            if env_value:
                value = env_value
            
            # Encrypt sensitive values
            if config.get("sensitive") and value:
                value = encrypt_value(str(value))
            
            config_data["settings"][key] = {
                **config,
                "value": value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        
        config_data["created_at"] = datetime.now(timezone.utc)
        config_data["updated_at"] = datetime.now(timezone.utc)
        
        await system_config_collection.insert_one(config_data)
        return config_data
    
    return existing

async def get_all_config(include_sensitive: bool = False) -> Dict[str, Any]:
    """Get all configuration settings"""
    config = await system_config_collection.find_one({"_id": "system_config"})
    
    if not config:
        config = await init_system_config()
    
    result = {}
    settings = config.get("settings", {})
    
    for key, setting in settings.items():
        value = setting.get("value", "")
        is_sensitive = setting.get("sensitive", False)
        
        # Decrypt if sensitive
        if is_sensitive and value:
            decrypted = decrypt_value(value)
            if include_sensitive:
                value = decrypted
            else:
                value = mask_value(decrypted)
        
        result[key] = {
            "value": value,
            "category": setting.get("category", "general"),
            "label": setting.get("label", key),
            "description": setting.get("description", ""),
            "sensitive": is_sensitive,
            "required": setting.get("required", False),
            "options": setting.get("options"),
            "type": setting.get("type", "string"),
            "updated_at": setting.get("updated_at")
        }
    
    return result

async def get_config_value(key: str, default: Any = None) -> Any:
    """Get a single config value (decrypted)"""
    config = await system_config_collection.find_one({"_id": "system_config"})
    
    if not config:
        config = await init_system_config()
    
    settings = config.get("settings", {})
    setting = settings.get(key)
    
    if not setting:
        return default
    
    value = setting.get("value", default)
    
    # Decrypt if sensitive
    if setting.get("sensitive") and value:
        value = decrypt_value(value)
    
    return value

async def update_config(key: str, value: Any) -> Dict[str, Any]:
    """Update a single config value"""
    config = await system_config_collection.find_one({"_id": "system_config"})
    
    if not config:
        config = await init_system_config()
    
    settings = config.get("settings", {})
    
    if key not in settings and key not in DEFAULT_CONFIG:
        raise ValueError(f"Unknown config key: {key}")
    
    # Get config definition
    config_def = settings.get(key, DEFAULT_CONFIG.get(key, {}))
    
    # Encrypt if sensitive
    if config_def.get("sensitive") and value:
        value = encrypt_value(str(value))
    
    # Update the value
    await system_config_collection.update_one(
        {"_id": "system_config"},
        {
            "$set": {
                f"settings.{key}.value": value,
                f"settings.{key}.updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"key": key, "updated": True}

async def update_multiple_configs(updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update multiple config values at once"""
    config = await system_config_collection.find_one({"_id": "system_config"})
    
    if not config:
        config = await init_system_config()
    
    settings = config.get("settings", {})
    update_ops = {}
    
    for key, value in updates.items():
        if key not in settings and key not in DEFAULT_CONFIG:
            continue
        
        config_def = settings.get(key, DEFAULT_CONFIG.get(key, {}))
        
        # Encrypt if sensitive and value is not masked
        if config_def.get("sensitive") and value and not value.startswith("****"):
            value = encrypt_value(str(value))
        elif config_def.get("sensitive") and value and value.startswith("****"):
            # Skip masked values (not changed)
            continue
        
        update_ops[f"settings.{key}.value"] = value
        update_ops[f"settings.{key}.updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_ops:
        update_ops["updated_at"] = datetime.now(timezone.utc)
        await system_config_collection.update_one(
            {"_id": "system_config"},
            {"$set": update_ops}
        )
    
    return {"updated_count": len(update_ops) // 2}

async def get_config_by_category(category: str, include_sensitive: bool = False) -> Dict[str, Any]:
    """Get config settings by category"""
    all_config = await get_all_config(include_sensitive)
    return {k: v for k, v in all_config.items() if v.get("category") == category}

# ===================== HELPER FUNCTIONS =====================

async def get_active_payment_gateway() -> str:
    """Get the active payment gateway based on settings"""
    mode = await get_config_value("payment_gateway_mode", "auto")
    return mode

async def is_maintenance_mode() -> bool:
    """Check if app is in maintenance mode"""
    return await get_config_value("maintenance_mode", False)

async def get_app_branding() -> Dict[str, str]:
    """Get app branding settings"""
    return {
        "app_name": await get_config_value("app_name", "Divine App"),
        "app_tagline": await get_config_value("app_tagline", "Your Spiritual Journey Begins Here"),
        "support_email": await get_config_value("support_email", "support@divineapp.com"),
        "support_phone": await get_config_value("support_phone", ""),
    }

# Category labels for UI
CONFIG_CATEGORIES = {
    "video": {"label": "Video (100ms)", "icon": "video", "description": "100ms video call integration settings"},
    "payment": {"label": "Payment Gateway Keys", "icon": "credit-card", "description": "Stripe and Razorpay API keys"},
    "payment_settings": {"label": "Payment Settings", "icon": "settings", "description": "Payment gateway configuration"},
    "fees_taxes": {"label": "Fees & Taxes", "icon": "receipt", "description": "Platform fees, GST, and tax settings"},
    "firebase": {"label": "Firebase", "icon": "flame", "description": "Firebase authentication settings"},
    "branding": {"label": "App Branding", "icon": "palette", "description": "App name, tagline, and contact info"},
    "maintenance": {"label": "Maintenance", "icon": "tool", "description": "Maintenance mode settings"},
    "notifications": {"label": "Notifications", "icon": "bell", "description": "Email, SMS, and push notification settings"},
}

# ===================== API KEY ACCESSORS (with env fallback) =====================
# These functions provide a single source of truth for API keys
# They first check the database, then fall back to environment variables

async def get_100ms_credentials() -> Dict[str, str]:
    """Get 100ms API credentials - checks DB first, then env"""
    access_key = await get_config_value("hms_access_key")
    secret = await get_config_value("hms_secret")
    
    # Fall back to env if not set in DB
    if not access_key:
        access_key = os.environ.get("HMS_ACCESS_KEY", "")
    if not secret:
        secret = os.environ.get("HMS_SECRET", "")
    
    return {
        "access_key": access_key,
        "secret": secret
    }

async def get_stripe_credentials() -> Dict[str, str]:
    """Get Stripe API credentials - checks DB first, then env"""
    publishable_key = await get_config_value("stripe_publishable_key")
    secret_key = await get_config_value("stripe_secret_key")
    
    # Fall back to env if not set in DB
    if not publishable_key:
        publishable_key = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
    if not secret_key:
        secret_key = os.environ.get("STRIPE_SECRET_KEY", "")
    
    return {
        "publishable_key": publishable_key,
        "secret_key": secret_key
    }

async def get_razorpay_credentials() -> Dict[str, str]:
    """Get Razorpay API credentials - checks DB first, then env"""
    key_id = await get_config_value("razorpay_key_id")
    key_secret = await get_config_value("razorpay_key_secret")
    
    # Fall back to env if not set in DB
    if not key_id:
        key_id = os.environ.get("RAZORPAY_KEY_ID", "")
    if not key_secret:
        key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    
    return {
        "key_id": key_id,
        "key_secret": key_secret
    }

async def get_firebase_credentials() -> Dict[str, str]:
    """Get Firebase credentials - checks DB first, then env"""
    api_key = await get_config_value("firebase_api_key")
    auth_domain = await get_config_value("firebase_auth_domain")
    project_id = await get_config_value("firebase_project_id")
    
    # Fall back to env if not set in DB
    if not api_key:
        api_key = os.environ.get("FIREBASE_WEB_API_KEY", "")
    if not project_id:
        project_id = os.environ.get("FIREBASE_PROJECT_ID", "")
    
    return {
        "api_key": api_key,
        "auth_domain": auth_domain or f"{project_id}.firebaseapp.com",
        "project_id": project_id
    }


async def get_fees_and_taxes() -> Dict[str, Any]:
    """Get platform fees and tax configuration for checkout"""
    platform_fee_enabled = await get_config_value("platform_fee_enabled")
    platform_fee_type = await get_config_value("platform_fee_type")
    platform_fee_value = await get_config_value("platform_fee_value")
    gst_enabled = await get_config_value("gst_enabled")
    gst_percentage = await get_config_value("gst_percentage")
    gst_on_platform_fee = await get_config_value("gst_on_platform_fee")
    tax_label = await get_config_value("tax_label")
    gst_registration_number = await get_config_value("gst_registration_number")
    
    return {
        "platform_fee": {
            "enabled": platform_fee_enabled if platform_fee_enabled is not None else True,
            "type": platform_fee_type or "percentage",
            "value": float(platform_fee_value or 2.5)
        },
        "tax": {
            "enabled": gst_enabled if gst_enabled is not None else True,
            "percentage": float(gst_percentage or 18),
            "on_platform_fee": gst_on_platform_fee if gst_on_platform_fee is not None else True,
            "label": tax_label or "GST",
            "registration_number": gst_registration_number or ""
        }
    }


def calculate_fees_and_taxes(subtotal: float, fees_config: Dict) -> Dict[str, float]:
    """Calculate platform fee and tax amounts based on configuration"""
    platform_fee = 0
    tax_amount = 0
    
    # Calculate platform fee
    if fees_config["platform_fee"]["enabled"]:
        if fees_config["platform_fee"]["type"] == "percentage":
            platform_fee = round(subtotal * fees_config["platform_fee"]["value"] / 100, 2)
        else:
            platform_fee = fees_config["platform_fee"]["value"]
    
    # Calculate tax
    if fees_config["tax"]["enabled"]:
        taxable_amount = subtotal
        if fees_config["tax"]["on_platform_fee"]:
            taxable_amount += platform_fee
        tax_amount = round(taxable_amount * fees_config["tax"]["percentage"] / 100, 2)
    
    return {
        "platform_fee": platform_fee,
        "tax_amount": tax_amount,
        "tax_percentage": fees_config["tax"]["percentage"] if fees_config["tax"]["enabled"] else 0,
        "tax_label": fees_config["tax"]["label"]
    }

