import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Settings, LogOut, ShoppingBag, Home,
  Edit, Trash, Loader2, TrendingUp, DollarSign, BarChart3,
  AlertTriangle, Search, Filter, ChevronRight, X, Check,
  Truck, Clock, CheckCircle, XCircle, MessageSquare, Camera,
  Store, MapPin, Phone, Mail, Image as ImageIcon, Save, Play
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import ChatTab from '../../components/Chat/ChatTab';

// Check if desktop
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isDesktop;
};

// Sidebar for desktop
function Sidebar({ activeTab, setActiveTab, user, unreadMessages }) {
  const { logout } = useAuth();
  
  const tabs = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'inventory', icon: BarChart3, label: 'Inventory' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages },
    { id: 'profile', icon: Store, label: 'Shop Profile' },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-orange-100 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-saffron rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-cinzel text-xl font-bold text-maroon">Shop Owner</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-saffron to-gold rounded-full flex items-center justify-center text-white font-cinzel">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">Shop Owner</p>
          </div>
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
                ? 'bg-saffron text-white' 
                : 'text-gray-600 hover:bg-orange-50'
            }`}
            data-testid={`sidebar-${tab.id}`}
          >
            <div className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-orange-100">
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

// Bottom Navigation for Mobile
function BottomNav({ activeTab, setActiveTab, unreadMessages }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
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

// Dashboard Home Tab
function DashboardTab({ isDesktop }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/shop/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 mb-2">Shop Not Found</h3>
        <p className="text-gray-500">Please register your shop first.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8 ${isDesktop ? '' : ''}`}>
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's your shop overview</p>
      </div>

      {/* Stats Grid */}
      <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-8`}>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
          <DollarSign className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">₹{stats.stats.today_revenue?.toLocaleString() || 0}</p>
          <p className="text-sm opacity-80">Today's Revenue</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">₹{stats.stats.monthly_revenue?.toLocaleString() || 0}</p>
          <p className="text-sm opacity-80">This Month</p>
        </div>
        <div className="bg-gradient-to-br from-saffron to-orange-600 rounded-2xl p-4 text-white">
          <ShoppingBag className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.stats.pending_orders + stats.stats.processing_orders}</p>
          <p className="text-sm opacity-80">Pending Orders</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white">
          <Package className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.stats.total_products}</p>
          <p className="text-sm opacity-80">Products</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.stats.low_stock > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-800">{stats.stats.low_stock} products low on stock</p>
            <p className="text-sm text-red-600">Check inventory to restock items</p>
          </div>
        </div>
      )}

      <div className={`${isDesktop ? 'grid grid-cols-2 gap-8' : ''}`}>
        {/* Recent Orders */}
        <div className="mb-6">
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Recent Orders</h2>
          {stats.recent_orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-orange-50">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recent_orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-4 border border-orange-50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'paid' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{order.items_count} items</span>
                    <span className="font-semibold text-saffron">₹{order.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="mb-6">
          <h2 className="font-cinzel text-lg font-semibold text-maroon mb-4">Top Selling Products</h2>
          {stats.top_products.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-orange-50">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.top_products.map((product, idx) => (
                <div key={product.id} className="bg-white rounded-xl p-4 border border-orange-50 shadow-sm flex items-center gap-4">
                  <div className="w-8 h-8 bg-saffron/10 rounded-full flex items-center justify-center text-saffron font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sold} sold</p>
                  </div>
                  <p className="font-semibold text-green-600">₹{product.revenue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Products Tab
function ProductsTab({ isDesktop }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', stock: '', images: [], video_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const videoInputRef = React.useRef(null);

  const categories = [
    'Pooja Items', 'Idols & Statues', 'Books & Scriptures', 
    'Incense & Dhoop', 'Flowers & Garlands', 'Clothing', 'Accessories', 'Other'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/shop/my-products');
      setProducts(res.data.products || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages = [...formData.images];

    for (let i = 0; i < Math.min(files.length, 5 - newImages.length); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        continue;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        const res = await api.post('/api/upload/image', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newImages.push(res.data.url);
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }

    setFormData({ ...formData, images: newImages });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video size should be less than 50MB');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await api.post('/api/upload/video', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, video_url: res.data.url });
      toast.success('Video uploaded');
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const removeVideo = () => {
    setFormData({ ...formData, video_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };
      
      if (editingProduct) {
        await api.put(`/api/shop/products/${editingProduct.id}`, productData);
        toast.success('Product updated');
      } else {
        await api.post('/api/shop/products', productData);
        toast.success('Product added');
      }
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', images: [], video_url: '' });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      images: product.images || [],
      video_url: product.video_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/shop/products/${productId}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-maroon">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} products in your store</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setEditingProduct(null); setFormData({ name: '', description: '', price: '', category: '', stock: '', images: [], video_url: '' }); }}
          className="bg-saffron text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition-colors"
          data-testid="add-product-btn"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
        />
      </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-cinzel text-xl font-semibold text-maroon">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                    placeholder="e.g., Brass Ganesha Idol"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none resize-none"
                    placeholder="Describe your product..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                      min="1"
                      className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                      placeholder="999"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Stock *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      required
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Product Images Upload */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Product Images (up to 5)</label>
                  
                  {/* Image Previews */}
                  {formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-orange-100">
                          <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {formData.images.length < 5 && (
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="product-images"
                      />
                      <label
                        htmlFor="product-images"
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-orange-200 rounded-xl cursor-pointer hover:border-saffron hover:bg-orange-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-saffron" />
                            <span className="text-sm text-gray-500">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-5 h-5 text-saffron" />
                            <span className="text-sm text-gray-600">Upload Images</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Max 5MB per image. Supported: JPG, PNG, WebP</p>
                </div>

                {/* Product Video Upload */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Product Video (optional)</label>
                  
                  {formData.video_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-orange-100">
                      <video 
                        src={formData.video_url} 
                        className="w-full h-40 object-cover"
                        controls
                      />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm flex items-center gap-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="product-video"
                      />
                      <label
                        htmlFor="product-video"
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-orange-200 rounded-xl cursor-pointer hover:border-saffron hover:bg-orange-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-saffron" />
                            <span className="text-sm text-gray-500">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 text-saffron" />
                            <span className="text-sm text-gray-600">Upload Video</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Max 50MB. Supported: MP4, WebM, MOV</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-saffron text-white hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {editingProduct ? 'Update' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-orange-50">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No products yet</h3>
          <p className="text-gray-500 mb-4">Add your first product to start selling</p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-saffron text-white px-6 py-2 rounded-full"
          >
            Add Product
          </button>
        </div>
      ) : (
        <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-orange-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-orange-50 flex items-center justify-center">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-saffron/30" />
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                <div className="flex justify-between items-center">
                  <p className="font-bold text-saffron">₹{product.price}</p>
                  <p className={`text-xs px-2 py-1 rounded-full ${
                    product.stock === 0 ? 'bg-red-100 text-red-700' :
                    product.stock < 10 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {product.stock === 0 ? 'Out of stock' : `Stock: ${product.stock}`}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => handleEdit(product)}
                    className="flex-1 py-2 rounded-lg bg-orange-50 text-saffron text-sm hover:bg-orange-100 flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="py-2 px-3 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Orders Tab
function OrdersTab({ isDesktop }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statuses = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'paid', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' ? '/api/shop/orders' : `/api/shop/orders?status=${statusFilter}`;
      const res = await api.get(url);
      setOrders(res.data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Check className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Orders</h1>
        <p className="text-gray-500 text-sm">Manage and fulfill customer orders</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {statuses.map((status) => (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              statusFilter === status.id
                ? 'bg-saffron text-white'
                : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-cinzel text-xl font-semibold text-maroon">
                  Order #{selectedOrder.order_number}
                </h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Customer Info */}
              <div className="bg-orange-50 rounded-xl p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Customer Details</h3>
                <p className="text-sm text-gray-600">{selectedOrder.customer_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Shipping Address</h3>
                <p className="text-sm text-gray-600">{selectedOrder.shipping_address}</p>
              </div>

              {/* Items */}
              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Items ({selectedOrder.items.length})</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                      <p className="font-semibold">₹{item.subtotal}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-saffron text-lg">₹{selectedOrder.shop_total}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-3">Update Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'paid')}
                      className="py-2 px-4 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Processing
                    </button>
                  )}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid') && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'shipped')}
                      className="py-2 px-4 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" /> Mark Shipped
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'delivered')}
                      className="py-2 px-4 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Mark Delivered
                    </button>
                  )}
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                      className="py-2 px-4 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-orange-50">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-500">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full bg-white rounded-2xl p-4 border border-orange-50 shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">{order.customer_name}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'paid' ? 'bg-purple-100 text-purple-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {order.item_count} items • {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-saffron">₹{order.shop_total}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Inventory Tab
function InventoryTab({ isDesktop }) {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/api/shop/inventory');
      setInventory(res.data);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId) => {
    try {
      await api.put(`/api/shop/products/${productId}/stock`, { stock: parseInt(newStock) });
      toast.success('Stock updated');
      setEditingStock(null);
      fetchInventory();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Inventory</h1>
        <p className="text-gray-500 text-sm">Manage your product stock levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-orange-50 text-center">
          <p className="text-2xl font-bold text-gray-800">{inventory?.total || 0}</p>
          <p className="text-sm text-gray-500">Total Products</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
          <p className="text-2xl font-bold text-yellow-700">{inventory?.low_stock_count || 0}</p>
          <p className="text-sm text-yellow-600">Low Stock</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
          <p className="text-2xl font-bold text-red-700">{inventory?.out_of_stock_count || 0}</p>
          <p className="text-sm text-red-600">Out of Stock</p>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-2xl border border-orange-50 overflow-hidden">
        <div className="p-4 bg-orange-50 border-b border-orange-100">
          <h3 className="font-medium text-maroon">All Products (sorted by stock)</h3>
        </div>
        <div className="divide-y divide-orange-50">
          {inventory?.products?.map((product) => (
            <div key={product.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-6 h-6 text-saffron/30" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category} • ₹{product.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {editingStock === product.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-20 px-3 py-2 rounded-lg border border-orange-200 text-center"
                      autoFocus
                    />
                    <button 
                      onClick={() => updateStock(product.id)}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingStock(null)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.is_out_of_stock ? 'bg-red-100 text-red-700' :
                      product.is_low_stock ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {product.stock} in stock
                    </span>
                    <button 
                      onClick={() => { setEditingStock(product.id); setNewStock(product.stock.toString()); }}
                      className="p-2 bg-orange-50 text-saffron rounded-lg hover:bg-orange-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Shop Profile Tab
function ShopProfileTab({ isDesktop }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/shop/profile');
      setProfile(res.data);
      setFormData(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/shop/profile', formData);
      toast.success('Profile updated');
      setProfile(formData);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 lg:p-8 text-center py-12">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 mb-2">Shop Not Registered</h3>
        <p className="text-gray-500">Please register your shop first.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <div className="mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-maroon">Shop Profile</h1>
        <p className="text-gray-500 text-sm">Manage your shop information and settings</p>
      </div>

      <div className={`${isDesktop ? 'max-w-2xl' : ''}`}>
        <div className="bg-white rounded-2xl border border-orange-50 p-6 space-y-6">
          {/* Shop Name */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Shop Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none resize-none"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Address</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">City</label>
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
            />
          </div>

          {/* Shipping Settings */}
          <div className="pt-4 border-t border-orange-100">
            <h3 className="font-medium text-maroon mb-4">Shipping Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Shipping Cost (₹)</label>
                <input
                  type="number"
                  value={formData.shipping_cost || 50}
                  onChange={(e) => setFormData({...formData, shipping_cost: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Free Shipping Above (₹)</label>
                <input
                  type="number"
                  value={formData.free_shipping_above || 0}
                  onChange={(e) => setFormData({...formData, free_shipping_above: parseInt(e.target.value)})}
                  placeholder="0 = No free shipping"
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:ring-2 focus:ring-saffron/50 focus:border-saffron outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Set "Free Shipping Above" to 0 to disable free shipping
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-saffron text-white hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function ShopOwnerDashboard() {
  const { user, logout } = useAuth();
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
