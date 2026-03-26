import React from 'react';
import { Package, ShoppingBag, MessageSquare, Store, DollarSign } from 'lucide-react';
import { OmIcon } from './shared';

export function BottomNav({ activeTab, setActiveTab, unreadMessages }) {
  const tabs = [
    { id: 'home', icon: OmIcon, label: 'Home' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'earnings', icon: DollarSign, label: 'Earnings' },
    { id: 'messages', icon: MessageSquare, label: 'Chat', badge: unreadMessages },
    { id: 'profile', icon: Store, label: 'Shop' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 px-2 py-2 z-50 lg:hidden">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-saffron' : 'text-gray-400'
            }`}
            data-testid={`nav-${tab.id}`}
          >
            <div className="relative">
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span className={`text-xs mt-1 ${activeTab === tab.id ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
