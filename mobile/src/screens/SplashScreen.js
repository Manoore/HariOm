import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../constants/theme';
import Svg, { 
  Path, Circle, Ellipse, Defs, LinearGradient as SvgLinearGradient, 
  Stop, G, Text as SvgText, Rect, Polygon 
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Animated Diya Component
const AnimatedDiya = ({ style }) => {
  const flameAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const flameScale = flameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Animated.View style={[style, { transform: [{ scale: flameScale }] }]}>
      <Svg width={60} height={80} viewBox="0 0 60 80">
        <Defs>
          <SvgLinearGradient id="diyaGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#B8860B" />
          </SvgLinearGradient>
          <SvgLinearGradient id="flame" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#FF6B00" />
            <Stop offset="50%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#FFF5CC" />
          </SvgLinearGradient>
        </Defs>
        {/* Diya base */}
        <Ellipse cx="30" cy="70" rx="20" ry="5" fill="#8B4513" />
        <Path d="M15 70 Q15 55 22 48 L38 48 Q45 55 45 70" fill="url(#diyaGold)" />
        <Ellipse cx="30" cy="48" rx="12" ry="4" fill="#FFD700" />
        {/* Flame */}
        <Path d="M30 45 Q24 32 30 15 Q36 32 30 45" fill="url(#flame)" />
        <Ellipse cx="30" cy="20" rx="4" ry="6" fill="#FFF5CC" opacity="0.8" />
      </Svg>
    </Animated.View>
  );
};

// Temple Icon Component
const TempleIcon = () => (
  <Svg width={120} height={140} viewBox="0 0 120 140">
    <Defs>
      <SvgLinearGradient id="templeGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="50%" stopColor="#FFA500" />
        <Stop offset="100%" stopColor="#B8860B" />
      </SvgLinearGradient>
      <SvgLinearGradient id="templeStone" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#DEB887" />
        <Stop offset="100%" stopColor="#CD853F" />
      </SvgLinearGradient>
    </Defs>
    {/* Temple base */}
    <Rect x="15" y="110" width="90" height="20" rx="3" fill="url(#templeStone)" />
    {/* Temple body */}
    <Rect x="22" y="70" width="76" height="40" fill="url(#templeStone)" />
    {/* Temple pillars */}
    <Rect x="28" y="75" width="8" height="30" fill="#8B4513" />
    <Rect x="84" y="75" width="8" height="30" fill="#8B4513" />
    {/* Temple door */}
    <Rect x="48" y="82" width="24" height="28" rx="12" fill="#4A3728" />
    {/* Temple roof tier 1 */}
    <Polygon points="60,50 100,70 20,70" fill="url(#templeGold)" />
    {/* Temple roof tier 2 */}
    <Polygon points="60,32 88,50 32,50" fill="url(#templeGold)" />
    {/* Temple spire */}
    <Polygon points="60,8 72,32 48,32" fill="url(#templeGold)" />
    {/* Kalash on top */}
    <Circle cx="60" cy="12" r="6" fill="#FFD700" />
    {/* Om symbol */}
    <SvgText x="60" y="98" fontSize="14" fill="#FFD700" textAnchor="middle" fontWeight="bold">
      ॐ
    </SvgText>
  </Svg>
);

// Om Symbol Component
const OmSymbol = ({ size = 40, color = COLORS.gold }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color: color, fontWeight: 'bold' }}>ॐ</Text>
  </View>
);

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

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const diyaLeftAnim = useRef(new Animated.Value(-100)).current;
  const diyaRightAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // Fade in temple with scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Animate diyas sliding in
      Animated.parallel([
        Animated.spring(diyaLeftAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(diyaRightAnim, {
          toValue: 0,
          friction: 8,
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
        duration: 20000,
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
  for (let i = 0; i < 15; i++) {
    particles.push(
      <FloatingParticle
        key={i}
        delay={i * 400}
        startX={Math.random() * width}
        startY={height * 0.5 + Math.random() * 100}
      />
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.maroon, COLORS.maroonDark, '#2D0000']}
      style={styles.container}
    >
      {/* Decorative rotating mandala */}
      <Animated.View style={[styles.mandalaContainer, { transform: [{ rotate }] }]}>
        <View style={styles.mandala}>
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.mandalaLine,
                { transform: [{ rotate: `${i * 30}deg` }] },
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
        <Animated.View style={[styles.diyaLeft, { transform: [{ translateX: diyaLeftAnim }] }]}>
          <AnimatedDiya />
        </Animated.View>

        {/* Temple Icon */}
        <Animated.View
          style={[
            styles.templeContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TempleIcon />
        </Animated.View>

        {/* Right Diya */}
        <Animated.View style={[styles.diyaRight, { transform: [{ translateX: diyaRightAnim }] }]}>
          <AnimatedDiya />
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleContainer, { opacity: titleAnim }]}>
          <Text style={styles.title}>DIVINE</Text>
          <View style={styles.titleUnderline} />
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={[styles.subtitleContainer, { opacity: subtitleAnim }]}>
          <OmSymbol size={24} color={COLORS.gold} />
          <Text style={styles.subtitle}>Your Spiritual Journey Begins</Text>
          <OmSymbol size={24} color={COLORS.gold} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineContainer, { opacity: subtitleAnim }]}>
          <Text style={styles.tagline}>
            Connect with the Divine from Anywhere
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
    opacity: 0.1,
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
    height: width * 0.8,
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
    alignItems: 'center',
    zIndex: 10,
  },
  templeContainer: {
    marginBottom: 20,
  },
  diyaLeft: {
    position: 'absolute',
    left: -80,
    top: 40,
  },
  diyaRight: {
    position: 'absolute',
    right: -80,
    top: 40,
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
    marginTop: 20,
    gap: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.cream,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  taglineContainer: {
    marginTop: 30,
    paddingHorizontal: 40,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 253, 208, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
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
