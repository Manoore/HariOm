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
- **Authentication**: Firebase (FULLY INTEGRATED)
- **Payments**: Stripe (real keys configured) + Razorpay (placeholder)
- **Video Meetings**: Skipped for MVP
- **Horoscope**: Local calculation service
- **Design Theme**: Traditional warm (saffron, gold, maroon)
- **MVP Scope**: All core features together
- **Icons**: 3D animated SVG icons (NO EMOJIS)

## Architecture
- **Frontend**: React.js (mobile-first responsive)
- **Backend**: Python FastAPI
- **Database**: MongoDB Atlas (user's cloud instance)
- **Styling**: Tailwind CSS with custom traditional theme
- **Authentication**: Firebase Auth (email/password + Google Sign-In)
- **Mobile**: React Native with Expo (separate project at /app/divine-mobile)

## Firebase Configuration (March 15, 2026)
- **Project ID**: divine-104d4
- **Auth Domain**: divine-104d4.firebaseapp.com
- **Authorized Domain**: bhakti-hub-15.preview.emergentagent.com
- **Features Enabled**:
  - Email/Password authentication
  - Google Sign-In (WORKING after domain authorization)
  - User sync with backend database

## Stripe Configuration (March 15, 2026)
- **Publishable Key**: pk_test_51QgI3PHHYDXeQk9Q... (configured in frontend)
- **Secret Key**: sk_test_51QgI3PHHYDXeQk9Q... (configured in backend)
- **Integration**: Payment Intent API ready
- **IP-based Selection**: Stripe for international users, Razorpay for India

## What's Been Implemented

### Authentication (COMPLETE)
- [x] Firebase SDK installed and configured
- [x] Email/Password authentication (working)
- [x] Google Sign-In with popup (working - domain authorized)
- [x] Firebase user sync with backend MongoDB
- [x] Token-based API authentication
- [x] Centered, card-style auth screens on desktop
- [x] **First-time Google user onboarding screen** (NEW - March 15, 2026)

### User Profile (NEW - March 15, 2026)
- [x] Editable profile section for devotees
- [x] Profile fields: Name, Phone, DOB, Gotra, Nakshatra, City, Pincode, Address
- [x] Backend PUT /api/users/profile endpoint
- [x] Profile completion tracking (profile_completed flag)
- [x] First-time Google login shows profile completion wizard
- [x] Two-step onboarding: Basic Info → Spiritual Details
- [x] Skip option for users who want to complete later

### Payment Gateway (IN PROGRESS)
- [x] Stripe keys configured
- [x] IP-based gateway detection (ipapi.co)
- [x] Stripe payment intent endpoint
- [x] Razorpay order creation endpoint (placeholder keys)
- [x] SmartPayment component with auto-detection
- [ ] Full checkout flow with confirmation

### UI Updates (March 15, 2026)
- [x] Auth screens centered and card-styled for desktop
- [x] Animated Aarti (Harathi) on landing page - bottom-right corner
- [x] Clickable DIVINE logo scrolls to top (navbar and footer)
- [x] 3D animated SVG devotional icons throughout the app
- [x] No emojis used anywhere

### Backend APIs (100% Working - 20/20 Tests)
- [x] User authentication (register/login/profile)
- [x] Firebase sync endpoints (/api/auth/firebase-sync, /api/auth/firebase-register)
- [x] Priests CRUD with services
- [x] Bookings system
- [x] Products/Marketplace
- [x] Cart operations
- [x] Orders system
- [x] Horoscope/Astrology APIs
- [x] Festivals and Temples APIs
- [x] Admin stats and management
- [x] Stripe payment intent creation
- [x] Razorpay order creation (placeholder)

### Frontend (100% Complete)
- [x] Web Marketing Landing Page with 3D icons and animated Aarti
- [x] Firebase Auth integration (Google + Email/Password)
- [x] Splash screen with animated Divine logo
- [x] Welcome screen with 3D feature icons
- [x] Login/Register screens with Google Sign-In (centered on desktop)
- [x] Devotee Dashboard - Responsive
- [x] Admin Dashboard - Responsive (9 Users, 3 Priests, 8 Products)
- [x] Priest Dashboard
- [x] Shop Owner Dashboard

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Firebase Authentication integration ✅
- [x] Google Sign-In domain authorization ✅
- [x] Stripe keys configuration ✅
- [x] Auth screen UI optimization ✅

### P1 (High Priority) - NEXT
- [ ] Complete payment checkout flow
- [ ] Razorpay real keys integration
- [ ] Priest booking payment flow
- [ ] Order confirmation and receipt

### P2 (Medium Priority)
- [ ] Astrologer/Priest/Shop Owner complete dashboards
- [ ] Product reviews and ratings
- [ ] Search and filter improvements
- [ ] Image upload for products/priests
- [ ] Horoscope API integration (real data)

### P3 (Future/Nice to Have)
- [ ] Video consultation integration
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Social sharing
- [ ] Referral system
- [ ] Mobile App (requires EXPO_TOKEN)
- [ ] App Store / Play Store deployment

## Tech Stack
```
Frontend: React 18, Tailwind CSS, Framer Motion, Firebase SDK
Backend: FastAPI, Motor (MongoDB async driver), Stripe SDK
Database: MongoDB Atlas
Auth: Firebase Auth (Google + Email/Password)
Payments: Stripe (test keys active), Razorpay (placeholder)
Mobile: React Native with Expo
Icons: Custom 3D animated SVGs
```

## Test Credentials
- **Admin**: admin@divineapp.com / admin123
- **Devotee**: devotee@divineapp.com / devotee123
- **Google Sign-In**: Any Google account

## Key Files
- `frontend/src/lib/firebase.js` - Firebase configuration and auth functions
- `frontend/src/contexts/AuthContext.js` - Auth context with Firebase + manual sync
- `frontend/src/contexts/PaymentContext.js` - IP-based payment gateway selection
- `frontend/src/components/PaymentComponents.js` - Stripe/Razorpay components
- `frontend/src/pages/AuthScreen.js` - Centered auth screens
- `backend/server.py` - Backend with Firebase sync + Stripe endpoints
- `backend/config.py` - Configuration with Stripe keys

## Preview URLs
- **Web App**: https://bhakti-hub-15.preview.emergentagent.com
