import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Plus, Settings, LogOut, ShoppingBag,
  Edit, Trash, Loader2, TrendingUp
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

export default function ShopOwnerDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/shop/my-products');
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-parchment pb-24">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gold-dark to-gold px-4 pt-8 pb-12">
        <p className="text-white/70 text-sm">Shop Dashboard</p>
        <h1 className="font-cinzel text-xl font-bold text-white">{user?.name}</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{products.length}</p>
            <p className="text-xs text-white/70">Products</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-white/70">Orders</p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-cinzel text-lg font-semibold text-maroon">My Products</h2>
            <button className="bg-saffron text-white rounded-full p-2">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-saffron animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No products yet</p>
              <button className="mt-3 bg-saffron text-white px-4 py-2 rounded-full text-sm">
                Add First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div key={product.id} className="border border-orange-100 rounded-xl p-3">
                  <div className="aspect-square bg-orange-50 rounded-lg mb-2 flex items-center justify-center">
                    <Package className="w-8 h-8 text-saffron/30" />
                  </div>
                  <p className="font-medium text-sm text-gray-800 truncate">{product.name}</p>
                  <p className="text-saffron font-bold">₹{product.price}</p>
                  <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-6">
        <button 
          onClick={logout}
          className="w-full bg-red-50 rounded-xl p-4 flex items-center justify-center gap-2 text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
