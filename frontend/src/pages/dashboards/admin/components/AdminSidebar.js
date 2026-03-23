import React, { useState } from 'react';
import { 
  Users, Settings, LogOut, CheckCircle, UserCheck, Package, 
  Calendar, BookOpen, Music, Play, MessageSquare, Video, Key, User, Menu, X, ShoppingBag, FileText
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { OmIcon } from './shared';

// Sidebar Navigation for Desktop
export function AdminSidebar({ activeTab, setActiveTab, user }) {
  const { logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const tabs = [
    { id: 'overview', icon: OmIcon, label: 'Overview' },
    { id: 'approvals', icon: CheckCircle, label: 'Approvals' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'priests', icon: UserCheck, label: 'Priests' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'puja-types', icon: BookOpen, label: 'Puja Types' },
    { id: 'audio-library', icon: Music, label: 'Audio Library' },
    { id: 'video-library', icon: Play, label: 'Video Library' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback & Reviews' },
    ...(isSuperAdmin ? [{ id: 'admin-management', icon: Key, label: 'Admin Management' }] : []),
    { id: 'consultation', icon: Video, label: 'Consultation Settings' },
    { id: 'system', icon: Settings, label: 'System Settings' },
    { id: 'app-settings', icon: Settings, label: 'App Settings' },
    { id: 'profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-orange-50 to-amber-100 border-r border-orange-200 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <img 
            src="/temple-logo.png" 
            alt="Divine Logo" 
            className="w-10 h-10 rounded-lg object-cover"
          />
          <span className="font-cinzel text-xl font-bold text-gray-800">DIVINE</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-saffron/20 rounded-full flex items-center justify-center text-saffron-dark font-cinzel">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-saffron text-gray-800 shadow-md' 
                : 'text-gray-600 hover:bg-orange-100 hover:text-saffron-dark'
            }`}
            data-testid={`admin-sidebar-${tab.id}`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-orange-200">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          data-testid="admin-sidebar-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// Bottom Navigation for Mobile
export function AdminBottomNav({ activeTab, setActiveTab }) {
  const [showMore, setShowMore] = useState(false);
  
  const mainTabs = [
    { id: 'overview', icon: OmIcon, label: 'Home' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'priests', icon: UserCheck, label: 'Priests' },
    { id: 'more', icon: Menu, label: 'More', isMore: true },
  ];

  const moreTabs = [
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'content', icon: FileText, label: 'Content' },
    { id: 'system', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-orange-200 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-cinzel font-semibold text-maroon">More Options</h3>
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
                  <div className="w-12 h-12 bg-gradient-to-br from-saffron/10 to-gold/10 rounded-xl flex items-center justify-center mb-1">
                    <tab.icon className="w-6 h-6 text-saffron" />
                  </div>
                  <span className="text-xs text-gray-600 text-center leading-tight">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 px-2 py-2 z-50 lg:hidden shadow-lg">
        <div className="flex justify-around items-center">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.isMore ? setShowMore(!showMore) : setActiveTab(tab.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                tab.isMore && showMore ? 'text-saffron' :
                activeTab === tab.id && !tab.isMore ? 'text-saffron' : 'text-gray-500'
              }`}
              data-testid={`admin-nav-${tab.id}`}
            >
              <tab.icon className={`w-6 h-6 ${(activeTab === tab.id || (tab.isMore && showMore)) ? 'stroke-[2.5]' : ''}`} />
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
