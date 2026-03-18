import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';

const ConsultationScreen = ({ navigation }) => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState('all');

  const consultationTypes = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'video', name: 'Video Call', icon: 'videocam' },
    { id: 'voice', name: 'Voice Call', icon: 'call' },
    { id: 'chat', name: 'Chat', icon: 'chatbubbles' },
  ];

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/astrologers');
      setAstrologers(response.data.astrologers || response.data || []);
    } catch (error) {
      console.log('Error fetching astrologers:', error);
      // Sample data
      setAstrologers([
        {
          id: '1',
          name: 'Acharya Deepak Joshi',
          specializations: ['Kundali Reading', 'Vastu Consultation', 'Career Guidance'],
          experience_years: 20,
          rating: 4.9,
          total_consultations: 1500,
          rate_per_minute: 25,
          languages: ['Hindi', 'English', 'Marathi'],
          available: true,
          supports: ['video', 'voice', 'chat'],
        },
        {
          id: '2',
          name: 'Pandit Vishnu Sharma',
          specializations: ['Marriage Compatibility', 'Gemstone Advice', 'Numerology'],
          experience_years: 15,
          rating: 4.8,
          total_consultations: 980,
          rate_per_minute: 20,
          languages: ['Hindi', 'Sanskrit'],
          available: true,
          supports: ['voice', 'chat'],
        },
        {
          id: '3',
          name: 'Dr. Lakshmi Narayan',
          specializations: ['Medical Astrology', 'Muhurat', 'Remedies'],
          experience_years: 25,
          rating: 4.9,
          total_consultations: 2200,
          rate_per_minute: 35,
          languages: ['Hindi', 'English', 'Tamil'],
          available: false,
          supports: ['video', 'voice'],
        },
        {
          id: '4',
          name: 'Swami Ananda',
          specializations: ['Spiritual Guidance', 'Meditation', 'Tantra'],
          experience_years: 30,
          rating: 5.0,
          total_consultations: 3500,
          rate_per_minute: 50,
          languages: ['Hindi', 'English', 'Sanskrit'],
          available: true,
          supports: ['video'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAstrologers();
    setRefreshing(false);
  };

  const handleStartConsultation = (astrologer, type) => {
    if (!astrologer.available) {
      Alert.alert('Not Available', `${astrologer.name} is currently offline. Please try again later.`);
      return;
    }
    
    Alert.alert(
      'Start Consultation',
      `Start ${type} consultation with ${astrologer.name}?\n\nRate: ₹${astrologer.rate_per_minute}/min`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => Alert.alert('Coming Soon', 'Video/Voice consultation feature will be available soon!')
        },
      ]
    );
  };

  const filteredAstrologers = selectedType === 'all' 
    ? astrologers 
    : astrologers.filter(a => a.supports?.includes(selectedType));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call Astrologer</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Banner */}
      <TouchableOpacity style={styles.banner} activeOpacity={0.9}>
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          <View style={styles.bannerContent}>
            <Icon name="planet" size={40} color="#fff" style={{ opacity: 0.9 }} />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Talk to Expert Astrologers</Text>
              <Text style={styles.bannerSubtitle}>Get guidance on life, career, relationships & more</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Consultation Types */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.typesContainer}
        contentContainerStyle={styles.typesContent}
      >
        {consultationTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeChip,
              selectedType === type.id && styles.typeChipActive,
            ]}
            onPress={() => setSelectedType(type.id)}
          >
            <Icon 
              name={type.icon} 
              size={18} 
              color={selectedType === type.id ? COLORS.white : COLORS.gray[600]} 
            />
            <Text
              style={[
                styles.typeText,
                selectedType === type.id && styles.typeTextActive,
              ]}
            >
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Astrologers List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {filteredAstrologers.map((astrologer) => (
          <View key={astrologer.id} style={styles.astrologerCard}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, !astrologer.available && styles.avatarOffline]}>
                  <Text style={styles.avatarText}>
                    {astrologer.name?.charAt(0)?.toUpperCase() || 'A'}
                  </Text>
                </View>
                {astrologer.available && <View style={styles.onlineIndicator} />}
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.astrologerName}>{astrologer.name}</Text>
                <View style={styles.ratingRow}>
                  <Icon name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {astrologer.rating} • {astrologer.total_consultations} consultations
                  </Text>
                </View>
                <Text style={styles.experienceText}>
                  {astrologer.experience_years} years experience
                </Text>
              </View>
              
              <View style={styles.rateContainer}>
                <Text style={styles.rateText}>₹{astrologer.rate_per_minute}</Text>
                <Text style={styles.rateUnit}>/min</Text>
              </View>
            </View>

            {/* Specializations */}
            <View style={styles.specializationsContainer}>
              {astrologer.specializations?.slice(0, 3).map((spec, index) => (
                <View key={index} style={styles.specTag}>
                  <Text style={styles.specText}>{spec}</Text>
                </View>
              ))}
            </View>

            {/* Languages */}
            <Text style={styles.languagesText}>
              <Icon name="globe-outline" size={12} /> {astrologer.languages?.join(', ')}
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              {astrologer.supports?.includes('chat') && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.chatButton]}
                  onPress={() => handleStartConsultation(astrologer, 'chat')}
                >
                  <Icon name="chatbubbles-outline" size={18} color="#10B981" />
                  <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Chat</Text>
                </TouchableOpacity>
              )}
              {astrologer.supports?.includes('voice') && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.voiceButton]}
                  onPress={() => handleStartConsultation(astrologer, 'voice')}
                >
                  <Icon name="call-outline" size={18} color="#3B82F6" />
                  <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Call</Text>
                </TouchableOpacity>
              )}
              {astrologer.supports?.includes('video') && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.videoButton, !astrologer.available && styles.buttonDisabled]}
                  onPress={() => handleStartConsultation(astrologer, 'video')}
                  disabled={!astrologer.available}
                >
                  <Icon name="videocam" size={18} color={astrologer.available ? COLORS.white : COLORS.gray[400]} />
                  <Text style={[styles.actionButtonText, { color: astrologer.available ? COLORS.white : COLORS.gray[400] }]}>
                    {astrologer.available ? 'Video' : 'Offline'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
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
  banner: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  bannerGradient: {
    padding: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    marginLeft: 16,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  typesContainer: {
    backgroundColor: COLORS.white,
    maxHeight: 60,
  },
  typesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    marginRight: 8,
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: '#8B5CF6',
  },
  typeText: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  typeTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  astrologerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOffline: {
    backgroundColor: COLORS.gray[400],
  },
  avatarText: {
    fontSize: 22,
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
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  astrologerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  experienceText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  rateUnit: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  specTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  languagesText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  chatButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  voiceButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  videoButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray[200],
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ConsultationScreen;
