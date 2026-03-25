import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster } from 'sonner';
import api from '../../lib/api';
import ChatTab from '../../components/Chat/ChatTab';

import { useIsDesktop } from './shopowner/components/shared';
import { Sidebar } from './shopowner/components/Sidebar';
import { BottomNav } from './shopowner/components/BottomNav';
import { DashboardTab } from './shopowner/components/DashboardTab';
import { ProductsTab } from './shopowner/components/ProductsTab';
import { OrdersTab } from './shopowner/components/OrdersTab';
import { InventoryTab } from './shopowner/components/InventoryTab';
import { ShopProfileTab } from './shopowner/components/ShopProfileTab';

export default function ShopOwnerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/chat/unread-count');
      setUnreadMessages(res.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardTab isDesktop={isDesktop} />;
      case 'products':
        return <ProductsTab isDesktop={isDesktop} />;
      case 'orders':
        return <OrdersTab isDesktop={isDesktop} />;
      case 'inventory':
        return <InventoryTab isDesktop={isDesktop} />;
      case 'messages':
        return <ChatTab isDesktop={isDesktop} />;
      case 'profile':
        return <ShopProfileTab isDesktop={isDesktop} />;
      default:
        return <DashboardTab isDesktop={isDesktop} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      
      {isDesktop && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user}
          unreadMessages={unreadMessages}
        />
      )}
      
      <div className={isDesktop ? 'ml-64' : ''}>
        {renderContent()}
      </div>
      
      {!isDesktop && (
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          unreadMessages={unreadMessages}
        />
      )}
    </div>
  );
}
