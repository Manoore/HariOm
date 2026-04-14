# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion + react-i18next
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Razorpay
- **Video**: 100ms SDK
- **Auth**: JWT + Firebase
- **Email**: Resend API
- **Push**: Firebase Cloud Messaging
- **Chat**: WebSocket (FastAPI native) + REST API fallback
- **i18n**: react-i18next + i18next-browser-languagedetector (10 Indian languages)
- **Translation API**: Google Free Translate + MyMemory fallback

## Core Features

### Multi-Language Support (10 Languages)
- English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Sanskrit
- Static UI translations via JSON locale files
- Auto-translate user-generated content (priest bios, reviews) via useAutoTranslate hook
- Language selector in navbar, preference persisted in localStorage
- Wired pages: LandingPage, AuthScreen, AuthPages, PriestPages, PriestDetailView, Layout (Navbar/Footer/BottomNav), Navigation (Sidebar/BottomNav), MarketplacePages, ContentPages, AstrologyPage

### Puja Samagri (Items) + PDF/Image Upload
- Priest uploads Samagri PDF or photo, or types items manually
- Devotee sees samagri with View PDF / View Photo links

### WebSocket Real-Time Chat
- ws://host/ws/chat/{room_id}?token=JWT

### Priest Availability & Slot Booking
- Double-booking prevented (409)

### All Other Features
- Multi-role auth, E-commerce, Astrology, Video consultations
- Admin Dashboard, Devotional content

## Session Log

### Apr 13, 2026
- [x] WebSocket real-time chat, Samagri, Availability, Bug fixes (iterations 50-52)

### Apr 14, 2026
- [x] Puja Samagri PDF/Image Upload (iteration_53: 100%)
- [x] Multi-Language: 10 languages initial setup (iteration_54: 100%)
- [x] Multi-Language: Remaining pages wired (iteration_55)
  - Layout.js (Navbar, BottomNav, Footer) — all translated
  - Navigation.js (Dashboard Sidebar + BottomNav) — all translated
  - MarketplacePages.js, ContentPages.js, AstrologyPage.js — translated
  - PriestDetailView.js — useAutoTranslate for priest bios

## P1/P2 Backlog

### P1 — Upcoming
1. Wire HomeTab quick actions and headings with i18n
2. CI/CD Pipeline Setup (GitHub Actions -> Cloud Run + Firebase)
3. Play Store TWA Setup

### P2 — Future
4. Automated Payouts via RazorpayX
5. Phase 2 Live Streams (100ms HLS)
6. Temple section enhancements

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Admin: `admin@divine.com` / `admin123`

## Architecture
```
/app/frontend/src/
├── i18n/
│   ├── index.js (10 languages)
│   └── locales/ (en, hi, bn, mr, gu, ta, te, kn, ml, sa .json)
├── hooks/useAutoTranslate.js
├── components/
│   ├── LanguageSelector.js
│   ├── Layout.js (Navbar/Footer/BottomNav with i18n)
│   └── DevoteeDashboard/PriestDetailView.js (useAutoTranslate)
└── pages/
    ├── AuthScreen.js, PriestPages.js, LandingPage.js
    ├── MarketplacePages.js, ContentPages.js, AstrologyPage.js
    └── dashboards/devotee/components/Navigation.js (Sidebar/BottomNav with i18n)
```
