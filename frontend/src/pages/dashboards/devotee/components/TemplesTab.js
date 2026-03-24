import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, ChevronRight, ChevronLeft, Loader2, 
  BookOpen, Compass, Star, Filter, X, ChevronDown
} from 'lucide-react';
import api from '../../../../lib/api';
import { TempleIcon3D } from './shared';

// Deity color mapping
const DEITY_COLORS = {
  Shiva: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', accent: '#3B82F6' },
  Vishnu: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accent: '#6366F1' },
  Krishna: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accent: '#8B5CF6' },
  Rama: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', accent: '#F97316' },
  Durga: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', accent: '#EF4444' },
  Ganesha: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: '#F59E0B' },
  Hanuman: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', accent: '#EA580C' },
  Kali: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', accent: '#374151' },
  Lakshmi: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', accent: '#EC4899' },
  Saraswati: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', accent: '#06B6D4' },
  Sun: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', accent: '#EAB308' },
};

const DEFAULT_DEITY_COLOR = { bg: 'bg-saffron/10', text: 'text-saffron', border: 'border-saffron/30', accent: '#FF9933' };

function getDeityColor(deity) {
  return DEITY_COLORS[deity] || DEFAULT_DEITY_COLOR;
}

// Clean markdown-style text for display
function cleanInfo(text) {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,3}\s/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Get first paragraph as summary
function getSummary(text, maxLen = 150) {
  const clean = cleanInfo(text);
  const firstPara = clean.split('\n\n')[0] || clean;
  if (firstPara.length <= maxLen) return firstPara;
  return firstPara.slice(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

// Temple Detail View
function TempleDetail({ temple, onBack }) {
  const [activeSection, setActiveSection] = useState('info');
  const deityColor = getDeityColor(temple.deity);
  
  const sections = [
    { id: 'info', label: 'Overview', icon: BookOpen },
    { id: 'story', label: 'History', icon: BookOpen },
    { id: 'architecture', label: 'Architecture', icon: Compass },
    { id: 'visiting_guide', label: 'Visit Guide', icon: MapPin },
    { id: 'mention_in_scripture', label: 'Scriptures', icon: Star },
  ].filter(s => temple[s.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      data-testid="temple-detail-view"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-saffron mb-4 hover:underline"
        data-testid="temple-detail-back"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Temples
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-maroon to-maroon-light p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <TempleIcon3D size="w-10 h-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-cinzel text-xl md:text-2xl font-bold leading-tight">{temple.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-white/80 text-sm">
                  <MapPin className="w-4 h-4" />
                  {temple.state}
                </span>
                {temple.deity && (
                  <span className="bg-white/20 px-3 py-0.5 rounded-full text-sm">
                    {temple.deity}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex overflow-x-auto border-b border-orange-100 scrollbar-hide">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeSection === s.id
                  ? 'border-saffron text-saffron'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`temple-section-${s.id}`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="p-5 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed"
            >
              {cleanInfo(temple[activeSection])}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Temple Card
function TempleCard({ temple, onClick }) {
  const deityColor = getDeityColor(temple.deity);
  
  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl shadow-sm border border-orange-100 p-4 hover:shadow-md hover:border-saffron/30 transition-all group"
      whileHover={{ y: -2 }}
      data-testid={`temple-card-${temple.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${deityColor.bg}`}>
          <TempleIcon3D size="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm md:text-base group-hover:text-saffron transition-colors truncate">
            {temple.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {temple.state}
            </span>
            {temple.deity && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${deityColor.bg} ${deityColor.text}`}>
                {temple.deity}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
            {getSummary(temple.info, 120)}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-saffron transition-colors flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

// Main TemplesTab Component
export function TemplesTab({ isDesktop }) {
  const [temples, setTemples] = useState([]);
  const [states, setStates] = useState([]);
  const [deities, setDeities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDeity, setSelectedDeity] = useState('');
  const [selectedTemple, setSelectedTemple] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch filters data on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [statesRes, deitiesRes, statsRes] = await Promise.all([
          api.get('/api/temples/states'),
          api.get('/api/temples/deities'),
          api.get('/api/temples/stats'),
        ]);
        setStates(statesRes.data.states || []);
        setDeities(deitiesRes.data.deities || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Error fetching temple metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch temples
  const fetchTemples = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (selectedState) params.set('state', selectedState);
      if (selectedDeity) params.set('deity', selectedDeity);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      
      const res = await api.get(`/api/temples/list?${params}`);
      setTemples(res.data.temples || []);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching temples:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedState, selectedDeity, searchQuery]);

  useEffect(() => {
    fetchTemples();
  }, [fetchTemples]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedState, selectedDeity, searchQuery]);

  // If a temple is selected, show detail view
  if (selectedTemple) {
    return (
      <TempleDetail
        temple={selectedTemple}
        onBack={() => setSelectedTemple(null)}
      />
    );
  }

  const activeFilters = (selectedState ? 1 : 0) + (selectedDeity ? 1 : 0);

  return (
    <div data-testid="temples-tab" className="space-y-4">
      {/* Stats Banner */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-orange-100">
            <p className="font-cinzel text-xl md:text-2xl font-bold text-maroon">{stats.total_temples}</p>
            <p className="text-xs text-gray-500">Temples</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-orange-100">
            <p className="font-cinzel text-xl md:text-2xl font-bold text-maroon">{stats.total_states}</p>
            <p className="text-xs text-gray-500">States</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-orange-100">
            <p className="font-cinzel text-xl md:text-2xl font-bold text-maroon">{stats.total_deities}</p>
            <p className="text-xs text-gray-500">Deities</p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search temples..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron"
              data-testid="temples-search"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || activeFilters > 0 ? 'bg-saffron text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'
            }`}
            data-testid="temples-filter-toggle"
          >
            <Filter className="w-4 h-4" />
            {activeFilters > 0 && (
              <span className="bg-white text-saffron text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-gray-100 space-y-3">
                {/* State Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    data-testid="temples-state-filter"
                  >
                    <option value="">All States</option>
                    {states.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deity Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Deity</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDeity('')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        !selectedDeity ? 'bg-saffron text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {deities.map((d) => {
                      const color = getDeityColor(d.name);
                      return (
                        <button
                          key={d.name}
                          onClick={() => setSelectedDeity(d.name === selectedDeity ? '' : d.name)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            selectedDeity === d.name
                              ? 'bg-saffron text-white'
                              : `${color.bg} ${color.text} hover:opacity-80`
                          }`}
                          data-testid={`deity-filter-${d.name}`}
                        >
                          {d.name} ({d.count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFilters > 0 && (
                  <button
                    onClick={() => { setSelectedState(''); setSelectedDeity(''); }}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>{total} temples found</span>
        {totalPages > 1 && <span>Page {page} of {totalPages}</span>}
      </div>

      {/* Temples List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-saffron animate-spin" />
        </div>
      ) : temples.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-orange-100">
          <TempleIcon3D size="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="text-gray-500 font-medium">No temples found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {temples.map((temple) => (
            <TempleCard
              key={temple.id}
              temple={temple}
              onClick={() => setSelectedTemple(temple)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            data-testid="temples-prev-page"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm text-gray-600 font-medium">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            data-testid="temples-next-page"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
