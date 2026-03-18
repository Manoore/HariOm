import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';

const LiveEventsScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('live');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/live-events');
      setEvents(response.data.events || response.data || []);
    } catch (error) {
      console.log('Error fetching events:', error);
      // Sample data
      setEvents([
        {
          id: '1',
          title: 'Morning Aarti - Kashi Vishwanath Temple',
          host: 'Kashi Vishwanath Temple',
          type: 'Temple Aarti',
          isLive: true,
          viewers: 2450,
          thumbnail: null,
          scheduledAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Satyanarayan Katha Live',
          host: 'Pandit Ramesh Sharma',
          type: 'Puja',
          isLive: true,
          viewers: 890,
          thumbnail: null,
          scheduledAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Evening Satsang with Swami Vivekananda Ashram',
          host: 'Swami Ananda',
          type: 'Satsang',
          isLive: false,
          viewers: 0,
          thumbnail: null,
          scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          title: 'Bhagavad Gita Chapter 4 - Live Discussion',
          host: 'Acharya Deepak Joshi',
          type: 'Discourse',
          isLive: false,
          viewers: 0,
          thumbnail: null,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          title: 'Shiv Mahimna Stotram',
          host: 'Temple Music Group',
          type: 'Bhajan',
          isLive: false,
          viewers: 0,
          thumbnail: null,
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '6',
          title: 'Maha Shivaratri Special Abhishekam',
          host: 'Kedarnath Temple',
          type: 'Temple Puja',
          isLive: false,
          viewers: 0,
          thumbnail: null,
          scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleJoinEvent = (event) => {
    if (event.isLive) {
      Alert.alert('Joining Live', `Joining "${event.title}"...`, [{ text: 'OK' }]);
    } else {
      Alert.alert(
        'Set Reminder',
        `Would you like to be reminded when "${event.title}" goes live?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remind Me', onPress: () => Alert.alert('Reminder Set', 'We\'ll notify you when this event goes live!') },
        ]
      );
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Temple Aarti':
      case 'Temple Puja': return '#EF4444';
      case 'Puja': return COLORS.saffron;
      case 'Satsang': return '#8B5CF6';
      case 'Discourse': return '#3B82F6';
      case 'Bhajan': return '#EC4899';
      default: return COLORS.gray[500];
    }
  };

  const formatScheduledTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) return 'Started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) return `Starts in ${minutes}m`;
    if (hours < 24) return `Starts in ${hours}h ${minutes}m`;
    
    const days = Math.floor(hours / 24);
    return `In ${days} day${days > 1 ? 's' : ''}`;
  };

  const liveEvents = events.filter(e => e.isLive);
  const upcomingEvents = events.filter(e => !e.isLive);

  const displayEvents = selectedTab === 'live' ? liveEvents : upcomingEvents;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Events</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="calendar-outline" size={24} color={COLORS.saffron} />
        </TouchableOpacity>
      </View>

      {/* Live Now Banner */}
      {liveEvents.length > 0 && (
        <TouchableOpacity 
          style={styles.liveBanner}
          onPress={() => handleJoinEvent(liveEvents[0])}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.liveBannerGradient}
          >
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
            <Text style={styles.liveBannerTitle} numberOfLines={1}>
              {liveEvents[0].title}
            </Text>
            <View style={styles.liveBannerMeta}>
              <Text style={styles.liveBannerHost}>{liveEvents[0].host}</Text>
              <View style={styles.viewersCount}>
                <Icon name="eye" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.viewersText}>{liveEvents[0].viewers} watching</Text>
              </View>
            </View>
            <View style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Now</Text>
              <Icon name="arrow-forward" size={16} color="#EF4444" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'live' && styles.tabActive]}
          onPress={() => setSelectedTab('live')}
        >
          <View style={styles.tabContent}>
            {selectedTab === 'live' && <View style={styles.tabDot} />}
            <Text style={[styles.tabText, selectedTab === 'live' && styles.tabTextActive]}>
              Live ({liveEvents.length})
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcomingEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {displayEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon 
              name={selectedTab === 'live' ? "videocam-off-outline" : "calendar-outline"} 
              size={64} 
              color={COLORS.gray[300]} 
            />
            <Text style={styles.emptyTitle}>
              {selectedTab === 'live' ? 'No Live Events' : 'No Upcoming Events'}
            </Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'live' 
                ? 'Check back later for live spiritual events'
                : 'New events will be added soon'}
            </Text>
          </View>
        ) : (
          displayEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => handleJoinEvent(event)}
              activeOpacity={0.8}
            >
              <View style={styles.eventThumbnail}>
                <LinearGradient
                  colors={[getTypeColor(event.type), getTypeColor(event.type) + 'CC']}
                  style={styles.thumbnailGradient}
                >
                  <Icon name="videocam" size={32} color="#fff" />
                  {event.isLive && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveIndicatorText}>LIVE</Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
              
              <View style={styles.eventInfo}>
                <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(event.type)}20` }]}>
                  <Text style={[styles.typeText, { color: getTypeColor(event.type) }]}>{event.type}</Text>
                </View>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <Text style={styles.eventHost}>{event.host}</Text>
                
                <View style={styles.eventMeta}>
                  {event.isLive ? (
                    <View style={styles.viewersContainer}>
                      <Icon name="eye" size={14} color={COLORS.gray[500]} />
                      <Text style={styles.metaText}>{event.viewers} watching</Text>
                    </View>
                  ) : (
                    <View style={styles.timeContainer}>
                      <Icon name="time-outline" size={14} color={COLORS.gray[500]} />
                      <Text style={styles.metaText}>{formatScheduledTime(event.scheduledAt)}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.actionButton, event.isLive && styles.actionButtonLive]}
                onPress={() => handleJoinEvent(event)}
              >
                <Icon 
                  name={event.isLive ? "play" : "notifications-outline"} 
                  size={18} 
                  color={event.isLive ? COLORS.white : COLORS.saffron} 
                />
              </TouchableOpacity>
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
  headerIcon: {
    padding: 4,
  },
  liveBanner: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  liveBannerGradient: {
    padding: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  liveBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  liveBannerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveBannerHost: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  viewersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewersText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.saffron,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.saffron,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    ...SHADOWS.small,
  },
  eventThumbnail: {
    width: 100,
    height: 100,
  },
  thumbnailGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveIndicatorText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  eventInfo: {
    flex: 1,
    padding: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  eventHost: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  eventMeta: {
    marginTop: 'auto',
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gray[100],
  },
  actionButtonLive: {
    backgroundColor: '#EF4444',
  },
});

export default LiveEventsScreen;
