import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Edit, Trash, Loader2, Search, X, 
  Camera, Save, Play 
} from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../../../components/ui/ConfirmDialog';

const categories = [
  'Pooja Items', 'Idols & Statues', 'Books & Scriptures', 
  'Incense & Dhoop', 'Flowers & Garlands', 'Clothing', 'Accessories', 'Other'
];

export function ProductsTab({ isDesktop }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', stock: '', images: [], video_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

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
    const ok = await confirm({
      title: 'Delete Product?',
      message: 'This product will be permanently removed from your store.',
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!ok) return;
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

  const resetForm = () => {
    setShowForm(true);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: '', stock: '', images: [], video_url: '' });
  };

  return (
    <div className={`p-4 lg:p-8 pb-24 lg:pb-8`}>
      <ConfirmDialog />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-maroon">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} products in your store</p>
        </div>
        <button 
          onClick={resetForm}
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
