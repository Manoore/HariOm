import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// Floating Particle Component
const FloatingParticle = ({ delay, startX, startY }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <View style={styles.particleInner} />
    </Animated.View>
  );
};

// Animated Diya/Lamp Component
const AnimatedDiya = ({ style }) => {
  const flameAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const flameOpacity = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Animated.View style={[style, { opacity: flameOpacity }]}>
      <View style={styles.diyaContainer}>
        <View style={styles.flame} />
        <View style={styles.diyaBase} />
      </View>
    </Animated.View>
  );
};

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Scale and show temple image
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(imageAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Show title
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Show subtitle
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(1500),
    ]).start(() => {
      if (onFinish) onFinish();
    });

    // Continuous rotation for decorative elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Generate particles
  const particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push(
      <FloatingParticle
        key={i}
        delay={i * 300}
        startX={Math.random() * width}
        startY={height * 0.6 + Math.random() * 100}
      />
    );
  }

  return (
    <LinearGradient
      colors={['#1a0a0a', COLORS.maroon, '#2D0000']}
      style={styles.container}
    >
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {/* Decorative rotating mandala */}
        <Animated.View style={[styles.mandalaContainer, { transform: [{ rotate }] }]}>
          <View style={styles.mandala}>
            {[...Array(16)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.mandalaLine,
                  { transform: [{ rotate: `${i * 22.5}deg` }] },
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Floating particles */}
        {particles}

        {/* Main content */}
        <View style={styles.content}>
          {/* Left Diya */}
          <AnimatedDiya style={styles.diyaLeft} />

          {/* Temple Image */}
          <Animated.View
            style={[
              styles.templeContainer,
              {
                opacity: imageAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require('../../assets/temple-logo.png')}
              style={styles.templeImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Right Diya */}
          <AnimatedDiya style={styles.diyaRight} />

          {/* Title */}
          <Animated.View style={[styles.titleContainer, { opacity: titleAnim }]}>
            <Text style={styles.title}>DIVINE</Text>
            <View style={styles.titleUnderline} />
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={[styles.subtitleContainer, { opacity: subtitleAnim }]}>
            <Text style={styles.omSymbol}>ॐ</Text>
            <Text style={styles.subtitle}>Your Spiritual Journey Begins</Text>
            <Text style={styles.omSymbol}>ॐ</Text>
          </Animated.View>

          {/* Temple Name */}
          <Animated.View style={[styles.templeNameContainer, { opacity: subtitleAnim }]}>
            <Text style={styles.templeName}>
              Sri Anantha Padmanabha Swamy
            </Text>
          </Animated.View>
        </View>

        {/* Bottom decorative line */}
        <View style={styles.bottomDecoration}>
          <LinearGradient
            colors={['transparent', COLORS.gold, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomLine}
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mandalaContainer: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.08,
    top: -width * 0.25,
    left: -width * 0.25,
  },
  mandala: {
    width: width,
    height: width,
    borderRadius: width / 2,
    borderWidth: 1,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mandalaLine: {
    position: 'absolute',
    width: 1,
    height: width * 0.9,
    backgroundColor: COLORS.gold,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingTop: 40,
  },
  templeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  templeImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 16,
  },
  diyaContainer: {
    alignItems: 'center',
  },
  flame: {
    width: 12,
    height: 20,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    marginBottom: -5,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  diyaBase: {
    width: 24,
    height: 12,
    backgroundColor: '#B8860B',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  diyaLeft: {
    position: 'absolute',
    left: 40,
    top: height * 0.35,
  },
  diyaRight: {
    position: 'absolute',
    right: 40,
    top: height * 0.35,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 12,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleUnderline: {
    width: 200,
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 8,
    borderRadius: 1,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  omSymbol: {
    fontSize: 20,
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.cream,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  templeNameContainer: {
    marginTop: 20,
    paddingHorizontal: 40,
  },
  templeName: {
    fontSize: 12,
    color: 'rgba(255, 253, 208, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomLine: {
    width: width * 0.6,
    height: 2,
    borderRadius: 1,
  },
});

export default SplashScreen;
