import React, { useState } from 'react';
import { 
  Sun, ShoppingBag, User, Calendar, Menu,
  LogOut, BookOpen, Play, Music, Rss, MessageSquare, Video, X, UserRoundCheck, Bell, Landmark
} from 'lucide-react';
import { useCart } from '../../../../contexts/CartContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { OmIcon } from './shared';
import NotificationBell from '../../../../components/NotificationBell';

// Sidebar Navigation for Desktop
export function Sidebar({ activeTab, setActiveTab, user, unreadMessages }) {
  const { cartCount } = useCart();
  const { logout } = useAuth();
  
  const tabs = [
    { id: 'home', icon: OmIcon, label: 'Home' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages },
    { id: 'consultation', icon: Video, label: 'Call Astrologer' },
    { id: 'classes', icon: BookOpen, label: 'Vedic Classes' },
    { id: 'live', icon: Play, label: 'Live Events' },
    { id: 'feed', icon: Rss, label: 'Spiritual Feed' },
    { id: 'mantras', icon: Music, label: 'Mantras & Shlokas' },
    { id: 'scriptures', icon: BookOpen, label: 'Sacred Scriptures' },
    { id: 'calendar', icon: Calendar, label: 'Festival Calendar' },
    { id: 'priests', icon: UserRoundCheck, label: 'Book Priests' },
    { id: 'temples', icon: Landmark, label: 'Temples' },
    { id: 'astrology', icon: Sun, label: 'Astrology' },
    { id: 'shop', icon: ShoppingBag, label: 'Pooja Store' },
    { id: 'profile', icon: User, label: 'My Account' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-orange-100 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/temple-logo.png" 
              alt="Divine Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <span className="font-cinzel text-xl font-bold text-maroon">DIVINE</span>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* User Info - Clickable to go to profile */}
      <button 
        onClick={() => setActiveTab('profile')}
        className="p-4 border-b border-orange-100 w-full text-left hover:bg-orange-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white font-cinzel">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800 hover:text-saffron transition-colors">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </button>

      {/* Navigation - scrollable if needed */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-saffron text-white' 
                : 'text-gray-600 hover:bg-orange-50'
            }`}
            data-testid={`sidebar-${tab.id}`}
          >
            <div className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.id === 'shop' && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              {tab.id === 'messages' && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout - always visible at bottom */}
      <div className="p-4 border-t border-orange-100 flex-shrink-0">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// Bottom Navigation Component for Mobile
export function BottomNav({ activeTab, setActiveTab, unreadMessages }) {
  const { cartCount } = useCart();
  const [showMore, setShowMore] = useState(false);
  
  const mainTabs = [
    { id: 'home', icon: OmIcon, label: 'Home' },
    { id: 'priests', icon: UserRoundCheck, label: 'Priests' },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'more', icon: Menu, label: 'More', isMore: true },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const moreTabs = [
    { id: 'consultation', icon: Video, label: 'Call Astrologer' },
    { id: 'classes', icon: BookOpen, label: 'Vedic Classes' },
    { id: 'live', icon: Play, label: 'Live Events' },
    { id: 'mantras', icon: Music, label: 'Mantras & Shlokas' },
    { id: 'scriptures', icon: BookOpen, label: 'Scriptures' },
    { id: 'temples', icon: Landmark, label: 'Temples' },
    { id: 'astrology', icon: Sun, label: 'Astrology' },
    { id: 'calendar', icon: Calendar, label: 'Festival Calendar' },
    { id: 'feed', icon: Rss, label: 'Spiritual Feed' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages },
  ];

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-orange-100 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-cinzel font-semibold text-maroon">More Services</h3>
              <button onClick={() => setShowMore(false)} className="p-1">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {moreTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowMore(false);
                  }}
                  className="flex flex-col items-center p-2 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-saffron/10 to-gold/10 rounded-xl flex items-center justify-center mb-1">
                      <tab.icon className="w-6 h-6 text-saffron" />
                    </div>
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 text-center leading-tight">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 px-2 py-2 z-50 lg:hidden">
      <div className="flex justify-around items-center">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.isMore ? setShowMore(!showMore) : setActiveTab(tab.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              tab.isMore && showMore ? 'text-saffron' : 
              activeTab === tab.id && !tab.isMore ? 'text-saffron' : 'text-gray-400'
            }`}
            data-testid={`nav-${tab.id}`}
          >
            <div className="relative">
              <tab.icon className={`w-6 h-6 ${(activeTab === tab.id || (tab.isMore && showMore)) ? 'stroke-[2.5]' : ''}`} />
              {tab.id === 'shop' && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-saffron text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className={`text-xs mt-1 ${(activeTab === tab.id || (tab.isMore && showMore)) ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
    </>
  );
}
