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
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';

const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bookings/my-bookings');
      setBookings(response.data.bookings || response.data || []);
    } catch (error) {
      console.log('Error fetching bookings:', error);
      // Sample data
      setBookings([
        {
          id: '1',
          priest_name: 'Pandit Ramesh Sharma',
          puja_type: 'Satyanarayan Pooja',
          date: '2026-03-25',
          time: '10:00 AM',
          status: 'confirmed',
          amount: 2100,
          location: 'Home Visit',
        },
        {
          id: '2',
          priest_name: 'Pandit Suresh Verma',
          puja_type: 'Griha Pravesh',
          date: '2026-04-05',
          time: '9:00 AM',
          status: 'pending',
          amount: 5100,
          location: 'Home Visit',
        },
        {
          id: '3',
          priest_name: 'Acharya Deepak Joshi',
          puja_type: 'Kundali Reading',
          date: '2026-03-10',
          time: '4:00 PM',
          status: 'completed',
          amount: 1500,
          location: 'Online',
        },
        {
          id: '4',
          priest_name: 'Pandit Ramesh Sharma',
          puja_type: 'Ganesh Puja',
          date: '2026-02-20',
          time: '11:00 AM',
          status: 'cancelled',
          amount: 1500,
          location: 'Home Visit',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleCancelBooking = (booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your ${booking.puja_type} booking?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            setBookings(bookings.map(b => 
              b.id === booking.id ? { ...b, status: 'cancelled' } : b
            ));
            Alert.alert('Cancelled', 'Your booking has been cancelled.');
          }
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'completed': return '#6366F1';
      case 'cancelled': return '#EF4444';
      default: return COLORS.gray[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'completed': return 'checkmark-done-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === 'upcoming') {
      return bookingDate >= today && booking.status !== 'cancelled' && booking.status !== 'completed';
    } else {
      return bookingDate < today || booking.status === 'cancelled' || booking.status === 'completed';
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' 
                ? 'Book a priest for your puja needs'
                : 'Your past bookings will appear here'}
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.bookNowButton}
                onPress={() => navigation.navigate('Priests')}
              >
                <Text style={styles.bookNowText}>Book a Priest</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              {/* Status Badge */}
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
                  <Icon name={getStatusIcon(booking.status)} size={14} color={getStatusColor(booking.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.bookingAmount}>₹{booking.amount}</Text>
              </View>

              {/* Puja Info */}
              <Text style={styles.pujaType}>{booking.puja_type}</Text>
              <Text style={styles.priestName}>with {booking.priest_name}</Text>

              {/* Date & Time */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Icon name="calendar-outline" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Icon name="time-outline" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.detailText}>{booking.time}</Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.detailItem}>
                <Icon name="location-outline" size={16} color={COLORS.gray[500]} />
                <Text style={styles.detailText}>{booking.location}</Text>
              </View>

              {/* Actions */}
              {booking.status === 'confirmed' || booking.status === 'pending' ? (
                <View style={styles.actionsRow}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelBooking(booking)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactButton}>
                    <Icon name="chatbubble-outline" size={18} color={COLORS.saffron} />
                    <Text style={styles.contactButtonText}>Contact</Text>
                  </TouchableOpacity>
                </View>
              ) : booking.status === 'completed' ? (
                <TouchableOpacity style={styles.reviewButton}>
                  <Icon name="star-outline" size={18} color={COLORS.white} />
                  <Text style={styles.reviewButtonText}>Write a Review</Text>
                </TouchableOpacity>
              ) : null}
            </View>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.saffron,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  tabTextActive: {
    color: COLORS.white,
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
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  bookNowButton: {
    backgroundColor: COLORS.saffron,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  bookNowText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  pujaType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  priestName: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.saffron,
  },
  contactButtonText: {
    color: COLORS.saffron,
    fontWeight: '600',
    fontSize: 13,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.saffron,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  reviewButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MyBookingsScreen;
