import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Sun, Moon, Sunrise, Sunset, IndianRupee, TrendingUp, Calendar, Upload, Image, Trash2, X, Loader2, Camera, Plus, CalendarDays } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../../../components/ui/ConfirmDialog';

function ReviewsTab({ reviews }) {
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-lg font-semibold text-maroon">Reviews</h2>
      <div className="bg-white rounded-xl p-6 text-center">
        <p className="text-4xl font-bold text-maroon">{avgRating}</p>
        <div className="flex justify-center gap-1 my-2">{[1,2,3,4,5].map(s => <Star key={s} className={`w-5 h-5 ${s <= Math.round(parseFloat(avgRating)) ? 'text-gold fill-gold' : 'text-gray-300'}`} />)}</div>
        <p className="text-gray-500">{reviews.length} reviews</p>
      </div>
      {reviews.length === 0 ? <p className="text-center text-gray-400 py-8">No reviews yet</p> : (
        <div className="space-y-3">{reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-4">
            <div className="flex justify-between"><span className="font-medium">{r.user_name}</span><div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-gold fill-gold' : 'text-gray-300'}`} />)}</div></div>
            <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
          </div>
        ))}</div>
      )}
    </div>
  );
}


function PortfolioTab({ portfolio, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', type: 'image', url: '' });
  const fileInputRef = useRef(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image or video file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewItem({ 
        ...newItem, 
        url: response.data.url,
        type: file.type.startsWith('video') ? 'video' : 'image'
      });
      toast.success('File uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.url) {
      toast.error('Please upload an image or video');
      return;
    }

    try {
      await api.post('/api/priest/portfolio', {
        title: newItem.title || 'Untitled',
        description: newItem.description,
        type: newItem.type,
        url: newItem.url
      });
      toast.success('Portfolio item added!');
      setNewItem({ title: '', description: '', type: 'image', url: '' });
      setShowModal(false);
      onRefresh();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleDelete = async (itemId) => {
    const ok = await confirm({
      title: 'Delete Portfolio Item?',
      message: 'This item will be permanently removed from your portfolio.',
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await api.delete(`/api/priest/portfolio/${itemId}`);
      toast.success('Item deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-semibold text-maroon">Portfolio</h2>
        <button 
          type="button"
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm hover:bg-saffron/90 active:scale-95 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" /> Add
        </button>
      </div>
      {portfolio.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No portfolio items</p>
          <p className="text-sm text-gray-300 mt-1">Add photos and videos of your work</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {portfolio.map(p => (
            <div key={p.id} className="aspect-square rounded-xl bg-gray-100 overflow-hidden relative group">
              {p.type === 'video' ? (
                <video src={p.url} className="w-full h-full object-cover" />
              ) : (
                <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {p.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs truncate">{p.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Portfolio Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-cinzel text-lg font-semibold text-maroon">Add Portfolio Item</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image/Video*</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                  className="hidden"
                />
                
                {newItem.url ? (
                  <div className="relative">
                    {newItem.type === 'video' ? (
                      <video src={newItem.url} className="w-full h-48 object-cover rounded-xl" controls />
                    ) : (
                      <img src={newItem.url} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    )}
                    <button
                      onClick={() => setNewItem({ ...newItem, url: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-saffron hover:bg-orange-50 transition-colors flex flex-col items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload</span>
                        <span className="text-xs text-gray-400">Images or Videos (max 10MB)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="e.g., Satyanarayan Pooja at Mumbai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  placeholder="Add details about this work..."
                />
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.url || uploading}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add to Portfolio
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


function PanchangTab({ panchang, festivals }) {
  const getPanchangValue = (v, f = '') => { if (!v) return f; if (typeof v === 'string') return v; if (typeof v === 'object') return v.name || v.value || f; return String(v); };
  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-lg font-semibold text-maroon">Panchang & Calendar</h2>
      <div className="bg-white rounded-xl p-4 md:p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Sun className="w-5 h-5 text-saffron" /> Today's Panchang</h3>
        {panchang ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[{l:'Tithi',v:panchang.tithi},{l:'Nakshatra',v:panchang.nakshatra},{l:'Yoga',v:panchang.yoga},{l:'Karana',v:panchang.karana},{l:'Sunrise',v:panchang.sunrise},{l:'Sunset',v:panchang.sunset}].map((i,idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">{i.l}</p><p className="font-medium">{getPanchangValue(i.v, '--')}</p></div>
            ))}
          </div>
        ) : <p className="text-center text-gray-400 py-4">Loading...</p>}
      </div>
      <div className="bg-white rounded-xl p-4 md:p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-saffron" /> Upcoming Festivals</h3>
        <div className="space-y-2">{festivals.slice(0,10).map((f,i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
            <div><p className="font-medium">{f.name}</p><p className="text-sm text-gray-500">{f.date}</p></div>
            {f.days_until !== undefined && <span className={`px-3 py-1 rounded-full text-sm ${f.days_until === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{f.days_until === 0 ? 'Today!' : `${f.days_until} days`}</span>}
          </div>
        ))}</div>
      </div>
    </div>
  );
}

function EarningsTab({ earnings, analytics }) {
  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-lg font-semibold text-maroon">Earnings</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white"><p className="text-sm opacity-80">Total</p><p className="text-2xl font-bold">₹{earnings?.total_earnings || analytics?.stats?.total_earnings || 0}</p></div>
        <div className="bg-gradient-to-br from-saffron to-orange-500 rounded-xl p-4 text-white"><p className="text-sm opacity-80">This Month</p><p className="text-2xl font-bold">₹{earnings?.monthly_earnings || analytics?.stats?.monthly_earnings || 0}</p></div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white"><p className="text-sm opacity-80">Pending</p><p className="text-2xl font-bold">₹{earnings?.pending_payouts || 0}</p></div>
      </div>
      <div className="bg-white rounded-xl p-4"><h3 className="font-semibold mb-4">Recent Transactions</h3>
        {(!earnings?.transactions || earnings.transactions.length === 0) ? <p className="text-center text-gray-400 py-8">No transactions</p> : (
          <div className="space-y-2">{earnings.transactions.slice(0,10).map((t,i) => (
            <div key={i} className="flex justify-between p-3 border border-gray-100 rounded-xl">
              <div><p className="font-medium">{t.description}</p><p className="text-xs text-gray-400">{t.date}</p></div>
              <p className="font-bold text-green-600">+₹{t.amount}</p>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}


export { ReviewsTab, PortfolioTab, PanchangTab, EarningsTab };
