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

## Pending Issues (User Verification)
- P0: Blank screen on mobile/Safari (code-complete, needs Firebase deploy)
- P1: Mobile Google Sign-In (blocked by Safari fix)
- P1: GOOGLE_PLACES_API_KEY on Cloud Run
- P1: GitHub Actions APK build fails

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
