import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/theme';
import { ProductCard, PriestCard, FestivalCard, ServiceCard } from '../components/Cards';
import { SearchInput } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { priestAPI, productAPI, festivalAPI } from '../services/api';

const { width } = Dimensions.get('window');

// Quick Action Item
const QuickAction = ({ icon, label, onPress, color = COLORS.saffron }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// Section Header
const SectionHeader = ({ title, onSeeAll }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
        <Text style={styles.seeAllText}>See All</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.saffron} />
      </TouchableOpacity>
    )}
  </View>
);

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { cartItemCount, addToCart } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [priests, setPriests] = useState([]);
  const [products, setProducts] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [priestsRes, productsRes, festivalsRes] = await Promise.all([
        priestAPI.getAll({ limit: 3 }),
        productAPI.getAll({ limit: 6 }),
        festivalAPI.getAll(),
      ]);
      
      setPriests(priestsRes.data.priests || []);
      setProducts(productsRes.data.products || []);
      setFestivals((festivalsRes.data.festivals || []).slice(0, 4));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAddToCart = async (product) => {
    const result = await addToCart(product.id);
    if (result.success) {
      // Show success feedback
    }
  };

  const quickActions = [
    { icon: 'flame-outline', label: 'Book Puja', color: COLORS.saffron, screen: 'Priests' },
    { icon: 'planet-outline', label: 'Astrology', color: '#818CF8', screen: 'Astrology' },
    { icon: 'storefront-outline', label: 'Shop', color: COLORS.gold, screen: 'Store' },
    { icon: 'chatbubbles-outline', label: 'Chat', color: COLORS.success, screen: 'Chat' },
  ];

  const services = [
    { name: 'Satyanarayana', price: '2,100', duration: '2 hrs', icon: 'flame-outline' },
    { name: 'Griha Pravesh', price: '5,100', duration: '3 hrs', icon: 'home-outline' },
    { name: 'Navagraha', price: '4,500', duration: '2.5 hrs', icon: 'planet-outline' },
    { name: 'Rudrabhishek', price: '3,100', duration: '1.5 hrs', icon: 'water-outline' },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Devotee'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.gray[700]} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="cart-outline" size={24} color={COLORS.gray[700]} />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search priests, products, services..."
            onSubmit={() => navigation.navigate('Search', { query: searchQuery })}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => (
            <QuickAction
              key={index}
              icon={action.icon}
              label={action.label}
              color={action.color}
              onPress={() => navigation.navigate(action.screen)}
            />
          ))}
        </View>

        {/* Upcoming Festival Banner */}
        {festivals.length > 0 && (
          <TouchableOpacity style={styles.festivalBanner}>
            <LinearGradient
              colors={GRADIENTS.sunrise}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.festivalBannerGradient}
            >
              <View style={styles.festivalBannerContent}>
                <View>
                  <Text style={styles.festivalBannerLabel}>Next Festival</Text>
                  <Text style={styles.festivalBannerTitle}>{festivals[0].name}</Text>
                  <Text style={styles.festivalBannerDate}>{festivals[0].date}</Text>
                </View>
                <View style={styles.festivalBannerIcon}>
                  <Text style={styles.festivalEmoji}>🪔</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Popular Services */}
        <View style={styles.section}>
          <SectionHeader 
            title="Popular Puja Services" 
            onSeeAll={() => navigation.navigate('Services')} 
          />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {services.map((service, index) => (
              <ServiceCard 
                key={index} 
                service={service} 
                onPress={() => navigation.navigate('ServiceDetail', { service })}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Priests */}
        <View style={styles.section}>
          <SectionHeader 
            title="Top Priests" 
            onSeeAll={() => navigation.navigate('Priests')} 
          />
          {priests.map((priest, index) => (
            <PriestCard
              key={priest.id || index}
              priest={priest}
              onPress={() => navigation.navigate('PriestDetail', { priest })}
              onBook={() => navigation.navigate('BookPriest', { priest })}
            />
          ))}
        </View>

        {/* Upcoming Festivals */}
        <View style={styles.section}>
          <SectionHeader 
            title="Upcoming Festivals" 
            onSeeAll={() => navigation.navigate('Festivals')} 
          />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {festivals.map((festival, index) => (
              <FestivalCard 
                key={festival.id || index} 
                festival={festival} 
                onPress={() => navigation.navigate('FestivalDetail', { festival })}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <SectionHeader 
            title="Pooja Essentials" 
            onSeeAll={() => navigation.navigate('Store')} 
          />
          <View style={styles.productsGrid}>
            {products.slice(0, 4).map((product, index) => (
              <ProductCard
                key={product.id || index}
                product={product}
                onPress={() => navigation.navigate('ProductDetail', { product })}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {},
  greeting: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.maroon,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.saffron,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.small,
  },
  quickActionLabel: {
    fontSize: 12,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  festivalBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  festivalBannerGradient: {
    padding: 20,
  },
  festivalBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  festivalBannerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  festivalBannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  festivalBannerDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  festivalBannerIcon: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  festivalEmoji: {
    fontSize: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.maroon,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.saffron,
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
});

export default HomeScreen;
