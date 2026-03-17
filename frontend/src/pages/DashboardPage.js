import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, ShoppingBag, Star, Clock, User, Settings,
  Package, Award, Users, TrendingUp, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertCircle, Shield, LogOut
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import AstrologerDashboard from './dashboards/AstrologerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

// Role display configuration
const ROLE_CONFIG = {
  priest: { label: 'Priest', color: 'bg-maroon', icon: Star },
  admin: { label: 'Admin', color: 'bg-purple-600', icon: Shield },
  super_admin: { label: 'Super Admin', color: 'bg-purple-800', icon: Shield },
  devotee: { label: 'Devotee', color: 'bg-saffron', icon: User },
  astrologer: { label: 'Astrologer', color: 'bg-indigo-600', icon: Star },
  shop_owner: { label: 'Shop Owner', color: 'bg-green-600', icon: ShoppingBag },
};

// Role Badge Component
function RoleBadge({ role, light = false }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.devotee;
  const Icon = config.icon;
  
  if (light) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
        <Icon className="w-3.5 h-3.5 text-gold" />
        <span className="text-xs font-medium text-white capitalize">{config.label}</span>
      </div>
    );
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 ${config.color} px-3 py-1 rounded-full`}>
      <Icon className="w-3.5 h-3.5 text-white" />
      <span className="text-xs font-medium text-white capitalize">{config.label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  // Route to appropriate dashboard based on role
  switch (user.role) {
    case 'admin':
    case 'super_admin':
      return <AdminDashboard />;
    case 'priest':
      return <PriestDashboard />;
    case 'astrologer':
      return <AstrologerDashboard />;
    case 'shop_owner':
      return <ShopOwnerDashboard />;
    default:
      return <DevoteeDashboard />;
  }
}

function DevoteeDashboard() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Show welcome toast on first load
  useEffect(() => {
    if (user && !welcomeShown) {
      const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.devotee;
      toast.success(`Welcome, ${user.name}!`, {
        description: `You're logged in as ${roleConfig.label}`,
        duration: 4000,
      });
      setWelcomeShown(true);
    }
  }, [user, welcomeShown]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, ordersRes] = await Promise.all([
        api.get('/api/bookings'),
        api.get('/api/orders')
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': case 'paid': case 'delivered': return 'bg-green-100 text-green-700';
      case 'confirmed': case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Welcome Section */}
          <div className="card p-6 mb-8 bg-gradient-to-r from-saffron to-gold text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-cinzel text-2xl font-bold mb-2">
                  Namaste, {user.name}!
                </h1>
                <p className="opacity-90 mb-3">Welcome to your spiritual dashboard</p>
                {/* Role Badge */}
                <RoleBadge role={user.role} light />
              </div>
              <button 
                onClick={logout}
                className="p-2 bg-white/20 rounded-full hover:bg-red-500/50 transition-colors"
                data-testid="logout-btn"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link to="/priests" className="card p-4 text-center hover:shadow-md transition-shadow" data-testid="quick-book-priest">
              <Star className="w-8 h-8 text-saffron mx-auto mb-2" />
              <span className="font-medium text-gray-700">Book Priest</span>
            </Link>
            <Link to="/astrology" className="card p-4 text-center hover:shadow-md transition-shadow" data-testid="quick-horoscope">
              <Calendar className="w-8 h-8 text-cosmic-accent mx-auto mb-2" />
              <span className="font-medium text-gray-700">Horoscope</span>
            </Link>
            <Link to="/marketplace" className="card p-4 text-center hover:shadow-md transition-shadow" data-testid="quick-shop">
              <ShoppingBag className="w-8 h-8 text-gold-dark mx-auto mb-2" />
              <span className="font-medium text-gray-700">Shop</span>
            </Link>
            <Link to="/festivals" className="card p-4 text-center hover:shadow-md transition-shadow" data-testid="quick-festivals">
              <Calendar className="w-8 h-8 text-maroon mx-auto mb-2" />
              <span className="font-medium text-gray-700">Festivals</span>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-saffron animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bookings */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-cinzel text-xl font-bold text-maroon">My Bookings</h2>
                  <Link to="/priests" className="text-saffron text-sm flex items-center gap-1">
                    Book New <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {bookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No bookings yet</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl">
                        <div className="w-12 h-12 bg-saffron rounded-full flex items-center justify-center text-white font-cinzel">
                          {booking.priest_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{booking.service_name}</p>
                          <p className="text-sm text-gray-500">{booking.priest_name}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Orders */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-cinzel text-xl font-bold text-maroon">My Orders</h2>
                  <Link to="/marketplace" className="text-saffron text-sm flex items-center gap-1">
                    Shop More <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No orders yet</p>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl">
                        <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800">Order #{order.id.slice(-6)}</p>
                          <p className="text-sm text-gray-500">₹{order.total_amount}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function PriestDashboard() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Show welcome toast on first load
  useEffect(() => {
    if (user && !welcomeShown) {
      const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.priest;
      toast.success(`Welcome, ${user.name}!`, {
        description: `You're logged in as ${roleConfig.label}`,
        duration: 4000,
      });
      setWelcomeShown(true);
    }
  }, [user, welcomeShown]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/api/priest/bookings');
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/api/bookings/${bookingId}/status?status=${status}`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card p-6 mb-8 bg-gradient-to-r from-maroon to-maroon-light text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-cinzel text-2xl font-bold mb-2">Priest Dashboard</h1>
                <p className="opacity-90 mb-3">Manage your bookings and services</p>
                <RoleBadge role={user?.role} light />
              </div>
              <button 
                onClick={logout}
                className="p-2 bg-white/20 rounded-full hover:bg-red-500/50 transition-colors"
                data-testid="logout-btn"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-saffron">{bookings.length}</p>
              <p className="text-gray-600 text-sm">Total Bookings</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
              <p className="text-gray-600 text-sm">Pending</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
              <p className="text-gray-600 text-sm">Confirmed</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
              <p className="text-gray-600 text-sm">Completed</p>
            </div>
          </div>

          {/* Bookings List */}
          <div className="card p-6">
            <h2 className="font-cinzel text-xl font-bold text-maroon mb-4">Booking Requests</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-saffron animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-4 bg-orange-50 rounded-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">{booking.service_name}</h3>
                        <p className="text-sm text-gray-600">
                          {booking.user_name} • {new Date(booking.booking_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">Type: {booking.booking_type}</p>
                        {booking.address && <p className="text-sm text-gray-500">Address: {booking.address}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="bg-green-500 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" /> Accept
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="bg-red-500 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" /> Decline
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm"
                          >
                            Mark Complete
                          </button>
                        )}
                        {['completed', 'cancelled'].includes(booking.status) && (
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {booking.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ShopOwnerDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Show welcome toast on first load
  useEffect(() => {
    if (user && !welcomeShown) {
      const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.shop_owner;
      toast.success(`Welcome, ${user.name}!`, {
        description: `You're logged in as ${roleConfig.label}`,
        duration: 4000,
      });
      setWelcomeShown(true);
    }
  }, [user, welcomeShown]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/shop/my-products');
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card p-6 mb-8 bg-gradient-to-r from-gold-dark to-gold text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-cinzel text-2xl font-bold mb-2">Shop Dashboard</h1>
                <p className="opacity-90 mb-3">Manage your products and orders</p>
                <RoleBadge role={user?.role} light />
              </div>
              <button 
                onClick={logout}
                className="p-2 bg-white/20 rounded-full hover:bg-red-500/50 transition-colors"
                data-testid="logout-btn"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-cinzel text-xl font-bold text-maroon mb-4">My Products</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-saffron animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No products yet. Add your first product!</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="card-product">
                    <div className="aspect-square bg-orange-50 rounded-xl mb-2 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-saffron/30" />
                    </div>
                    <h3 className="font-medium text-sm text-gray-800 truncate">{product.name}</h3>
                    <p className="text-saffron font-bold">₹{product.price}</p>
                    <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
