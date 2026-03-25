# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services. Features include priest booking, astrology services, a spiritual e-commerce store, devotional content (mantras, audio, video), and live video/voice consultations.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + Python
- **Database**: MongoDB Atlas
- **Integrations**: Firebase (Auth/Hosting/FCM), Stripe, 100ms (Video), Google Places API, Resend (Email)

## User Roles
- **Devotee** (devotee@divineapp.com / devotee123)
- **Priest** (pandit.sharma@divineapp.com / priest123)
- **Astrologer** (astro.joshi@divineapp.com / astro123)
- **Shop Owner** (shop.poojamart@divineapp.com / shop123)
- **Admin** (admin@divine.com / admin123)

## Implemented Features

### Core Platform
- Multi-role authentication (JWT + Firebase Google Auth)
- Devotee, Priest, Astrologer, Shop Owner, Admin dashboards
- In-app notification system + Firebase Push Notifications (FCM V1)
- Mobile-responsive design with bottom nav + desktop sidebar

### Devotee Dashboard Tabs
- Home, My Activity, Messages, Call Astrologer, Vedic Classes, Live Events
- Spiritual Feed, Mantras & Shlokas, Sacred Scriptures
- Festival Calendar, Book Priests, Temples, Astrology, Pooja Store, Profile

### My Activity Tab (Mar 25, 2026) - NEW
- Dedicated tab in sidebar (2nd position) and mobile bottom nav
- **Bookings sub-tab**: Full list with status filters (All/Pending/Confirmed/Completed/Cancelled), cancel buttons, review buttons
- **Orders sub-tab**: All store orders with item previews, delivery status tracking
- **Call History sub-tab**: Astrology consultation history with duration and amount
- Empty states guide users to relevant actions

### Priest Booking Notifications (Mar 25, 2026) - FIXED
- Priests now receive in-app + email + push notifications when a devotee books them
- Priests receive notifications when a devotee cancels a booking
- When priest cancels, only devotee is notified (no redundant self-notification)
- New notification types: PRIEST_NEW_BOOKING, PRIEST_BOOKING_CANCELLED
- Email templates added for both types

### Temples Section (Mar 2026)
- 268 temples across 33 Indian states, 10 deity categories
- Full-text search, state/deity filters, pagination
- Detailed temple view with tabs: Overview, History, Architecture, Visit Guide, Scriptures

### Subcaste Management (Mar 2026)
- 126 subcastes seeded, Admin CRUD
- Priest profile includes subcaste dropdown
- Devotee can search/filter priests by subcaste and math_mutt

### Dashboard Refactoring (Mar 25, 2026) - COMPLETED
- **PriestDashboard.js**: ~3200 → 377 lines + 10 components in `/priest/components/`
- **AstrologerDashboard.js**: 949 → 252 lines + 7 components in `/astrologer/components/`
- **ShopOwnerDashboard.js**: 1391 → 80 lines + 8 components in `/shopowner/components/`
- All component files under 500 lines. Full frontend regression tested.

### Other Features
- Stripe payments, E-commerce store
- 100ms video calling for astrology consultations
- Chat system, Panchang calendar, Scriptures library

## Bug Fixes (Mar 2026)
1. Math/Mutt dropdown showing empty categories → Fixed
2. Priest analytics 500 error → Fixed (timezone-naive vs aware datetime)
3. Puja Type dropdown empty → Fixed
4. Astrologer redirected to landing page after accepting call → Fixed
5. Duplicate notification bell in priest dashboard → Fixed
6. Missing imports in priest components (ClassesTab, MiscTabs, ServicesTab) → Fixed
7. BookingsTab.js missing useState import → Fixed
8. ProfileTab.js missing Star/Plus imports → Fixed
9. Priest not receiving booking notifications → Fixed

## Deployment
- Backend: Google Cloud Run (divine-backend)
- Frontend: Firebase Hosting (divine-104d4.web.app)
- Deploy commands:
  - Backend: `cd backend && gcloud run deploy divine-backend --source . --region us-central1 --allow-unauthenticated --port 8001`
  - Frontend: `cd frontend && npm run build && npx firebase-tools deploy --only hosting`

## Pending Issues (User Verification)
- P0: Blank screen on mobile/Safari (code-complete, needs Firebase deploy)
- P1: Mobile Google Sign-In not working (blocked by Safari fix)
- P1: GOOGLE_PLACES_API_KEY on Cloud Run (user needs gcloud update-env-vars)
- P1: GitHub Actions APK build fails intermittently

## Upcoming Tasks
- (P1) Razorpay Integration: Replace Stripe for UPI payouts to providers
- (P1) CI/CD Pipeline: GitHub Actions → Cloud Run + Firebase
- (P1) Play Store TWA Setup
- (P2) Production data cleanup

## Future/Backlog
- Enable Astrologer & Shop Owner signups (multi-vendor)
- Scheduled push notification reminders for Vedic classes
- Phase 2 Live Streams (100ms HLS broadcasting)
- Temple section enhancements (AI images, maps, nearby temples)
- Provider Onboarding Guide
