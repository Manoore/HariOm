# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services. Features include priest booking, astrology services, a spiritual e-commerce store, devotional content, and live video/voice consultations.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Razorpay (sole active gateway). Stripe kept as placeholder for future international expansion.
- **Video**: 100ms SDK
- **Auth**: Firebase Auth / JWT
- **Email**: Resend API
- **Push**: Firebase Cloud Messaging (FCM V1)

## Core Features Implemented

### E-Commerce / Marketplace
- Product catalog, cart, checkout with Stripe + Razorpay
- Order Status Lifecycle: pending → paid → received → accepted → processing → shipping → delivered
- Tracking link + delivery instructions on shipping
- Delivery photo proof on delivered
- In-app + push + email notifications on all status changes

### Wallet Recharge (Real Payment Integration) ✅
- `POST /api/wallet/create-recharge-intent` - Creates real Stripe PaymentIntent + Razorpay Order
- `POST /api/wallet/recharge` - Verifies payment with gateway before adding balance
- SmartPayment component with location-based gateway selection (Stripe/Razorpay)
- Preset amounts (₹100, ₹200, ₹500, ₹1000) + custom amount input
- All mock/fake payment flows removed

### Scheduled Class Reminders
- User-configurable timing: 15 min, 30 min, 1 hour, 2 hours, 1 day before
- Auto-enroll: 1-hour reminder auto-set on class enrollment
- Background scheduler runs every 60 seconds
- Priests also get self-reminders

### Provider Payout Dashboard
- **Shop Owner**: Revenue breakdown, Fee Summary, Net Earnings, Pending Payout, Transaction history
- **Priest**: Enhanced earnings with income sources (Puja Bookings + Vedic Classes)
- **Astrologer**: Existing earnings dashboard with consultation revenue
- All dashboards show configurable platform fees (5%) and GST (18%)

### Other Features
- Multi-role auth (Devotee, Priest, Astrologer, Shop Owner, Admin)
- Priest booking system with status tracking
- Astrology services (horoscope, birth chart, consultations)
- Devotional content (mantras, stotras, festivals, temples)
- Video consultations (100ms SDK, per-minute billing)
- Admin dashboard (user management, system config)

## What's Been Implemented (Session - Mar 26-27, 2026)
- [x] Backend: POST /api/wallet/create-recharge-intent (real Stripe + Razorpay intent generation)
- [x] Backend: POST /api/wallet/recharge (payment verification before balance addition)
- [x] Frontend: Cleaned orphaned mock code from WalletComponents.js
- [x] Frontend: SmartPayment properly wired with onError, description props
- [x] Codebase audit: No remaining mock payment patterns found
- [x] Bug fix: Class enrollment payment now sends payment_confirmed:true to backend
- [x] Bug fix: isEnrolled checks class_id properly, shows "Enrolled" badge
- [x] Bug fix: "Already enrolled" returns clear error message
- [x] Bug fix: Stripe API key explicitly set before PaymentIntent creation in classes.py
- [x] Bug fix: Added payment_method_types=["card"] to all Stripe PaymentIntent.create calls (prevents redirect errors)
- [x] Admin Payments Dashboard: Revenue summary, by-type breakdown, gateway split, pending payouts, transactions table with filters
- [x] Phase 2 - Provider Payout Management: Configurable split % (per priest/shop_owner/astrologer), pending payouts with Mark Paid flow, payout history
- [x] Phase 3 - Refund Management: Eligible refunds list (orders + bookings), real Stripe/Razorpay refund processing, refund history
- [x] All tests passed (iteration_45: wallet, iteration_46: class enrollment, iteration_47: payments dashboard, iteration_48: payouts + refunds 29/29)

## P1/P2 Backlog

### P1 - Upcoming
1. CI/CD Pipeline Setup (GitHub Actions → Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 - Future
3. Phase 2 Live Streams (100ms HLS broadcasting)
4. Temple section enhancements (AI images, maps, nearby temples)

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Admin: `admin@divine.com` / `admin123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Astrologer: `astro.joshi@divineapp.com` / `astro123`
- Shop Owner: `shop.poojamart@divineapp.com` / `shop123`

## Key API Endpoints
- `POST /api/wallet/create-recharge-intent` - Creates Stripe + Razorpay payment intents
- `POST /api/wallet/recharge` - Verifies & finalizes wallet top-up
- `GET /api/wallet` - Get wallet balance
- `GET /api/wallet/transactions` - Transaction history
- `POST /api/payments/stripe/create-intent` - General Stripe intent
- `POST /api/payments/razorpay/create-order` - General Razorpay order

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── consultation.py    # Wallet endpoints (create-recharge-intent, recharge)
│   │   └── payments.py        # General Stripe/Razorpay intents
│   ├── video_consultation.py  # Wallet balance functions
│   └── system_config.py       # Payment credentials management
└── frontend/
    └── src/
        ├── components/
        │   ├── PaymentComponents.js       # SmartPayment, StripePayment, RazorpayPayment
        │   └── Wallet/WalletComponents.js # WalletCard, RechargeModal, TransactionHistory
        └── contexts/
            └── PaymentContext.js           # Location-based payment method detection
```
