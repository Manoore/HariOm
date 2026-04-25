# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion + react-i18next
- **Mobile**: Capacitor 6 (Android + iOS from same React codebase)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Razorpay
- **Video**: 100ms SDK
- **Auth**: JWT + Firebase
- **Email**: Resend API
- **Push**: Firebase Cloud Messaging
- **Chat**: WebSocket (FastAPI native) + REST API fallback
- **i18n**: react-i18next (10 Indian languages)

## Core Features (All Complete)
- Multi-Language Support (10 languages)
- Puja Samagri + PDF/Image Upload
- WebSocket Real-Time Chat
- Priest Availability & Slot Booking
- E-commerce, Astrology, Video consultations
- Admin Dashboard

## Mobile App (Capacitor)
- Package ID: `com.divineapp.hariom`
- Android: `/frontend/android/` — Open in Android Studio
- iOS: `/frontend/ios/` — Open in Xcode (requires Mac)
- Theme: Maroon (#8B2500) primary, Saffron (#FF9933) accent, Cream (#FFF8E1) splash
- Same codebase as web — no separate UI needed

## Session Log

### Apr 13-14, 2026
- [x] WebSocket chat, Samagri, Availability, Bug fixes
- [x] Samagri PDF/Image Upload
- [x] Multi-Language Support (10 languages, all pages)
- [x] Sidebar translation fixes

### Apr 15, 2026
- [x] Capacitor 6 setup for Android + iOS
  - Installed @capacitor/core, @capacitor/cli, @capacitor/android, @capacitor/ios
  - Created android/ and ios/ native projects
  - Configured Divine App theme colors, splash screen
  - Synced web assets to both platforms

## Backlog
### P1
1. Generate app icons & splash screens for all DPI sizes
2. CI/CD Pipeline Setup (GitHub Actions)
3. Play Store listing & first release

### P2
4. Automated Payouts via RazorpayX
5. Phase 2 Live Streams (100ms HLS)
6. Temple section enhancements

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Admin: `admin@divine.com` / `admin123`
