import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Loader2, Check, X, Shield } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../../../components/ui/ConfirmDialog';

export function AdminManagementTab({ isDesktop }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', is_super_admin: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/api/admin/admins');
      setAdmins(res.data.admins || []);
    } catch (error) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!editingAdmin && (!form.password || form.password.length < 6)) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      if (editingAdmin) {
        await api.put(`/api/admin/admins/${editingAdmin.id}`, {
          name: form.name,
          is_super_admin: form.is_super_admin
        });
        toast.success('Admin updated');
      } else {
        await api.post('/api/admin/admins', form);
        toast.success('Admin created');
      }
      fetchAdmins();
      setShowAddModal(false);
      setEditingAdmin(null);
      setForm({ name: '', email: '', password: '', is_super_admin: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (adminId, isActive) => {
    const ok = await confirm({
      title: `${isActive ? 'Deactivate' : 'Activate'} Admin?`,
      message: `This admin will be ${isActive ? 'deactivated and lose access' : 'reactivated'}.`,
      confirmLabel: isActive ? 'Deactivate' : 'Activate',
      variant: isActive ? 'danger' : 'default'
    });
    if (!ok) return;
    try {
      await api.put(`/api/admin/admins/${adminId}`, { is_active: !isActive });
      toast.success(`Admin ${isActive ? 'deactivated' : 'activated'}`);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = async (adminId) => {
    const ok = await confirm({
      title: 'Delete Admin?',
      message: 'This admin will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/admins/${adminId}`);
      toast.success('Admin deleted');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete admin');
    }
  };

  return (
    <div className={`pb-24 lg:pb-8 ${isDesktop ? 'px-8' : 'px-4'}`}>
      <ConfirmDialog />
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-cinzel text-xl font-semibold text-gray-800">Admin Management</h2>
            <p className="text-sm text-gray-500">Manage administrators and their permissions</p>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setEditingAdmin(null); setForm({ name: '', email: '', password: '', is_super_admin: false }); }}
            className="flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-xl hover:bg-saffron-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-saffron animate-spin" />
          </div>
        ) : (
          <div className={`${isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}`}>
            {admins.map((admin) => (
              <div key={admin.id} className={`bg-white shadow-sm border rounded-2xl p-4 ${!admin.is_active ? 'border-red-200 bg-red-50/30' : 'border-orange-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg ${
                    admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-saffron/20 text-saffron-dark'
                  }`}>
                    {admin.role === 'super_admin' ? <Shield className="w-6 h-6" /> : admin.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${admin.is_active ? 'text-gray-800' : 'text-gray-400'}`}>{admin.name}</p>
                    <p className="text-gray-500 text-sm truncate">{admin.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                  {!admin.is_active && <span className="text-xs text-red-500">Inactive</span>}
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-orange-100">
                  <button
                    onClick={() => { setEditingAdmin(admin); setForm({ name: admin.name, email: admin.email, password: '', is_super_admin: admin.role === 'super_admin' }); setShowAddModal(true); }}
                    className="flex-1 text-xs px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                      admin.is_active ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {admin.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(admin.id)}
                    className="text-xs px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl"
          >
            <div className="p-4 border-b border-orange-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-orange-50 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                  disabled={!!editingAdmin}
                />
              </div>
              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_super_admin"
                  checked={form.is_super_admin}
                  onChange={(e) => setForm({ ...form, is_super_admin: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_super_admin" className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Super Admin</p>
                  <p className="text-xs text-gray-500">Can manage other admins and all settings</p>
                </label>
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
            </div>

            <div className="p-4 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-saffron text-white rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-saffron-dark transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingAdmin ? 'Update' : 'Create Admin'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
