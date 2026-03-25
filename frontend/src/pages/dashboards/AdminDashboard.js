import React, { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster } from 'sonner';
import ConsultationSettingsAdmin from '../../components/Admin/ConsultationSettingsAdmin';
import SystemSettingsAdmin from '../../components/Admin/SystemSettingsAdmin';

// Import all admin components from the modular components folder
import {
  AdminSidebar,
  AdminBottomNav,
  OverviewTab,
  UsersTab,
  PriestsTab,
  ProductsTab,
  BookingsTab,
  VideoLibraryTab,
  ApprovalsTab,
  PujaTypesTab,
  AudioLibraryTab,
  FeedbackTab,
  ProfileTab,
  AdminManagementTab,
  SettingsTab,
  useIsDesktop
} from './admin/components';
import { SubcastesTab } from './admin/components/SubcastesTab';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [priests, setPriests] = useState([]);
  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, priestsRes, productsRes, bookingsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/priests'),
        api.get('/api/products'),
        api.get('/api/bookings')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setPriests(priestsRes.data.priests || []);
      setProducts(productsRes.data.products || []);
      setBookings(bookingsRes.data.bookings || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 ${isDesktop ? 'lg:pl-64' : ''}`}>
      <Toaster position="top-center" richColors />
      
      {isDesktop && <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />}

      {/* Header - Mobile Only */}
      {!isDesktop && (
        <div className="px-4 pt-8 pb-6">
          <p className="text-saffron-dark text-sm">Admin Dashboard</p>
          <h1 className="font-cinzel text-2xl font-bold text-gray-800">{user?.name || 'Admin'}</h1>
        </div>
      )}

      {/* Desktop Header */}
      {isDesktop && (
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <p className="text-saffron-dark text-sm">Admin Dashboard</p>
            <h1 className="font-cinzel text-2xl font-bold text-gray-800">{user?.name || 'Admin'}</h1>
          </div>
          <button className="w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-saffron hover:text-saffron-dark transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Content - Render active tab */}
      {activeTab === 'overview' && <OverviewTab stats={stats} users={users} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'approvals' && <ApprovalsTab isDesktop={isDesktop} />}
      {activeTab === 'users' && <UsersTab users={users} isDesktop={isDesktop} loading={loading} onRefresh={fetchData} />}
      {activeTab === 'priests' && <PriestsTab priests={priests} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'products' && <ProductsTab products={products} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'bookings' && <BookingsTab bookings={bookings} isDesktop={isDesktop} loading={loading} />}
      {activeTab === 'puja-types' && <PujaTypesTab isDesktop={isDesktop} />}
      {activeTab === 'subcastes' && <SubcastesTab isDesktop={isDesktop} />}
      {activeTab === 'audio-library' && <AudioLibraryTab isDesktop={isDesktop} />}
      {activeTab === 'video-library' && <VideoLibraryTab isDesktop={isDesktop} />}
      {activeTab === 'feedback' && <FeedbackTab isDesktop={isDesktop} />}
      {activeTab === 'admin-management' && user?.role === 'super_admin' && <AdminManagementTab isDesktop={isDesktop} />}
      {activeTab === 'consultation' && <ConsultationSettingsAdmin />}
      {activeTab === 'system' && <SystemSettingsAdmin />}
      {activeTab === 'app-settings' && <SettingsTab isDesktop={isDesktop} />}
      {activeTab === 'profile' && <ProfileTab isDesktop={isDesktop} user={user} onRefresh={fetchData} />}

      {/* Mobile Logout - shown only on overview */}
      {!isDesktop && activeTab === 'overview' && (
        <div className="px-4 mt-6 pb-24">
          <button 
            onClick={logout}
            className="w-full bg-red-500/20 rounded-xl p-4 flex items-center justify-center gap-2 text-red-400"
            data-testid="admin-logout"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {!isDesktop && <AdminBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
