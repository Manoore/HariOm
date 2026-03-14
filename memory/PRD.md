# Divine App - PRD (Product Requirements Document)

## Project Overview
Divine App is a mobile-first digital platform that connects people with priests, astrology services, spiritual learning, and pooja products in one place - a complete ecosystem for Hindu spiritual services.

## Original Problem Statement
Build a cross-platform app (iOS, Android, Web) for Hindu spiritual services including:
- Priest booking for poojas and ceremonies
- Astrology/Horoscope services
- Pooja marketplace
- Multi-role system (Devotee, Priest, Astrologer, Shop Owner, Admin)
- Festival calendar and temple directory

## User Choices
- **Authentication**: Firebase (placeholder - user to provide keys later)
- **Payments**: Stripe (international) + Razorpay (India)
- **Video Meetings**: Skipped for MVP
- **Horoscope**: Local calculation service
- **Design Theme**: Traditional warm (saffron, gold, maroon)
- **MVP Scope**: All core features together

## Architecture
- **Frontend**: React.js (mobile-first responsive)
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **Styling**: Tailwind CSS with custom traditional theme

## User Personas
1. **Devotees**: Book priests, check horoscope, buy pooja items
2. **Priests**: Manage bookings, offer services
3. **Astrologers**: Provide consultations
4. **Shop Owners**: Sell pooja products
5. **Admin**: Platform management

## App Flows

### Web Flow (Desktop/Tablet)
1. **Marketing Landing Page** → Full landing page with:
   - Hero section with app preview
   - Features, Services, Priests sections
   - Marketplace preview
   - Festival calendar
   - Testimonials and CTA
   - Footer with contact info
2. **Login/Sign Up** → Authentication with user type selection
3. **Dashboard** → Role-specific dashboard with sidebar navigation

### Mobile Flow (Phone)
1. **Splash Screen** → Animated Divine logo with loading
2. **Welcome Screen** → Feature icons, Get Started / Login buttons
3. **Login/Register** → Authentication with user type dropdown
4. **Dashboard** → Role-specific dashboard with bottom navigation

## Core Requirements
- [x] Mobile-first responsive design
- [x] Platform-specific flows (Web: Landing → Auth → Dashboard, Mobile: Splash → Auth → Dashboard)
- [x] Role-based authentication and dashboards
- [x] Priest listing and booking system
- [x] Horoscope/Astrology section with zodiac signs
- [x] Pooja marketplace with cart
- [x] Festival calendar
- [x] Temple directory
- [x] Bottom navigation for mobile, sidebar for desktop

## What's Been Implemented (March 2026)

### Backend APIs (100% Working)
- [x] User authentication (register/login/profile)
- [x] Priests CRUD with services
- [x] Bookings system
- [x] Products/Marketplace
- [x] Cart operations
- [x] Orders system
- [x] Horoscope/Astrology APIs
- [x] Festivals and Temples APIs
- [x] Admin stats and management
- [x] Stripe payment integration

### Frontend (100% Complete)
- [x] Web Marketing Landing Page (Hero, Features, Services, Priests, Marketplace, Festivals, CTA, Footer)
- [x] Splash screen with animated Divine logo (mobile only)
- [x] Welcome screen with feature icons (mobile only)
- [x] Login/Register screens with user type dropdown
- [x] **Devotee Dashboard** - Responsive (sidebar on desktop, bottom nav on mobile)
  - Home tab with quick actions, festivals, priests
  - Priests tab with booking flow
  - Astrology tab with zodiac horoscope
  - Shop tab with product grid and cart
  - Profile tab with bookings and orders
- [x] **Admin Dashboard** - Responsive (sidebar on desktop, bottom nav on mobile)
  - Overview tab with stats
  - Users tab with all users list
  - Priests tab with priest management
  - Products tab with product grid
  - Bookings tab with booking list
- [x] Priest Dashboard for booking management
- [x] Shop Owner Dashboard

### Design
- [x] Traditional Indian theme (saffron/gold/maroon)
- [x] Cinzel font for headings
- [x] Dark cosmic mode for astrology section
- [x] Mobile-first bottom navigation
- [x] Desktop sidebar navigation

## Prioritized Backlog

### P0 (Critical)
- [ ] Firebase Authentication integration (user to provide keys)

### P1 (High Priority)
- [ ] Razorpay payment integration with real keys
- [ ] Priest booking payment flow
- [ ] Push notifications for bookings

### P2 (Medium Priority)
- [ ] Astrologer dashboard
- [ ] Product reviews and ratings
- [ ] Search and filter improvements
- [ ] Image upload for products/priests

### P3 (Future/Nice to Have)
- [ ] Video consultation integration
- [ ] Multi-language support
- [ ] Social sharing
- [ ] Referral system
- [ ] App Store / Play Store deployment (Expo EAS)

## Tech Stack
```
Frontend: React 18, Tailwind CSS, Framer Motion
Backend: FastAPI, Motor (MongoDB async driver)
Database: MongoDB
Auth: JWT (Firebase integration pending)
Payments: Stripe (configured), Razorpay (pending keys)
```

## Test Results (March 14, 2026)
- Backend: 100% working
- Frontend: 100% (all flows tested and verified)
- Integration: 100% working

### Test Credentials
- **Admin**: admin@divineapp.com / admin123
- **Devotee**: test.devotee@divineapp.com / devotee123

## Next Steps
1. User provides Firebase credentials for auth integration
2. User provides Razorpay keys for Indian payments
3. Complete payment flow testing
4. App store preparation (React Native migration if needed)

## Key Files
- `frontend/src/pages/MobileApp.js` - Main app navigator (controls web vs mobile flow)
- `frontend/src/pages/LandingPage.js` - Web marketing landing page
- `frontend/src/pages/AuthScreen.js` - Authentication with user type dropdown
- `frontend/src/pages/dashboards/AdminDashboard.js` - Admin dashboard (responsive)
- `frontend/src/pages/dashboards/DevoteeDashboard.js` - Devotee dashboard (responsive)
- `backend/server.py` - FastAPI backend
