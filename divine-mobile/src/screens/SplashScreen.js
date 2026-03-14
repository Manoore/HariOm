import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Ellipse, Path } from 'react-native-svg';

export default function SplashScreen({ onComplete }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 2.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#722F37', '#4A1C20', '#2D0A0A']}
      style={styles.container}
    >
      {/* Decorative circles */}
      <View style={styles.decorativeCircles}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Diya/Lamp Icon */}
        <View style={styles.lampContainer}>
          <Svg width={120} height={120} viewBox="0 0 100 100">
            <Ellipse cx="50" cy="85" rx="30" ry="8" fill="#B8860B" />
            <Path d="M30 85 Q30 70 35 60 L65 60 Q70 70 70 85" fill="#FFD700" />
            <Ellipse cx="50" cy="60" rx="18" ry="6" fill="#FFD700" />
            <Path d="M50 55 Q45 40 50 25 Q55 40 50 55" fill="#FF9933" />
            <Ellipse cx="50" cy="30" rx="4" ry="6" fill="#FFEB3B" />
          </Svg>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>DIVINE</Text>
        <Text style={styles.tagline}>SPIRITUAL SERVICES</Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: fadeAnim,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Sanskrit text */}
      <Text style={styles.sanskritText}>Om Asato Ma Sadgamaya</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  circle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 1000,
  },
  circle1: {
    width: 300,
    height: 300,
  },
  circle2: {
    width: 200,
    height: 200,
  },
  circle3: {
    width: 100,
    height: 100,
  },
  logoContainer: {
    alignItems: 'center',
  },
  lampContainer: {
    marginBottom: 20,
  },
  appName: {
    fontFamily: 'serif',
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 4,
  },
  tagline: {
    color: 'rgba(255, 215, 0, 0.6)',
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  sanskritText: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255, 215, 0, 0.4)',
    fontSize: 14,
  },
});
