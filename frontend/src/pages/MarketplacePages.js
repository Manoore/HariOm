import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Search, Filter, Star, Plus, Minus, 
  ShoppingCart, Trash2, Loader2, ArrowRight, X
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Toaster, toast } from 'sonner';

export function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);

      const [productsRes, categoriesRes] = await Promise.all([
        api.get(`/api/products?${params.toString()}`),
        api.get('/api/product-categories')
      ]);

      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    const success = await addToCart(productId, 1);
    if (success) {
      toast.success('Added to cart!');
    } else {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-maroon mb-2">
            Pooja Marketplace
          </h1>
          <p className="text-gray-600">
            Quality pooja items delivered to your doorstep
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="card p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
                placeholder="Search products..."
                data-testid="search-products"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
                data-testid="filter-category"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-saffron animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => (
              <motion.div 
                key={product.id}
                className="card-product"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="aspect-square bg-gradient-to-br from-orange-50 to-cream rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-saffron/30" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2">{product.name}</h3>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span>{product.rating}</span>
                    <span className="text-gray-300">|</span>
                    <span>{product.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-saffron font-bold text-lg">₹{product.price}</span>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="bg-saffron hover:bg-saffron-dark text-white p-2 rounded-full transition-colors"
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No products found</p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategory(''); }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CartPage() {
  const { cart, updateCartItem, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  const handleQuantityChange = (productId, currentQty, change) => {
    const newQty = currentQty + change;
    updateCartItem(productId, newQty);
  };

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter shipping address');
      return;
    }

    setCheckoutLoading(true);
    try {
      // Create order
      const orderRes = await api.post('/api/orders', {
        items: cart.items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        shipping_address: shippingAddress,
        payment_method: 'razorpay'
      });

      // Create payment session
      const paymentRes = await api.post('/api/payments/create-checkout', {
        amount: cart.total,
        currency: 'INR',
        payment_type: 'order',
        reference_id: orderRes.data.order_id,
        payment_method: 'razorpay'
      });

      // Redirect to Stripe
      window.location.href = paymentRes.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-12 bg-gradient-to-b from-cream to-parchment">
      <Toaster position="top-center" richColors />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-cinzel text-3xl font-bold text-maroon mb-8">Your Cart</h1>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-saffron animate-spin" />
            </div>
          ) : cart.items.length === 0 ? (
            <div className="card p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-cinzel text-xl text-gray-600 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some products to get started</p>
              <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
                Browse Products <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart Items */}
              <div className="card divide-y divide-orange-100">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="p-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-saffron/30" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                      <p className="text-saffron font-bold">₹{item.price}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        data-testid={`decrease-${item.product_id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity, 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        data-testid={`increase-${item.product_id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-maroon">₹{item.subtotal}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold text-xl">₹{cart.total}</span>
                </div>
                <div className="flex justify-between items-center mb-6 text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>

                {!showCheckout ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="btn-primary w-full"
                    data-testid="proceed-checkout"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Address
                      </label>
                      <textarea
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="Enter your complete address"
                        data-testid="shipping-address"
                      />
                    </div>
                    <button
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                      data-testid="pay-now"
                    >
                      {checkoutLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Pay ₹{cart.total} <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                <button
                  onClick={clearCart}
                  className="w-full mt-4 text-red-500 hover:text-red-600 text-sm flex items-center justify-center gap-2"
                  data-testid="clear-cart"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
