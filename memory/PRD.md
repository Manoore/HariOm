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

### Puja Samagri (Items) List
- Priest adds samagri items per service (name, quantity, optional flag)
- Items stored on service and copied to booking when created
- Devotee sees samagri on priest detail page when selecting a service
- Devotee sees expandable samagri in booking cards on dashboard
- Priest service cards show samagri item count badge

### Priest Availability & Slot Booking
- Weekly schedule (Mon-Sun, enable/disable, start/end times)
- Configurable slot duration (30/45/60/90/120 min)
- Block specific dates
- `GET /api/priests/{id}/available-slots?date=YYYY-MM-DD`
- Booked slots auto-filtered, double-booking prevented (409)

### Priest Booking Flow
- Select service -> see samagri list -> pick date -> pick time slot
- Razorpay payment -> confirm-payment -> chat room created -> notifications sent
- In-app confirmation dialogs, no page refreshes

### Chat/Messaging
- Auto-created on booking payment, 3s polling, text/image messages

### Wallet, Payments, Admin
- Razorpay wallet recharge with real intent generation
- Admin Dashboard (Revenue, Payouts, Refunds, configurable splits)

## Session Log

### Apr 13, 2026
- [x] Puja Samagri feature — priest adds items per service, devotee sees them
- [x] Samagri editor in ServiceModal (add/remove items with name, qty, optional)
- [x] Samagri display on priest detail page (devotee side)
- [x] Expandable samagri in booking cards on devotee dashboard
- [x] All tests passed (iteration_52: 10/10 backend, 100% frontend)

### Mar 31, 2026
- [x] Priest Availability Management — schedule, slot duration, blocked dates
- [x] SlotPicker component for booking (14-day calendar + time grid)
- [x] Conflict prevention — double-booking returns 409
- [x] All tests passed (iteration_51: 14/14 backend, 100% frontend)

### Mar 30, 2026
- [x] Reviews display fix, booking confirm without page refresh
- [x] In-app ConfirmDialog everywhere, notifications post-payment
- [x] Chat room creation on payment, message polling
- [x] All tests passed (iteration_50)

## P1/P2 Backlog
### P1 — Upcoming
1. CI/CD Pipeline Setup (GitHub Actions -> Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 — Future
3. Automated Payouts via RazorpayX
4. WebSocket for real-time chat
5. Phase 2 Live Streams (100ms HLS)
6. Temple section enhancements

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Admin: `admin@divine.com` / `admin123`

## Key API Endpoints
- `GET /api/priests/{id}/available-slots?date=YYYY-MM-DD`
- `POST /api/bookings` (with slot_start, slot_end, saves samagri_list)
- `POST /api/bookings/{id}/confirm-payment`
- `GET/POST /api/priest/services` (with samagri_list)
- `PUT /api/priest/services/{id}` (update samagri_list)
- `GET/POST /api/priest/availability`

## Architecture
```
/app/
├── backend/routes/
│   ├── bookings_new.py     # Availability + Booking + Samagri + Conflict
│   ├── priest_dashboard.py # Service CRUD with samagri_list
│   ├── priests_new.py      # Public priest detail with samagri
│   ├── chat.py             # Chat rooms + messages
│   └── admin_new.py        # Admin Payments
└── frontend/src/
    ├── components/
    │   ├── Booking/SlotPicker.js
    │   └── DevoteeDashboard/PriestDetailView.js (samagri display)
    └── pages/
        ├── PriestPages.js (samagri display)
        ├── DashboardPage.js (expandable samagri in bookings)
        └── dashboards/priest/components/
            ├── ServicesTab.js (samagri editor)
            └── AvailabilityTab.js
```
