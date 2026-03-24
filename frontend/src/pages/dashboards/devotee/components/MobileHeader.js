import React from 'react';
import { ArrowLeft } from 'lucide-react';
import NotificationBell from '../../../../components/NotificationBell';

// Mobile Header with Back Button
export function MobileHeader({ title, onBack, rightElement }) {
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between md:hidden">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-700 hover:text-saffron transition-colors"
        data-testid="mobile-back-btn"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>
      <h2 className="font-cinzel text-lg font-semibold text-maroon absolute left-1/2 -translate-x-1/2">
        {title}
      </h2>
      <div className="flex items-center gap-1">
        <NotificationBell />
        {rightElement && <div>{rightElement}</div>}
      </div>
    </div>
  );
}
