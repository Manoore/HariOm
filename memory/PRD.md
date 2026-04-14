# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Razorpay
- **Video**: 100ms SDK
- **Auth**: JWT
- **Email**: Resend API
- **Push**: Firebase Cloud Messaging
- **Chat**: WebSocket (FastAPI native) + REST API fallback

## Core Features

### WebSocket Real-Time Chat
- `ws://host/ws/chat/{room_id}?token=JWT` — persistent connection
- Server handles: new_message (save + broadcast), typing (broadcast), read (mark all read)
- Auto-reconnect on disconnect (5s delay)
- Polling fallback (3s) when WebSocket unavailable
- "Online" / "typing..." status indicators in chat header
- Messages persist in MongoDB, broadcast to all room participants instantly

### Puja Samagri (Items) List
- Priest adds items per service (name, qty, optional flag)
- Priest can upload Samagri PDF or take a photo instead of typing items
- Items stored on service and copied to booking
- Devotee sees samagri when selecting service and in booking cards
- View PDF / View Photo links available for devotees

### Priest Availability & Slot Booking
- Weekly schedule, slot duration, blocked dates
- Available slots API filters booked slots
- Double-booking prevented (409)

### Priest Booking Flow
- Select service (see samagri) -> pick date -> pick time slot
- Razorpay payment -> confirm-payment -> chat room + notifications

### All Other Features
- Multi-role auth, E-commerce, Astrology, Video consultations
- Admin Dashboard (Payments, Payouts, Refunds)
- Devotional content (mantras, scriptures, festivals)
- In-app ConfirmDialog for all actions

## Session Log

### Apr 13, 2026
- [x] WebSocket real-time chat — full implementation
- [x] Puja Samagri feature (iteration_52: 100% pass)
- [x] Priest Availability (iteration_51: 100% pass)
- [x] Bug fixes: reviews, booking confirm, chat rooms (iteration_50: 100% pass)

### Apr 14, 2026
- [x] Puja Samagri PDF/Image Upload — VERIFIED (iteration_53: 100% pass)
  - Fixed missing samagri_pdf_url, samagri_image_url from GET /api/priests/{id}
  - Fixed missing samagri fields from GET /api/priests/{id}/services
  - Fixed missing duration_minutes from all service API responses
  - Fixed upload URL generation to use request-based base URL instead of hardcoded production URL
  - Backend: POST /api/upload/document (PDF), POST /api/upload/image, GET /api/uploads/{filename}
  - Frontend: Upload PDF button, Take Photo button in ServiceModal
  - Devotee: View PDF/View Photo links when service selected

## P1/P2 Backlog
### P1 — Upcoming
1. CI/CD Pipeline Setup (GitHub Actions -> Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 — Future
3. Automated Payouts via RazorpayX
4. Phase 2 Live Streams (100ms HLS)
5. Temple section enhancements

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Admin: `admin@divine.com` / `admin123`

## Key API Endpoints
- `ws://host/ws/chat/{room_id}?token=JWT` — Real-time chat WebSocket
- `GET /api/chat/rooms` / `POST /api/chat/rooms/{id}/messages` — Chat REST
- `GET /api/priests/{id}/available-slots?date=YYYY-MM-DD`
- `POST /api/bookings` (with slot_start, slot_end, saves samagri_list)
- `POST /api/bookings/{id}/confirm-payment`
- `GET/POST /api/priest/services` (with samagri_list, samagri_pdf_url, samagri_image_url)
- `POST /api/upload/document` — PDF upload
- `POST /api/upload/image` — Image upload
- `GET /api/uploads/{filename}` — Serve uploaded files

## Architecture
```
/app/
├── backend/
│   ├── server.py           # WebSocket /ws/chat/{room_id} endpoint
│   ├── routes/
│   │   ├── chat.py         # ConnectionManager + REST chat APIs
│   │   ├── bookings_new.py # Availability + Booking + Samagri
│   │   ├── priest_dashboard.py # Service CRUD with Samagri + Upload fields
│   │   ├── priests_new.py  # Public priest APIs with Samagri fields
│   │   └── uploads.py      # File upload (PDF, Image, Video)
│   └── auth.py
└── frontend/src/
    ├── components/
    │   ├── Chat/ChatTab.js  # WebSocket primary + polling fallback
    │   ├── Booking/SlotPicker.js
    │   └── DevoteeDashboard/PriestDetailView.js
    └── pages/
        ├── PriestPages.js
        └── dashboards/priest/components/
            ├── ServicesTab.js (samagri editor + PDF/Image upload)
            └── AvailabilityTab.js
```
