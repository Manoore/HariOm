import React from 'react';
import { Phone, IndianRupee, MessageSquare, User } from 'lucide-react';
import { OmIcon } from './shared';

export function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', icon: OmIcon, label: 'Home' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'earnings', icon: IndianRupee, label: 'Earnings' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-purple-100 px-2 py-2 z-50 lg:hidden">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-purple-600' : 'text-gray-400'
            }`}
            data-testid={`nav-${tab.id}`}
          >
            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-xs mt-1 ${activeTab === tab.id ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
