import React, { useState, useEffect } from 'react';
import { Package, Loader2, Edit, Check, X } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function InventoryTab({ isDesktop }) {
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
                  <p className="text-xs text-gray-500">{product.category} - ₹{product.price}</p>
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
