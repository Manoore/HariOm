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
- Festival Calendar, Book Priests, **Temples** (NEW), Astrology, Pooja Store, Profile

### Temples Section (NEW - Mar 2026)
- 268 temples across 33 Indian states, 10 deity categories
- Data sourced from rishabhmodi03/hindu-temples GitHub repo
- Full-text search, state/deity filters, pagination
- Detailed temple view with tabs: Overview, History, Architecture, Visit Guide, Scriptures
- Backend: /api/temples/list, /api/temples/states, /api/temples/deities, /api/temples/stats, /api/temples/{id}

### Priest Dashboard
- Profile management with Math/Mutt affiliation dropdown (fixed)
- Analytics dashboard (fixed datetime timezone bug)
- Booking management, earnings tracking

### Other Features
- Stripe payments, E-commerce store
- 100ms video calling for astrology consultations
- Chat system, Panchang calendar, Scriptures library

## Bug Fixes (Mar 2026 Session)
1. Math/Mutt dropdown showing empty categories → Fixed (API returns strings, not objects)
2. Priest analytics 500 error → Fixed (timezone-naive vs aware datetime comparison)
3. Consultation temples endpoint 500 → Fixed (missing city/description fields in new schema)

## Deployment
- Backend: Google Cloud Run (divine-backend-149993395431.us-central1.run.app)
- Frontend: Firebase Hosting (divine-104d4.web.app)
- Deploy commands:
  - Backend: `cd backend && gcloud run deploy divine-backend --source . --region us-central1 --allow-unauthenticated`
  - Frontend: `cd frontend && npm run build && npx firebase-tools deploy --only hosting`

## Pending Issues
- P0: Blank screen on mobile deployment (caching/service worker issue)
- P1: Mobile Google Sign-In not working (blocked by blank screen)
- P1: GitHub Actions APK build fails intermittently

## Upcoming Tasks
- Production data cleanup (remove test data)
- Play Store TWA Setup
- CI/CD Pipeline (GitHub Actions → Cloud Run + Firebase)
- Astrologer & Shop Owner signups (multi-vendor)
- Stripe Connect for payment splitting
- Scheduled push notification reminders
- Phase 2 Live Streams (100ms HLS)
- Provider Onboarding Guide
