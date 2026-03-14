import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen({ navigation, route }) {
  const initialMode = route?.params?.mode || 'login';
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'devotee',
  });

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      // Navigation will be handled by App.js based on auth state
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (registerData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(registerData);
      // Navigation will be handled by App.js based on auth state
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { label: 'Devotee (Book services)', value: 'devotee' },
    { label: 'Priest (Offer services)', value: 'priest' },
    { label: 'Astrologer (Consultations)', value: 'astrologer' },
    { label: 'Shop Owner (Sell products)', value: 'shop_owner' },
  ];

  return (
    <LinearGradient colors={['#FFF8E7', '#FFF5E0', '#FFEDD5']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {mode === 'login' ? (
              // Login Form
              <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue your spiritual journey</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChangeText={(text) => setLoginData({ ...loginData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password"
                      value={loginData.password}
                      onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Demo Credentials */}
                <View style={styles.demoBox}>
                  <Text style={styles.demoTitle}>Demo Credentials:</Text>
                  <Text style={styles.demoText}>Admin: admin@divineapp.com / admin123</Text>
                  <Text style={styles.demoText}>Priest: pandit.sharma@divineapp.com / priest123</Text>
                </View>
              </View>
            ) : (
              // Register Form
              <View style={styles.formContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join our spiritual community</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your full name"
                      value={registerData.name}
                      onChangeText={(text) => setRegisterData({ ...registerData, name: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChangeText={(text) => setRegisterData({ ...registerData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="+91 98765 43210"
                      value={registerData.phone}
                      onChangeText={(text) => setRegisterData({ ...registerData, phone: text })}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>I want to join as</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={registerData.role}
                      onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                      style={styles.picker}
                    >
                      {roleOptions.map((option) => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="At least 6 characters"
                      value={registerData.password}
                      onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Switch Mode */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
                <Text style={styles.switchLink}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  formContainer: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  pickerWrapper: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  primaryButton: {
    backgroundColor: '#FF9933',
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
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
  demoBox: {
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
  switchLink: {
    color: '#FF9933',
    fontSize: 14,
    fontWeight: '600',
  },
});
