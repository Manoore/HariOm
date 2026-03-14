import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../lib/api';

const Tab = createBottomTabNavigator();

// Home Tab
function HomeTab({ navigation }) {
  const { user } = useAuth();
  const [priests, setPriests] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [priestsRes, festivalsRes] = await Promise.all([
        api.get('/api/priests?limit=3'),
        api.get('/api/festivals'),
      ]);
      setPriests(priestsRes.data.priests || []);
      setFestivals((festivalsRes.data.festivals || []).slice(0, 3));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FFF8E7', '#FFF5E0']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Namaste,</Text>
          <Text style={styles.userName}>{user?.name || 'Devotee'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'people', label: 'Priests', screen: 'Priests' },
            { icon: 'sparkles', label: 'Horoscope', screen: 'Astrology' },
            { icon: 'cart', label: 'Shop', screen: 'Shop' },
            { icon: 'business', label: 'Temples', screen: 'Home' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Ionicons name={item.icon} size={24} color="#FF9933" />
              <Text style={styles.quickActionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Festivals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Festivals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {festivals.map((festival) => (
              <LinearGradient
                key={festival.id}
                colors={['#FF9933', '#FFD700']}
                style={styles.festivalCard}
              >
                <Ionicons name="calendar" size={20} color="white" />
                <Text style={styles.festivalName}>{festival.name}</Text>
                <Text style={styles.festivalDate}>{festival.date}</Text>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>

        {/* Featured Priests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Priests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Priests')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color="#FF9933" />
          ) : (
            priests.map((priest) => (
              <TouchableOpacity key={priest.id} style={styles.priestCard}>
                <View style={styles.priestAvatar}>
                  <Text style={styles.priestInitial}>{priest.user_name?.charAt(0)}</Text>
                </View>
                <View style={styles.priestInfo}>
                  <Text style={styles.priestName}>{priest.user_name}</Text>
                  <Text style={styles.priestSpecialization}>
                    {priest.specializations?.slice(0, 2).join(', ')}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {priest.rating} ({priest.total_reviews})
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// Priests Tab
function PriestsTab() {
  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchPriests();
  }, [filter]);

  const fetchPriests = async () => {
    try {
      const params = filter ? `?specialization=${filter}` : '';
      const res = await api.get(`/api/priests${params}`);
      setPriests(res.data.priests || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'Vedic Rituals', 'Homam', 'Pooja', 'Ceremony'];

  return (
    <LinearGradient colors={['#FFF8E7', '#FFF5E0']} style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Book a Priest</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                (f === 'All' && !filter) || filter === f ? styles.filterChipActive : {},
              ]}
              onPress={() => setFilter(f === 'All' ? '' : f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  (f === 'All' && !filter) || filter === f ? styles.filterChipTextActive : {},
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF9933" style={styles.loader} />
      ) : (
        <FlatList
          data={priests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.priestCardLarge}>
              <View style={styles.priestAvatarLarge}>
                <Text style={styles.priestInitialLarge}>{item.user_name?.charAt(0)}</Text>
              </View>
              <View style={styles.priestInfoLarge}>
                <View style={styles.priestNameRow}>
                  <Text style={styles.priestNameLarge}>{item.user_name}</Text>
                  {item.is_verified && (
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  )}
                </View>
                <Text style={styles.priestExperience}>{item.experience_years} years experience</Text>
                <View style={styles.specializationRow}>
                  {item.specializations?.slice(0, 2).map((s, i) => (
                    <View key={i} style={styles.specializationChip}>
                      <Text style={styles.specializationText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.priestRating}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratingBadgeText}>{item.rating}</Text>
                </View>
                <Text style={styles.reviewCount}>{item.total_reviews} reviews</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </LinearGradient>
  );
}

// Astrology Tab
function AstrologyTab() {
  const signs = [
    { name: 'Aries', symbol: '♈' },
    { name: 'Taurus', symbol: '♉' },
    { name: 'Gemini', symbol: '♊' },
    { name: 'Cancer', symbol: '♋' },
    { name: 'Leo', symbol: '♌' },
    { name: 'Virgo', symbol: '♍' },
    { name: 'Libra', symbol: '♎' },
    { name: 'Scorpio', symbol: '♏' },
    { name: 'Sagittarius', symbol: '♐' },
    { name: 'Capricorn', symbol: '♑' },
    { name: 'Aquarius', symbol: '♒' },
    { name: 'Pisces', symbol: '♓' },
  ];

  const [selectedSign, setSelectedSign] = useState(null);
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHoroscope = async (sign) => {
    setSelectedSign(sign);
    setLoading(true);
    try {
      const res = await api.get(`/api/horoscope/daily/${sign.name.toLowerCase()}`);
      setHoroscope(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch horoscope');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.astrologyContent}>
        <Text style={styles.astrologyTitle}>Daily Horoscope</Text>
        <Text style={styles.astrologySubtitle}>Select your zodiac sign</Text>

        <View style={styles.zodiacGrid}>
          {signs.map((sign) => (
            <TouchableOpacity
              key={sign.name}
              style={[
                styles.zodiacCard,
                selectedSign?.name === sign.name && styles.zodiacCardActive,
              ]}
              onPress={() => fetchHoroscope(sign)}
            >
              <Text style={styles.zodiacSymbol}>{sign.symbol}</Text>
              <Text style={styles.zodiacName}>{sign.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && <ActivityIndicator color="#818CF8" style={styles.loader} />}

        {horoscope && !loading && (
          <View style={styles.horoscopeResult}>
            <Text style={styles.horoscopeSymbol}>{selectedSign?.symbol}</Text>
            <Text style={styles.horoscopeSign}>{horoscope.zodiac_sign}</Text>
            <Text style={styles.horoscopePrediction}>{horoscope.daily_prediction}</Text>
            <View style={styles.horoscopeStats}>
              <View style={styles.horoscopeStat}>
                <Text style={styles.statLabel}>Lucky Number</Text>
                <Text style={styles.statValue}>{horoscope.lucky_number}</Text>
              </View>
              <View style={styles.horoscopeStat}>
                <Text style={styles.statLabel}>Lucky Color</Text>
                <Text style={styles.statValue}>{horoscope.lucky_color}</Text>
              </View>
              <View style={styles.horoscopeStat}>
                <Text style={styles.statLabel}>Mood</Text>
                <Text style={styles.statValue}>{horoscope.mood}</Text>
              </View>
              <View style={styles.horoscopeStat}>
                <Text style={styles.statLabel}>Compatibility</Text>
                <Text style={styles.statValue}>{horoscope.compatibility}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// Shop Tab
function ShopTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    const success = await addToCart(productId, 1);
    if (success) {
      Alert.alert('Success', 'Added to cart!');
    } else {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LinearGradient colors={['#FFF8E7', '#FFF5E0']} style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Pooja Store</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF9933" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productGrid}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productImage}>
                <Ionicons name="cube" size={32} color="rgba(255, 153, 51, 0.3)" />
              </View>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.productRating}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.productRatingText}>{item.rating}</Text>
              </View>
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToCart(item.id)}
                >
                  <Ionicons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </LinearGradient>
  );
}

// Profile Tab
function ProfileTab() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [bookingsRes, ordersRes] = await Promise.all([
        api.get('/api/bookings'),
        api.get('/api/orders'),
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <LinearGradient colors={['#FFF8E7', '#FFF5E0']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.profileContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>{user?.name?.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
          </View>
        </View>

        {/* My Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Bookings</Text>
          {bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color="#CCC" />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          ) : (
            bookings.slice(0, 3).map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View>
                  <Text style={styles.bookingService}>{booking.service_name}</Text>
                  <Text style={styles.bookingPriest}>{booking.priest_name}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    booking.status === 'confirmed' && styles.statusConfirmed,
                    booking.status === 'pending' && styles.statusPending,
                    booking.status === 'completed' && styles.statusCompleted,
                  ]}
                >
                  <Text style={styles.statusText}>{booking.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

// Main Dashboard Component with Bottom Tabs
export default function DevoteeDashboard() {
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Priests') iconName = 'star';
          else if (route.name === 'Astrology') iconName = 'sunny';
          else if (route.name === 'Shop') iconName = 'cart';
          else if (route.name === 'Profile') iconName = 'person';

          return (
            <View>
              <Ionicons
                name={focused ? iconName : `${iconName}-outline`}
                size={size}
                color={color}
              />
              {route.name === 'Shop' && cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          );
        },
        tabBarActiveTintColor: '#FF9933',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#FFEDD5',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Priests" component={PriestsTab} />
      <Tab.Screen name="Astrology" component={AstrologyTab} />
      <Tab.Screen name="Shop" component={ShopTab} />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
    marginTop: 50,
  },
  greeting: {
    color: '#666',
    fontSize: 14,
  },
  userName: {
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#722F37',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '23%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 12,
  },
  seeAll: {
    color: '#FF9933',
    fontSize: 14,
  },
  festivalCard: {
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 140,
  },
  festivalName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 8,
  },
  festivalDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  priestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9933',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  priestInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  priestInfo: {
    flex: 1,
  },
  priestName: {
    fontWeight: '600',
    color: '#333',
    fontSize: 15,
  },
  priestSpecialization: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: '#666',
    fontSize: 11,
    marginLeft: 4,
  },
  // Page styles
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  pageTitle: {
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  filterChipActive: {
    backgroundColor: '#FF9933',
    borderColor: '#FF9933',
  },
  filterChipText: {
    color: '#666',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: 'white',
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  priestCardLarge: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priestAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FF9933',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  priestInitialLarge: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  priestInfoLarge: {
    flex: 1,
  },
  priestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priestNameLarge: {
    fontWeight: '600',
    color: '#333',
    fontSize: 16,
  },
  priestExperience: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  specializationRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  specializationChip: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  specializationText: {
    color: '#C2410C',
    fontSize: 11,
  },
  priestRating: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadgeText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  reviewCount: {
    color: '#999',
    fontSize: 11,
    marginTop: 2,
  },
  // Astrology styles
  astrologyContent: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 100,
  },
  astrologyTitle: {
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  astrologySubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 20,
  },
  zodiacGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  zodiacCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zodiacCardActive: {
    backgroundColor: '#6366F1',
  },
  zodiacSymbol: {
    fontSize: 24,
    marginBottom: 4,
  },
  zodiacName: {
    color: '#E2E8F0',
    fontSize: 10,
  },
  horoscopeResult: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  horoscopeSymbol: {
    fontSize: 48,
    marginBottom: 8,
  },
  horoscopeSign: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  horoscopePrediction: {
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  horoscopeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  horoscopeStat: {
    width: '47%',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Shop styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  productGrid: {
    padding: 12,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    aspectRatio: 1,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontWeight: '500',
    color: '#333',
    fontSize: 13,
    marginBottom: 4,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productRatingText: {
    color: '#666',
    fontSize: 11,
    marginLeft: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: '#FF9933',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addButton: {
    backgroundColor: '#FF9933',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile styles
  profileContent: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 100,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF9933',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitial: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#722F37',
  },
  profileEmail: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  emptyText: {
    color: '#999',
    marginTop: 8,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  bookingService: {
    fontWeight: '600',
    color: '#333',
  },
  bookingPriest: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusConfirmed: {
    backgroundColor: '#DBEAFE',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF9933',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
