import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';

const MantrasShlokaScreen = ({ navigation }) => {
  const [mantras, setMantras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'morning', name: 'Morning', icon: 'sunny' },
    { id: 'deities', name: 'Deities', icon: 'star' },
    { id: 'healing', name: 'Healing', icon: 'heart' },
    { id: 'meditation', name: 'Meditation', icon: 'leaf' },
  ];

  useEffect(() => {
    fetchMantras();
  }, []);

  const fetchMantras = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/mantras');
      setMantras(response.data.mantras || response.data || []);
    } catch (error) {
      console.log('Error fetching mantras:', error);
      // Sample data
      setMantras([
        {
          id: '1',
          name: 'Gayatri Mantra',
          deity: 'Sun God',
          description: 'The most powerful Vedic hymn for enlightenment',
          duration: '3:45',
          category: 'morning',
          lyrics: 'Om Bhur Bhuvaḥ Swaḥ, Tat Savitur Vareṇyaṃ...',
          benefits: ['Spiritual awakening', 'Mental clarity', 'Protection'],
          playCount: 15420,
        },
        {
          id: '2',
          name: 'Om Namah Shivaya',
          deity: 'Lord Shiva',
          description: 'Sacred five-syllable mantra for Lord Shiva',
          duration: '5:20',
          category: 'deities',
          lyrics: 'Om Namah Shivaya...',
          benefits: ['Inner peace', 'Removes negativity', 'Spiritual growth'],
          playCount: 12350,
        },
        {
          id: '3',
          name: 'Hanuman Chalisa',
          deity: 'Lord Hanuman',
          description: '40 verses praising Lord Hanuman',
          duration: '8:15',
          category: 'deities',
          lyrics: 'Shri Guru Charan Saroj Raj, Nij Man Mukar Sudhari...',
          benefits: ['Courage', 'Protection from evil', 'Strength'],
          playCount: 28900,
        },
        {
          id: '4',
          name: 'Mahamrityunjaya Mantra',
          deity: 'Lord Shiva',
          description: 'Powerful mantra for healing and longevity',
          duration: '4:30',
          category: 'healing',
          lyrics: 'Om Tryambakam Yajamahe, Sugandhim Pushtivardhanam...',
          benefits: ['Healing', 'Longevity', 'Protection from illness'],
          playCount: 19200,
        },
        {
          id: '5',
          name: 'Om Gan Ganapataye Namah',
          deity: 'Lord Ganesha',
          description: 'Invocation to Lord Ganesha to remove obstacles',
          duration: '2:45',
          category: 'morning',
          lyrics: 'Om Gan Ganapataye Namah...',
          benefits: ['Removes obstacles', 'New beginnings', 'Success'],
          playCount: 8900,
        },
        {
          id: '6',
          name: 'Om Mani Padme Hum',
          deity: 'Avalokiteshvara',
          description: 'Buddhist mantra of compassion',
          duration: '6:00',
          category: 'meditation',
          lyrics: 'Om Mani Padme Hum...',
          benefits: ['Compassion', 'Wisdom', 'Inner peace'],
          playCount: 11500,
        },
        {
          id: '7',
          name: 'Vishnu Sahasranama',
          deity: 'Lord Vishnu',
          description: '1000 names of Lord Vishnu',
          duration: '25:00',
          category: 'deities',
          lyrics: 'Viśvam Viṣṇur Vaṣatkāro Bhūtabhavyabhavatprabhuḥ...',
          benefits: ['Peace', 'Prosperity', 'Liberation'],
          playCount: 7600,
        },
        {
          id: '8',
          name: 'Aum Meditation',
          deity: 'Universal',
          description: 'Sacred primordial sound for deep meditation',
          duration: '15:00',
          category: 'meditation',
          lyrics: 'Aum...',
          benefits: ['Deep relaxation', 'Spiritual connection', 'Focus'],
          playCount: 21000,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMantras();
    setRefreshing(false);
  };

  const handlePlay = (mantra) => {
    if (currentPlaying?.id === mantra.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlaying(mantra);
      setIsPlaying(true);
    }
  };

  const filteredMantras = selectedCategory === 'all'
    ? mantras
    : mantras.filter(m => m.category === selectedCategory);

  const formatPlayCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mantras & Shlokas</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="search-outline" size={24} color={COLORS.saffron} />
        </TouchableOpacity>
      </View>

      {/* Featured Banner */}
      <TouchableOpacity style={styles.featuredBanner} activeOpacity={0.9}>
        <LinearGradient
          colors={['#F472B6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredGradient}
        >
          <Ionicons name="musical-notes" size={32} color="#fff" style={{ opacity: 0.9 }} />
          <View style={styles.featuredText}>
            <Text style={styles.featuredTitle}>Daily Mantra</Text>
            <Text style={styles.featuredSubtitle}>Start your day with divine vibrations</Text>
          </View>
          <TouchableOpacity style={styles.featuredPlayButton}>
            <Ionicons name="play" size={24} color="#EC4899" />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons 
              name={cat.icon} 
              size={16} 
              color={selectedCategory === cat.id ? COLORS.white : COLORS.gray[600]} 
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mantras List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {filteredMantras.map((mantra) => (
          <TouchableOpacity
            key={mantra.id}
            style={[
              styles.mantraCard,
              currentPlaying?.id === mantra.id && styles.mantraCardActive,
            ]}
            onPress={() => handlePlay(mantra)}
            activeOpacity={0.8}
          >
            <View style={styles.mantraIconContainer}>
              <LinearGradient
                colors={currentPlaying?.id === mantra.id ? ['#F472B6', '#EC4899'] : [COLORS.saffron, '#FF6600']}
                style={styles.mantraIcon}
              >
                <Ionicons 
                  name={currentPlaying?.id === mantra.id && isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="#fff" 
                />
              </LinearGradient>
            </View>
            
            <View style={styles.mantraInfo}>
              <Text style={styles.mantraName}>{mantra.name}</Text>
              <Text style={styles.mantraDeity}>{mantra.deity}</Text>
              <View style={styles.mantraMetaRow}>
                <View style={styles.mantraMeta}>
                  <Ionicons name="time-outline" size={12} color={COLORS.gray[500]} />
                  <Text style={styles.mantraMetaText}>{mantra.duration}</Text>
                </View>
                <View style={styles.mantraMeta}>
                  <Ionicons name="headset-outline" size={12} color={COLORS.gray[500]} />
                  <Text style={styles.mantraMetaText}>{formatPlayCount(mantra.playCount)}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.mantraMoreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Now Playing Bar */}
      {currentPlaying && (
        <View style={styles.nowPlayingBar}>
          <LinearGradient
            colors={['#F472B6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nowPlayingGradient}
          >
            <View style={styles.nowPlayingInfo}>
              <Ionicons name="musical-note" size={20} color="#fff" />
              <View style={styles.nowPlayingText}>
                <Text style={styles.nowPlayingTitle} numberOfLines={1}>{currentPlaying.name}</Text>
                <Text style={styles.nowPlayingSubtitle}>{currentPlaying.deity}</Text>
              </View>
            </View>
            <View style={styles.nowPlayingControls}>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="play-skip-back" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.playPauseButton}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={26} color="#EC4899" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="play-skip-forward" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.maroon,
  },
  headerIcon: {
    padding: 4,
  },
  featuredBanner: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  featuredGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  featuredText: {
    flex: 1,
    marginLeft: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  featuredSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  featuredPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    backgroundColor: COLORS.white,
    maxHeight: 55,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#EC4899',
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mantraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  mantraCardActive: {
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  mantraIconContainer: {
    marginRight: 12,
  },
  mantraIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mantraInfo: {
    flex: 1,
  },
  mantraName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 2,
  },
  mantraDeity: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 6,
  },
  mantraMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mantraMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mantraMetaText: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  mantraMoreButton: {
    padding: 8,
  },
  nowPlayingBar: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  nowPlayingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  nowPlayingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nowPlayingText: {
    marginLeft: 12,
    flex: 1,
  },
  nowPlayingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  nowPlayingSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  nowPlayingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 8,
  },
  playPauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MantrasShlokaScreen;
