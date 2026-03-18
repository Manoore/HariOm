import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { priestAPI } from '../services/api';

const PriestsListScreen = ({ navigation }) => {
  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', name: 'All' },
    { id: 'vedic', name: 'Vedic Rituals' },
    { id: 'puja', name: 'Puja' },
    { id: 'wedding', name: 'Wedding' },
    { id: 'homam', name: 'Homam' },
  ];

  useEffect(() => {
    fetchPriests();
  }, []);

  const fetchPriests = async () => {
    try {
      setLoading(true);
      console.log('Fetching priests from API...');
      const response = await priestAPI.getAll({ limit: 20 });
      console.log('Priests response:', response.data);
      setPriests(response.data.priests || []);
    } catch (error) {
      console.log('Error fetching priests:', error.message);
      // Sample data fallback
      setPriests([
        {
          id: '1',
          user_name: 'Pandit Ramesh Sharma',
          specializations: ['Vedic Rituals', 'Satyanarayan Pooja'],
          experience_years: 15,
          languages: ['Hindi', 'Sanskrit', 'English'],
          rating: 4.9,
          total_reviews: 128,
          hourly_rate: 500,
          available: true,
        },
        {
          id: '2',
          user_name: 'Pandit Suresh Verma',
          specializations: ['Homam', 'Navagraha Shanti'],
          experience_years: 12,
          languages: ['Hindi', 'Tamil'],
          rating: 4.8,
          total_reviews: 95,
          hourly_rate: 450,
          available: true,
        },
        {
          id: '3',
          user_name: 'Acharya Deepak Joshi',
          specializations: ['Kundali Reading', 'Vastu Consultation'],
          experience_years: 20,
          languages: ['Hindi', 'English', 'Marathi'],
          rating: 4.7,
          total_reviews: 210,
          hourly_rate: 600,
          available: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPriests();
    setRefreshing(false);
  };

  const filteredPriests = priests.filter(priest => {
    const matchesSearch = priest.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      priest.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedFilter === 'all') return matchesSearch;
    
    return matchesSearch && priest.specializations?.some(s => 
      s.toLowerCase().includes(selectedFilter.toLowerCase())
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book a Priest</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search-outline" size={20} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or service..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Priests List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading priests...</Text>
          </View>
        ) : filteredPriests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="person-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>No priests found</Text>
          </View>
        ) : (
          filteredPriests.map((priest) => (
            <TouchableOpacity
              key={priest.id}
              style={styles.priestCard}
              onPress={() => navigation.navigate('PriestDetail', { priest })}
              activeOpacity={0.8}
            >
              <View style={styles.priestAvatar}>
                <Text style={styles.avatarText}>
                  {priest.user_name?.charAt(0)?.toUpperCase() || 'P'}
                </Text>
                {priest.available && <View style={styles.onlineIndicator} />}
              </View>
              
              <View style={styles.priestInfo}>
                <Text style={styles.priestName}>{priest.user_name}</Text>
                
                <View style={styles.ratingRow}>
                  <Icon name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {priest.rating || 4.5} ({priest.total_reviews || 0} reviews)
                  </Text>
                </View>
                
                <Text style={styles.experienceText}>
                  {priest.experience_years} years experience
                </Text>
                
                <View style={styles.specializationsRow}>
                  {(priest.specializations || []).slice(0, 2).map((spec, index) => (
                    <View key={index} style={styles.specTag}>
                      <Text style={styles.specTagText}>{spec}</Text>
                    </View>
                  ))}
                  {(priest.specializations?.length || 0) > 2 && (
                    <Text style={styles.moreText}>+{priest.specializations.length - 2}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.priestActions}>
                <Text style={styles.priceText}>₹{priest.hourly_rate || 500}/hr</Text>
                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => navigation.navigate('BookPriest', { priest })}
                >
                  <Text style={styles.bookButtonText}>Book</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
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
  searchContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.gray[800],
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.saffron,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 16,
  },
  priestCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  priestAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  priestInfo: {
    flex: 1,
  },
  priestName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  experienceText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  specializationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  specTag: {
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  specTagText: {
    fontSize: 10,
    color: COLORS.saffronDark || COLORS.saffron,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  priestActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.saffron,
    marginBottom: 8,
  },
  bookButton: {
    backgroundColor: COLORS.saffron,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bookButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default PriestsListScreen;
