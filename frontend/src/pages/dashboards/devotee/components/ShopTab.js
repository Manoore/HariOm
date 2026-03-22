import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ShoppingCart, Plus, Minus, X, Loader2, ChevronRight, Star,
  MapPin, ShoppingBag
} from 'lucide-react';
import { useCart } from '../../../../contexts/CartContext';
import api from '../../../../lib/api';
import { toast } from 'sonner';

function ShopTab({ isDesktop, ProductDetailView }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [nearbyMode, setNearbyMode] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [view, setView] = useState('shop'); // shop, product-detail, checkout, success, orders, order-detail
  const [orderData, setOrderData] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const { addToCart, cartCount } = useCart();

  // Lazy load checkout components
  const [CheckoutComponents, setCheckoutComponents] = useState(null);
  // Lazy load reviews components
  const [ReviewComponents, setReviewComponents] = useState(null);
  
  useEffect(() => {
    import('../../../../components/Checkout/CheckoutComponents').then(module => {
      setCheckoutComponents(module);
    });
    import('../../../../components/Reviews/ProductReviews').then(module => {
      setReviewComponents(module);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [locationFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (locationFilter) params.append('location', locationFilter);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/api/products${queryString}`);
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNearbyProducts = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      setNearbyMode(true);
      
      try {
        const geocodeRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_PLACES_API_KEY || 'AIzaSyBr3qP19Vxsv5jeLxccsM0OfK3DWssPTVQ'}`
        );
        const geocodeData = await geocodeRes.json();
        
        if (geocodeData.results && geocodeData.results[0]) {
          const addressComponents = geocodeData.results[0].address_components;
          const city = addressComponents.find(c => c.types.includes('locality'))?.long_name;
          const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
          
          if (city) {
            setLocationFilter(city);
            toast.success(`Showing stores near ${city}`);
          } else if (state) {
            setLocationFilter(state);
            toast.success(`Showing stores in ${state}`);
          }
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        toast.error('Could not determine your city');
      }
    } catch (error) {
      console.error('Location error:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location in your browser settings.');
      } else {
        toast.error('Could not get your location');
      }
      setNearbyMode(false);
    } finally {
      setGettingLocation(false);
    }
  };

  const clearLocationFilter = () => {
    setLocationFilter('');
    setNearbyMode(false);
  };

  const handleAddToCart = async (productId) => {
    const success = await addToCart(productId, 1);
    if (success) {
      toast.success('Added to cart!');
    } else {
      toast.error('Failed to add');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle different views
  if (CheckoutComponents && view === 'checkout') {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
        <CheckoutComponents.CheckoutPage 
          onBack={() => setView('shop')} 
          onComplete={(data) => {
            setOrderData(data);
            setView('success');
          }}
        />
      </div>
    );
  }

  if (CheckoutComponents && view === 'success' && orderData) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
        <CheckoutComponents.OrderSuccessPage 
          orderData={orderData}
          onContinue={() => {
            setOrderData(null);
            setView('shop');
          }}
          onViewOrders={() => setView('orders')}
        />
      </div>
    );
  }

  if (CheckoutComponents && view === 'orders') {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
        <CheckoutComponents.MyOrdersPage 
          onBack={() => setView('shop')}
          onViewOrder={(orderId) => {
            setSelectedOrderId(orderId);
            setView('order-detail');
          }}
        />
      </div>
    );
  }

  if (CheckoutComponents && view === 'order-detail' && selectedOrderId) {
    return (
      <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
        <CheckoutComponents.OrderDetailPage 
          orderId={selectedOrderId}
          onBack={() => setView('orders')}
        />
      </div>
    );
  }

  // Product Detail View
  if (view === 'product-detail' && selectedProductId) {
    const selectedProduct = products.find(p => p.id === selectedProductId);
    
    return (
      <ProductDetailView 
        product={selectedProduct}
        productId={selectedProductId}
        isDesktop={isDesktop}
        onBack={() => {
          setSelectedProductId(null);
          setView('shop');
        }}
        onAddToCart={handleAddToCart}
        ReviewComponents={ReviewComponents}
        cartCount={cartCount}
        onOpenCart={() => setShowCart(true)}
      />
    );
  }

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      {/* Cart Sidebar */}
      {CheckoutComponents && (
        <CheckoutComponents.CartSidebar 
          isOpen={showCart} 
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setView('checkout');
          }}
        />
      )}

      <div className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-maroon">Pooja Store</h1>
          <div className="flex items-center gap-3">
            {/* Near Me Button */}
            <button
              onClick={getNearbyProducts}
              disabled={gettingLocation}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-all ${
                nearbyMode
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-600 border-orange-200 hover:border-green-500 hover:text-green-600'
              }`}
            >
              {gettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Near Me</span>
            </button>
            <button
              onClick={() => setView('orders')}
              className="text-sm text-saffron hover:underline"
              data-testid="my-orders-link"
            >
              My Orders
            </button>
            <button 
              onClick={() => setShowCart(true)}
              className="relative p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
              data-testid="cart-button"
            >
              <ShoppingCart className="w-6 h-6 text-saffron" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Location Filter Display */}
        {locationFilter && (
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <MapPin className="w-3 h-3" />
              Stores near {locationFilter}
              <button onClick={clearLocationFilter} className="ml-1 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
        
        {/* Search */}
        <div className={`relative ${isDesktop ? 'max-w-md' : ''}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-white border border-orange-100 rounded-xl pl-12 pr-4 py-3 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : (
        <div className={`grid ${isDesktop ? 'grid-cols-4 xl:grid-cols-5 gap-6' : 'grid-cols-2 gap-3'}`}>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm border border-orange-50 hover:shadow-md transition-shadow cursor-pointer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                setSelectedProductId(product.id);
                setView('product-detail');
              }}
              data-testid={`product-card-${product.id}`}
            >
              <div className={`aspect-square bg-orange-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden`}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <ShoppingBag className="w-10 h-10 text-saffron/30" />
                )}
              </div>
              <p className={`font-medium ${isDesktop ? 'text-base' : 'text-sm'} text-gray-800 line-clamp-2 mb-1`}>{product.name}</p>
              <p className="text-xs text-gray-500 mb-1">{product.shop_name}</p>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-gold fill-gold" />
                <span className="text-xs text-gray-500">{product.rating || 0}</span>
                <span className="text-xs text-gray-400">({product.total_reviews || 0})</span>
                {product.stock < 10 && product.stock > 0 && (
                  <span className="text-xs text-amber-600 ml-auto">Only {product.stock} left</span>
                )}
                {product.stock === 0 && (
                  <span className="text-xs text-red-500 ml-auto">Out of stock</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-saffron font-bold">₹{product.price}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product.id);
                  }}
                  disabled={product.stock === 0}
                  className="w-8 h-8 lg:w-10 lg:h-10 bg-saffron hover:bg-saffron-dark text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid={`add-to-cart-${product.id}`}
                >
                  <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export { ShopTab };
