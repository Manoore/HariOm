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
- [x] **My Bookings & My Orders on Home screen** (NEW)
- [x] **Clickable user name in sidebar → Profile page** (NEW)
- [x] **Clickable user name in Home header → Profile page** (NEW)

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

### Astrology Features (COMPLETE - March 15, 2026)
- [x] Daily Horoscope tab with 12 zodiac signs (colorful symbols)
- [x] Horoscope prediction display with Lucky Number & Lucky Color
- [x] Birth Kundali tab with form (Date/Time, Birth Place dropdown)
- [x] Kundali Matching tab for marriage compatibility (Bride & Groom details)
- [x] Personalized horoscope on Home screen (based on user's nakshatra/DOB)
- [x] Profile completion prompt for users without DOB/nakshatra
- [x] Graceful API error handling (displays "Service Temporarily Unavailable")
- [x] Fallback horoscope data when Prokerala API unavailable
- [x] Backend integration with Prokerala API (needs valid credentials)

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

### P1.5 (Completed - March 15, 2026)
- [x] **Astrology Tab UI Complete**
  - [x] Daily Horoscope with 12 zodiac signs
  - [x] Birth Kundali form with date/time/location inputs
  - [x] Kundali Matching form for marriage compatibility
  - [x] **Prokerala API fully integrated with real credentials**
  - [x] Beautiful result displays for Kundali and Matching
  - [x] Mangal Dosha detection with exceptions
  - [x] Ashtakoot Milan with 8 aspects scoring
  - [x] **Consistent UI theme** (saffron/gold/cream matching rest of app)
  - [x] **Searchable location input** with India Post Pincode API
  - [x] 40+ major Indian cities with coordinates
  - [x] Pincode search returns post office names
- [x] **Personalized Horoscope on Home Screen**
  - [x] Shows horoscope when user has DOB/nakshatra in profile
  - [x] Profile completion prompt when user hasn't set up astrology details

### P1.6 (Completed - March 15, 2026)
- [x] **Mantras & Shlokas Section**
  - [x] "Today's Worship" - Shows deity based on day of week (e.g., Sunday = Surya)
  - [x] "By Deity" - Browse 11 deities with colored borders
  - [x] "All Mantras" - Search and filter 26+ mantras
  - [x] Sanskrit text with transliteration and meaning
  - [x] Benefits and best chanting time shown
  - [x] Free/Premium tier badges
  - [x] Stotras section (Hanuman Chalisa, etc.)
  - [x] Connected to devotional_content MongoDB database
  - [x] **Multi-language Translation** (English, Hindi, Telugu, Tamil, Kannada, Malayalam) - Works across ALL sections
  - [x] **Sarvam AI Text-to-Speech** - Integrated but has compatibility issues with some voices
  - [x] **Audio Library** - Internet Archive integration for streaming mantras/shlokas
    - Curated collection of 8 popular mantras (Gayatri, Hanuman Chalisa, Ganesh, Vishnu, Devi, Shiva)
    - **Simplified single-line list UI** with Play button, title, deity, Karaoke button, duration
    - Free text search to find any mantra/bhajan from millions of audio files
    - Audio player with play/pause controls and "Now Playing" bar
  - [x] **Karaoke Mode** - NEW! Whisper-powered synchronized lyrics
    - Click "🎤 Karaoke" button on any audio
    - Audio transcribed using OpenAI Whisper (via Emergent Universal Key)
    - Word-by-word highlighting as audio plays
    - Full transcription displayed at bottom
    - Play/Pause controls and close button

### P1.7 (Completed - March 15, 2026)
- [x] **Panchang & Festival Calendar**
  - [x] Today's Panchang with Tithi, Nakshatra, Yoga, Karana, Sunrise/Sunset
  - [x] Hindu month display (Phalguna, Chaitra, etc.)
  - [x] Vara (weekday) with ruling deity
  - [x] Upcoming Festivals list with days until each festival (22+ festivals)
  - [x] Monthly Calendar view with Tithi and Nakshatra for each day
  - [x] Navigation arrows to view any month
  - [x] Powered by Swiss Ephemeris (pyswisseph) for astronomical calculations

### P1.8 (Completed - March 15, 2026)
- [x] **Priest Dashboard - FULLY IMPLEMENTED**
  - [x] **Home Tab** - Analytics overview with cards
    - Total Bookings, Completed, Classes, Content Posts stats
    - Total Earnings and Monthly Earnings display
    - Today's Panchang quick view
    - Upcoming Festivals preview
    - Pending Booking Requests with Accept/Decline buttons
    - Upcoming Bookings list
  - [x] **Profile Tab** - Complete profile management
    - Profile photo and basic info
    - Bio/About Me section (editable)
    - Specializations selection (16 options)
    - Languages selection (10 options)
    - Work Locations management
    - Contact & Pricing settings (phone, email, base price, experience)
    - Verified Priest badge display
  - [x] **Bookings Tab** - Enhanced booking management
    - Search and filter bookings by status
    - Status tabs (All, Pending, Confirmed, Completed, Cancelled)
    - Accept/Decline/Complete actions
    - Booking details with location
  - [x] **Services Tab** - Full CRUD for services offered
    - Add/Edit/Delete services
    - Service details (name, description, category, duration, price)
    - Categories: Pooja, Homam, Ceremony, Consultation, Online
  - [x] **Reviews Tab** - View reviews from devotees
    - Rating summary with average score
    - Rating distribution chart (5★ to 1★)
    - Individual review cards with user, service, rating, comment
  - [x] **Portfolio Tab** - Media gallery
    - Add photos and videos
    - Image/Video URL support
    - Delete functionality
    - Grid gallery view
  - [x] **Panchang Tab** - Full panchang display
    - Today's Panchang (Tithi, Nakshatra, Yoga, Karana, Sunrise, Sunset)
    - Upcoming Festivals list with countdown
  - [x] **Earnings Tab** - Financial overview
    - Total Earnings, Monthly Earnings, Pending Payouts
    - Recent Transactions list
  - [x] **Classes Tab** - Spiritual class management
    - Add/Edit/Delete classes
    - Schedule management
  - [x] **Live Tab** - Stream management
    - Schedule streams
    - Go Live / End Stream
    - Past streams history
  - [x] **Backend APIs** - All endpoints working
    - Profile: GET/PUT /api/priest/profile
    - Reviews: GET /api/priest/reviews
    - Portfolio: GET/POST/DELETE /api/priest/portfolio
    - Services: GET/POST/PUT/DELETE /api/priest/services
    - Earnings: GET /api/priest/earnings
    - Plus all previous APIs (classes, availability, content, streams, analytics, bookings)

### P2 (Medium Priority)
- [ ] Astrologer/Shop Owner complete dashboards (Priest done!)
- [ ] Product reviews and ratings
- [ ] Search and filter improvements
- [ ] Image upload for products/priests

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
Backend: FastAPI, Motor (MongoDB async driver), Stripe SDK, Sarvam AI SDK
Database: MongoDB Atlas
Auth: Firebase Auth (Google + Email/Password)
Payments: Stripe (test keys active), Razorpay (placeholder)
TTS: Sarvam AI (Indian voices - Hindi, Telugu, Tamil, Kannada, Malayalam)
Translation: Google Translate API with MyMemory fallback
Mobile: React Native with Expo
Icons: Custom 3D animated SVGs
```

## Test Credentials
- **Admin**: admin@divineapp.com / admin123
- **Devotee**: devotee@divineapp.com / devotee123
- **Priest**: pandit.sharma@divineapp.com / priest123
- **Google Sign-In**: Any Google account

## Key Files
- `frontend/src/lib/firebase.js` - Firebase configuration and auth functions
- `frontend/src/contexts/AuthContext.js` - Auth context with Firebase + manual sync
- `frontend/src/contexts/PaymentContext.js` - IP-based payment gateway selection
- `frontend/src/components/PaymentComponents.js` - Stripe/Razorpay components
- `frontend/src/pages/AuthScreen.js` - Centered auth screens
- `frontend/src/pages/dashboards/PriestDashboard.js` - NEW: Complete Priest Dashboard with all features
- `backend/server.py` - Backend with Firebase sync + Stripe + Priest APIs (lines 1790-2145)
- `backend/config.py` - Configuration with Stripe keys
- `backend/tests/test_priest_dashboard.py` - NEW: Pytest tests for Priest Dashboard

## Preview URLs
- **Web App**: https://divine-priest-dash.preview.emergentagent.com
