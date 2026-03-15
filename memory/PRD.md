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
- **Icons**: 3D animated SVG icons (NO EMOJIS)

## Architecture
- **Frontend**: React.js (mobile-first responsive)
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **Styling**: Tailwind CSS with custom traditional theme
- **Mobile**: React Native with Expo (separate project at /app/divine-mobile)

## App Flows

### Web Flow (Desktop/Tablet)
1. **Marketing Landing Page** → Full landing page with 3D animated devotional icons
2. **Login/Sign Up** → Authentication with user type selection
3. **Dashboard** → Role-specific dashboard with sidebar navigation

### Mobile Flow (Phone)
1. **Splash Screen** → Animated Divine logo with lamp
2. **Welcome Screen** → 3D animated feature icons, Get Started / Login buttons
3. **Login/Register** → Authentication with user type dropdown
4. **Dashboard** → Role-specific dashboard with bottom navigation

## What's Been Implemented (March 2026)

### UI Updates - 3D Animated Icons
- [x] Removed ALL emojis from the app
- [x] Created custom 3D animated SVG icons:
  - **DiyaIcon** - Animated oil lamp with flickering flame
  - **OmIcon** - Sacred Om symbol with rotation
  - **KalashIcon** - Traditional kalash with floating animation
  - **TempleIcon** - Hindu temple with 3D perspective
  - **BellIcon** - Temple bell with swinging animation
  - **ConchIcon** - Shankh/Conch shell
  - **ZodiacIcon** - Rotating zodiac wheel
  - **CartIcon** - Pooja basket with bouncing animation
- [x] Applied icons across Landing Page, Auth Screen, and Dashboards

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

### Frontend (100% Complete)
- [x] Web Marketing Landing Page with 3D icons
- [x] Splash screen with animated Divine logo
- [x] Welcome screen with 3D feature icons
- [x] Login/Register screens with user type dropdown
- [x] **Devotee Dashboard** - Responsive with 3D quick action icons
- [x] **Admin Dashboard** - Responsive with sidebar
- [x] Priest Dashboard
- [x] Shop Owner Dashboard

### Mobile (Expo) - Partially Complete
- [x] Project setup at /app/divine-mobile
- [x] Navigation structure
- [x] Auth context and screens
- [x] DevoteeDashboard with tabs
- [ ] Expo preview not working in cloud environment (requires EXPO_TOKEN)

## Prioritized Backlog

### P0 (Critical)
- [ ] Firebase Authentication integration (user to provide credentials)
- [ ] Expo authentication for mobile preview (user to provide EXPO_TOKEN)

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
Mobile: React Native with Expo
Icons: Custom 3D animated SVGs
```

## Test Credentials
- **Admin**: admin@divineapp.com / admin123
- **Devotee**: test.devotee@divineapp.com / devotee123

## Key Files
- `frontend/src/pages/LandingPage.js` - Web marketing landing page with 3D icons
- `frontend/src/pages/AuthScreen.js` - Authentication with 3D feature icons
- `frontend/src/pages/dashboards/DevoteeDashboard.js` - Dashboard with 3D quick actions
- `frontend/src/pages/dashboards/AdminDashboard.js` - Admin dashboard
- `divine-mobile/` - React Native Expo project

## Preview URLs
- **Web App**: https://divine-spiritual.preview.emergentagent.com
- **Expo QR Code**: https://divine-spiritual.preview.emergentagent.com/expo-qr.html (requires EXPO_TOKEN)
