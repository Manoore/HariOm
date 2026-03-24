# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services. Features include priest booking, astrology services, a spiritual e-commerce store, devotional content (mantras, audio, video), and live video/voice consultations.

## User Personas
- **Devotee**: Primary user who books priests, consults astrologers, shops for spiritual items, accesses devotional content
- **Priest**: Service provider offering poojas, ceremonies, and religious services
- **Astrologer**: Provides horoscope readings and consultations via video calls
- **Shop Owner**: Sells spiritual items through the marketplace
- **Admin**: Platform administrator managing users, approvals, and content

## Core Features

### Implemented ✅
1. **Authentication System**
   - Firebase Auth integration
   - Local bcrypt fallback for testing
   - Role-based dashboards (Devotee, Priest, Astrologer, Shop Owner, Admin)

2. **Priest Services**
   - Priest profiles with specializations, languages, services
   - Booking system with payment integration
   - Availability management
   - Admin approval workflow

3. **Astrology Services**
   - Astrologer profiles
   - 100ms WebRTC video consultations
   - Wallet system for payments

4. **E-Commerce (Pooja Store)**
   - Product listings with categories
   - Shopping cart functionality
   - Order management

5. **Devotional Content**
   - Video Library (YouTube embeds) - all categories working
   - Audio Library (mantras, bhajans, aarti)
   - Scripture Library

6. **Vedic Classes (Phase 1)**
   - Priest class creation (Free & Paid)
   - Automated 100ms room generation for paid classes
   - YouTube Live embed for streams
   - Free class green styling differentiation

7. **UI/UX**
   - Om icon in Devotee sidebar (Home menu)
   - Logout button visibility fixed
   - Multi-language support (i18n)

### Completed in Latest Session ✅
8. **Admin Dashboard Refactoring** (March 22, 2026)
   - Reduced AdminDashboard.js from 2604 lines to 124 lines
   - Created 15 modular component files in `/admin/components/`
   - All components under 500 lines (largest: AudioLibraryTab at 390 lines)
   - Components: AdminSidebar, OverviewTab, UsersTab, PriestsTab, ProductsTab, BookingsTab, VideoLibraryTab, ApprovalsTab, PujaTypesTab, AudioLibraryTab, FeedbackTab, ProfileTab, AdminManagementTab, shared utilities

9. **DevoteeDashboard Refactoring Complete** (March 22, 2026)
   - Reduced DevoteeDashboard.js from 5948 lines to 1588 lines (73% reduction!)
   - Created 14 modular component files in `/devotee/components/`:
     - shared.js (93 lines) - Icons, useIsDesktop hook
     - MobileHeader.js (23 lines)
     - Navigation.js (202 lines) - Sidebar, BottomNav
     - FeedTab.js (317 lines) - PostCard, FeedTab
     - ConsultationTab.js (96 lines)
     - HomeTab.js (421 lines)
     - ReviewModal.js (100 lines)
     - PriestsTab.js (307 lines)
     - LiveEventsTab.js (326 lines)
     - CalendarTab.js (306 lines)
     - ShopTab.js (345 lines)
     - ProfileTab.js (429 lines)
     - ClassesTab.js (1008 lines) - main component with ClassRequestForm, ClassCard
     - ClassVideoRoom.js (318 lines) - 100ms video room component
     - TestimonialSection.js (123 lines) - testimonial form
     - index.js (20 lines)
   - Fixed bugs: PriestsTab location object rendering, import path corrections
   - Total lines in components: ~4500 lines

10. **Backend server.py Refactoring Phase 1-4** (March 22, 2026)
    - **Phase 1**: Extracted Shop (11 routes) + Cart (5 routes) - 497 lines removed
    - **Phase 2**: Extracted Chat (8 routes) + Payments (5 routes) - 639 lines removed
    - **Phase 3**: Extracted Orders (10 routes) + Astrology (15 routes) - 647 lines removed
    - **Phase 4**: Created Devotional (20 routes, 442 lines) + Panchang (8 routes, 381 lines) route files

11. **Backend server.py Refactoring Phase 5 & 6 - COMPLETE** (March 23, 2026)
    - ✅ Phase 5: Removed duplicate Panchang/Festival/Devotional/Scripture routes
    - ✅ Phase 6: Complete modular extraction - **server.py reduced from 4650 to 541 lines (88% reduction!)**
    - **New modular route files created:**
      - `routes/uploads.py` - File uploads (image/video)
      - `routes/places.py` - Google Places API
      - `routes/translate.py` - Translation API
      - `routes/video_library.py` - YouTube devotional videos
      - `routes/classes.py` - Classes & Live Streams (~700 lines)
      - `routes/feedback.py` - Feedback & Testimonials
      - `routes/consultation.py` - Consultation, Wallet, System Config (~370 lines)
      - `routes/archive.py` - Internet Archive Vedic Library (~320 lines)
      - `routes/shop.py` (updated) - Added marketplace_router for public products
    - **Total**: 18 modular route files in `/app/backend/routes/`
    - **Original server.py**: 6429 lines → **Final**: 541 lines (**92% reduction!**)
    - All 28 API tests passed (100% success rate - iteration_29.json)

### In Progress 🔄
- None currently active

12. **AuthScreen.js ESLint Build Fix** (March 24, 2026)
    - Fixed `signupSettings` scoping issue — passed as prop from `AuthScreen` to `RegisterScreen`
    - `npm run build` now completes successfully

13. **Mobile Splash Screen & Enhanced Icons** (March 24, 2026)
    - Added animated splash screen with Om logo, floating particles, and loading animation (~2.8s)
    - Enhanced 4 service icons (Bell, Zodiac, Temple, Cart) with detailed SVGs, gradients, glows
    - Upgraded icon cards with gradient backgrounds, borders, and tap animations

14. **In-App Notifications System - Fully Wired** (March 24, 2026)
    - NotificationBell component now rendered in: Desktop sidebar, MobileHeader, HomeTab
    - Backend notification service already triggers on: bookings, class enrollment, payments
    - Added test notification endpoint (`POST /api/notifications/test`)
    - Added admin announcement endpoint (`POST /api/notifications/admin/announce`)
    - Bell shows unread count badge, dropdown with mark-read/delete actions

### Pending Features 📋
- **P1**: GitHub Actions APK build fixes
- **P2**: Stripe Connect for vendor payment splitting
- **P2**: Push notifications for class reminders
- **P2**: Phase 2 Live Streams (100ms HLS)
- **P3**: Temple section functionality
- **P3**: Provider onboarding guide

## Technical Architecture

### Stack
- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: Firebase + bcrypt fallback
- **Video**: 100ms WebRTC SDK
- **Payments**: Integrated (Stripe Connect pending)

### Key Files
- `/app/backend/server.py` - Main API (541 lines - fully modularized ✅)
- `/app/backend/routes/` - 18 modular route files
- `/app/backend/routes/shop.py` - Shop owner routes (365 lines)
- `/app/backend/routes/cart.py` - Cart routes (181 lines)
- `/app/backend/routes/chat.py` - Chat REST routes (398 lines)
- `/app/backend/routes/payments.py` - Payment routes (287 lines)
- `/app/backend/routes/orders_new.py` - Orders/Checkout routes (493 lines)
- `/app/backend/routes/astrology.py` - Astrology/Horoscope routes (481 lines)
- `/app/backend/routes/devotional.py` - Devotional Content routes (442 lines)
- `/app/backend/routes/panchang.py` - Panchang/Festival routes (381 lines)
- `/app/frontend/src/pages/dashboards/AdminDashboard.js` - Admin UI (124 lines - REFACTORED ✅)
- `/app/frontend/src/pages/dashboards/admin/components/` - Modular admin components (15 files)
- `/app/frontend/src/pages/dashboards/DevoteeDashboard.js` - Devotee UI (1588 lines - REFACTORED 73% ✅)
- `/app/frontend/src/pages/dashboards/devotee/components/` - Modular devotee components (16 files)
- `/app/backend/class_rooms.py` - Background job for 100ms room generation

### API Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/video-library` - Devotional video content
- `GET /api/priest/profile` - Priest profile management
- `GET /api/my-enrollments` - User class enrollments
- `GET /api/classes` - Available Vedic classes

## Deployment
- **Backend**: Google Cloud Run (`gcloud run deploy divine-backend --source .`)
- **Frontend**: Firebase Hosting (`npm run build && npx firebase deploy`)
- Uses `--legacy-peer-deps` for npm compatibility

## Last Updated
March 24, 2026 - In-App Notifications wired up, Splash Screen & Enhanced Icons added, ESLint build fix
