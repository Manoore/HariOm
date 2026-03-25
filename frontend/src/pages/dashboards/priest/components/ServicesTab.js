import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2, X, Briefcase, IndianRupee, Clock } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

function ServicesTab({ services, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingService(null);
    setShowModal(true);
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/api/priest/services/${serviceId}`);
      toast.success('Service deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-semibold text-maroon">Services</h2>
        <button 
          type="button"
          data-testid="add-service-btn"
          onClick={handleAddClick}
          onTouchEnd={handleAddClick}
          style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
          className="flex items-center gap-2 bg-saffron text-white px-4 py-2 rounded-lg text-sm hover:bg-saffron/90 active:scale-95 transition-all cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {services.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center"><Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-400">No services yet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-xl p-4 border-l-4 border-saffron">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{s.category}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingService(s); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => deleteService(s.id)} className="p-1.5 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{s.description}</p>
              <div className="flex gap-3 mt-2 text-sm">
                <span><Clock className="w-3 h-3 inline" /> {s.duration_minutes}min</span>
                <span className="text-saffron font-medium">₹{s.price}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceModal 
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingService(null); }}
        editData={editingService}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// Service Modal Component
function ServiceModal({ isOpen, onClose, editData, onSuccess }) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'Pooja', duration_minutes: 60, price: 1100, puja_type_id: '', custom_puja_name: '', location_type: 'online', temple_name: ''
  });
  const [saving, setSaving] = useState(false);
  const [pujaTypes, setPujaTypes] = useState([]);
  const [pujaCategories, setPujaCategories] = useState({});
  const [showCustomInput, setShowCustomInput] = useState(false);

  const locationTypes = [
    { value: 'online', label: 'Online', description: 'Via video call' },
    { value: 'home_visit', label: 'Home Visit', description: 'Priest visits devotee\'s home' },
    { value: 'temple', label: 'Temple', description: 'At a temple venue' }
  ];

  useEffect(() => {
    // Load puja types
    const loadPujaTypes = async () => {
      try {
        const res = await api.get('/api/puja-types');
        setPujaTypes(res.data.puja_types || []);
        setPujaCategories(res.data.categories || {});
      } catch (error) {
        console.error('Failed to load puja types:', error);
      }
    };
    loadPujaTypes();
  }, []);

  useEffect(() => {
    if (editData) {
      const isCustom = editData.puja_type_id === 'other' || !editData.puja_type_id;
      setForm({
        name: editData.name || '',
        description: editData.description || '',
        category: editData.category || 'Pooja',
        duration_minutes: editData.duration_minutes || 60,
        price: editData.price || 1100,
        puja_type_id: editData.puja_type_id || '',
        custom_puja_name: isCustom ? editData.name : '',
        location_type: editData.location_type || 'online',
        temple_name: editData.temple_name || ''
      });
      setShowCustomInput(isCustom && editData.name);
    } else {
      setForm({ name: '', description: '', category: 'Pooja', duration_minutes: 60, price: 1100, puja_type_id: '', custom_puja_name: '', location_type: 'online', temple_name: '' });
      setShowCustomInput(false);
    }
  }, [editData, isOpen]);

  const handlePujaSelect = (value) => {
    if (value === 'other') {
      setShowCustomInput(true);
      setForm({ ...form, puja_type_id: 'other', name: form.custom_puja_name || '' });
    } else {
      const selectedPuja = pujaTypes.find(p => p.id === value);
      setShowCustomInput(false);
      setForm({ 
        ...form, 
        puja_type_id: value, 
        name: selectedPuja ? selectedPuja.name : '',
        custom_puja_name: ''
      });
    }
  };

  const handleSubmit = async () => {
    const serviceName = showCustomInput ? form.custom_puja_name : form.name;
    if (!serviceName) { toast.error('Select or enter a puja name'); return; }
    setSaving(true);
    try {
      const submitData = {
        ...form,
        name: serviceName
      };
      if (editData) {
        await api.put(`/api/priest/services/${editData.id}`, submitData);
      } else {
        await api.post('/api/priest/services', submitData);
      }
      toast.success(editData ? 'Service updated!' : 'Service added!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-cinzel text-lg font-semibold text-maroon">{editData ? 'Edit Service' : 'Add Service'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puja/Service Type*</label>
            <select 
              value={form.puja_type_id} 
              onChange={(e) => handlePujaSelect(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
              data-testid="puja-type-select"
            >
              <option value="">-- Select Puja Type --</option>
              {Object.entries(pujaCategories).map(([category, pujas]) => (
                <optgroup key={category} label={category}>
                  {pujas.map(puja => (
                    <option key={puja.id} value={puja.id}>{puja.name}</option>
                  ))}
                </optgroup>
              ))}
              <option value="other">Other (Custom)</option>
            </select>
          </div>

          {showCustomInput && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Puja Name*</label>
              <input 
                type="text" 
                value={form.custom_puja_name} 
                onChange={(e) => setForm({ ...form, custom_puja_name: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
                placeholder="Enter custom puja name"
                data-testid="custom-puja-input"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              rows={3} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              placeholder="Describe the service..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={form.category} 
              onChange={(e) => setForm({ ...form, category: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
            >
              <option value="Pooja">Pooja</option>
              <option value="Homam">Homam/Havan</option>
              <option value="Ceremony">Ceremony</option>
              <option value="Consultation">Consultation</option>
              <option value="Online">Online Service</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input 
                type="number" 
                value={form.duration_minutes} 
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input 
                type="number" 
                value={form.price} 
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
              />
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Location*</label>
            <div className="grid grid-cols-3 gap-2">
              {locationTypes.map(loc => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => setForm({ ...form, location_type: loc.value })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    form.location_type === loc.value
                      ? 'border-saffron bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`service-location-${loc.value}`}
                >
                  <div className="font-medium text-sm text-gray-800">{loc.label}</div>
                  <div className="text-xs text-gray-500">{loc.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Temple Name - only show if location_type is temple */}
          {form.location_type === 'temple' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temple Name*</label>
              <input 
                type="text" 
                value={form.temple_name} 
                onChange={(e) => setForm({ ...form, temple_name: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50" 
                placeholder="Enter temple name where service is offered"
                data-testid="service-temple-name"
              />
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editData ? 'Update' : 'Add Service'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


export { ServicesTab, ServiceModal };
