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
- Home, Messages, Call Astrologer, Vedic Classes, Live Events
- Spiritual Feed, Mantras & Shlokas, Sacred Scriptures
- Festival Calendar, Book Priests, Temples, Astrology, Pooja Store, Profile

### Temples Section (Mar 2026)
- 268 temples across 33 Indian states, 10 deity categories
- Data sourced from rishabhmodi03/hindu-temples GitHub repo
- Full-text search, state/deity filters, pagination
- Detailed temple view with tabs: Overview, History, Architecture, Visit Guide, Scriptures
- Backend: /api/temples/list, /api/temples/states, /api/temples/deities, /api/temples/stats, /api/temples/{id}

### Subcaste Management (Mar 2026)
- 126 subcastes seeded from user-provided list
- Admin CRUD: /api/subcastes (GET, POST, PUT, DELETE)
- Admin dashboard "Subcastes" tab for managing subcastes
- Priest profile includes subcaste dropdown
- Devotee can search/filter priests by subcaste and math_mutt
- Priest detail view shows subcaste, math_mutt, temple affiliation, work locations

### Dashboard Refactoring (Mar 2026) - COMPLETED
- **PriestDashboard.js**: Refactored from ~3200 lines to 377-line orchestrator + 10 component files in `/priest/components/`
- **AstrologerDashboard.js**: Refactored from 949 lines to 252-line orchestrator + 7 component files in `/astrologer/components/`
- **ShopOwnerDashboard.js**: Refactored from 1391 lines to 80-line orchestrator + 8 component files in `/shopowner/components/`
- All component files are under 500 lines. Full frontend regression tested and verified.

### Other Features
- Stripe payments, E-commerce store
- 100ms video calling for astrology consultations
- Chat system, Panchang calendar, Scriptures library

## Bug Fixes (Mar 2026)
1. Math/Mutt dropdown showing empty categories -> Fixed
2. Priest analytics 500 error -> Fixed (timezone-naive vs aware datetime)
3. Consultation temples endpoint 500 -> Fixed
4. Puja Type dropdown empty -> Fixed
5. Astrologer redirected to landing page after accepting call -> Fixed
6. Duplicate notification bell in priest dashboard -> Fixed
7. BookingsTab.js missing useState import -> Fixed by testing agent
8. ProfileTab.js missing Star/Plus imports -> Fixed by testing agent

## Deployment
- Backend: Google Cloud Run (divine-backend-149993395431.us-central1.run.app)
- Frontend: Firebase Hosting (divine-104d4.web.app)
- Deploy commands:
  - Backend: `cd backend && gcloud run deploy divine-backend --source . --region us-central1 --allow-unauthenticated`
  - Frontend: `cd frontend && npm run build && npx firebase-tools deploy --only hosting`

## Pending Issues
- P0: Blank screen on mobile deployment (code-complete, needs Firebase deploy)
- P1: Mobile Google Sign-In not working (blocked by blank screen fix)
- P1: GitHub Actions APK build fails intermittently
- P1: GOOGLE_PLACES_API_KEY wiped on Cloud Run (user needs to run gcloud update-env-vars)

## Upcoming Tasks
- (P1) Razorpay Integration: Replace Stripe for UPI payouts to providers
- (P1) CI/CD Pipeline: GitHub Actions -> Cloud Run + Firebase
- (P1) Play Store TWA Setup
- (P2) Production data cleanup (remove test data)
- (P2) Enable Astrologer & Shop Owner signups (multi-vendor)
- (P2) Scheduled push notification reminders for Vedic classes
- (P2) Phase 2 Live Streams (100ms HLS broadcasting)
- (P3) Temple section enhancements (AI images, maps, nearby temples)
- (P3) Provider Onboarding Guide
