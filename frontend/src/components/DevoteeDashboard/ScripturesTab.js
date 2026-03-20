import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, ChevronRight, ChevronLeft, Search, Loader2, 
  Sparkles, ArrowLeft, BookMarked, ScrollText, Flame, Crown, Sword
} from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';

// Scripture Icon Mapping
const scriptureIcons = {
  'bhagavad_gita': BookOpen,
  'valmiki_ramayana': Crown,
  'mahabharata': Sword,
  'rigveda': Flame,
  'atharvaveda': Sparkles,
  'yajurveda': Flame,
  'ramcharitmanas': ScrollText
};

// Scripture colors
const scriptureColors = {
  'bhagavad_gita': 'from-amber-500 to-orange-600',
  'valmiki_ramayana': 'from-emerald-500 to-teal-600',
  'mahabharata': 'from-red-500 to-rose-600',
  'rigveda': 'from-orange-500 to-amber-600',
  'atharvaveda': 'from-purple-500 to-violet-600',
  'yajurveda': 'from-yellow-500 to-amber-600',
  'ramcharitmanas': 'from-sky-500 to-blue-600'
};

// Scripture Card Component
function ScriptureCard({ scripture, onClick }) {
  const IconComponent = scriptureIcons[scripture.scripture_id] || BookOpen;
  const gradientClass = scriptureColors[scripture.scripture_id] || 'from-saffron to-gold';
  
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-md border border-orange-100 text-left w-full hover:shadow-lg transition-shadow"
      data-testid={`scripture-card-${scripture.scripture_id}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <IconComponent className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-cinzel font-semibold text-gray-800 text-lg">{scripture.name}</h3>
          <p className="text-sm text-saffron font-medium">{scripture.name_hindi}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{scripture.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>{scripture.total_verses?.toLocaleString()} verses</span>
            <span>•</span>
            <span>{scripture.total_sections} {scripture.category === 'veda' ? 'mandalas/kandas' : 'chapters'}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

// Scripture List View
function ScriptureList({ scriptures, onSelect, loading }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredScriptures = scriptures.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.name_hindi.includes(searchQuery);
    const matchesFilter = filter === 'all' || s.category === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('scriptures.searchPlaceholder', 'Search scriptures...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-orange-100 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
          data-testid="scriptures-search"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'veda', 'itihasa'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f 
                ? 'bg-saffron text-white' 
                : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
            }`}
            data-testid={`filter-${f}`}
          >
            {f === 'all' ? t('scriptures.all', 'All') : 
             f === 'veda' ? t('scriptures.vedas', 'Vedas') : 
             t('scriptures.itihasa', 'Itihasas')}
          </button>
        ))}
      </div>

      {/* Scripture Cards */}
      <div className="space-y-3">
        {filteredScriptures.map((scripture) => (
          <ScriptureCard 
            key={scripture.scripture_id} 
            scripture={scripture} 
            onClick={() => onSelect(scripture)}
          />
        ))}
      </div>

      {filteredScriptures.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          {t('scriptures.noResults', 'No scriptures found')}
        </div>
      )}
    </div>
  );
}

// Section List View
function SectionList({ scripture, sections, onSelect, onBack, loading }) {
  const { t } = useTranslation();
  const IconComponent = scriptureIcons[scripture.scripture_id] || BookOpen;
  const gradientClass = scriptureColors[scripture.scripture_id] || 'from-saffron to-gold';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
          data-testid="back-to-scriptures"
        >
          <ArrowLeft className="w-5 h-5 text-saffron" />
        </button>
        <div className={`w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-cinzel font-semibold text-xl text-gray-800">{scripture.name}</h2>
          <p className="text-sm text-saffron">{scripture.name_hindi}</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-600">{scripture.description}</p>
        <p className="text-xs text-gray-500 mt-2 italic">{scripture.description_hindi}</p>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sections.map((section) => (
          <motion.button
            key={section.section_num}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(section)}
            className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 hover:border-saffron hover:shadow-md transition-all text-center"
            data-testid={`section-${section.section_num}`}
          >
            <div className="text-2xl font-cinzel font-bold text-saffron mb-1">
              {section.section_num}
            </div>
            <div className="text-sm font-medium text-gray-700 line-clamp-1">
              {section.section_name}
            </div>
            {section.section_name_hindi && (
              <div className="text-xs text-gray-500 line-clamp-1">
                {section.section_name_hindi}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              {section.verse_count} {t('scriptures.verses', 'verses')}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Verse Reader View
function VerseReader({ scripture, section, onBack }) {
  const { t } = useTranslation();
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchVerses();
  }, [scripture.scripture_id, section.section_num, skip]);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/scriptures/${scripture.scripture_id}/sections/${section.section_num}?skip=${skip}&limit=${limit}`
      );
      
      if (response.data.status === 'ok') {
        const data = response.data.data;
        if (skip === 0) {
          setVerses(data.verses);
        } else {
          setVerses(prev => [...prev, ...data.verses]);
        }
        setTotal(data.total);
        setHasMore(data.has_more);
      }
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setSkip(prev => prev + limit);
    }
  };

  const IconComponent = scriptureIcons[scripture.scripture_id] || BookOpen;
  const gradientClass = scriptureColors[scripture.scripture_id] || 'from-saffron to-gold';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 bg-cream-50/95 backdrop-blur-sm z-10 -mx-4 px-4 py-3 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
            data-testid="back-to-sections"
          >
            <ArrowLeft className="w-5 h-5 text-saffron" />
          </button>
          <div className={`w-10 h-10 bg-gradient-to-br ${gradientClass} rounded-lg flex items-center justify-center`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-cinzel font-semibold text-gray-800 truncate">{scripture.name}</h2>
            <p className="text-sm text-saffron truncate">{section.section_name} {section.section_name_hindi && `(${section.section_name_hindi})`}</p>
          </div>
          <div className="text-xs text-gray-400 whitespace-nowrap">
            {total} {t('scriptures.verses', 'verses')}
          </div>
        </div>
      </div>

      {/* Verses */}
      <div className="space-y-4">
        <AnimatePresence>
          {verses.map((verse, index) => (
            <motion.div
              key={`${verse.verse_num}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-orange-100"
            >
              {/* Verse Number */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-white bg-saffron px-2 py-1 rounded-full">
                  {verse.sarga_num && `Sarga ${verse.sarga_num}, `}
                  {verse.chapter_num && `Ch ${verse.chapter_num}, `}
                  {verse.sukta_num && `Sukta ${verse.sukta_num}`}
                  {verse.verse_num > 0 && (verse.sarga_num || verse.chapter_num ? ` Verse ${verse.verse_num}` : `Verse ${verse.verse_num}`)}
                </span>
                {verse.verse_type && (
                  <span className="text-xs text-gray-500">{verse.verse_type}</span>
                )}
              </div>

              {/* Sanskrit Text */}
              <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-sanskrit">
                {verse.text}
              </div>

              {/* Commentaries (if available - for Gita) */}
              {verse.commentaries && Object.keys(verse.commentaries).length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-saffron cursor-pointer hover:text-saffron/80 font-medium">
                    {t('scriptures.viewCommentary', 'View Commentary')} ({Object.keys(verse.commentaries).length})
                  </summary>
                  <div className="mt-3 space-y-3 pl-4 border-l-2 border-orange-100">
                    {Object.entries(verse.commentaries).slice(0, 2).map(([author, commentary]) => (
                      <div key={author} className="text-sm">
                        <p className="font-medium text-gray-700 mb-1">{author}:</p>
                        <p className="text-gray-600 leading-relaxed line-clamp-4">{commentary}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Translations (if available - for Gita) */}
              {verse.translations && Object.keys(verse.translations).length > 0 && (
                <details className="mt-3">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-500 font-medium">
                    {t('scriptures.viewTranslation', 'View Translation')} ({Object.keys(verse.translations).length})
                  </summary>
                  <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-100">
                    {Object.entries(verse.translations).slice(0, 2).map(([lang, translation]) => (
                      <div key={lang} className="text-sm">
                        <p className="font-medium text-gray-700 mb-1">{lang}:</p>
                        <p className="text-gray-600 leading-relaxed line-clamp-4">{translation}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {loading && skip > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-saffron" />
        </div>
      )}
      
      {hasMore && !loading && (
        <button
          onClick={loadMore}
          className="w-full py-3 bg-orange-50 hover:bg-orange-100 rounded-xl text-saffron font-medium transition-colors"
          data-testid="load-more-verses"
        >
          {t('scriptures.loadMore', 'Load More Verses')}
        </button>
      )}

      {!hasMore && verses.length > 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          {t('scriptures.endOfSection', 'End of section')}
        </div>
      )}
    </div>
  );
}

// Random Verse Widget
function RandomVerseWidget() {
  const { t } = useTranslation();
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomVerse = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/scriptures/verse/random');
      if (response.data.status === 'ok') {
        setVerse(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching random verse:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomVerse();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-saffron/10 to-gold/10 rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-saffron" />
      </div>
    );
  }

  if (!verse) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-saffron/10 to-gold/10 rounded-2xl p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-saffron" />
          <span className="text-sm font-medium text-saffron">{t('scriptures.verseOfDay', 'Verse of the Day')}</span>
        </div>
        <button 
          onClick={fetchRandomVerse}
          className="text-xs text-gray-500 hover:text-saffron transition-colors"
        >
          {t('scriptures.refresh', 'Refresh')}
        </button>
      </div>
      <p className="text-gray-800 font-sanskrit leading-relaxed line-clamp-3">{verse.text}</p>
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
        <BookMarked className="w-4 h-4" />
        <span>{verse.scripture_name} • {verse.section_name}</span>
      </div>
    </motion.div>
  );
}

// Main Scriptures Tab Component
export default function ScripturesTab({ isDesktop }) {
  const { t } = useTranslation();
  const [scriptures, setScriptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScripture, setSelectedScripture] = useState(null);
  const [scriptureDetails, setScriptureDetails] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchScriptures();
  }, []);

  const fetchScriptures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/scriptures');
      if (response.data.status === 'ok') {
        setScriptures(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching scriptures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScriptureDetails = async (scripture) => {
    try {
      setDetailsLoading(true);
      const response = await api.get(`/api/scriptures/${scripture.scripture_id}`);
      if (response.data.status === 'ok') {
        setScriptureDetails(response.data.data);
        setSelectedScripture(scripture);
      }
    } catch (error) {
      console.error('Error fetching scripture details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectScripture = (scripture) => {
    fetchScriptureDetails(scripture);
  };

  const handleSelectSection = (section) => {
    setSelectedSection(section);
  };

  const handleBackToScriptures = () => {
    setSelectedScripture(null);
    setScriptureDetails(null);
    setSelectedSection(null);
  };

  const handleBackToSections = () => {
    setSelectedSection(null);
  };

  return (
    <div className={`${isDesktop ? 'ml-64 p-8' : 'p-4 pb-24'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {!selectedScripture && (
          <div className="mb-6">
            <h1 className="font-cinzel text-2xl font-bold text-maroon mb-1">
              {t('scriptures.title', 'Sacred Scriptures')}
            </h1>
            <p className="text-gray-500 text-sm">
              {t('scriptures.subtitle', 'Explore the timeless wisdom of Hindu scriptures')}
            </p>
          </div>
        )}

        {/* Random Verse Widget */}
        {!selectedScripture && <RandomVerseWidget />}

        {/* Content */}
        {!selectedScripture && (
          <ScriptureList 
            scriptures={scriptures} 
            onSelect={handleSelectScripture}
            loading={loading}
          />
        )}

        {selectedScripture && !selectedSection && scriptureDetails && (
          <SectionList 
            scripture={scriptureDetails}
            sections={scriptureDetails.sections || []}
            onSelect={handleSelectSection}
            onBack={handleBackToScriptures}
            loading={detailsLoading}
          />
        )}

        {selectedScripture && selectedSection && (
          <VerseReader 
            scripture={selectedScripture}
            section={selectedSection}
            onBack={handleBackToSections}
          />
        )}
      </div>
    </div>
  );
}
