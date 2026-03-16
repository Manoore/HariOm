import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

// Zodiac Signs Data
const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'Earth' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'Air' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'Water' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth' },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'Air' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'Air' },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water' },
];

const ZodiacCard = ({ sign, isSelected, onPress }) => (
  <TouchableOpacity 
    style={[styles.zodiacCard, isSelected && styles.zodiacCardSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.zodiacSymbol, isSelected && styles.zodiacSymbolSelected]}>
      {sign.symbol}
    </Text>
    <Text style={[styles.zodiacName, isSelected && styles.zodiacNameSelected]}>
      {sign.name}
    </Text>
    <Text style={[styles.zodiacDates, isSelected && styles.zodiacDatesSelected]}>
      {sign.dates}
    </Text>
  </TouchableOpacity>
);

const ServiceCard = ({ icon, title, description, onPress }) => (
  <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient
      colors={['#1E293B', '#0F172A']}
      style={styles.serviceGradient}
    >
      <View style={styles.serviceIcon}>
        <Ionicons name={icon} size={28} color={COLORS.gold} />
      </View>
      <Text style={styles.serviceTitle}>{title}</Text>
      <Text style={styles.serviceDescription}>{description}</Text>
      <View style={styles.serviceArrow}>
        <Ionicons name="arrow-forward" size={16} color={COLORS.gold} />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const AstrologyScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedSign, setSelectedSign] = useState(null);

  const handleSignSelect = (sign) => {
    setSelectedSign(sign.name);
    Alert.alert(
      sign.name,
      `Your daily horoscope for ${sign.name}:\n\nToday is a great day for spiritual growth. Focus on your inner peace and meditation. Lucky color: Orange. Lucky number: 7.`,
      [{ text: 'OK' }]
    );
  };

  const handleServicePress = (service) => {
    Alert.alert(service, `${service} feature coming soon!`);
  };

  const handleAstrologerPress = (name) => {
    Alert.alert(
      'Book Consultation',
      `Would you like to book a consultation with ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => Alert.alert('Coming Soon', 'Video consultation feature coming soon!') }
      ]
    );
  };

  const services = [
    {
      icon: 'document-text-outline',
      title: 'Birth Chart (Kundli)',
      description: 'Get your detailed Vedic birth chart analysis',
    },
    {
      icon: 'calendar-outline',
      title: 'Daily Horoscope',
      description: 'Read your personalized daily predictions',
    },
    {
      icon: 'videocam-outline',
      title: 'Live Consultation',
      description: 'Talk to expert astrologers via video call',
    },
    {
      icon: 'heart-outline',
      title: 'Compatibility',
      description: 'Check Kundli matching for marriage',
    },
  ];

  const astrologers = [
    { name: 'Pandit Sharma', rating: '4.9', spec: 'Vedic Astrology', price: '15' },
    { name: 'Jyotishi Devi', rating: '4.8', spec: 'Numerology', price: '12' },
    { name: 'Acharya Verma', rating: '4.7', spec: 'Palmistry', price: '10' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.cosmicBg, COLORS.cosmicSurface]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Astrology</Text>
            <Text style={styles.headerSubtitle}>Discover your cosmic journey</Text>
          </View>
          
          {/* Cosmic decoration */}
          <View style={styles.cosmicDecoration}>
            <View style={styles.star1} />
            <View style={styles.star2} />
            <View style={styles.star3} />
          </View>
        </LinearGradient>

        {/* Daily Tip */}
        <View style={styles.tipContainer}>
          <LinearGradient
            colors={['rgba(129, 140, 248, 0.15)', 'rgba(129, 140, 248, 0.05)']}
            style={styles.tipGradient}
          >
            <Ionicons name="sparkles" size={20} color={COLORS.cosmicAccent} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Cosmic Tip of the Day</Text>
              <Text style={styles.tipText}>
                The moon is in its waxing phase. This is an auspicious time for new beginnings and spiritual practices.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Zodiac Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your Sign</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.zodiacScroll}
          >
            {ZODIAC_SIGNS.map((sign) => (
              <ZodiacCard
                key={sign.name}
                sign={sign}
                isSelected={selectedSign === sign.name}
                onPress={() => handleSignSelect(sign)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Astrology Services</Text>
          <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                icon={service.icon}
                title={service.title}
                description={service.description}
                onPress={() => handleServicePress(service.title)}
              />
            ))}
          </View>
        </View>

        {/* Featured Astrologers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Astrologers</Text>
            <TouchableOpacity onPress={() => Alert.alert('All Astrologers', 'View all astrologers feature coming soon!')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.astrologersScroll}
          >
            {astrologers.map((astrologer, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.astrologerCard}
                onPress={() => handleAstrologerPress(astrologer.name)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.astrologerGradient}
                >
                  <View style={styles.astrologerAvatar}>
                    <Text style={styles.avatarText}>{astrologer.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.astrologerName}>{astrologer.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color={COLORS.gold} />
                    <Text style={styles.ratingText}>{astrologer.rating}</Text>
                  </View>
                  <Text style={styles.astrologerSpec}>{astrologer.spec}</Text>
                  <Text style={styles.astrologerPrice}>₹{astrologer.price}/min</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cosmicBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    position: 'relative',
  },
  headerContent: {
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.cosmicAccent,
  },
  cosmicDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  star1: {
    position: 'absolute',
    top: 30,
    right: 40,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    opacity: 0.8,
  },
  star2: {
    position: 'absolute',
    top: 60,
    right: 80,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.white,
    opacity: 0.6,
  },
  star3: {
    position: 'absolute',
    top: 20,
    right: 100,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.cosmicAccent,
    opacity: 0.5,
  },
  tipContainer: {
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 24,
  },
  tipGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cosmicAccent,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.gray[400],
    lineHeight: 18,
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
    color: COLORS.white,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.cosmicAccent,
    fontWeight: '500',
  },
  zodiacScroll: {
    paddingHorizontal: 16,
  },
  zodiacCard: {
    backgroundColor: COLORS.cosmicSurface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    width: 100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  zodiacCardSelected: {
    borderColor: COLORS.cosmicAccent,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
  },
  zodiacSymbol: {
    fontSize: 32,
    color: COLORS.gray[400],
    marginBottom: 8,
  },
  zodiacSymbolSelected: {
    color: COLORS.cosmicAccent,
  },
  zodiacName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[300],
    marginBottom: 2,
  },
  zodiacNameSelected: {
    color: COLORS.white,
  },
  zodiacDates: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  zodiacDatesSelected: {
    color: COLORS.gray[400],
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  serviceCard: {
    width: (width - 48) / 2,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  serviceGradient: {
    padding: 16,
    minHeight: 140,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 11,
    color: COLORS.gray[400],
    lineHeight: 14,
  },
  serviceArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  astrologersScroll: {
    paddingHorizontal: 16,
  },
  astrologerCard: {
    width: 140,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  astrologerGradient: {
    padding: 16,
    alignItems: 'center',
  },
  astrologerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  astrologerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.gold,
    marginLeft: 4,
    fontWeight: '500',
  },
  astrologerSpec: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  astrologerPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
});

export default AstrologyScreen;
