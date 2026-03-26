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

### E-Commerce / Marketplace
- Product catalog, cart, checkout with Stripe + Razorpay
- Order Status Lifecycle: pending → paid → received → accepted → processing → shipping → delivered
- Tracking link + delivery instructions on shipping
- Delivery photo proof on delivered
- In-app + push + email notifications on all status changes

### Scheduled Class Reminders
- User-configurable timing: 15 min, 30 min, 1 hour, 2 hours, 1 day before
- Auto-enroll: 1-hour reminder auto-set on class enrollment
- Background scheduler runs every 60 seconds
- Priests also get self-reminders

### Provider Payout Dashboard (NEW - Feb 26, 2026)
- **Shop Owner**: Revenue breakdown (Today/Week/Month/All Time), Fee Summary (Platform Fee + GST deductions), Net Earnings, Pending Payout, Transaction history
- **Priest**: Enhanced earnings with income sources (Puja Bookings + Vedic Classes), 4 summary cards, transaction history
- **Astrologer**: Existing earnings dashboard with consultation revenue
- All dashboards show configurable platform fees (5%) and GST (18%)

### Other Features
- Multi-role auth (Devotee, Priest, Astrologer, Shop Owner, Admin)
- Priest booking system with status tracking
- Astrology services (horoscope, birth chart, consultations)
- Devotional content (mantras, stotras, festivals, temples)
- Video consultations (100ms SDK, per-minute billing)
- Admin dashboard (user management, system config)

## What's Been Implemented (Session - Feb 26, 2026)
- [x] Shop Owner Order Status Lifecycle
- [x] Order status notifications (in-app + push + email via Resend)
- [x] Delivery photo proof upload & display
- [x] Scheduled class reminders with configurable timing
- [x] Auto-enroll reminder (1 hour default)
- [x] Shop Owner Earnings & Payouts dashboard
- [x] Enhanced Priest Earnings dashboard
- [x] All features tested via testing agent (100% pass rate)

## P1/P2 Backlog

### P1 - Upcoming
1. CI/CD Pipeline Setup (GitHub Actions → Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 - Future
3. Phase 2 Live Streams (100ms HLS broadcasting)
4. Temple section enhancements (AI images, maps, nearby temples)

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Admin: `admin@divineapp.com` / `admin123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Astrologer: `astro.joshi@divineapp.com` / `astro123`
- Shop Owner: `shop.poojamart@divineapp.com` / `shop123`
