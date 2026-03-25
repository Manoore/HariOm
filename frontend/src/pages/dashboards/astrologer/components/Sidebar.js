import React from 'react';
import { Phone, IndianRupee, MessageSquare, User, LogOut } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { OmIcon } from './shared';

export function Sidebar({ activeTab, setActiveTab, user, isAvailable, onToggleAvailability }) {
  const { logout } = useAuth();
  
  const tabs = [
    { id: 'home', icon: OmIcon, label: 'Dashboard' },
    { id: 'calls', icon: Phone, label: 'Call History' },
    { id: 'earnings', icon: IndianRupee, label: 'Earnings' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-purple-100 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <img 
            src="/temple-logo.png" 
            alt="Divine Logo" 
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <h1 className="font-cinzel text-xl font-bold text-purple-900">DIVINE</h1>
            <p className="text-xs text-purple-500">Astrologer Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-purple-600">{user?.name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{user?.name || 'Astrologer'}</p>
            <p className="text-xs text-gray-500">Astrologer</p>
          </div>
        </div>
        
        {/* Availability Toggle */}
        <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            ) : (
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
            )}
            <span className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
              {isAvailable ? 'Online' : 'Offline'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={onToggleAvailability}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-600 hover:bg-purple-50'
            }`}
            data-testid={`sidebar-${tab.id}`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-purple-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
