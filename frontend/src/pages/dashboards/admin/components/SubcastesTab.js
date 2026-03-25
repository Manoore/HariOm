import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Search, X } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'sonner';

export function SubcastesTab({ isDesktop }) {
  const [subcastes, setSubcastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSubcastes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/subcastes');
      setSubcastes(res.data.subcastes || []);
    } catch (err) {
      toast.error('Failed to load subcastes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubcastes(); }, []);

  const addSubcaste = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/api/subcastes', { name: newName.trim() });
      toast.success(`Added "${newName.trim()}"`);
      setNewName('');
      fetchSubcastes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const deleteSubcaste = async (name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/api/subcastes/${encodeURIComponent(name)}`);
      toast.success(`Deleted "${name}"`);
      fetchSubcastes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const filtered = search
    ? subcastes.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : subcastes;

  return (
    <div className={`${isDesktop ? 'p-6 max-w-4xl mx-auto' : 'p-4 pb-24'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-cinzel text-xl md:text-2xl font-bold text-maroon">Manage Subcastes</h2>
          <p className="text-sm text-gray-500 mt-1">{subcastes.length} subcastes total</p>
        </div>
      </div>

      {/* Add New */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 mb-4" data-testid="add-subcaste-form">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubcaste()}
            placeholder="Enter new subcaste name..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
            data-testid="subcaste-name-input"
          />
          <button
            onClick={addSubcaste}
            disabled={adding || !newName.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-saffron text-white rounded-lg text-sm font-medium hover:bg-saffron/90 disabled:opacity-50 transition-colors"
            data-testid="add-subcaste-btn"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subcastes..."
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
          data-testid="subcaste-search"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No subcastes found</p>
            ) : (
              filtered.map((name, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 hover:bg-orange-50/50 transition-colors"
                  data-testid={`subcaste-row-${idx}`}
                >
                  <span className="text-sm text-gray-700">{name}</span>
                  <button
                    onClick={() => deleteSubcaste(name)}
                    className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                    data-testid={`delete-subcaste-${idx}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t">
            Showing {filtered.length} of {subcastes.length}
          </div>
        </div>
      )}
    </div>
  );
}
