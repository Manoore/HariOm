# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion + react-i18next
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Razorpay
- **Video**: 100ms SDK
- **Auth**: JWT
- **Email**: Resend API
- **Push**: Firebase Cloud Messaging
- **Chat**: WebSocket (FastAPI native) + REST API fallback
- **i18n**: react-i18next + i18next-browser-languagedetector (10 Indian languages)
- **Translation API**: Google Free Translate + MyMemory fallback

## Core Features

### Multi-Language Support (10 Languages)
- English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Sanskrit
- Static UI translations via JSON locale files (i18n)
- Auto-translate user-generated content via `/api/translate` endpoint
- `useAutoTranslate` hook for dynamic content translation
- Language selector in navbar, preference persisted in localStorage
- Wired pages: LandingPage, AuthScreen, AuthPages, PriestPages

### WebSocket Real-Time Chat
- `ws://host/ws/chat/{room_id}?token=JWT` — persistent connection
- Auto-reconnect, typing indicators, online status, polling fallback

### Puja Samagri (Items) List
- Priest adds items per service (name, qty, optional flag)
- Priest can upload Samagri PDF or take a photo
- Devotee sees samagri with View PDF / View Photo links

### Priest Availability & Slot Booking
- Weekly schedule, slot duration, blocked dates
- Double-booking prevented (409)

### Priest Booking Flow
- Select service (see samagri) -> pick date -> pick time slot
- Razorpay payment -> confirm-payment -> chat room + notifications

### All Other Features
- Multi-role auth, E-commerce, Astrology, Video consultations
- Admin Dashboard (Payments, Payouts, Refunds)
- Devotional content (mantras, scriptures, festivals)

## Session Log

### Apr 13, 2026
- [x] WebSocket real-time chat (iteration_50-52: 100% pass)
- [x] Puja Samagri + Priest Availability + Bug fixes

### Apr 14, 2026
- [x] Puja Samagri PDF/Image Upload — VERIFIED (iteration_53: 100% pass)
- [x] Multi-Language Support — 10 Indian languages (iteration_54: 100% pass)
  - Added Bengali, Marathi, Gujarati locale files
  - Updated i18n config for 10 languages
  - Wired AuthScreen, AuthPages, PriestPages with useTranslation()
  - Created useAutoTranslate hook for user-generated content
  - Fixed upload URL generation (request-based)

## P0/P1/P2 Backlog

### P0 — Done
- All core features implemented and tested

### P1 — Upcoming
1. Wire remaining pages with i18n (Dashboard, Marketplace, Astrology, etc.)
2. Integrate useAutoTranslate hook for priest bios, service descriptions, reviews
3. CI/CD Pipeline Setup (GitHub Actions -> Cloud Run + Firebase)
4. Play Store TWA Setup

### P2 — Future
5. Automated Payouts via RazorpayX
6. Phase 2 Live Streams (100ms HLS)
7. Temple section enhancements

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Admin: `admin@divine.com` / `admin123`

## Key API Endpoints
- `ws://host/ws/chat/{room_id}?token=JWT`
- `GET /api/priests/{id}/available-slots?date=YYYY-MM-DD`
- `POST /api/bookings` (slot_start, slot_end, samagri_list)
- `POST /api/bookings/{id}/confirm-payment`
- `GET/POST /api/priest/services` (samagri_list, samagri_pdf_url, samagri_image_url)
- `POST /api/upload/document` | `POST /api/upload/image`
- `POST /api/translate` (text, target_lang)

## Architecture
```
/app/
├── backend/
│   ├── server.py
│   ├── routes/
│   │   ├── chat.py, bookings_new.py, priest_dashboard.py
│   │   ├── priests_new.py, uploads.py, translate.py
│   └── auth.py
└── frontend/src/
    ├── i18n/
    │   ├── index.js (10 languages config)
    │   └── locales/ (en, hi, bn, mr, gu, ta, te, kn, ml, sa .json)
    ├── hooks/useAutoTranslate.js
    ├── components/LanguageSelector.js
    └── pages/
        ├── AuthScreen.js, PriestPages.js, LandingPage.js (i18n wired)
        └── dashboards/priest/components/ServicesTab.js
```
