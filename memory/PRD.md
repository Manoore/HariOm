# Divine App - Product Requirements Document

## Original Problem Statement
Build "Divine App," a digital platform connecting users with Hindu spiritual services. Features include priest booking, astrology services, a spiritual e-commerce store, devotional content (mantras, audio, video), and live video/voice consultations.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + Python
- **Database**: MongoDB Atlas
- **Integrations**: Firebase (Auth/Hosting/FCM), Stripe, 100ms (Video), Google Places API, Resend (Email)

## User Roles
- **Devotee** (devotee@divineapp.com / devotee123)
- **Priest** (pandit.sharma@divineapp.com / priest123)
- **Astrologer** (astro.joshi@divineapp.com / astro123)
- **Shop Owner** (shop.poojamart@divineapp.com / shop123)
- **Admin** (admin@divine.com / admin123)

## Implemented Features

### Core Platform
- Multi-role authentication (JWT + Firebase Google Auth)
- Devotee, Priest, Astrologer, Shop Owner, Admin dashboards
- In-app notification system + Firebase Push Notifications (FCM V1)
- Mobile-responsive design with bottom nav + desktop sidebar

### My Activity Tab (Mar 25, 2026)
- Dedicated tab in sidebar (2nd position) and mobile bottom nav
- **Bookings sub-tab**: Full list with status filters, cancel buttons, review buttons
- **Orders sub-tab**: All store orders with item previews, delivery status
- **Call History sub-tab**: Astrology consultation history

### Priest Booking Notifications (Mar 25, 2026)
- Priests receive in-app + email + push on new bookings and cancellations
- Smart routing: only the other party gets notified on cancellation

### Dashboard Refactoring (Mar 25, 2026) - COMPLETED
- PriestDashboard: ~3200 → 377 lines + 10 components
- AstrologerDashboard: 949 → 252 lines + 7 components
- ShopOwnerDashboard: 1391 → 80 lines + 8 components

### Priest Cancel Booking (Mar 25, 2026) - FIXED
- Priest can now cancel confirmed bookings (Cancel button added)
- Styled in-app confirm dialog replaces all browser window.confirm() across entire app

### Styled Confirm Dialog (Mar 25, 2026) - COMPLETED
- Reusable `useConfirmDialog` hook in `/components/ui/ConfirmDialog.js`
- Replaces ALL window.confirm() calls in: StreamsTab, ServicesTab, ClassesTab, PostsTab, MiscTabs, ProductsTab, AdminManagementTab, PujaTypesTab, SubcastesTab, FeedbackTab, AudioLibraryTab, FeedTab, BookingsTab

### Live Stream Reminders (Mar 25, 2026) - FIXED
- When priest starts a stream, all users who set reminders get notified
- Reminders cleaned up after notification sent

### Other Features
- Temples section (268 temples), Subcaste management (126 subcastes)
- Stripe payments, E-commerce store, 100ms video calling
- Chat system, Panchang calendar, Scriptures library

## Bug Fixes (Mar 2026)
1. Math/Mutt dropdown empty → Fixed
2. Priest analytics 500 error → Fixed
3. Puja Type dropdown empty → Fixed
4. Astrologer redirect after call → Fixed
5. Duplicate notification bell → Fixed
6. Missing imports in priest components → Fixed
7. Priest not receiving booking notifications → Fixed
8. Priest can't cancel confirmed bookings → Fixed
9. Browser confirm dialogs instead of app modals → Fixed
10. Live stream reminders not notifying → Fixed
11. **P0: Cart & Checkout flow broken → Fixed (Mar 25, 2026)**
    - Root cause: CartSidebar and CheckoutPage called `/api/cart` instead of `/api/cart/summary`
    - Fix: Changed both API calls in `CheckoutComponents.js` to use `/api/cart/summary`
12. **Payment status always pending → Fixed (Mar 25, 2026)**
    - Root cause: Stripe webhook missing from `orders_new.py` (existed in dead `orders.py`)
    - Fix: Added `POST /api/webhooks/stripe` to `orders_new.py` with `checkout.session.completed` handler
    - Added `status_history` tracking to all order creation/updates
13. **Order tracking not visible → Fixed (Mar 25, 2026)**
    - Added 4-step tracking timeline (Order Placed → Payment Confirmed → Shipped → Delivered)
    - Shows dates, visual progress, tracking numbers, and cancelled status
14. **Notification bell inconsistent on mobile → Fixed (Mar 25, 2026)**
    - Added `NotificationBell` to: AstrologerDashboard mobile header, ShopOwnerDashboard mobile header, AdminDashboard mobile+desktop headers, PriestDashboard sticky nav bar + tablet header

## Pending Issues (User Verification)
- Blank screen on mobile/Safari (code-complete, needs Firebase deploy)
- Mobile Google Sign-In (blocked by Safari fix)
- GOOGLE_PLACES_API_KEY on Cloud Run
- GitHub Actions APK build fails

## Recent Additions (Mar 25, 2026)
### Razorpay Integration
- Dual payment gateway: Users can choose Razorpay (UPI/Net Banking) or Stripe (Cards) at checkout
- Razorpay order creation via REST API (not SDK)
- Payment verification with HMAC signature validation
- Stripe webhook for reliable server-side payment confirmation

### Admin-Configurable Payment Settings
- Platform Fee: Enable/disable, percentage or flat amount, configurable value
- GST: Enable/disable toggle (disabled by default, per Indian ₹20L threshold)
- When enabled: configurable percentage, GSTIN, GST on platform fee only option
- Auto-Confirm Delivery: Configurable days (default 7)
- Auto-Payout on Completion: Toggle for automatic provider payouts
- Fee Preview: Shows breakdown for ₹1000 sample order

### Payment Flow (Collect & Transfer Model)
1. Customer pays → Full amount to platform (Razorpay or Stripe)
2. Order delivered → Auto-confirmed after N days (admin-configurable)
3. Auto-payout → Provider share transferred (minus platform fee + GST if enabled)
4. Refunds/cancellations → Admin handles via dashboard

## Upcoming Tasks
- (P1) Razorpay Integration: Replace Stripe for UPI payouts
- (P1) CI/CD Pipeline: GitHub Actions → Cloud Run + Firebase
- (P1) Play Store TWA Setup
- (P2) Production data cleanup

## Future/Backlog
- Enable Astrologer & Shop Owner signups (multi-vendor)
- Scheduled push notification reminders for Vedic classes
- Phase 2 Live Streams (100ms HLS broadcasting)
- Temple section enhancements (AI images, maps, nearby temples)
- Provider Onboarding Guide
