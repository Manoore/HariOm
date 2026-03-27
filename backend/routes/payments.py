"""
Payment Routes
Handles Razorpay payment integration (primary gateway).
Stripe endpoints kept as placeholder for future international expansion.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
import stripe
import os

from database import payment_transactions_collection, users_collection
from auth import get_current_user
from system_config import get_stripe_credentials, get_razorpay_credentials

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Pydantic models for requests
class StripeIntentRequest(BaseModel):
    amount: int  # Amount in cents/paise
    currency: str = "inr"
    description: Optional[str] = None
    metadata: Optional[dict] = None

class StripeConfirmRequest(BaseModel):
    payment_intent_id: str
    card_number: str
    exp_month: str
    exp_year: str
    cvc: str

class RazorpayOrderRequest(BaseModel):
    amount: int  # Amount in paise
    currency: str = "INR"
    description: Optional[str] = None
    metadata: Optional[dict] = None

class PaymentCreate(BaseModel):
    amount: float
    currency: str = "inr"
    payment_type: str  # "booking", "order", "class", etc.
    reference_id: str


@router.post("/stripe/create-intent")
async def create_stripe_payment_intent(data: StripeIntentRequest, user: dict = Depends(get_current_user)):
    """Create a Stripe payment intent"""
    
    # Get Stripe credentials from system config or env
    stripe_creds = await get_stripe_credentials()
    stripe.api_key = stripe_creds["secret_key"]
    
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=data.amount,
            currency=data.currency,
            payment_method_types=["card"],
            metadata={
                "user_id": str(user["_id"]),
                **(data.metadata or {})
            }
        )
        
        # Record the transaction
        await payment_transactions_collection.insert_one({
            "user_id": str(user["_id"]),
            "payment_intent_id": intent.id,
            "amount": data.amount / 100,  # Convert back to dollars
            "currency": data.currency.upper(),
            "payment_method": "stripe",
            "payment_status": "pending",
            "description": data.description,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stripe/confirm")
async def confirm_stripe_payment(data: StripeConfirmRequest, user: dict = Depends(get_current_user)):
    """Confirm a Stripe payment intent with card details"""
    
    # Get Stripe credentials from system config or env
    stripe_creds = await get_stripe_credentials()
    stripe.api_key = stripe_creds["secret_key"]
    
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    try:
        # For test mode, use test tokens instead of raw card numbers
        test_card_tokens = {
            "4242424242424242": "tok_visa",
            "4000056655665556": "tok_visa_debit", 
            "5555555555554444": "tok_mastercard",
            "378282246310005": "tok_amex",
            "4000000000003220": "tok_threeDSecure2Required",
            "4000000000000002": "tok_chargeDeclined",
        }
        
        # Check if this is a test card number
        clean_card = data.card_number.replace(" ", "").replace("-", "")
        test_token = test_card_tokens.get(clean_card)
        
        if test_token:
            # Use test token directly
            payment_method = stripe.PaymentMethod.create(
                type="card",
                card={"token": test_token},
            )
        else:
            # For production/real cards
            payment_method = stripe.PaymentMethod.create(
                type="card",
                card={
                    "number": data.card_number,
                    "exp_month": int(data.exp_month),
                    "exp_year": int(data.exp_year),
                    "cvc": data.cvc,
                },
            )
        
        # Confirm the payment intent with the payment method
        intent = stripe.PaymentIntent.confirm(
            data.payment_intent_id,
            payment_method=payment_method.id
        )
        
        # Update the transaction record
        await payment_transactions_collection.update_one(
            {"payment_intent_id": data.payment_intent_id},
            {"$set": {"payment_status": intent.status, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {
            "status": intent.status,
            "success": intent.status == "succeeded",
            "payment_intent_id": intent.id
        }
    except stripe.error.CardError as e:
        raise HTTPException(status_code=400, detail=str(e.user_message))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/razorpay/create-order")
async def create_razorpay_order(data: RazorpayOrderRequest, user: dict = Depends(get_current_user)):
    """Create a Razorpay order"""
    import razorpay
    
    # Get Razorpay credentials from system config or env
    razorpay_creds = await get_razorpay_credentials()
    
    if not razorpay_creds["key_id"] or not razorpay_creds["key_secret"]:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
    
    try:
        client = razorpay.Client(auth=(razorpay_creds["key_id"], razorpay_creds["key_secret"]))
        
        order_data = {
            "amount": data.amount,
            "currency": data.currency,
            "notes": {
                "user_id": str(user["_id"]),
                **(data.metadata or {})
            }
        }
        
        order = client.order.create(data=order_data)
        
        # Record the transaction
        await payment_transactions_collection.insert_one({
            "user_id": str(user["_id"]),
            "order_id": order["id"],
            "amount": data.amount / 100,  # Convert back to rupees
            "currency": data.currency,
            "payment_method": "razorpay",
            "payment_status": "pending",
            "description": data.description,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {
            "order_id": order["id"],
            "razorpay_key": razorpay_creds["key_id"],
            "amount": data.amount,
            "currency": data.currency
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-checkout")
async def create_stripe_checkout(request: Request, payment: PaymentCreate, user: dict = Depends(get_current_user)):
    """Create a Stripe checkout session"""
    import stripe
    
    stripe_creds = await get_stripe_credentials()
    
    if not stripe_creds["secret_key"]:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    stripe.api_key = stripe_creds["secret_key"]
    
    origin = request.headers.get("origin", str(request.base_url).rstrip('/'))
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel"
    
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": payment.currency.lower(),
                "product_data": {
                    "name": payment.payment_type.replace("_", " ").title(),
                },
                "unit_amount": int(float(payment.amount) * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": str(user["_id"]),
            "payment_type": payment.payment_type,
            "reference_id": payment.reference_id
        }
    )
    
    await payment_transactions_collection.insert_one({
        "user_id": str(user["_id"]),
        "session_id": session.id,
        "amount": payment.amount,
        "currency": payment.currency,
        "payment_type": payment.payment_type,
        "reference_id": payment.reference_id,
        "payment_method": "stripe",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"url": session.url, "session_id": session.id}


@router.get("/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    """Get payment status from Stripe session"""
    import stripe
    
    stripe_creds = await get_stripe_credentials()
    
    if not stripe_creds["secret_key"]:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    stripe.api_key = stripe_creds["secret_key"]
    
    session = stripe.checkout.Session.retrieve(session_id)
    
    payment_status = session.payment_status or "unpaid"
    status = session.status or "open"
    
    await payment_transactions_collection.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": payment_status, "status": status}}
    )
    
    return {
        "status": status,
        "payment_status": payment_status,
        "amount_total": session.amount_total,
        "currency": session.currency
    }
