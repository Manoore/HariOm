import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/theme';
import { Button, GoldButton } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Temple Logo Component
const TempleLogo = () => (
  <View style={styles.logoContainer}>
    <View style={styles.templeIcon}>
      <Text style={styles.omSymbol}>ॐ</Text>
    </View>
    <Text style={styles.logoText}>DIVINE</Text>
    <Text style={styles.logoSubtext}>Your Spiritual Journey</Text>
  </View>
);

const LoginScreen = ({ navigation }) => {
  const { login, register, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'devotee',
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!isLogin && !formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setFormErrors({ general: result.error });
      }
    } else {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      if (!result.success) {
        setFormErrors({ general: result.error });
      }
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const roles = [
    { value: 'devotee', label: 'Devotee', icon: 'person-outline' },
    { value: 'priest', label: 'Priest', icon: 'flame-outline' },
    { value: 'astrologer', label: 'Astrologer', icon: 'planet-outline' },
    { value: 'shop_owner', label: 'Shop Owner', icon: 'storefront-outline' },
  ];

  return (
    <LinearGradient
      colors={[COLORS.cream, COLORS.parchment]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo Section */}
            <TempleLogo />

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Tab Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, isLogin && styles.tabActive]}
                  onPress={() => setIsLogin(true)}
                >
                  <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, !isLogin && styles.tabActive]}
                  onPress={() => setIsLogin(false)}
                >
                  <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {formErrors.general && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                  <Text style={styles.errorText}>{formErrors.general}</Text>
                </View>
              )}

              {/* Registration Fields */}
              {!isLogin && (
                <>
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChangeText={(value) => updateFormData('name', value)}
                    placeholder="Enter your full name"
                    icon={<Ionicons name="person-outline" size={20} color={COLORS.gray[400]} />}
                    error={formErrors.name}
                    autoCapitalize="words"
                  />

                  {/* Role Selection */}
                  <Text style={styles.roleLabel}>I am a</Text>
                  <View style={styles.roleGrid}>
                    {roles.map((role) => (
                      <TouchableOpacity
                        key={role.value}
                        style={[
                          styles.roleOption,
                          formData.role === role.value && styles.roleOptionActive,
                        ]}
                        onPress={() => updateFormData('role', role.value)}
                      >
                        <Ionicons
                          name={role.icon}
                          size={24}
                          color={formData.role === role.value ? COLORS.saffron : COLORS.gray[400]}
                        />
                        <Text
                          style={[
                            styles.roleText,
                            formData.role === role.value && styles.roleTextActive,
                          ]}
                        >
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Common Fields */}
              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                icon={<Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />}
                error={formErrors.email}
              />

              <Input
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Enter your password"
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />}
                error={formErrors.password}
              />

              {!isLogin && (
                <Input
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder="Confirm your password"
                  secureTextEntry
                  icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />}
                  error={formErrors.confirmPassword}
                />
              )}

              {/* Forgot Password */}
              {isLogin && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <Button
                title={isLogin ? 'Login' : 'Create Account'}
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
                size="large"
              />

              {/* Social Login Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="call-outline" size={24} color={COLORS.saffron} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms */}
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  templeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.large,
  },
  omSymbol: {
    fontSize: 40,
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.maroon,
    letterSpacing: 6,
  },
  logoSubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.large,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  tabTextActive: {
    color: COLORS.saffron,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleOption: {
    width: '48%',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleOptionActive: {
    borderColor: COLORS.saffron,
    backgroundColor: 'rgba(255, 153, 51, 0.05)',
  },
  roleText: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 6,
    fontWeight: '500',
  },
  roleTextActive: {
    color: COLORS.saffron,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: COLORS.saffron,
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  dividerText: {
    color: COLORS.gray[500],
    fontSize: 13,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  termsText: {
    textAlign: 'center',
    color: COLORS.gray[500],
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.saffron,
    fontWeight: '500',
  },
});

export default LoginScreen;
