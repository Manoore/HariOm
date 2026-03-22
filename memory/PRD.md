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

10. **Backend server.py Refactoring Phase 1** (March 22, 2026)
    - Reduced server.py from 6429 lines to 5932 lines (-497 lines, 8% reduction)
    - Extracted Shop routes to `/app/backend/routes/shop.py` (11 routes)
    - Extracted Cart routes to `/app/backend/routes/cart.py` (5 routes)
    - All 23 backend tests passed after refactoring

### In Progress 🔄
- None currently active

### Pending Features 📋
- **P1**: Continue Backend server.py refactoring (5932 lines remaining - target <3000 lines)
  - Extract Orders/Checkout routes
  - Extract Payment routes  
  - Extract Chat/WebSocket routes
  - Extract Astrology/Horoscope routes
  - Extract Devotional content routes
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
- `/app/backend/server.py` - Main API (5932 lines - Phase 1 refactoring done ✅)
- `/app/backend/routes/shop.py` - Shop owner routes (365 lines)
- `/app/backend/routes/cart.py` - Cart routes (181 lines)
- `/app/frontend/src/pages/dashboards/AdminDashboard.js` - Admin UI (124 lines - REFACTORED ✅)
- `/app/frontend/src/pages/dashboards/admin/components/` - Modular admin components (15 files)
- `/app/frontend/src/pages/dashboards/DevoteeDashboard.js` - Devotee UI (1588 lines - REFACTORED 73% ✅)
- `/app/frontend/src/pages/dashboards/devotee/components/` - Modular devotee components (16 files)
- `/app/backend/class_rooms.py` - Background job for 100ms room generation
- `/app/backend/routes/priest_dashboard.py` - Priest API endpoints

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
March 22, 2026 - ClassesTab.js refactoring complete (1277 → 1008 lines + 2 sub-components)
                Backend server.py Phase 1 refactoring (6429 → 5932 lines, Shop & Cart routes extracted)
