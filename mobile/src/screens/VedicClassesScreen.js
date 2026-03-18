import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';

const VedicClassesScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'vedas', name: 'Vedas' },
    { id: 'yoga', name: 'Yoga' },
    { id: 'meditation', name: 'Meditation' },
    { id: 'sanskrit', name: 'Sanskrit' },
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/classes');
      setClasses(response.data.classes || []);
    } catch (error) {
      console.log('Error fetching classes:', error);
      // Set sample data if API fails
      setClasses([
        {
          id: '1',
          title: 'Introduction to Bhagavad Gita',
          instructor: 'Swami Vivekananda',
          duration: '12 weeks',
          level: 'Beginner',
          enrolled: 245,
          rating: 4.9,
          price: 2999,
          image: null,
          category: 'vedas',
        },
        {
          id: '2',
          title: 'Patanjali Yoga Sutras',
          instructor: 'Guru Ramdev',
          duration: '8 weeks',
          level: 'Intermediate',
          enrolled: 189,
          rating: 4.8,
          price: 1999,
          image: null,
          category: 'yoga',
        },
        {
          id: '3',
          title: 'Sanskrit for Beginners',
          instructor: 'Dr. Sharma',
          duration: '16 weeks',
          level: 'Beginner',
          enrolled: 156,
          rating: 4.7,
          price: 3499,
          image: null,
          category: 'sanskrit',
        },
        {
          id: '4',
          title: 'Advanced Meditation Techniques',
          instructor: 'Sri Sri Ravi Shankar',
          duration: '6 weeks',
          level: 'Advanced',
          enrolled: 312,
          rating: 4.9,
          price: 1499,
          image: null,
          category: 'meditation',
        },
        {
          id: '5',
          title: 'Upanishads - The Hidden Wisdom',
          instructor: 'Swami Chinmayananda',
          duration: '10 weeks',
          level: 'Intermediate',
          enrolled: 98,
          rating: 4.8,
          price: 2499,
          image: null,
          category: 'vedas',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  const handleEnroll = (classItem) => {
    Alert.alert(
      'Enroll in Class',
      `Would you like to enroll in "${classItem.title}" for ₹${classItem.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enroll', onPress: () => Alert.alert('Success', 'Enrollment feature coming soon!') },
      ]
    );
  };

  const filteredClasses = selectedCategory === 'all' 
    ? classes 
    : classes.filter(c => c.category === selectedCategory);

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return COLORS.gray[500];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vedic Classes</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Classes List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {filteredClasses.map((classItem) => (
          <TouchableOpacity
            key={classItem.id}
            style={styles.classCard}
            onPress={() => handleEnroll(classItem)}
            activeOpacity={0.8}
          >
            <View style={styles.classImageContainer}>
              <LinearGradient
                colors={['#FF9933', '#FF6600']}
                style={styles.classImagePlaceholder}
              >
                <Icon name="book-outline" size={40} color="#fff" />
              </LinearGradient>
            </View>
            
            <View style={styles.classInfo}>
              <View style={styles.classHeader}>
                <View style={[styles.levelBadge, { backgroundColor: `${getLevelColor(classItem.level)}20` }]}>
                  <Text style={[styles.levelText, { color: getLevelColor(classItem.level) }]}>
                    {classItem.level}
                  </Text>
                </View>
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{classItem.rating}</Text>
                </View>
              </View>
              
              <Text style={styles.classTitle}>{classItem.title}</Text>
              <Text style={styles.classInstructor}>by {classItem.instructor}</Text>
              
              <View style={styles.classMetaRow}>
                <View style={styles.classMeta}>
                  <Icon name="time-outline" size={14} color={COLORS.gray[500]} />
                  <Text style={styles.classMetaText}>{classItem.duration}</Text>
                </View>
                <View style={styles.classMeta}>
                  <Icon name="people-outline" size={14} color={COLORS.gray[500]} />
                  <Text style={styles.classMetaText}>{classItem.enrolled} enrolled</Text>
                </View>
              </View>
              
              <View style={styles.classFooter}>
                <Text style={styles.classPrice}>₹{classItem.price}</Text>
                <TouchableOpacity style={styles.enrollButton} onPress={() => handleEnroll(classItem)}>
                  <Text style={styles.enrollButtonText}>Enroll Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
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
  categoriesContainer: {
    backgroundColor: COLORS.white,
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.saffron,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  classCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  classImageContainer: {
    height: 120,
  },
  classImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    padding: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  classInstructor: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 12,
  },
  classMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classMetaText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  enrollButton: {
    backgroundColor: COLORS.saffron,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  enrollButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default VedicClassesScreen;
