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

## Core Features

### Priest Availability & Slot Booking
- Priest sets weekly schedule (Mon-Sun, enable/disable days, start/end times)
- Configurable slot duration (30min, 45min, 1hr, 90min, 2hrs)
- Block specific dates (holidays, personal leave)
- `GET /api/priests/{id}/available-slots?date=YYYY-MM-DD` — returns available time slots
- Booked slots auto-filtered from available list
- Real-time conflict prevention (409 error on double-booking)
- Default: Mon-Sat 9AM-6PM, 60min slots

### Priest Booking Flow
- Devotee selects service -> picks date from 14-day calendar -> picks time slot
- Only available (unbooked) slots shown
- Creates booking + Razorpay payment modal
- `POST /api/bookings/{id}/confirm-payment` verifies payment, confirms booking, creates chat room, sends notifications
- Priest can Accept/Complete/Cancel with in-app dialogs (no page refresh)

### Chat/Messaging System
- Chat rooms auto-created on booking payment confirmation
- 3-second message polling for real-time updates
- Text and image messages, unread tracking, read receipts
- Chat expiry: 5 days after booking completion

### Reviews System
- Service reviews via `/api/bookings/{id}/review`
- Product reviews via `/api/products/{id}/reviews`
- Priest detail page shows reviews via `/api/providers/{provider_id}/reviews`

### Wallet, Payments, Admin
- Razorpay-only wallet recharge with real intent generation
- Admin Payments Dashboard (Revenue, Payouts, Refunds)
- Configurable provider splits (Platform Fee %, GST %)
- Devotee My Activity tab with unified transaction history

### Other Features
- Multi-role auth (Devotee, Priest, Astrologer, Shop Owner, Admin)
- Astrology services, Devotional content, Video consultations
- E-commerce store with order lifecycle
- In-app ConfirmDialog for all confirmation actions

## Session Log (Mar 31, 2026)
- [x] Priest Availability Management — weekly schedule, slot duration, blocked dates
- [x] SlotPicker component for devotee booking flow (14-day calendar + time grid)
- [x] Conflict prevention — double-booking returns 409
- [x] Available slots API filters booked slots automatically
- [x] AvailabilityTab added to Priest Dashboard
- [x] Updated PriestPages.js and PriestDetailView.js with SlotPicker
- [x] All tests passed (iteration_51: 100% backend 14/14, 100% frontend)

## Previous Session (Mar 30, 2026)
- [x] Reviews display fix (endpoint + field alignment)
- [x] Priest booking confirm without page refresh
- [x] All booking actions use in-app ConfirmDialog
- [x] Chat room auto-creation on payment confirmation
- [x] Message polling for real-time chat
- [x] Notifications moved to post-payment

## P1/P2 Backlog
### P1 — Upcoming
1. CI/CD Pipeline Setup (GitHub Actions -> Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 — Future
3. Automated Payouts via RazorpayX
4. WebSocket endpoint for chat (replace polling)
5. Phase 2 Live Streams (100ms HLS)
6. Temple section enhancements (AI images, maps)

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Admin: `admin@divine.com` / `admin123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Astrologer: `astro.joshi@divineapp.com` / `astro123`
- Shop Owner: `shop.poojamart@divineapp.com` / `shop123`

## Key API Endpoints
- `GET /api/priests/{id}/available-slots?date=YYYY-MM-DD` — Available time slots
- `POST /api/bookings` — Create booking (with slot_start/slot_end)
- `POST /api/bookings/{id}/confirm-payment` — Verify + confirm + chat + notify
- `GET/POST /api/priest/availability` — Manage priest schedule
- `GET /api/chat/rooms` / `POST /api/chat/rooms/{id}/messages` — Chat
- `GET /api/my-transactions` — Devotee transaction history
- `GET /api/admin/payments/dashboard` — Admin payments overview

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── bookings_new.py      # Availability slots + Booking + Conflict check
│   │   ├── priest_dashboard.py  # Priest availability CRUD
│   │   ├── chat.py              # Chat rooms + messages
│   │   ├── consultation.py      # Wallet, Reviews, Providers
│   │   └── admin_new.py         # Admin Payments, Payouts, Refunds
│   └── models.py                # BookingCreate with slot_start/slot_end
└── frontend/
    └── src/
        ├── components/
        │   ├── Booking/SlotPicker.js   # Date + time slot picker
        │   ├── Chat/ChatTab.js         # Chat with polling
        │   └── PaymentComponents.js    # Razorpay checkout
        └── pages/dashboards/
            ├── PriestDashboard.js
            └── priest/components/
                ├── AvailabilityTab.js  # Schedule + duration + blocked dates
                └── BookingsTab.js      # Per-booking loading + confirm dialogs
```
