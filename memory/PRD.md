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
- **Payments**: Stripe (real keys configured) + Razorpay (placeholder) - IP-based selection
- **Video Meetings**: 100ms Integration (IMPLEMENTED)
- **Horoscope**: Local calculation service
- **Design Theme**: Traditional warm (saffron, gold, maroon)
- **MVP Scope**: All core features together
- **Icons**: 3D animated SVG icons (NO EMOJIS)

## Architecture
- **Frontend**: React.js (mobile-first responsive)
- **Backend**: Python FastAPI
- **Database**: MongoDB Atlas (user's cloud instance)
- **Styling**: Tailwind CSS with custom traditional theme
- **Authentication**: Firebase Auth (email/password + Google Sign-In + Phone OTP)
- **Mobile**: React Native with Expo (project at `/app/mobile/`)
  - Expo SDK 55
  - React Navigation for navigation
  - Same API backend as web
  - Devotional splash screen with temple, diyas, Om symbol

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

## Backlog / Future Tasks 📋

### Completed ✅
1. ~~**Music Library Admin Management**~~ ✅ COMPLETED (March 17, 2026)
   - Audio Library with Play/Preview functionality
   - Now Playing bar with playback controls
   - Admin CRUD for audio items

2. ~~**Priest Reviews Display**~~ ✅ COMPLETED (March 17, 2026)
   - Reviews section on priest profile
   - Rating distribution chart
   - Individual review cards with ratings

3. ~~**Code Refactoring - Frontend**~~ ✅ COMPLETED (March 17, 2026)
   - Extracted `PriestDetailView` component (279 lines)
   - Extracted `AstrologyTab` component (510 lines)
   - DevoteeDashboard.js reduced from 5,411 to 4,318 lines

4. ~~**Code Refactoring - Backend**~~ ✅ COMPLETED (March 17, 2026)
   - Created `routes/admin_new.py` (530 lines)
   - Created `routes/auth_new.py` (316 lines)
   - Created `routes/priests_new.py` (204 lines)
   - Created `routes/bookings_new.py` (353 lines)
   - server.py reduced from 6,676 to 5,271 lines (-21%)

5. ~~**Class Enrollment Payments (P0)**~~ ✅ COMPLETED (March 17, 2026)
   - Integrated SmartPayment component for Stripe payments
   - Full payment flow for Vedic class enrollment

6. ~~**Edit/Delete Functionality (P1)**~~ ✅ COMPLETED (March 17, 2026)
   - Services: Edit/Delete already existed
   - Classes: Edit/Delete already existed
   - Live Streams: Added Edit/Delete buttons for scheduled streams

7. ~~**Booking Cancellation & Refunds (P1)**~~ ✅ COMPLETED (March 17, 2026)
   - Cancel button on pending/confirmed bookings
   - 24-hour refund policy: 100% if >24hrs, 50% if <24hrs, 0% after booking time
   - Cancellation preview modal showing refund amount
   - Backend endpoints for cancellation and preview

### Upcoming Tasks (P2+)
1. **Stripe Connect Integration (P2)**
   - Split payments between platform and service providers

2. **Continue Backend Refactoring (P2)**
   - Extract Shop/Marketplace routes
   - Extract Payment (Stripe) routes
   - Extract Astrology routes
   - Extract Priest Dashboard routes

3. **Continue Frontend Refactoring (P2)**
   - Extract remaining tabs from DevoteeDashboard.js
   - Refactor PriestDashboard.js

4. **YouTube Embedded Player (P3)**
   - Embed YouTube videos for mantras
   - Curated playlists for each category

5. **Mobile App (Expo) (P3)**
   - Fix Expo loading issue
   - Complete native app for App Store/Play Store

## What's Been Implemented

### Authentication (COMPLETE)
- [x] Firebase SDK installed and configured
- [x] Email/Password authentication (working)
- [x] Google Sign-In with popup (working - domain authorized)
- [x] Firebase user sync with backend MongoDB
- [x] Token-based API authentication
- [x] Centered, card-style auth screens on desktop
- [x] **First-time Google user onboarding screen** (NEW - March 15, 2026)
- [x] **Phone Number (OTP) Authentication** (NEW - March 15, 2026)
  - Email/Phone toggle on login and register screens
  - Firebase Phone Auth with invisible reCAPTCHA
  - +91 prefix for Indian phone numbers
  - 6-digit OTP verification flow
  - Role selection during phone registration
  - Backend support for phone-based users (auth_type field)

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

### P1 (High Priority) - COMPLETED (March 15, 2026)
- [x] **Complete Stripe Checkout Flow** - Full integration with redirect to Stripe payment page
- [x] Fixed cart display bug (images IndexError)
- [x] Payment confirmation endpoint
- [ ] Razorpay real keys integration (future)
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
  - [x] ~~Sarvam AI Text-to-Speech~~ - **REMOVED** (March 15, 2026) - User requested removal
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
- [x] **Comments & Likes Feature for Posts** (NEW)
  - [x] Like/unlike posts with heart icon toggle
  - [x] Comment on posts with text and/or images
  - [x] Comment image upload via /api/upload/image
  - [x] Delete own comments
  - [x] View comments for any post
  - [x] Like status check API
  - [x] Real-time like count updates
  - [x] Toast notifications for actions
  - [x] Backend APIs: POST/GET/DELETE /api/posts/{id}/comments, POST /api/posts/{id}/like, GET /api/posts/{id}/like-status
  - [x] PostCard component with full interaction support

- [x] **Dedicated Feed Tab** (NEW)
  - [x] "Spiritual Feed" tab added to desktop sidebar
  - [x] "Feed" tab added to mobile bottom navigation
  - [x] FeedTab component with paginated post loading
  - [x] "Load More" button for pagination
  - [x] Full PostCard support with likes/comments
  - [x] data-testid attributes for testing

- [x] **Real-Time Chat System** (NEW - March 15, 2026)
  - [x] WebSocket-based real-time messaging
  - [x] Text + Image message support
  - [x] Auto chat room creation when booking is confirmed
  - [x] Auto chat room deactivation when booking is completed/cancelled
  - [x] Chat room list with last message preview
  - [x] Unread message badges on Messages tab
  - [x] Desktop: Side-by-side chat layout
  - [x] Mobile: Full-screen chat view with back navigation
  - [x] Typing indicators
  - [x] Read receipts (double checkmarks)
  - [x] Date separators in chat history
  - [x] Messages tab in Devotee Dashboard (sidebar + bottom nav)
  - [x] Messages tab in Priest Dashboard (sidebar)
  - [x] Backend APIs: GET/POST /api/chat/rooms, messages, read, unread-count
  - [x] WebSocket endpoint: /ws/chat/{room_id}?token=JWT

- [x] **Video Consultation System with Per-Minute Billing** (NEW - March 15, 2026)
  - [x] 100ms integration for video calls
  - [x] User wallet system with recharge
  - [x] IP-based payment gateway selection (Razorpay for India, Stripe for others)
  - [x] Per-minute billing for astrologer consultations
  - [x] Free 5 minutes for new users (admin configurable)
  - [x] Low balance warning at ₹20 (admin configurable)
  - [x] 30-second grace period before disconnect (admin configurable)
  - [x] Auto-disconnect when wallet balance exhausted
  - [x] Admin dashboard for consultation settings
  - [x] Astrologer-specific pricing (each sets own rate)
  - [x] Astrologer availability toggle (online/offline)
  - [x] Call history for users and astrologers
  - [x] Transaction history
  - [x] Platform commission (20% default, admin configurable)
  - [x] Wallet UI with balance display and recharge
  - [x] "Call Astrologer" tab in Devotee Dashboard
  - [x] Backend APIs: wallet, consultation, astrologer profile
  - [x] WebSocket for real-time billing updates

- [x] **Astrologer Dashboard** (NEW - March 15, 2026)
  - [x] Dashboard home with performance overview
  - [x] Stats cards: Today's Earnings, Minutes, Week, Month
  - [x] Total Earnings card with consultations and minutes
  - [x] Call History tab with detailed call logs
  - [x] Earnings Report tab with Day/Week/Month filters
  - [x] Earnings Breakdown chart visualization
  - [x] Profile management with editable rate per minute
  - [x] Specializations and Languages management (add/remove)
  - [x] Online/Offline availability toggle
  - [x] Messages tab (shared ChatTab component)
  - [x] Role-based routing to AstrologerDashboard
  - [x] Backend APIs: dashboard, earnings, calls
  - [x] Responsive design for mobile and desktop

- [x] **Admin System Settings - Dynamic Configuration** (NEW - March 15, 2026)
  - [x] Secure management of all API keys from Admin Dashboard
  - [x] System Settings tab in Admin sidebar
  - [x] 7 configuration categories:
    - Video (100ms) - Access Key & Secret
    - Payment Gateway Keys - Stripe & Razorpay
    - Payment Settings - Gateway mode, currencies
    - Firebase - API Key, Auth Domain, Project ID
    - Branding - App name, tagline, support contact
    - Maintenance - Maintenance mode toggle, message
    - Notifications - Email/SMS/Push settings
  - [x] Encrypted storage for sensitive values (Fernet encryption)
  - [x] Masked display with eye toggle for secrets
  - [x] Dynamic credential loading from DB (with env fallback)
  - [x] Backend refactored: Stripe, Razorpay, 100ms use database config
  - [x] Public branding endpoint for app settings
  - [x] Backend APIs: GET/PUT /api/admin/system-config
  - [x] SystemSettingsAdmin component with collapsible categories

- [x] **Shop Owner Dashboard** (NEW - March 15, 2026)
  - [x] Dashboard Home - Revenue stats (today/monthly/total), pending orders, product count
  - [x] Recent Orders widget with status badges
  - [x] Top Selling Products widget with revenue
  - [x] Products Tab - Add/Edit/Delete products with full CRUD
  - [x] **Image Upload** - Up to 5 product images with preview and remove
  - [x] **Video Upload** - Optional product video with preview and remove
  - [x] Orders Tab - View all orders with status filters (All/Pending/Processing/Shipped/Delivered/Cancelled)
  - [x] Order Details modal - Customer info, shipping address, items, status update buttons
  - [x] Inventory Tab - Stock management with low stock alerts, inline editing
  - [x] Shop Profile Tab - Edit shop info, shipping cost, free shipping threshold
  - [x] Messages Tab - Chat with customers (shared ChatTab component)
  - [x] Backend APIs: /api/shop/dashboard, /api/shop/orders, /api/shop/inventory, /api/shop/profile

- [x] **E-commerce Checkout Flow** (NEW - March 15, 2026)
  - [x] Pooja Store with product grid, search, add to cart
  - [x] Cart button with badge showing item count
  - [x] My Orders link in store header
  - [x] Cart Sidebar - Slide-in cart with items, quantity controls, shipping breakdown
  - [x] Multi-step Checkout (Address → Payment → Confirm)
  - [x] Shipping Address form with name, phone, address, city, notes
  - [x] Payment Method selection (Stripe/Razorpay)
  - [x] Order Summary with per-shop shipping breakdown
  - [x] Shop-owner defined shipping cost with free shipping threshold
  - [x] Order Success page with order number and chat room notice
  - [x] My Orders page with order history and status tracking
  - [x] Order Detail page with full order information
  - [x] Auto-created chat room between customer and shop owner for each order
  - [x] Backend APIs: /api/checkout, /api/cart/summary, /api/orders/{id}
  - [x] File uploads: /api/upload/image, /api/upload/video

- [x] **Product Reviews & Ratings** (NEW - March 15, 2026)
  - [x] Verified purchase requirement - only customers who bought can review
  - [x] 1-5 star rating with visual star picker
  - [x] Written review with optional photo attachments
  - [x] Rating summary with distribution bar chart
  - [x] Mark reviews as helpful
  - [x] Edit/Delete own reviews
  - [x] Sort reviews by recent, helpful, rating
  - [x] Product rating auto-updates on new reviews
  - [x] Backend APIs: POST/GET /api/products/{id}/reviews, GET /api/products/{id}/can-review
  - [x] Frontend: ProductReviews component with WriteReviewModal
  - [x] **Product Detail Page** integrated into DevoteeDashboard ShopTab
    - [x] Full product info with images/video gallery
    - [x] Thumbnail image selector
    - [x] Quantity selector (+/-)
    - [x] Add to Cart button
    - [x] Stock status and low-stock warnings
    - [x] Integrated CustomerReviews section
    - [x] Back to Shop navigation

- [x] **Backend Refactoring** (March 15, 2026)
  - [x] Created modular routes directory structure
  - [x] Separated routes into: auth, users, shop, products, orders, cart, chat, admin, posts, uploads, reviews
  - [x] Each route file is self-contained with its own dependencies
  - [x] Maintains backward compatibility with existing API endpoints
  - [x] Easier to maintain and extend

- [x] **Priest Dashboard - FULLY IMPLEMENTED**
  - [x] **Home Tab** - Analytics overview with cards
    - Total Bookings, Completed, Classes, Content Posts stats
    - Total Earnings and Monthly Earnings display
    - Today's Panchang quick view
    - Upcoming Festivals preview
    - Pending Booking Requests with Accept/Decline buttons
    - Upcoming Bookings list
    - **Recent Posts preview** (NEW)
  - [x] **Profile Tab** - Complete profile management
    - **Profile photo upload with camera icon** (NEW)
    - Bio/About Me section (editable)
    - Specializations selection (16 options)
    - Languages selection (10 options)
    - Work Locations management
    - Contact & Pricing settings (phone, email, base price, experience)
    - Verified Priest badge display
  - [x] **Posts Tab** (NEW) - Daily updates for devotees
    - Create new posts with content and optional image
    - View existing posts with likes, comments, views
    - Delete posts functionality
    - Public feed available at /api/posts/feed
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
    - **Advanced scheduling with frequency options** (NEW):
      - One Time
      - Daily
      - Weekly (with day selection)
      - Bi-Weekly (with day selection)
      - Monthly
    - Schedule time picker
  - [x] **Live Tab** - Stream management
    - Schedule streams
    - Go Live / End Stream
    - Past streams history
  - [x] **Mobile Responsive Design** (NEW)
    - Bottom navigation bar: Home, Posts, Bookings, Profile, More
    - "More" menu popup with: Services, Reviews, Portfolio, Panchang, Earnings, Classes, Live
    - Compact mobile stats and cards
    - Touch-friendly navigation
  - [x] **Backend APIs** - All endpoints working
    - Profile: GET/PUT /api/priest/profile (with profile_photo field)
    - Reviews: GET /api/priest/reviews
    - Portfolio: GET/POST/DELETE /api/priest/portfolio
    - Services: GET/POST/PUT/DELETE /api/priest/services
    - Earnings: GET /api/priest/earnings
    - **Posts: GET/POST/DELETE /api/priest/posts** (NEW)
    - **Public Feed: GET /api/posts/feed** (NEW)
    - Plus all previous APIs (classes, availability, content, streams, analytics, bookings)

### P2 (Medium Priority)
- [ ] Astrologer/Shop Owner complete dashboards (Priest done!)
- [ ] Product reviews and ratings
- [ ] Search and filter improvements
- [ ] Image upload for products/priests

### P2.5 (React Native Mobile App - December 2025)
- [x] **Expo Project Setup** - `/app/mobile/` directory
- [x] **Same Design System** - Matching colors (saffron, gold, maroon, cream)
- [x] **Devotional Splash Screen** - Animated temple icon with diyas, Om symbol, floating particles
- [x] **Core Screens Implemented:**
  - [x] SplashScreen - Beautiful animated entrance with temple, diyas, Om symbols
  - [x] LoginScreen - Email/Password auth with role selection
  - [x] HomeScreen - Dashboard with quick actions, priests, products, festivals
  - [x] StoreScreen - Product grid with categories, search, filters
  - [x] CartScreen - Full cart management with quantity controls
  - [x] ProfileScreen - User profile with menu sections and logout
  - [x] AstrologyScreen - Zodiac signs, cosmic theme, astrologer cards
- [x] **Navigation** - Bottom tabs (Home, Store, Astrology, Profile) + Stack navigation
- [x] **Reusable Components:**
  - Button, GoldButton (gradient)
  - Input, SearchInput
  - ProductCard, PriestCard, FestivalCard, ServiceCard
- [x] **Context Providers:**
  - AuthContext - Login, register, logout, Firebase sync
  - CartContext - Add, update, remove, clear cart
- [x] **API Service** - Full API integration matching web backend
- [x] **Dependencies Installed:**
  - @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs
  - expo-linear-gradient, expo-font, @expo/vector-icons
  - react-native-reanimated, react-native-gesture-handler
  - react-native-svg, react-native-safe-area-context
  - expo-secure-store, expo-av, expo-image-picker
  - axios for API calls
- [ ] Phone authentication flow (to be ported from web)
- [ ] Google Sign-In integration
- [ ] Full checkout flow with Stripe
- [ ] Chat feature
- [ ] Video consultation
- [ ] Push notifications

### P3 (Future/Nice to Have)
- [ ] Complete mobile app feature parity with web
- [ ] App Store / Play Store deployment (requires Apple Developer & Google Play accounts)
- [ ] Push notifications integration
- [ ] Social sharing
- [ ] Referral system

## Tech Stack
```
Frontend: React 18, Tailwind CSS, Framer Motion, Firebase SDK
Backend: FastAPI, Motor (MongoDB async driver), Stripe SDK
Database: MongoDB Atlas
Auth: Firebase Auth (Google + Email/Password)
Payments: Stripe (test keys active), Razorpay (placeholder)
Translation: Google Translate API with MyMemory fallback
Mobile: React Native with Expo
Icons: Custom 3D animated SVGs
```

## Test Credentials
- **Admin**: admin@divineapp.com / admin123
- **Devotee**: devotee@test.com / test1234
- **Priest**: pandit.sharma@divineapp.com / priest123
- **Shop Owner**: shop@test.com / test1234
- **Google Sign-In**: Any Google account

## Backend Architecture (Modular Routes - March 15, 2026)
```
/app/backend/
├── server.py              # Main FastAPI app (includes routers)
├── routes/
│   ├── __init__.py        # Router exports
│   ├── auth.py            # Authentication (register, login, firebase-sync)
│   ├── users.py           # User profile management
│   ├── shop.py            # Shop owner dashboard APIs
│   ├── products.py        # Product listing/details
│   ├── orders.py          # Checkout and order management
│   ├── cart.py            # Shopping cart
│   ├── chat.py            # Real-time chat
│   ├── admin.py           # Admin dashboard & settings
│   ├── posts.py           # Social feed/posts
│   ├── uploads.py         # File uploads (image/video)
│   └── reviews.py         # Product reviews & ratings (NEW)
├── database.py            # MongoDB collections
├── models.py              # Pydantic models
├── auth.py                # JWT auth utilities
└── system_config.py       # Admin-editable config
```

## Key Files
- `frontend/src/lib/firebase.js` - Firebase configuration and auth functions
- `frontend/src/contexts/AuthContext.js` - Auth context with Firebase + manual sync
- `frontend/src/contexts/PaymentContext.js` - IP-based payment gateway selection
- `frontend/src/contexts/CartContext.js` - Cart state management with add/remove/update
- `frontend/src/components/PaymentComponents.js` - Stripe/Razorpay components
- `frontend/src/components/Chat/ChatTab.js` - Real-time chat UI components
- `frontend/src/components/Admin/SystemSettingsAdmin.js` - Admin system configuration UI
- `frontend/src/components/Checkout/CheckoutComponents.js` - Cart sidebar, Checkout flow, Orders pages (NEW)
- `frontend/src/pages/AuthScreen.js` - Centered auth screens
- `frontend/src/pages/dashboards/PriestDashboard.js` - Complete Priest Dashboard with all features
- `frontend/src/pages/dashboards/DevoteeDashboard.js` - Devotee Dashboard with Feed, Shop, Chat, Checkout
- `frontend/src/pages/dashboards/AdminDashboard.js` - Admin Dashboard with System Settings tab
- `frontend/src/pages/dashboards/ShopOwnerDashboard.js` - Complete Shop Owner Dashboard (NEW - March 15, 2026)
- `backend/server.py` - Backend with all APIs including shop owner dashboard and checkout
- `backend/system_config.py` - Encrypted admin-editable configuration system
- `backend/video_consultation.py` - 100ms integration with dynamic credentials
- `backend/models.py` - Pydantic models including ProductCreate with video_url
- `backend/config.py` - Configuration with Stripe keys
- `backend/database.py` - MongoDB collections including chat_rooms, chat_messages, system_config
- `backend/tests/test_priest_dashboard.py` - Pytest tests for Priest Dashboard
- `backend/tests/test_post_comments_likes.py` - Pytest tests for Comments & Likes feature
- `backend/tests/test_chat_feature.py` - Pytest tests for Chat feature
- `backend/tests/test_system_config.py` - Pytest tests for System Config APIs
- `backend/tests/test_shop_checkout.py` - Pytest tests for Shop Owner and Checkout APIs (NEW)
- `frontend/src/components/Reviews/ProductReviews.js` - Product reviews UI components (NEW)
- `backend/routes/reviews.py` - Product reviews API (NEW)

## Session Summary - March 17, 2026

### Completed Today ✅
1. **Auth Screen UI** - Falling flowers on sides, authentic Trishul icons
2. **Landing Page** - Falling flowers, removed duplicate testimonials
3. **Vedic Classes Tab** - Devotees can browse and view classes
4. **Live Events Tab** - Devotees can see live/upcoming streams
5. **Priest Filters** - Location, language, "Near Me" button
6. **Store Filters** - "Near Me" button for nearby stores
7. **Services Bug Fix** - Services now show from `priest_services_collection`
8. **Booking Bug Fix** - Booking creation now works with services
9. **Classes/Streams Bug Fix** - Fixed `isoformat()` error for date fields
10. **Backend Deployed** - Successfully to Cloud Run

### Pending for Tomorrow 🔴
1. **Chat Rooms Not Working** - Debug why chat is not showing after booking confirmation
2. **Class Payment Integration** - Add payment section for paid classes enrollment
3. **Live Streaming Notifications** - Enable notifications when priest goes live
4. **Class Slot Management**:
   - Priest sets available slots for each class
   - Enrollment decreases available slots
   - Show remaining slots to users
5. **Free/Paid Class Option**:
   - Priest can mark class as FREE or PAID
   - FREE: Direct enrollment
   - PAID: Requires payment before enrollment
6. **Edit Functionality**:
   - Edit classes (title, description, schedule, price)
   - Edit live streams (title, description, schedule)
   - Edit services (name, price, duration)
7. **Booking Cancellation**:
   - Devotee can cancel booking (at least 24 hours before)
   - Priest can cancel booking (at least 24 hours before)
   - Cancellation policy enforcement
8. **Refund Process**:
   - Automatic refund for cancellations within policy
   - Partial refund options
   - Refund to wallet or original payment method
9. **Stripe Connect - Payment Splitting** (Priority):
   - **Phase 1**: Priest/Vendor Stripe onboarding (connect bank account)
   - **Phase 2**: Auto-split payments (Platform fee % + Priest/Vendor share)
   - **Phase 3**: Payout dashboard for priests/vendors to see earnings
   - Admin can set platform fee percentage
   - Refunds deducted from priest/vendor share

### Deployment Status
- **Backend (Cloud Run):** ✅ Deployed - https://divine-backend-149993395431.us-central1.run.app
- **Frontend (Firebase):** ⚠️ Needs rebuild with correct backend URL
  - Update `frontend/.env`: `REACT_APP_BACKEND_URL=https://divine-backend-149993395431.us-central1.run.app`
  - Run: `npm run build && npx firebase-tools deploy --only hosting`

## Latest Updates (March 17, 2026)

### Priest Services Fix (BUG FIX)
- [x] **Fixed services not showing when booking** - Services from `priest_services_collection` are now fetched correctly
- [x] Added public endpoint `GET /api/priests/{priest_id}/services` for booking page
- [x] Priest list and detail APIs now include services from the separate collection

### Nearby/Location-Based Search (NEW)
- [x] **"Near Me" Button for Priests** - Uses browser geolocation to find priests in your city
- [x] **"Near Me" Button for Store** - Find stores/products near your location
- [x] Google Geocoding integration to convert coordinates to city name
- [x] Products API now supports `location` query parameter to filter by shop location

### Priest Filters Feature (NEW)
- [x] **Location/Zip Code Filter** - Search priests by city, state, or zip code
- [x] **Language Filter** - Filter priests by language (Hindi, Sanskrit, Tamil, Telugu, etc.)
- [x] **Enhanced Priest Cards** - Now show location and languages
- [x] **Collapsible Filter Panel** - Clean UI with filter badge showing active filters
- [x] **Clear Filters** - One-click to reset all filters
- [x] Backend API updated with `location` and `zipcode` query parameters

### Vedic Classes & Live Events Feature (NEW)
- [x] **Vedic Classes Tab** - Devotees can now browse and enroll in spiritual classes
  - Browse available classes with priest info, schedule, and pricing
  - View enrolled classes with meeting links
  - Filter between "Browse Classes" and "My Classes" views
- [x] **Live Events Tab** - Devotees can watch live spiritual streams
  - View currently live streams with "Watch Now" button
  - See upcoming scheduled streams
  - Live viewer count displayed
- [x] **New API Endpoints:**
  - `GET /api/classes` - List all public classes
  - `GET /api/classes/{id}` - Get class details  
  - `POST /api/classes/{id}/enroll` - Enroll in a class
  - `GET /api/live-streams` - List live and scheduled streams
  - `GET /api/my-enrollments` - Get user's enrolled classes
  - `GET /api/admin/priests` - Admin endpoint to view all priests (including unverified)

### Auth Screen UI Enhancements (COMPLETED)
- [x] **Falling Flowers Animation** - Beautiful multi-variety falling flowers:
  - Rose petals (soft pink) with gradient and shadow effects
  - Marigold flowers (orange/yellow) with detailed petal layers
  - Jasmine flowers (white) with 5-petal design
  - Hibiscus petals (red) with vein details
  - **Flowers only fall on LEFT and RIGHT sides** - not over the center form
- [x] **Authentic Trishul Icons** - Redesigned with:
  - Three-pronged design with proper proportions
  - Gold gradient fill with shine effects
  - Decorative bands on the shaft
  - Crescent moon decoration
  - Center jewel ornament
  - Multiple Trishuls at different positions (left and right)
- [x] **Other Devotional Elements** retained:
  - Om symbols (ॐ) with gentle floating animation
  - Diyas with animated flames
  - Temple bells with swinging motion
  - Lotus flowers
  - Swastika symbols
  - Kalash with decorative leaves

### Landing Page Fixes (COMPLETED)
- [x] **Removed duplicate testimonials section** - Only one testimonials section now (dynamic from DB)
- [x] **Added falling flowers animation** - Rose petals, marigolds, and jasmine flowers falling on left and right sides

## Chat Room Fix (March 17, 2026)
- [x] **Auto-heal inactive chat rooms** - Chat rooms that were incorrectly deactivated when bookings were completed are now automatically reactivated
- [x] **Root cause**: Old code deactivated chats on booking completion; new code only deactivates on cancellation
- [x] **Solution**: GET `/api/chat/rooms` now checks booking/order status and reactivates if not cancelled
- [x] **Backend fix in**: `/app/backend/server.py` - get_chat_rooms endpoint

## Preview URLs
- **Web App**: https://puja-connect-12.preview.emergentagent.com
- **Mobile App**: Run `npx expo start` from `/app/mobile/` and scan QR with Expo Go app

## Mobile App Structure (`/app/mobile/`)
```
/app/mobile/
├── App.js                     # Root component with providers
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── src/
    ├── components/            # Reusable UI components
    │   ├── Button.js          # Primary, secondary, gold buttons
    │   ├── Cards.js           # Product, Priest, Festival, Service cards
    │   └── Input.js           # Text input, search input
    ├── constants/
    │   └── theme.js           # Colors, fonts, sizes, gradients
    ├── contexts/
    │   ├── AuthContext.js     # Authentication state
    │   └── CartContext.js     # Shopping cart state
    ├── navigation/
    │   └── AppNavigator.js    # Tab + Stack navigation
    ├── screens/
    │   ├── SplashScreen.js    # Animated devotional splash
    │   ├── LoginScreen.js     # Auth with email/password
    │   ├── HomeScreen.js      # Dashboard home
    │   ├── StoreScreen.js     # Pooja store
    │   ├── CartScreen.js      # Shopping cart
    │   ├── ProfileScreen.js   # User profile
    │   └── AstrologyScreen.js # Astrology features
    └── services/
        └── api.js             # API client with all endpoints
```
