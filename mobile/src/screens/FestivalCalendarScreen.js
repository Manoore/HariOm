import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';

const FestivalCalendarScreen = ({ navigation }) => {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchFestivals();
  }, []);

  const fetchFestivals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/festivals');
      setFestivals(response.data.festivals || response.data || []);
    } catch (error) {
      console.log('Error fetching festivals:', error);
      // Sample data
      setFestivals([
        { id: '1', name: 'Maha Shivaratri', date: '2026-02-26', type: 'Major Festival', description: 'The great night of Lord Shiva' },
        { id: '2', name: 'Holi', date: '2026-03-17', type: 'Major Festival', description: 'Festival of colors' },
        { id: '3', name: 'Ugadi/Gudi Padwa', date: '2026-03-22', type: 'New Year', description: 'Hindu New Year' },
        { id: '4', name: 'Ram Navami', date: '2026-03-30', type: 'Major Festival', description: 'Birth of Lord Rama' },
        { id: '5', name: 'Hanuman Jayanti', date: '2026-04-05', type: 'Festival', description: 'Birth of Lord Hanuman' },
        { id: '6', name: 'Akshaya Tritiya', date: '2026-04-21', type: 'Auspicious Day', description: 'Day of eternal prosperity' },
        { id: '7', name: 'Buddha Purnima', date: '2026-05-04', type: 'Festival', description: 'Birth of Buddha' },
        { id: '8', name: 'Rath Yatra', date: '2026-06-28', type: 'Major Festival', description: 'Chariot festival of Lord Jagannath' },
        { id: '9', name: 'Guru Purnima', date: '2026-07-13', type: 'Festival', description: 'Day to honor gurus' },
        { id: '10', name: 'Raksha Bandhan', date: '2026-08-09', type: 'Festival', description: 'Bond of protection between siblings' },
        { id: '11', name: 'Janmashtami', date: '2026-08-15', type: 'Major Festival', description: 'Birth of Lord Krishna' },
        { id: '12', name: 'Ganesh Chaturthi', date: '2026-08-27', type: 'Major Festival', description: 'Birth of Lord Ganesha' },
        { id: '13', name: 'Navratri Begins', date: '2026-09-28', type: 'Major Festival', description: '9 nights of Goddess Durga worship' },
        { id: '14', name: 'Dussehra', date: '2026-10-06', type: 'Major Festival', description: 'Victory of good over evil' },
        { id: '15', name: 'Diwali', date: '2026-10-21', type: 'Major Festival', description: 'Festival of lights' },
        { id: '16', name: 'Chhath Puja', date: '2026-10-26', type: 'Festival', description: 'Worship of Sun God' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFestivals();
    setRefreshing(false);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Major Festival': return '#EF4444';
      case 'New Year': return '#8B5CF6';
      case 'Auspicious Day': return '#10B981';
      default: return COLORS.saffron;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getDaysUntil = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return 'Passed';
    if (diff === 0) return 'Today!';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  const filteredFestivals = festivals.filter(f => {
    const date = new Date(f.date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const upcomingFestivals = festivals
    .filter(f => new Date(f.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Festival Calendar</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="notifications-outline" size={24} color={COLORS.saffron} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {/* Upcoming Festivals Banner */}
        {upcomingFestivals.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Upcoming Festivals</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingScroll}
            >
              {upcomingFestivals.map((festival) => (
                <TouchableOpacity 
                  key={festival.id}
                  style={styles.upcomingCard}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[getTypeColor(festival.type), getTypeColor(festival.type) + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.upcomingGradient}
                  >
                    <View style={styles.upcomingBadge}>
                      <Text style={styles.upcomingBadgeText}>{getDaysUntil(festival.date)}</Text>
                    </View>
                    <Text style={styles.upcomingName}>{festival.name}</Text>
                    <Text style={styles.upcomingDate}>{formatDate(festival.date)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity 
            style={styles.monthArrow}
            onPress={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(y => y - 1);
              } else {
                setSelectedMonth(m => m - 1);
              }
            }}
          >
            <Icon name="chevron-back" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {months[selectedMonth]} {selectedYear}
          </Text>
          
          <TouchableOpacity 
            style={styles.monthArrow}
            onPress={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(y => y + 1);
              } else {
                setSelectedMonth(m => m + 1);
              }
            }}
          >
            <Icon name="chevron-forward" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* Festivals List for Selected Month */}
        <View style={styles.content}>
          {filteredFestivals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="calendar-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyText}>No festivals in {months[selectedMonth]}</Text>
            </View>
          ) : (
            filteredFestivals.map((festival) => (
              <TouchableOpacity 
                key={festival.id} 
                style={styles.festivalCard}
                activeOpacity={0.8}
              >
                <View style={[styles.dateBadge, { backgroundColor: getTypeColor(festival.type) }]}>
                  <Text style={styles.dateDay}>
                    {new Date(festival.date).getDate()}
                  </Text>
                  <Text style={styles.dateMonth}>
                    {months[new Date(festival.date).getMonth()].slice(0, 3)}
                  </Text>
                </View>
                
                <View style={styles.festivalInfo}>
                  <View style={styles.festivalHeader}>
                    <Text style={styles.festivalName}>{festival.name}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(festival.type)}15` }]}>
                      <Text style={[styles.typeText, { color: getTypeColor(festival.type) }]}>
                        {festival.type}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.festivalDesc} numberOfLines={2}>{festival.description}</Text>
                  <Text style={styles.festivalDays}>{getDaysUntil(festival.date)}</Text>
                </View>
                
                <TouchableOpacity style={styles.reminderButton}>
                  <Icon name="notifications-outline" size={20} color={COLORS.saffron} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
        
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
  headerIcon: {
    padding: 4,
  },
  upcomingSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  upcomingScroll: {
    paddingHorizontal: 16,
  },
  upcomingCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  upcomingGradient: {
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
  },
  upcomingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  upcomingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  upcomingName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  upcomingDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  monthArrow: {
    padding: 4,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.maroon,
  },
  content: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 12,
  },
  festivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  dateBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  dateMonth: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },
  festivalInfo: {
    flex: 1,
  },
  festivalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  festivalName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  festivalDesc: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  festivalDays: {
    fontSize: 11,
    color: COLORS.saffron,
    fontWeight: '500',
  },
  reminderButton: {
    padding: 8,
  },
});

export default FestivalCalendarScreen;
