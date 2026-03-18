import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SpiritualFeedScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/feed');
      setPosts(response.data.posts || response.data || []);
    } catch (error) {
      console.log('Error fetching feed:', error);
      // Set sample data
      setPosts([
        {
          id: '1',
          author: { name: 'Pandit Ramesh Sharma', role: 'priest', avatar: null },
          content: 'Om Namah Shivaya 🙏 Today is an auspicious day for meditation and self-reflection. May Lord Shiva bless us all with peace and wisdom.',
          likes: 45,
          comments: 12,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          liked: false,
        },
        {
          id: '2',
          author: { name: 'Acharya Deepak Joshi', role: 'astrologer', avatar: null },
          content: 'Today\'s planetary alignment is favorable for new beginnings. If you\'ve been planning to start something new, this is the time! 🌟',
          likes: 38,
          comments: 8,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          liked: true,
        },
        {
          id: '3',
          author: { name: 'Temple Admin', role: 'admin', avatar: null },
          content: 'Reminder: Maha Shivaratri celebrations will begin from 6 PM tomorrow. Special abhishekam and bhajans throughout the night. All devotees are welcome! 🕉️',
          likes: 128,
          comments: 34,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          liked: false,
        },
        {
          id: '4',
          author: { name: 'Swami Vivekananda Ashram', role: 'organization', avatar: null },
          content: 'Daily Thought: "Arise, awake, and stop not until the goal is reached." - Swami Vivekananda\n\nLet this be our guiding light today. 🪔',
          likes: 89,
          comments: 15,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          liked: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'priest': return COLORS.saffron;
      case 'astrologer': return '#8B5CF6';
      case 'admin': return '#10B981';
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
        <Text style={styles.headerTitle}>Spiritual Feed</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="add-circle-outline" size={24} color={COLORS.saffron} />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
        }
      >
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.authorAvatar}>
                <Text style={styles.avatarText}>
                  {post.author.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>{post.author.name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: `${getRoleBadgeColor(post.author.role)}20` }]}>
                    <Text style={[styles.roleText, { color: getRoleBadgeColor(post.author.role) }]}>
                      {post.author.role}
                    </Text>
                  </View>
                </View>
                <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
              </View>
              <TouchableOpacity>
                <Icon name="ellipsis-horizontal" size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            {/* Post Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleLike(post.id)}
              >
                <Icon 
                  name={post.liked ? "heart" : "heart-outline"} 
                  size={22} 
                  color={post.liked ? '#EF4444' : COLORS.gray[500]} 
                />
                <Text style={[styles.actionText, post.liked && { color: '#EF4444' }]}>
                  {post.likes}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="chatbubble-outline" size={20} color={COLORS.gray[500]} />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="share-outline" size={22} color={COLORS.gray[500]} />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
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
  headerIcon: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  postCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  postTime: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  postContent: {
    fontSize: 15,
    color: COLORS.gray[700],
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
});

export default SpiritualFeedScreen;
