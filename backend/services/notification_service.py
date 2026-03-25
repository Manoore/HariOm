"""
Notification Service Module
Handles all notifications (Email, In-App & Push) for the Divine App.
- Email users: Send email via Resend
- Phone users: Store as in-app notification
- Push: Send FCM push notifications to registered devices
"""

import os
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from enum import Enum

import httpx
import resend

from database import users_collection, notification_logs_collection, fcm_tokens_collection

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# Initialize Firebase Admin SDK for FCM V1 API
import firebase_admin
from firebase_admin import credentials, messaging as fcm_messaging

def _init_firebase_admin():
    """Initialize Firebase Admin SDK using service account JSON"""
    if firebase_admin._apps:
        return True
    
    sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    
    try:
        if sa_path and os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized from service account file")
            return True
        elif sa_json:
            import json
            sa_dict = json.loads(sa_json)
            cred = credentials.Certificate(sa_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized from JSON env variable")
            return True
        else:
            logger.warning("No Firebase service account configured. Push notifications will be disabled.")
            return False
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {e}")
        return False

FIREBASE_ADMIN_READY = _init_firebase_admin()


class NotificationType(str, Enum):
    BOOKING_CREATED = "booking_created"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_COMPLETED = "booking_completed"
    # Priest-facing booking notifications
    PRIEST_NEW_BOOKING = "priest_new_booking"
    PRIEST_BOOKING_CANCELLED = "priest_booking_cancelled"
    CLASS_ENROLLED = "class_enrolled"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    REFUND_INITIATED = "refund_initiated"
    REFUND_COMPLETED = "refund_completed"


# Notification titles and icons for in-app display
NOTIFICATION_CONFIG = {
    NotificationType.BOOKING_CREATED: {"title": "Booking Created", "icon": "calendar-plus"},
    NotificationType.BOOKING_CONFIRMED: {"title": "Booking Confirmed", "icon": "check-circle"},
    NotificationType.BOOKING_CANCELLED: {"title": "Booking Cancelled", "icon": "x-circle"},
    NotificationType.BOOKING_COMPLETED: {"title": "Puja Completed", "icon": "star"},
    NotificationType.PRIEST_NEW_BOOKING: {"title": "New Booking Received", "icon": "calendar-plus"},
    NotificationType.PRIEST_BOOKING_CANCELLED: {"title": "Booking Cancelled", "icon": "x-circle"},
    NotificationType.CLASS_ENROLLED: {"title": "Class Enrollment", "icon": "book-open"},
    NotificationType.PAYMENT_SUCCESS: {"title": "Payment Successful", "icon": "credit-card"},
    NotificationType.PAYMENT_FAILED: {"title": "Payment Failed", "icon": "alert-circle"},
    NotificationType.REFUND_INITIATED: {"title": "Refund Initiated", "icon": "refresh-cw"},
    NotificationType.REFUND_COMPLETED: {"title": "Refund Completed", "icon": "check"},
}

# In-app notification messages (short versions)
INAPP_MESSAGES = {
    NotificationType.BOOKING_CREATED: "Your booking for {service_name} with {priest_name} on {booking_date} has been created. Amount: ₹{amount}",
    NotificationType.BOOKING_CONFIRMED: "Great news! Your booking for {service_name} has been confirmed by {priest_name}.",
    NotificationType.BOOKING_CANCELLED: "Your booking for {service_name} has been cancelled. Refund: ₹{refund_amount}",
    NotificationType.BOOKING_COMPLETED: "Your puja {service_name} is complete! Please rate your experience with {priest_name}.",
    NotificationType.PRIEST_NEW_BOOKING: "New booking from {devotee_name} for {service_name} on {booking_date}. Amount: ₹{amount}",
    NotificationType.PRIEST_BOOKING_CANCELLED: "Booking for {service_name} by {devotee_name} has been cancelled.",
    NotificationType.CLASS_ENROLLED: "You're enrolled in {class_name} by {teacher_name}. Schedule: {schedule}",
    NotificationType.PAYMENT_SUCCESS: "Payment of ₹{amount} successful for {description}.",
    NotificationType.REFUND_INITIATED: "Refund of ₹{refund_amount} has been initiated. Will be credited in 5-7 days.",
}


# Email Templates
EMAIL_TEMPLATES = {
    NotificationType.BOOKING_CREATED: {
        "subject": "Booking Confirmed - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #FF6B00, #FFB800); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">🙏 Divine App</h1>
            </div>
            <div style="padding: 30px; background: #FFF9F5; border-radius: 0 0 10px 10px;">
                <h2 style="color: #8B4513;">Namaste {user_name}!</h2>
                <p style="color: #333; line-height: 1.6;">Your booking has been created successfully.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #FF6B00; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service_name}</p>
                    <p style="margin: 5px 0;"><strong>Priest:</strong> {priest_name}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {booking_date}</p>
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ₹{amount}</p>
                    <p style="margin: 5px 0;"><strong>Booking ID:</strong> {booking_id}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">The priest will confirm your booking shortly. You can chat with them through the app.</p>
                
                <p style="color: #8B4513; margin-top: 30px;">Om Namah Shivaya 🙏</p>
            </div>
        </div>
        """
    },
    NotificationType.BOOKING_CONFIRMED: {
        "subject": "Booking Confirmed by Priest - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">✅ Booking Confirmed</h1>
            </div>
            <div style="padding: 30px; background: #F0FFF4; border-radius: 0 0 10px 10px;">
                <h2 style="color: #155724;">Namaste {user_name}!</h2>
                <p style="color: #333; line-height: 1.6;">Great news! Your booking has been confirmed by the priest.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #28a745; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service_name}</p>
                    <p style="margin: 5px 0;"><strong>Priest:</strong> {priest_name}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {booking_date}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">You can now chat with the priest to discuss any details for the puja.</p>
                
                <p style="color: #155724; margin-top: 30px;">Shubh Aashirwad 🙏</p>
            </div>
        </div>
        """
    },
    NotificationType.BOOKING_CANCELLED: {
        "subject": "Booking Cancelled - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #dc3545, #c82333); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">❌ Booking Cancelled</h1>
            </div>
            <div style="padding: 30px; background: #FFF5F5; border-radius: 0 0 10px 10px;">
                <h2 style="color: #721c24;">Namaste {user_name},</h2>
                <p style="color: #333; line-height: 1.6;">Your booking has been cancelled.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #dc3545; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service_name}</p>
                    <p style="margin: 5px 0;"><strong>Priest:</strong> {priest_name}</p>
                    <p style="margin: 5px 0;"><strong>Original Amount:</strong> ₹{amount}</p>
                    <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹{refund_amount}</p>
                    <p style="margin: 5px 0;"><strong>Refund Status:</strong> {refund_status}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support.</p>
            </div>
        </div>
        """
    },
    NotificationType.BOOKING_COMPLETED: {
        "subject": "Puja Completed - Thank You! - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #6f42c1, #e83e8c); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">🎉 Puja Completed</h1>
            </div>
            <div style="padding: 30px; background: #F8F5FF; border-radius: 0 0 10px 10px;">
                <h2 style="color: #6f42c1;">Namaste {user_name}!</h2>
                <p style="color: #333; line-height: 1.6;">Your puja has been completed successfully. May the blessings be with you!</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #6f42c1; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service_name}</p>
                    <p style="margin: 5px 0;"><strong>Priest:</strong> {priest_name}</p>
                </div>
                
                <p style="color: #6f42c1; font-weight: bold;">Please take a moment to review your experience!</p>
                <p style="color: #666; font-size: 14px;">Your feedback helps other devotees find the right priest.</p>
                
                <p style="color: #6f42c1; margin-top: 30px;">Har Har Mahadev 🙏</p>
            </div>
        </div>
        """
    },
    NotificationType.CLASS_ENROLLED: {
        "subject": "Class Enrollment Confirmed - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #17a2b8, #138496); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">📚 Enrollment Successful</h1>
            </div>
            <div style="padding: 30px; background: #E8F8FA; border-radius: 0 0 10px 10px;">
                <h2 style="color: #0c5460;">Namaste {user_name}!</h2>
                <p style="color: #333; line-height: 1.6;">You have successfully enrolled in the class.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #17a2b8; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Class:</strong> {class_name}</p>
                    <p style="margin: 5px 0;"><strong>Teacher:</strong> {teacher_name}</p>
                    <p style="margin: 5px 0;"><strong>Schedule:</strong> {schedule}</p>
                    <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹{amount}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">You will receive a reminder before the class starts.</p>
                
                <p style="color: #0c5460; margin-top: 30px;">Vidya Dadati Vinayam 📖</p>
            </div>
        </div>
        """
    },
    NotificationType.PAYMENT_SUCCESS: {
        "subject": "Payment Successful - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">✅ Payment Successful</h1>
            </div>
            <div style="padding: 30px; background: #F0FFF4; border-radius: 0 0 10px 10px;">
                <h2 style="color: #155724;">Namaste {user_name}!</h2>
                <p style="color: #333; line-height: 1.6;">Your payment has been processed successfully.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #28a745; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ₹{amount}</p>
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> {transaction_id}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {date}</p>
                    <p style="margin: 5px 0;"><strong>For:</strong> {description}</p>
                </div>
                
                <p style="color: #155724; margin-top: 30px;">Thank you for your trust! 🙏</p>
            </div>
        </div>
        """
    },
    NotificationType.PRIEST_NEW_BOOKING: {
        "subject": "New Booking Received - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #8B0000, #CD853F); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">New Booking</h1>
            </div>
            <div style="padding: 30px; background: #FFF9F5; border-radius: 0 0 10px 10px;">
                <h2 style="color: #8B4513;">Namaste {user_name}!</h2>
                <p style="color: #333; line-height: 1.6;">You have received a new booking request.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #8B0000; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Devotee:</strong> {devotee_name}</p>
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service_name}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {booking_date}</p>
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ₹{amount}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">Please open the app to confirm or manage this booking.</p>
                
                <p style="color: #8B4513; margin-top: 30px;">Om Namah Shivaya</p>
            </div>
        </div>
        """
    },
    NotificationType.PRIEST_BOOKING_CANCELLED: {
        "subject": "Booking Cancelled - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #dc3545, #c82333); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
            </div>
            <div style="padding: 30px; background: #FFF5F5; border-radius: 0 0 10px 10px;">
                <h2 style="color: #721c24;">Namaste {user_name},</h2>
                <p style="color: #333; line-height: 1.6;">A booking has been cancelled by the devotee.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #dc3545; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Devotee:</strong> {devotee_name}</p>
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service_name}</p>
                </div>
            </div>
        </div>
        """
    },
    NotificationType.REFUND_INITIATED: {
        "subject": "Refund Initiated - Divine App",
        "template": """
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #ffc107, #e0a800); border-radius: 10px;">
                <h1 style="color: white; margin: 0;">💰 Refund Initiated</h1>
            </div>
            <div style="padding: 30px; background: #FFFBF0; border-radius: 0 0 10px 10px;">
                <h2 style="color: #856404;">Namaste {user_name},</h2>
                <p style="color: #333; line-height: 1.6;">Your refund has been initiated and is being processed.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹{refund_amount}</p>
                    <p style="margin: 5px 0;"><strong>Original Amount:</strong> ₹{original_amount}</p>
                    <p style="margin: 5px 0;"><strong>Reason:</strong> {reason}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">The refund will be credited to your original payment method within 5-7 business days.</p>
            </div>
        </div>
        """
    }
}


async def get_user_notification_preference(user_id: str) -> dict:
    """
    Get user's notification preference based on how they logged in.
    Returns: {"channel": "email" or "inapp", "contact": email or user_id, "name": user_name}
    """
    from bson import ObjectId
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        return None
    
    user_name = user.get("name", "Devotee")
    
    # If user has email, send email notification
    if user.get("email"):
        return {"channel": "email", "contact": user.get("email"), "name": user_name, "user_id": user_id}
    
    # Otherwise store as in-app notification
    return {"channel": "inapp", "contact": user_id, "name": user_name, "user_id": user_id}


async def send_email_notification(to_email: str, subject: str, html_content: str) -> dict:
    """Send email using Resend"""
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping email")
        return {"status": "skipped", "reason": "API key not configured"}
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {email.get('id')}")
        return {"status": "success", "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"status": "failed", "error": str(e)}


async def store_inapp_notification(user_id: str, notification_type: NotificationType, 
                                   title: str, message: str, data: dict = None) -> dict:
    """Store notification in database for in-app display"""
    try:
        from bson import ObjectId
        
        config = NOTIFICATION_CONFIG.get(notification_type, {"title": "Notification", "icon": "bell"})
        
        notification = {
            "user_id": user_id,
            "type": notification_type.value,
            "title": title or config["title"],
            "message": message,
            "icon": config["icon"],
            "data": data or {},
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await notification_logs_collection.insert_one(notification)
        logger.info(f"In-app notification stored for user {user_id}: {result.inserted_id}")
        return {"status": "success", "notification_id": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"Failed to store in-app notification: {str(e)}")
        return {"status": "failed", "error": str(e)}


async def send_push_notification(user_id: str, title: str, body: str, data: dict = None) -> dict:
    """Send FCM push notification to all registered devices for a user using V1 API"""
    if not FIREBASE_ADMIN_READY:
        logger.warning("Firebase Admin not initialized, skipping push notification")
        return {"status": "skipped", "reason": "Firebase Admin not configured"}
    
    try:
        # Get all active tokens for the user
        cursor = fcm_tokens_collection.find({"user_id": user_id, "active": True})
        tokens = [doc["token"] async for doc in cursor]
        
        if not tokens:
            return {"status": "skipped", "reason": "No push tokens registered"}
        
        # Build the message
        notification = fcm_messaging.Notification(
            title=title,
            body=body,
            image=None
        )
        
        web_push = fcm_messaging.WebpushConfig(
            notification=fcm_messaging.WebpushNotification(
                title=title,
                body=body,
                icon="/temple-logo.png",
            ),
            fcm_options=fcm_messaging.WebpushFCMOptions(
                link=os.environ.get("FRONTEND_URL", "https://divine-104d4.web.app")
            )
        )
        
        str_data = {k: str(v) for k, v in (data or {}).items()}
        
        # Send to each token
        success_count = 0
        failure_count = 0
        
        for token in tokens:
            try:
                message = fcm_messaging.Message(
                    notification=notification,
                    webpush=web_push,
                    data=str_data,
                    token=token,
                )
                fcm_messaging.send(message)
                success_count += 1
            except fcm_messaging.UnregisteredError:
                # Token is invalid, deactivate it
                await fcm_tokens_collection.update_one(
                    {"token": token},
                    {"$set": {"active": False}}
                )
                failure_count += 1
            except Exception as e:
                logger.error(f"Failed to send to token {token[:20]}...: {e}")
                failure_count += 1
        
        logger.info(f"Push sent to {success_count}/{len(tokens)} devices for user {user_id}")
        return {"status": "success", "sent": success_count, "failed": failure_count}
    except Exception as e:
        logger.error(f"Failed to send push notification: {str(e)}")
        return {"status": "failed", "error": str(e)}


async def log_notification(user_id: str, notification_type: str, channel: str, 
                          contact: str, status: str, details: dict = None):
    """Log notification to database for tracking (only for email channel)"""
    if channel == "inapp":
        # In-app notifications are already stored, no need to log separately
        return
    
    try:
        log_entry = {
            "user_id": user_id,
            "notification_type": notification_type,
            "channel": channel,
            "contact": contact,
            "status": status,
            "details": details or {},
            "is_log": True,  # Mark as log entry, not actual notification
            "created_at": datetime.now(timezone.utc)
        }
        await notification_logs_collection.insert_one(log_entry)
    except Exception as e:
        logger.error(f"Failed to log notification: {str(e)}")


async def send_notification(user_id: str, notification_type: NotificationType, data: dict) -> dict:
    """
    Main function to send notification to a user.
    - Email users: Send email via Resend
    - Phone users: Store as in-app notification
    
    Args:
        user_id: The user's ID
        notification_type: Type of notification (from NotificationType enum)
        data: Dictionary with template variables
    
    Returns:
        dict with status and details
    """
    # Get user's preference
    preference = await get_user_notification_preference(user_id)
    
    if not preference:
        logger.warning(f"Could not find user or contact info for user_id: {user_id}")
        return {"status": "failed", "reason": "User not found or no contact info"}
    
    channel = preference["channel"]
    contact = preference["contact"]
    user_name = preference["name"]
    
    # Add user_name to data
    data["user_name"] = user_name
    
    # Always store as in-app notification (regardless of email/phone)
    config = NOTIFICATION_CONFIG.get(notification_type, {"title": "Notification", "icon": "bell"})
    inapp_template = INAPP_MESSAGES.get(notification_type, "You have a new notification.")
    try:
        inapp_message = inapp_template.format(**data)
    except KeyError:
        inapp_message = inapp_template
    
    await store_inapp_notification(
        user_id=user_id,
        notification_type=notification_type,
        title=config["title"],
        message=inapp_message,
        data=data
    )
    
    result = None
    
    if channel == "email":
        # Get email template
        template_config = EMAIL_TEMPLATES.get(notification_type)
        if not template_config:
            return {"status": "failed", "reason": "Email template not found"}
        
        subject = template_config["subject"]
        try:
            html_content = template_config["template"].format(**data)
        except KeyError as e:
            logger.error(f"Missing template variable: {e}")
            html_content = template_config["template"]
        
        result = await send_email_notification(contact, subject, html_content)
        
        # Log email notification
        await log_notification(
            user_id=user_id,
            notification_type=notification_type.value,
            channel=channel,
            contact=contact,
            status=result.get("status", "unknown"),
            details=result
        )
    
    # Always try to send push notification (works for both email and phone users)
    push_result = await send_push_notification(
        user_id=user_id,
        title=config["title"],
        body=inapp_message,
        data={"type": notification_type.value}
    )
    
    return {
        "status": result.get("status") if result else "success",
        "channel": channel,
        "contact": contact,
        "push": push_result.get("status", "skipped"),
        **(result or {})
    }


# Convenience functions for specific notification types

async def notify_booking_created(user_id: str, booking_data: dict):
    """Send notification when a booking is created"""
    return await send_notification(user_id, NotificationType.BOOKING_CREATED, booking_data)


async def notify_booking_confirmed(user_id: str, booking_data: dict):
    """Send notification when a booking is confirmed"""
    return await send_notification(user_id, NotificationType.BOOKING_CONFIRMED, booking_data)


async def notify_booking_cancelled(user_id: str, booking_data: dict):
    """Send notification when a booking is cancelled"""
    return await send_notification(user_id, NotificationType.BOOKING_CANCELLED, booking_data)


async def notify_booking_completed(user_id: str, booking_data: dict):
    """Send notification when a booking/puja is completed"""
    return await send_notification(user_id, NotificationType.BOOKING_COMPLETED, booking_data)


async def notify_class_enrolled(user_id: str, class_data: dict):
    """Send notification when user enrolls in a class"""
    return await send_notification(user_id, NotificationType.CLASS_ENROLLED, class_data)


async def notify_payment_success(user_id: str, payment_data: dict):
    """Send notification when payment is successful"""
    return await send_notification(user_id, NotificationType.PAYMENT_SUCCESS, payment_data)


async def notify_refund_initiated(user_id: str, refund_data: dict):
    """Send notification when refund is initiated"""
    return await send_notification(user_id, NotificationType.REFUND_INITIATED, refund_data)


async def notify_priest_new_booking(priest_user_id: str, booking_data: dict):
    """Send notification to priest when they receive a new booking"""
    return await send_notification(priest_user_id, NotificationType.PRIEST_NEW_BOOKING, booking_data)


async def notify_priest_booking_cancelled(priest_user_id: str, booking_data: dict):
    """Send notification to priest when a booking is cancelled"""
    return await send_notification(priest_user_id, NotificationType.PRIEST_BOOKING_CANCELLED, booking_data)
