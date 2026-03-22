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

### In Progress 🔄
- None currently active

### Pending Features 📋
- **P1**: GitHub Actions APK build fixes
- **P1**: DevoteeDashboard.js refactoring (5900+ lines → modular components)
- **P2**: Backend server.py refactoring (6000+ lines)
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
- `/app/backend/server.py` - Main API (6000+ lines, needs refactoring)
- `/app/frontend/src/pages/dashboards/AdminDashboard.js` - Admin UI (124 lines - REFACTORED ✅)
- `/app/frontend/src/pages/dashboards/admin/components/` - Modular admin components (15 files)
- `/app/frontend/src/pages/dashboards/DevoteeDashboard.js` - Devotee UI (5900+ lines - needs refactoring)
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
March 22, 2026 - AdminDashboard refactoring complete (2604 → 124 lines)
