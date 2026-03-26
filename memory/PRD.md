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

## Core Features Implemented

### Authentication & User Management
- Multi-role auth (Devotee, Priest, Astrologer, Shop Owner, Admin)
- JWT-based authentication

### E-Commerce / Marketplace
- Product catalog, cart, checkout with Stripe + Razorpay
- Order Status Lifecycle: pending → paid → received → accepted → processing → shipping → delivered
- Tracking link + delivery instructions on shipping
- Delivery photo proof on delivered
- In-app + push + email notifications on status changes

### Scheduled Class Reminders (NEW - Feb 26, 2026)
- User-configurable timing: 15 min, 30 min, 1 hour, 2 hours, 1 day before
- Only enrolled students and class instructor can set reminders
- In-app + push notification channels
- Background scheduler runs every 60 seconds
- API: GET/POST/DELETE /api/class-reminders
- Devotee UI: Bell icon dropdown on enrolled classes
- Priest UI: "Remind me" dropdown on their class cards

### Other Features
- Priest booking system with status tracking
- Astrology services (horoscope, birth chart, consultations)
- Devotional content (mantras, stotras, festivals, temples)
- Video consultations (100ms SDK, per-minute billing)
- Admin dashboard (user management, system config)
- ErrorBoundary for iOS Safari crash recovery

## P1/P2 Backlog

### P1 - Upcoming
1. CI/CD Pipeline Setup (GitHub Actions → Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 - Future
3. Provider Payout Dashboard
4. Phase 2 Live Streams (100ms HLS broadcasting)
5. Temple section enhancements (AI images, maps, nearby temples)

## Key API Endpoints
- `PUT /api/orders/{id}/status` — Order status lifecycle
- `GET /api/orders/{id}` — Order detail with tracking/delivery fields
- `GET/POST/DELETE /api/class-reminders` — Class reminder CRUD
- `GET /api/my-enrollments` — User's enrolled classes
- `GET /api/notifications` — User's notification feed

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Admin: `admin@divineapp.com` / `admin123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Astrologer: `astro.joshi@divineapp.com` / `astro123`
- Shop Owner: `shop.poojamart@divineapp.com` / `shop123`

## Code Architecture
```
/app/backend/
├── routes/classes.py              # Class reminder API endpoints
├── routes/orders_new.py           # Order status + notifications
├── services/
│   ├── notification_service.py    # Email + In-App + Push (CLASS_REMINDER types)
│   └── class_reminder_scheduler.py # Background scheduler (60s loop)
├── database.py                    # class_reminders_collection
└── server.py                      # Scheduler startup in lifespan

/app/frontend/src/pages/dashboards/
├── devotee/components/ClassesTab.js  # Enrolled class reminder UI
└── priest/components/ClassesTab.js   # Priest self-reminder UI
```
