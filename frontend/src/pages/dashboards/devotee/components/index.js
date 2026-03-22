// Devotee Dashboard Component Index
// This exports all modular components for the Devotee Dashboard

export { OmIcon, BellIcon3D, ZodiacIcon3D, TempleIcon3D, CartIcon3D, useIsDesktop } from './shared';
export { MobileHeader } from './MobileHeader';
export { Sidebar, BottomNav } from './Navigation';
export { PostCard, FeedTab } from './FeedTab';
export { ConsultationTab } from './ConsultationTab';
export { HomeTab } from './HomeTab';
export { ReviewModal } from './ReviewModal';

// The following components are still in the main DevoteeDashboard.js file
// They will be extracted in the next phase of refactoring
// For now, import them directly from the dashboard file if needed
