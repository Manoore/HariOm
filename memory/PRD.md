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
- **i18n**: react-i18next (10 Indian languages) + Google Free Translate API

## Core Features (All Complete)

### Multi-Language Support (10 Languages) — COMPLETE
- English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Sanskrit
- Static UI via JSON locale files; Dynamic content via useAutoTranslate hook
- Translated: LandingPage navbar, AuthScreen, HomeTab, Navigation (Sidebar+BottomNav), Layout (Navbar/Footer), MarketplacePages, ContentPages, AstrologyPage, PriestPages, PriestDetailView

### Puja Samagri + PDF/Image Upload — COMPLETE
### WebSocket Real-Time Chat — COMPLETE
### Priest Availability & Slot Booking — COMPLETE
### All Other Features — COMPLETE

## Session Log

### Apr 13, 2026
- [x] WebSocket chat, Samagri, Availability, Bug fixes (iterations 50-52)

### Apr 14, 2026
- [x] Samagri PDF/Image Upload (iteration_53: 100%)
- [x] i18n: 10 languages + AuthScreen + AuthPages + PriestPages (iteration_54: 100%)
- [x] i18n: Layout, Navigation, Marketplace, Content, Astrology, PriestDetailView (iteration_55)
- [x] i18n: LandingPage navbar + HomeTab headings/actions (iteration_56: 100%)

## P1/P2 Backlog
### P1 — Upcoming
1. CI/CD Pipeline Setup (GitHub Actions → Cloud Run + Firebase)
2. Play Store TWA Setup

### P2 — Future
3. Automated Payouts via RazorpayX
4. Phase 2 Live Streams (100ms HLS)
5. Temple section enhancements

## Test Credentials
- Devotee: `devotee@divineapp.com` / `devotee123`
- Priest: `pandit.sharma@divineapp.com` / `priest123`
- Admin: `admin@divine.com` / `admin123`
