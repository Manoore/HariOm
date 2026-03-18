import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/Button';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import StoreScreen from '../screens/StoreScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AstrologyScreen from '../screens/AstrologyScreen';
import VedicClassesScreen from '../screens/VedicClassesScreen';
import SpiritualFeedScreen from '../screens/SpiritualFeedScreen';
import PriestsListScreen from '../screens/PriestsListScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ConsultationScreen from '../screens/ConsultationScreen';
import FestivalCalendarScreen from '../screens/FestivalCalendarScreen';
import MantrasShlokaScreen from '../screens/MantrasShlokaScreen';
import LiveEventsFullScreen from '../screens/LiveEventsFullScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Bar Icon Component
const TabIcon = ({ name, focused }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
    <Ionicons 
      name={focused ? name : `${name}-outline`} 
      size={24} 
      color={focused ? COLORS.saffron : COLORS.gray[400]} 
    />
    {focused && <View style={styles.tabIndicator} />}
  </View>
);

// ============ PLACEHOLDER SCREENS ============

// Product Detail Screen
const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params || {};
  const { addToCart } = useCart();
  const [quantity, setQuantity] = React.useState(1);

  const handleAddToCart = async () => {
    if (product?.id) {
      await addToCart(product.id, quantity);
      Alert.alert('Success', 'Added to cart!', [
        { text: 'Continue Shopping', onPress: () => navigation.goBack() },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.productImageLarge}>
          {product?.images?.[0] ? (
            <Image source={{ uri: product.images[0] }} style={styles.productImg} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="cube-outline" size={80} color={COLORS.gray[300]} />
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product?.name || 'Product Name'}</Text>
          <Text style={styles.productPrice}>₹{product?.price || 0}</Text>
          <Text style={styles.productDesc}>{product?.description || 'No description available'}</Text>
          
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={COLORS.saffron} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color={COLORS.saffron} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomBar}>
        <Button title="Add to Cart" onPress={handleAddToCart} style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
};

// Priest Detail Screen
const PriestDetailScreen = ({ route, navigation }) => {
  const { priest } = route.params || {};

  const handleBook = () => {
    Alert.alert('Book Priest', 'Booking functionality coming soon!');
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Priest Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.priestProfile}>
          <View style={styles.priestAvatarLarge}>
            <Text style={styles.avatarTextLarge}>
              {priest?.user_name?.charAt(0)?.toUpperCase() || 'P'}
            </Text>
          </View>
          <Text style={styles.priestNameLarge}>{priest?.user_name || 'Priest Name'}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color={COLORS.gold} />
            <Text style={styles.ratingText}>{priest?.rating || 4.8} ({priest?.total_reviews || 0} reviews)</Text>
          </View>
          <Text style={styles.experienceText}>{priest?.experience_years || 0} years experience</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{priest?.bio || 'No bio available'}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.tagsContainer}>
            {(priest?.specializations || ['Vedic Rituals', 'Puja']).map((spec, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <Text style={styles.priceText}>₹{priest?.hourly_rate || 500}/hour</Text>
        </View>
      </ScrollView>
      
      <View style={styles.bottomBar}>
        <Button title="Book Now" onPress={handleBook} style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
};

// Notifications Screen
const NotificationsScreen = ({ navigation }) => (
  <SafeAreaView style={styles.screenContainer}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notifications</Text>
      <View style={{ width: 24 }} />
    </View>
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>You're all caught up!</Text>
    </View>
  </SafeAreaView>
);

// Search Screen
const SearchScreen = ({ route, navigation }) => {
  const { query } = route.params || {};
  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search: {query}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={64} color={COLORS.gray[300]} />
        <Text style={styles.emptyTitle}>Search Results</Text>
        <Text style={styles.emptyText}>Search functionality coming soon</Text>
      </View>
    </SafeAreaView>
  );
};

// Priests List Screen
const PriestsScreen = ({ navigation }) => (
  <SafeAreaView style={styles.screenContainer}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Book a Priest</Text>
      <View style={{ width: 24 }} />
    </View>
    <View style={styles.emptyState}>
      <Ionicons name="flame-outline" size={64} color={COLORS.saffron} />
      <Text style={styles.emptyTitle}>Find Priests</Text>
      <Text style={styles.emptyText}>Browse verified priests for your puja</Text>
      <Button 
        title="Coming Soon" 
        variant="outline" 
        style={{ marginTop: 20 }}
        onPress={() => navigation.goBack()}
      />
    </View>
  </SafeAreaView>
);

// Chat Screen
const ChatScreen = ({ navigation }) => (
  <SafeAreaView style={styles.screenContainer}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Messages</Text>
      <View style={{ width: 24 }} />
    </View>
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={COLORS.success} />
      <Text style={styles.emptyTitle}>No Messages</Text>
      <Text style={styles.emptyText}>Start a conversation with priests or astrologers</Text>
    </View>
  </SafeAreaView>
);

// Services Screen
const ServicesScreen = ({ navigation }) => (
  <SafeAreaView style={styles.screenContainer}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Puja Services</Text>
      <View style={{ width: 24 }} />
    </View>
    <ScrollView style={styles.content}>
      {[
        { name: 'Satyanarayana Puja', price: '2,100', duration: '2 hours' },
        { name: 'Griha Pravesh', price: '5,100', duration: '3 hours' },
        { name: 'Navagraha Shanti', price: '4,500', duration: '2.5 hours' },
        { name: 'Rudrabhishekam', price: '3,100', duration: '1.5 hours' },
        { name: 'Ganesh Puja', price: '1,500', duration: '1 hour' },
        { name: 'Lakshmi Puja', price: '1,800', duration: '1.5 hours' },
      ].map((service, i) => (
        <TouchableOpacity key={i} style={styles.serviceItem}>
          <View style={styles.serviceIcon}>
            <Ionicons name="flame-outline" size={24} color={COLORS.saffron} />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDuration}>{service.duration}</Text>
          </View>
          <Text style={styles.servicePrice}>₹{service.price}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </SafeAreaView>
);

// Festival Detail Screen
const FestivalDetailScreen = ({ route, navigation }) => {
  const { festival } = route.params || {};
  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Festival Details</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.festivalHeader}>
          <Ionicons name="calendar" size={48} color={COLORS.saffron} />
          <Text style={styles.festivalName}>{festival?.name || 'Festival'}</Text>
          <Text style={styles.festivalDate}>{festival?.date || 'Date TBD'}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{festival?.description || 'Details coming soon'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Festivals List Screen
const FestivalsScreen = ({ navigation }) => (
  <SafeAreaView style={styles.screenContainer}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Upcoming Festivals</Text>
      <View style={{ width: 24 }} />
    </View>
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={COLORS.saffron} />
      <Text style={styles.emptyTitle}>Festival Calendar</Text>
      <Text style={styles.emptyText}>View all upcoming Hindu festivals</Text>
    </View>
  </SafeAreaView>
);

// Mantras & Music Screen
const MantrasScreen = ({ navigation }) => (
  <SafeAreaView style={styles.screenContainer}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Mantras & Shlokas</Text>
      <View style={{ width: 24 }} />
    </View>
    <ScrollView style={styles.content}>
      {[
        { name: 'Gayatri Mantra', description: 'Most powerful Vedic hymn', duration: '3:45' },
        { name: 'Om Namah Shivaya', description: 'Sacred mantra for Lord Shiva', duration: '5:20' },
        { name: 'Hanuman Chalisa', description: '40 verses praising Hanuman', duration: '8:15' },
        { name: 'Vishnu Sahasranama', description: '1000 names of Lord Vishnu', duration: '25:00' },
        { name: 'Lalitha Sahasranama', description: '1000 names of Goddess Lalitha', duration: '30:00' },
        { name: 'Mahamrityunjaya Mantra', description: 'Mantra for healing and longevity', duration: '4:30' },
      ].map((mantra, i) => (
        <TouchableOpacity key={i} style={styles.serviceItem}>
          <View style={[styles.serviceIcon, { backgroundColor: 'rgba(244, 114, 182, 0.1)' }]}>
            <Ionicons name="musical-notes" size={24} color="#F472B6" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{mantra.name}</Text>
            <Text style={styles.serviceDuration}>{mantra.description}</Text>
          </View>
          <TouchableOpacity style={{ padding: 8 }}>
            <Ionicons name="play-circle" size={32} color={COLORS.saffron} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </SafeAreaView>
);

// Live Events Screen
const LiveEventsScreen = ({ navigation }) => (
  <SafeAreaView style={styles.screenContainer}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Live Events</Text>
      <View style={{ width: 24 }} />
    </View>
    <View style={styles.emptyState}>
      <Ionicons name="videocam-outline" size={64} color="#EF4444" />
      <Text style={styles.emptyTitle}>Live Spiritual Events</Text>
      <Text style={styles.emptyText}>Watch live pujas, satsangs, and spiritual discourses</Text>
      <Button 
        title="Coming Soon" 
        variant="outline" 
        style={{ marginTop: 20 }}
        onPress={() => navigation.goBack()}
      />
    </View>
  </SafeAreaView>
);

// ============ TAB NAVIGATOR ============

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.saffron,
        tabBarInactiveTintColor: COLORS.gray[400],
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Store" 
        component={StoreScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="storefront" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Astrology" 
        component={AstrologyScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="planet" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// ============ ROOT NAVIGATOR ============

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="PriestDetail" component={PriestDetailScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Priests" component={PriestsListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Services" component={ServicesScreen} />
            <Stack.Screen name="ServiceDetail" component={ServicesScreen} />
            <Stack.Screen name="FestivalDetail" component={FestivalDetailScreen} />
            <Stack.Screen name="Festivals" component={FestivalsScreen} />
            <Stack.Screen name="BookPriest" component={PriestDetailScreen} />
            <Stack.Screen name="Mantras" component={MantrasScreen} />
            <Stack.Screen name="LiveEvents" component={LiveEventsScreen} />
            <Stack.Screen name="VedicClasses" component={VedicClassesScreen} />
            <Stack.Screen name="SpiritualFeed" component={SpiritualFeedScreen} />
            <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="Consultation" component={ConsultationScreen} />
            <Stack.Screen name="FestivalCalendar" component={FestivalCalendarScreen} />
            <Stack.Screen name="MantrasLibrary" component={MantrasShlokaScreen} />
            <Stack.Screen name="LiveEventsScreen" component={LiveEventsFullScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ============ STYLES ============

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainerActive: {},
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.saffron,
  },
  screenContainer: {
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
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  productImageLarge: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.gray[100],
    borderRadius: 16,
    overflow: 'hidden',
  },
  productImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.saffron,
    marginBottom: 16,
  },
  productDesc: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 22,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  quantityLabel: {
    fontSize: 16,
    color: COLORS.gray[700],
    marginRight: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.saffron,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 30,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  addressText: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.gray[800],
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  paymentText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[700],
    marginLeft: 12,
  },
  priestProfile: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  priestAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  priestNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.maroon,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 6,
  },
  experienceText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  bioText: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.saffronDark,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  serviceDuration: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  festivalHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  festivalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.maroon,
    marginTop: 16,
  },
  festivalDate: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 8,
  },
});

export default AppNavigator;
