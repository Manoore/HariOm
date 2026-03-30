# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services. Features include priest booking, astrology services, a spiritual e-commerce store, devotional content, and live video/voice consultations.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Razorpay (sole active gateway)
- **Video**: 100ms SDK
- **Auth**: Firebase Auth / JWT
- **Email**: Resend API
- **Push**: Firebase Cloud Messaging (FCM V1)

## Core Features Implemented

### Priest Booking Flow
- Devotee selects service -> creates booking -> Razorpay payment modal
- `POST /api/bookings/{id}/confirm-payment` verifies payment, confirms booking, sends notifications, creates chat room
- Priest can Accept/Complete/Cancel with in-app confirmation dialogs (no page refresh)
- Chat room auto-created between devotee and priest after successful payment

### Chat/Messaging System
- Real-time messaging via REST API with 3-second polling
- Chat rooms auto-created on booking payment confirmation
- Support for text and image messages
- Unread count tracking, read receipts
- Chat expiry: 5 days after booking completion, instant on cancellation
- Admin can reactivate expired chats

### Reviews System
- Service reviews: `/api/bookings/{id}/review` (stores `review_text` field)
- Product reviews: `/api/products/{id}/reviews`
- Priest detail page shows reviews via `/api/providers/{provider_id}/reviews`

### Wallet Recharge (Real Payment)
- `POST /api/wallet/create-recharge-intent` - Creates Razorpay Order
- `POST /api/wallet/recharge` - Verifies payment before adding balance

### Admin Payments Dashboard
- Revenue summary, by-type breakdown, gateway split
- Configurable provider split % (Platform Fee, GST per provider type)
- Pending payouts with Mark Paid flow
- Refund management

### UI/UX
- All confirmation/error messages use in-app components (sonner toasts, useConfirmDialog)
- No browser-native dialogs (window.alert/confirm) anywhere
- Per-action loading states (no full page refreshes)

## What's Been Implemented (Session - Mar 30, 2026)
- [x] Reviews display fix: Frontend calls `/api/providers/{id}/reviews` + field name alignment
- [x] Priest booking confirm without page refresh (silentRefresh + per-booking loading)
- [x] All booking actions use in-app ConfirmDialog
- [x] ProductReviews delete uses useConfirmDialog
- [x] Priest booking notifications moved to post-payment endpoint
- [x] Chat room auto-creation on booking payment confirmation
- [x] Chat schema unification (booking_id + reference_id + string participants)
- [x] Message polling (3s interval) for real-time chat without WebSocket
- [x] Backward-compatible chat room queries (reference_id OR booking_id)

## P1/P2 Backlog

### P1 - Upcoming
1. CI/CD Pipeline Setup (GitHub Actions -> Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 - Future
3. Automated Payouts via RazorpayX
4. WebSocket endpoint for chat (replace polling with real-time)
5. Phase 2 Live Streams (100ms HLS broadcasting)
6. Temple section enhancements (AI images, maps, nearby temples)

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Admin: `admin@divine.com` / `admin123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Astrologer: `astro.joshi@divineapp.com` / `astro123`
- Shop Owner: `shop.poojamart@divineapp.com` / `shop123`

## Key API Endpoints
- `POST /api/bookings` - Create booking + Razorpay order
- `POST /api/bookings/{id}/confirm-payment` - Verify payment + confirm + notify + create chat
- `PUT /api/bookings/{id}/status` - Update status (priest)
- `POST /api/bookings/{id}/review` - Submit review (review_text field)
- `GET /api/providers/{id}/reviews` - Get provider reviews
- `GET /api/chat/rooms` - Get user's chat rooms
- `GET /api/chat/rooms/{id}/messages` - Get messages (also used for polling)
- `POST /api/chat/rooms/{id}/messages` - Send message
- `GET /api/chat/unread-count` - Total unread count

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── bookings_new.py      # Booking + payment confirm + chat room creation
│   │   ├── chat.py              # Chat rooms, messages, REST API
│   │   ├── consultation.py      # Wallet, Reviews, Providers
│   │   ├── admin_new.py         # Admin Payments, Payouts, Refunds
│   │   ├── classes.py           # Vedic classes
│   │   └── orders_new.py        # E-commerce orders
│   └── services/
│       └── notification_service.py
└── frontend/
    └── src/
        ├── components/
        │   ├── Chat/ChatTab.js          # Chat UI with 3s polling
        │   ├── PaymentComponents.js     # Razorpay checkout
        │   ├── ui/ConfirmDialog.js      # In-app confirm modal
        │   ├── Reviews/ProductReviews.js
        │   └── DevoteeDashboard/PriestDetailView.js
        └── pages/dashboards/
            ├── PriestDashboard.js        # silentRefresh
            └── priest/components/BookingsTab.js  # Per-booking loading
```
