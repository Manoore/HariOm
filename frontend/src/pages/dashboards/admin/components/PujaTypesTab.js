import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Edit2, Trash2, Loader2, Check, X } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

const PUJA_CATEGORIES = [
  'Deity Puja', 'Festival Puja', 'Samskara', 'Griha Puja', 'Graha Puja',
  'Homa & Yajna', 'Vrat Puja', 'Prosperity Puja', 'Marriage Puja',
  'Pitru Puja', 'Nature Puja', 'Protection Puja', 'Daily Puja', 'Education Puja', 'General'
];

export function PujaTypesTab({ isDesktop }) {
  const [pujaTypes, setPujaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPuja, setEditingPuja] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Deity Puja' });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchPujaTypes();
  }, []);

  const fetchPujaTypes = async () => {
    try {
      const res = await api.get('/api/admin/puja-types');
      setPujaTypes(res.data.puja_types || []);
    } catch (error) {
      toast.error('Failed to load puja types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Enter puja name');
      return;
    }
    setSaving(true);
    try {
      if (editingPuja) {
        await api.put(`/api/admin/puja-types/${editingPuja.id}`, form);
        toast.success('Puja type updated!');
      } else {
        await api.post('/api/admin/puja-types', form);
        toast.success('Puja type added!');
      }
      fetchPujaTypes();
      setShowModal(false);
      setEditingPuja(null);
      setForm({ name: '', category: 'Deity Puja' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this puja type?')) return;
    try {
      await api.delete(`/api/admin/puja-types/${id}`);
      toast.success('Puja type deleted!');
      fetchPujaTypes();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (puja) => {
    setEditingPuja(puja);
    setForm({ name: puja.name, category: puja.category, is_active: puja.is_active });
    setShowModal(true);
  };

  const filteredPujas = pujaTypes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedPujas = filteredPujas.reduce((acc, puja) => {
    const cat = puja.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(puja);
    return acc;
  }, {});

  return (
    <div className={`${isDesktop ? 'px-8 pb-8' : 'px-4 pb-24'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Puja Types Management</h2>
          <p className="text-gray-500 text-sm">Manage the dropdown options for puja services</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingPuja(null); setForm({ name: '', category: 'Deity Puja' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors"
          data-testid="add-puja-type-btn"
        >
          <Plus className="w-4 h-4" />
          Add Puja Type
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search puja types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white shadow-sm border border-orange-200 rounded-xl text-gray-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-white shadow-sm border border-orange-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron"
        >
          <option value="">All Categories</option>
          {PUJA_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-xl p-4">
          <p className="text-gray-500 text-sm">Total Pujas</p>
          <p className="text-2xl font-bold text-gray-800">{pujaTypes.length}</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4">
          <p className="text-gray-500 text-sm">Categories</p>
          <p className="text-2xl font-bold text-gray-800">{Object.keys(groupedPujas).length}</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">{pujaTypes.filter(p => p.is_active).length}</p>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4">
          <p className="text-gray-500 text-sm">Inactive</p>
          <p className="text-2xl font-bold text-red-500">{pujaTypes.filter(p => !p.is_active).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPujas).sort().map(([category, pujas]) => (
            <div key={category} className="bg-white shadow-sm border border-orange-100 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-saffron" />
                {category} ({pujas.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pujas.map(puja => (
                  <div
                    key={puja.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      puja.is_active ? 'bg-gray-100' : 'bg-red-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${puja.is_active ? 'text-gray-800' : 'text-red-400'}`}>
                        {puja.name}
                      </p>
                      {!puja.is_active && <span className="text-xs text-red-400">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => handleEdit(puja)}
                        className="p-1.5 hover:bg-orange-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(puja.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white shadow-sm rounded-2xl max-w-md w-full"
          >
            <div className="p-4 border-b border-orange-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingPuja ? 'Edit Puja Type' : 'Add Puja Type'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Puja Name*</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron"
                  placeholder="e.g., Ganesh Puja"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-saffron"
                >
                  {PUJA_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {editingPuja && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active !== false}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-600">Active (visible in dropdown)</label>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-orange-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingPuja ? 'Update' : 'Add'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
