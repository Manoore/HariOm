import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  FlatList,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';

const MessagesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations || response.data || []);
    } catch (error) {
      console.log('Error fetching conversations:', error);
      // Sample data
      setConversations([
        {
          id: '1',
          participant: { name: 'Pandit Ramesh Sharma', role: 'priest', avatar: null, online: true },
          lastMessage: 'Namaste! Your puja has been confirmed for tomorrow at 10 AM.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          unread: 2,
        },
        {
          id: '2',
          participant: { name: 'Acharya Deepak Joshi', role: 'astrologer', avatar: null, online: false },
          lastMessage: 'Your kundali analysis is ready. Please check your email.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          unread: 0,
        },
        {
          id: '3',
          participant: { name: 'Divine Support', role: 'support', avatar: null, online: true },
          lastMessage: 'How can we help you today?',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          unread: 0,
        },
        {
          id: '4',
          participant: { name: 'Pandit Suresh Verma', role: 'priest', avatar: null, online: false },
          lastMessage: 'Thank you for the booking. Looking forward to serving you.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          unread: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'priest': return COLORS.saffron;
      case 'astrologer': return '#8B5CF6';
      case 'support': return '#10B981';
      default: return COLORS.gray[500];
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('ChatDetail', { conversation: item })}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: getRoleColor(item.participant.role) }]}>
          <Text style={styles.avatarText}>
            {item.participant.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        {item.participant.online && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName} numberOfLines={1}>
            {item.participant.name}
          </Text>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="create-outline" size={24} color={COLORS.saffron} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search-outline" size={20} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chatbubbles-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>No Messages</Text>
          <Text style={styles.emptyText}>
            Start a conversation with priests or astrologers
          </Text>
          <TouchableOpacity 
            style={styles.startChatButton}
            onPress={() => navigation.navigate('Priests')}
          >
            <Text style={styles.startChatText}>Find a Priest</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.saffron]} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
  searchContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.gray[800],
  },
  listContent: {
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
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
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: COLORS.gray[500],
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: COLORS.saffron,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  startChatButton: {
    backgroundColor: COLORS.saffron,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  startChatText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MessagesScreen;
