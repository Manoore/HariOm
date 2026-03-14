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

## Core Requirements
- [x] Mobile-first responsive design
- [x] Splash screen → Welcome → Auth → Dashboard flow
- [x] Role-based authentication and dashboards
- [x] Priest listing and booking system
- [x] Horoscope/Astrology section with zodiac signs
- [x] Pooja marketplace with cart
- [x] Festival calendar
- [x] Temple directory
- [x] Bottom navigation for mobile app feel

## What's Been Implemented (Jan 2026)

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

### Frontend (95% Complete)
- [x] Splash screen with animated Divine logo
- [x] Welcome screen with feature icons
- [x] Login/Register screens
- [x] Devotee Dashboard with bottom nav
- [x] Priests Tab - listing and detail view
- [x] Astrology Tab - zodiac grid with horoscope
- [x] Shop Tab - product grid with add to cart
- [x] Profile Tab - bookings, orders, logout
- [x] Priest Dashboard for booking management
- [x] Admin Dashboard with stats
- [x] Shop Owner Dashboard

### Design
- [x] Traditional Indian theme (saffron/gold/maroon)
- [x] Cinzel font for headings
- [x] Dark cosmic mode for astrology section
- [x] Mobile-first bottom navigation

## Prioritized Backlog

### P0 (Critical) - In Progress
- [ ] External URL deployment fix (platform issue)
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

## Tech Stack
```
Frontend: React 18, Tailwind CSS, Framer Motion
Backend: FastAPI, Motor (MongoDB async driver)
Database: MongoDB
Auth: JWT (Firebase integration pending)
Payments: Stripe (configured), Razorpay (pending keys)
```

## Test Results
- Backend: 100% (22/22 tests passed on localhost)
- Frontend: 95% (UI complete, blocked by external URL)
- Integration: Pending external URL fix

## Next Steps
1. User provides Firebase credentials for auth integration
2. Fix external URL routing for production
3. Complete payment flow testing
4. App store preparation (React Native migration if needed)
