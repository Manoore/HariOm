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
- **Authentication**: Firebase (NOW INTEGRATED!)
- **Payments**: Stripe (international) + Razorpay (India)
- **Video Meetings**: Skipped for MVP
- **Horoscope**: Local calculation service
- **Design Theme**: Traditional warm (saffron, gold, maroon)
- **MVP Scope**: All core features together
- **Icons**: 3D animated SVG icons (NO EMOJIS)

## Architecture
- **Frontend**: React.js (mobile-first responsive)
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **Styling**: Tailwind CSS with custom traditional theme
- **Authentication**: Firebase Auth (email/password + Google Sign-In)
- **Mobile**: React Native with Expo (separate project at /app/divine-mobile)

## Firebase Configuration (March 15, 2026)
- **Project ID**: divine-104d4
- **Auth Domain**: divine-104d4.firebaseapp.com
- **Features Enabled**:
  - Email/Password authentication
  - Google Sign-In
  - User sync with backend database

## What's Been Implemented

### Firebase Authentication (COMPLETE)
- [x] Firebase SDK installed and configured
- [x] Email/Password authentication
- [x] Google Sign-In with popup
- [x] Firebase user sync with backend MongoDB
- [x] Token-based API authentication
- [x] Login screen with Google button
- [x] Register screen with Google button
- [x] Welcome screen with Google button
- [x] Legacy login fallback for existing users

### UI Updates
- [x] Animated Aarti (Harathi) on landing page - bottom-right corner
- [x] Clickable DIVINE logo scrolls to top (navbar and footer)
- [x] 3D animated SVG devotional icons throughout the app
- [x] No emojis used anywhere

### Backend APIs (100% Working)
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

### Frontend (100% Complete)
- [x] Web Marketing Landing Page with 3D icons and animated Aarti
- [x] Firebase Auth integration (Google + Email/Password)
- [x] Splash screen with animated Divine logo
- [x] Welcome screen with 3D feature icons
- [x] Login/Register screens with Google Sign-In
- [x] Devotee Dashboard - Responsive
- [x] Admin Dashboard - Responsive
- [x] Priest Dashboard
- [x] Shop Owner Dashboard

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Firebase Authentication integration ✅

### P1 (High Priority)
- [ ] Razorpay payment integration with real keys
- [ ] Priest booking payment flow
- [ ] Push notifications for bookings
- [ ] Expo mobile preview (requires EXPO_TOKEN)

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
Frontend: React 18, Tailwind CSS, Framer Motion, Firebase SDK
Backend: FastAPI, Motor (MongoDB async driver), firebase-admin
Database: MongoDB
Auth: Firebase Auth (Google + Email/Password)
Payments: Stripe (configured), Razorpay (pending keys)
Mobile: React Native with Expo
Icons: Custom 3D animated SVGs
```

## Test Credentials
- **Admin**: admin@divineapp.com / admin123 (legacy)
- **Google Sign-In**: Use any Google account

## Key Files
- `frontend/src/lib/firebase.js` - Firebase configuration and auth functions
- `frontend/src/contexts/AuthContext.js` - Auth context with Firebase integration
- `frontend/src/pages/LandingPage.js` - Landing page with Aarti animation
- `frontend/src/pages/AuthScreen.js` - Auth screens with Google Sign-In
- `backend/server.py` - Backend with Firebase sync endpoints

## Preview URLs
- **Web App**: https://divine-spiritual.preview.emergentagent.com
