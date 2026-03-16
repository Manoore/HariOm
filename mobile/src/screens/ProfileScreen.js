import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' },
        { icon: 'location-outline', label: 'Saved Addresses', screen: 'Addresses' },
        { icon: 'card-outline', label: 'Payment Methods', screen: 'PaymentMethods' },
      ],
    },
    {
      title: 'Orders & Bookings',
      items: [
        { icon: 'receipt-outline', label: 'My Orders', screen: 'Orders' },
        { icon: 'calendar-outline', label: 'Puja Bookings', screen: 'Bookings' },
        { icon: 'videocam-outline', label: 'Consultations', screen: 'Consultations' },
      ],
    },
    {
      title: 'Spiritual',
      items: [
        { icon: 'heart-outline', label: 'Favorites', screen: 'Favorites' },
        { icon: 'notifications-outline', label: 'Festival Reminders', screen: 'Reminders' },
        { icon: 'book-outline', label: 'Saved Mantras', screen: 'Mantras' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help & Support', screen: 'Help' },
        { icon: 'document-text-outline', label: 'Terms & Conditions', screen: 'Terms' },
        { icon: 'shield-outline', label: 'Privacy Policy', screen: 'Privacy' },
      ],
    },
  ];

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Ionicons name={icon} size={20} color={COLORS.saffron} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={GRADIENTS.saffron}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera-outline" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Devotee'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'devotee@divine.com'}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="person-outline" size={12} color={COLORS.white} />
                <Text style={styles.roleText}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Devotee'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Pujas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  <MenuItem
                    icon={item.icon}
                    label={item.label}
                    onPress={() => navigation.navigate(item.screen)}
                  />
                  {itemIndex < section.items.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Divine App v1.0.0</Text>

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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.maroon,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  profileGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.maroon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gray[200],
    alignSelf: 'center',
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginLeft: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    color: COLORS.gray[800],
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginLeft: 64,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 20,
  },
});

export default ProfileScreen;
