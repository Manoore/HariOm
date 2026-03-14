import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Ellipse, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }) {
  const features = [
    { icon: 'people', label: 'Book Priests', color: '#FF9933' },
    { icon: 'sparkles', label: 'Horoscope', color: '#FFD700' },
    { icon: 'business', label: 'Temples', color: '#722F37' },
    { icon: 'cart', label: 'Pooja Store', color: '#B8860B' },
  ];

  return (
    <LinearGradient
      colors={['#FFF8E7', '#FFF5E0', '#FFEDD5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top Section with Logo */}
        <View style={styles.topSection}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
              <Path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
              <Ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
              <Path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
              <Ellipse cx="50" cy="30" rx="4" ry="6" fill="#FFEB3B" />
            </Svg>
          </View>

          <Text style={styles.appName}>DIVINE</Text>
          <Text style={styles.description}>
            Your complete spiritual ecosystem for rituals, astrology & sacred services
          </Text>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Ionicons name={feature.icon} size={28} color={feature.color} />
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Section with Buttons */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Auth', { mode: 'register' })}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Auth', { mode: 'login' })}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  appName: {
    fontFamily: 'serif',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#722F37',
    letterSpacing: 2,
    marginBottom: 8,
  },
  description: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: 32,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 16,
    width: 85,
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#FF9933',
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF9933',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#722F37',
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#722F37',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
