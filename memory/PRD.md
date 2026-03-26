# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services. Features include priest booking, astrology services, a spiritual e-commerce store, devotional content, and live video/voice consultations.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Stripe + Razorpay
- **Video**: 100ms SDK
- **Auth**: Firebase Auth / JWT
- **Email**: Resend API
- **Hosting**: Firebase Hosting + Google Cloud Run

## User Personas
- **Devotee**: End user booking services, shopping, viewing content
- **Priest**: Service provider for pujas, ceremonies, consultations
- **Astrologer**: Provides horoscope readings and consultations
- **Shop Owner**: Sells spiritual products through marketplace
- **Admin**: Platform management and configuration

## Core Features Implemented

### Authentication & User Management
- Multi-role auth (Devotee, Priest, Astrologer, Shop Owner, Admin)
- Astrologer & Shop Owner signups enabled
- JWT-based authentication

### Priest Booking System
- Browse & book priests for various services
- Booking management with status tracking
- Priest dashboard with analytics

### E-Commerce / Marketplace
- Product catalog with categories
- Cart & checkout with Stripe + Razorpay
- **Order Status Lifecycle** (NEW - Feb 26, 2026):
  - Status flow: pending → paid → received → accepted → processing → shipping → delivered
  - Shop owners can progress orders through each status
  - When marking "shipping": tracking link + delivery instructions input
  - Devotees see 7-step tracking timeline with timestamps
  - Status transition validation (prevents invalid jumps)

### Astrology Services
- Daily horoscope
- Birth chart generation
- Consultation booking

### Devotional Content
- Mantras, stotras, scriptures
- Audio/video library
- Festival calendar
- Temple directory

### Video Consultations
- 100ms SDK integration for live calls
- Per-minute billing with wallet system

### Notifications
- Push notifications via Firebase FCM
- In-app notification system
- iOS Safari compatibility (ErrorBoundary fix)

### Admin Dashboard
- User/priest/shop management
- System configuration (fees, taxes, signup toggles)
- Cancellation/refund policy settings

## What's Been Implemented (Latest Session - Feb 26, 2026)
- [x] Shop Owner Order Status Lifecycle (received → accepted → processing → shipping → delivered)
- [x] Tracking link + delivery instructions on shipping status
- [x] Shop Owner OrdersTab UI with status filters, next-action buttons, shipping modal
- [x] Devotee OrderDetailPage with 7-step tracking timeline
- [x] Devotee MyOrdersPage with updated status badges
- [x] Backend status transition validation
- [x] All status references updated across codebase (shop dashboard, reviews, revenue queries)

## P0/P1/P2 Backlog

### P1 - In Progress Tasks
1. **Order Status In-App Push Notifications** — Notify devotees when shop owner changes status
2. **Shipping Email Notifications** — Email via Resend when status hits "shipping"
3. **Delivery Photo Proof** — Shop owner uploads delivery photo, devotee acknowledges

### P1 - Upcoming
4. CI/CD Pipeline Setup (GitHub Actions)
5. Play Store TWA Setup

### P2 - Future
6. Provider Payout Dashboard
7. Scheduled push notification reminders for Vedic classes
8. Phase 2 Live Streams (100ms HLS broadcasting)
9. Temple section enhancements (AI images, maps, nearby)

## Key API Endpoints
- `PUT /api/orders/{id}/status` — Update order status (shop owner/admin)
- `GET /api/orders/{id}` — Order detail with tracking info
- `GET /api/orders` — User's orders list
- `GET /api/shop/orders` — Shop owner's orders (with filters)
- `POST /api/checkout` — Create order with payment
- `POST /api/payment/confirm/{id}` — Confirm Stripe payment
- `POST /api/razorpay/verify` — Verify Razorpay payment

## Key DB Schema
- `orders` collection: status, tracking_link, delivery_instructions, status_history[], received_at, accepted_at, shipped_at, delivered_at
- `system_config`: signup settings, platform fees, taxes

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Admin: `admin@divine.com` / `admin123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Astrologer: `astro.joshi@divineapp.com` / `astro123`
- Shop Owner: `shop.poojamart@divineapp.com` / `shop123`

## Code Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── orders_new.py      # Order status lifecycle
│   │   ├── shop.py            # Shop owner endpoints
│   │   ├── admin_new.py
│   │   ├── auth_new.py
│   │   └── ...
│   ├── models.py              # OrderStatus enum
│   ├── server.py
│   └── tests/
│       └── test_order_status_lifecycle.py
└── frontend/
    └── src/
        ├── components/
        │   ├── Checkout/CheckoutComponents.js  # OrderDetailPage, MyOrdersPage
        │   └── ErrorBoundary.js
        └── pages/
            └── dashboards/
                ├── shopowner/components/OrdersTab.js  # Shop owner order management
                └── devotee/components/MyActivityTab.js
```
