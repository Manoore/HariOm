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
- **Push**: Firebase Cloud Messaging (FCM V1)
- **Hosting**: Firebase Hosting + Google Cloud Run

## User Personas
- **Devotee**: End user booking services, shopping, viewing content
- **Priest**: Service provider for pujas, ceremonies, consultations
- **Astrologer**: Provides horoscope readings and consultations
- **Shop Owner**: Sells spiritual products through marketplace
- **Admin/Super Admin**: Platform management and configuration

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
- **Order Status Lifecycle**:
  - Status flow: pending → paid → received → accepted → processing → shipping → delivered
  - Shop owners progress orders through each status
  - When marking "shipping": tracking link + delivery instructions input
  - When marking "delivered": delivery photo proof upload (optional)
  - Devotees see 7-step tracking timeline with timestamps
  - Status transition validation (prevents invalid jumps)
  - Admin (super_admin) can skip transitions

### Order Notifications System (NEW - Feb 26, 2026)
- **In-App Notifications**: Every status change creates a notification in the devotee's notification feed
  - Types: order_status_updated, order_shipped, order_delivered
- **Email Notifications via Resend**:
  - Shipping email with tracking link, delivery instructions, item summary
  - Delivered email with delivery photo (if uploaded)
  - Beautiful HTML templates matching Divine App branding
- **Push Notifications**: FCM V1 push to all registered devices
- All notification channels fire simultaneously (in-app + email + push)

### Delivery Photo Proof (NEW - Feb 26, 2026)
- Shop owner uploads delivery photo via `/api/upload/image`
- Photo URL saved to order document (`delivery_photo_url`)
- Devotee sees delivery photo in OrderDetailPage
- Photo included in delivery confirmation email

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

### Admin Dashboard
- User/priest/shop management
- System configuration (fees, taxes, signup toggles)
- Cancellation/refund policy settings

## What's Been Implemented (Session - Feb 26, 2026)
- [x] Shop Owner Order Status Lifecycle (received → accepted → processing → shipping → delivered)
- [x] Tracking link + delivery instructions on shipping status
- [x] In-app notifications for all order status changes
- [x] Shipping email with tracking info via Resend
- [x] Delivery email with photo proof via Resend
- [x] Delivery photo upload + display for delivered orders
- [x] Shop Owner OrdersTab with shipping modal, delivery photo modal
- [x] Devotee OrderDetailPage with 7-step timeline, tracking info, delivery photo
- [x] Backend status transition validation with admin override
- [x] All status references updated across codebase

## P0/P1/P2 Backlog

### P1 - Upcoming
1. CI/CD Pipeline Setup (GitHub Actions → Cloud Run + Firebase)
2. Play Store TWA Setup (Trusted Web Activity Android App Bundle)

### P2 - Future
3. Provider Payout Dashboard (earnings & payout history)
4. Scheduled push notification reminders for Vedic classes
5. Phase 2 Live Streams (100ms HLS broadcasting)
6. Temple section enhancements (AI images, maps, nearby temples)

## Key API Endpoints
- `PUT /api/orders/{id}/status` — Update order status with optional tracking_link, delivery_instructions, delivery_photo_url
- `GET /api/orders/{id}` — Order detail with all tracking/delivery fields
- `GET /api/orders` — User's orders list
- `GET /api/shop/orders` — Shop owner's orders (with filters)
- `GET /api/notifications` — User's notification feed (includes order notifications)
- `POST /api/upload/image` — Upload image, returns URL
- `POST /api/checkout` — Create order with payment
- `POST /api/payment/confirm/{id}` — Confirm Stripe payment
- `POST /api/razorpay/verify` — Verify Razorpay payment

## Key DB Schema
- `orders`: status, tracking_link, delivery_instructions, delivery_photo_url, status_history[], received_at, accepted_at, shipped_at, delivered_at
- `notification_logs`: user_id, type, title, message, icon, is_read, data, created_at (also used for email send logs with is_log=True)
- `fcm_tokens`: user_id, token, active
- `system_config`: signup settings, platform fees, taxes

## Notification Types
- `order_status_updated` — In-app + push (received, accepted, processing, cancelled)
- `order_shipped` — In-app + push + email with tracking
- `order_delivered` — In-app + push + email with delivery photo

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Admin: `admin@divineapp.com` / `admin123` (role: super_admin)
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Astrologer: `astro.joshi@divineapp.com` / `astro123`
- Shop Owner: `shop.poojamart@divineapp.com` / `shop123`

## Code Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── orders_new.py        # Order status lifecycle + notifications
│   │   ├── shop.py              # Shop owner endpoints
│   │   ├── notifications.py     # Notification CRUD API
│   │   ├── uploads.py           # File upload (images, videos)
│   │   ├── admin_new.py
│   │   ├── auth_new.py
│   │   └── ...
│   ├── services/
│   │   └── notification_service.py  # Email (Resend) + In-App + Push (FCM)
│   ├── models.py                    # OrderStatus enum (8 statuses)
│   ├── server.py
│   └── tests/
│       ├── test_order_status_lifecycle.py
│       └── test_order_notifications.py
└── frontend/
    └── src/
        ├── components/
        │   ├── Checkout/CheckoutComponents.js  # OrderDetailPage with delivery photo
        │   └── ErrorBoundary.js
        └── pages/
            └── dashboards/
                ├── shopowner/components/OrdersTab.js  # Shipping + Delivery modals
                └── devotee/components/MyActivityTab.js
```
