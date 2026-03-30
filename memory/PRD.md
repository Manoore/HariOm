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
- Product catalog, cart, checkout with Razorpay
- Order Status Lifecycle: pending -> paid -> received -> accepted -> processing -> shipping -> delivered
- Tracking link + delivery instructions on shipping
- Delivery photo proof on delivered
- In-app + push + email notifications on all status changes

### Wallet Recharge (Real Payment Integration)
- `POST /api/wallet/create-recharge-intent` - Creates real Razorpay Order
- `POST /api/wallet/recharge` - Verifies payment with gateway before adding balance
- SmartPayment component (Razorpay only)
- Preset amounts + custom amount input
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
- All dashboards show configurable platform fees and GST

### Admin Payments Dashboard
- Revenue summary, by-type breakdown, gateway split
- Configurable provider split % (per priest/shop_owner/astrologer)
- Pending payouts with Mark Paid flow, payout history
- Refund management: eligible refunds, real gateway refund processing, refund history

### Priest Booking Flow
- Devotee selects service -> creates booking -> Razorpay payment modal
- `POST /api/bookings/{id}/confirm-payment` verifies payment then confirms booking
- Notifications sent to priest/devotee ONLY after payment confirmed
- Priest can Accept/Complete/Cancel with in-app confirmation dialogs (no page refresh)

### Reviews System
- Service reviews: `/api/bookings/{id}/review` (stores in service_reviews_collection)
- Product reviews: `/api/products/{id}/reviews` (stores in product_reviews_collection)
- Priest detail page shows reviews via `/api/providers/{provider_id}/reviews`

### Other Features
- Multi-role auth (Devotee, Priest, Astrologer, Shop Owner, Admin)
- Astrology services (horoscope, birth chart, consultations)
- Devotional content (mantras, stotras, festivals, temples)
- Video consultations (100ms SDK, per-minute billing)
- Admin dashboard (user management, system config)
- In-app ConfirmDialog for all confirmation actions (no browser dialogs)

## What's Been Implemented (Session - Mar 30, 2026)
- [x] Bug fix: Priest reviews now display on priest detail page (fixed API endpoint: /api/providers/{id}/reviews)
- [x] Bug fix: ReviewModal sends review_text field matching backend expectation
- [x] Bug fix: Priest booking Accept/Decline/Complete no longer causes page refresh (silentRefresh)
- [x] Bug fix: Per-booking loading states in BookingsTab and HomeTab
- [x] Bug fix: All booking actions use in-app ConfirmDialog (Accept, Decline, Complete, Cancel)
- [x] Bug fix: ProductReviews delete uses useConfirmDialog instead of window.confirm
- [x] Bug fix: Priest booking notifications moved to post-payment (confirm-payment endpoint)
- [x] Bug fix: ObjectId validation added to confirm-payment endpoint
- [x] All tests passed (iteration_50: 100% backend, 100% frontend)

## P1/P2 Backlog

### P1 - Upcoming
1. CI/CD Pipeline Setup (GitHub Actions -> Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 - Future
3. Automated Payouts via RazorpayX
4. Phase 2 Live Streams (100ms HLS broadcasting)
5. Temple section enhancements (AI images, maps, nearby temples)

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Admin: `admin@divine.com` / `admin123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Astrologer: `astro.joshi@divineapp.com` / `astro123`
- Shop Owner: `shop.poojamart@divineapp.com` / `shop123`

## Key API Endpoints
- `POST /api/wallet/create-recharge-intent` - Creates Razorpay payment intent
- `POST /api/wallet/recharge` - Verifies & finalizes wallet top-up
- `GET /api/wallet` - Get wallet balance
- `POST /api/bookings` - Create booking + generate Razorpay order
- `POST /api/bookings/{id}/confirm-payment` - Verify payment + confirm booking + send notifications
- `PUT /api/bookings/{id}/status` - Update booking status (priest)
- `POST /api/bookings/{id}/review` - Submit service review
- `GET /api/providers/{id}/reviews` - Get provider reviews
- `GET /api/admin/payments/dashboard` - Admin payments overview
- `GET /api/admin/payouts/pending` - Pending provider payouts
- `GET /api/my-transactions` - Devotee unified transaction history

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── admin_new.py         # Admin Payments, Payouts, Refunds
│   │   ├── bookings_new.py      # Booking CRUD + payment confirmation + notifications
│   │   ├── consultation.py      # Wallet, Reviews, Providers
│   │   ├── classes.py           # Razorpay integrated
│   │   ├── orders_new.py        # Razorpay integrated
│   │   └── reviews.py           # Product reviews
│   ├── services/
│   │   └── notification_service.py  # Email, Push, In-app notifications
│   └── system_config.py         # Admin-configurable settings
└── frontend/
    └── src/
        ├── components/
        │   ├── PaymentComponents.js  # SmartPayment (Razorpay only)
        │   ├── ui/ConfirmDialog.js   # In-app confirmation modal
        │   ├── Reviews/ProductReviews.js
        │   └── DevoteeDashboard/PriestDetailView.js
        ├── pages/dashboards/
        │   ├── PriestDashboard.js  # silentRefresh for booking updates
        │   ├── priest/components/BookingsTab.js  # Per-booking loading
        │   ├── admin/components/PaymentsTab.js
        │   └── devotee/components/ReviewModal.js
        └── contexts/
            └── PaymentContext.js
```
