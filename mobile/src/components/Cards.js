import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/theme';

// Basic Card Component
export const Card = ({ children, style, onPress, ...props }) => {
  const content = (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Product Card for Pooja Store
export const ProductCard = ({ product, onPress, onAddToCart }) => {
  const imageUrl = product.images?.[0] || null;
  
  return (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={40} color={COLORS.gray[300]} />
          </View>
        )}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}% OFF</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        
        <View style={styles.productRating}>
          <Ionicons name="star" size={14} color={COLORS.gold} />
          <Text style={styles.ratingText}>{product.rating || '4.5'}</Text>
          <Text style={styles.reviewsText}>({product.review_count || 0})</Text>
        </View>
        
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>₹{product.price}</Text>
          {product.original_price && (
            <Text style={styles.originalPrice}>₹{product.original_price}</Text>
          )}
        </View>
      </View>
      
      {onAddToCart && (
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
        >
          <Ionicons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// Priest Card
export const PriestCard = ({ priest, onPress, onBook }) => {
  return (
    <TouchableOpacity 
      style={styles.priestCard} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.priestHeader}>
        <View style={styles.priestAvatar}>
          {priest.photo_url ? (
            <Image source={{ uri: priest.photo_url }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={GRADIENTS.saffron}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {priest.user_name?.charAt(0)?.toUpperCase() || 'P'}
              </Text>
            </LinearGradient>
          )}
        </View>
        
        <View style={styles.priestInfo}>
          <View style={styles.priestNameRow}>
            <Text style={styles.priestName}>{priest.user_name}</Text>
            {priest.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            )}
          </View>
          
          <View style={styles.priestRating}>
            <Ionicons name="star" size={14} color={COLORS.gold} />
            <Text style={styles.ratingText}>{priest.rating || '4.8'}</Text>
            <Text style={styles.reviewsText}>({priest.total_reviews || 0} reviews)</Text>
          </View>
          
          <Text style={styles.priestExperience}>
            {priest.experience_years || 0} years experience
          </Text>
        </View>
      </View>
      
      {priest.specializations && priest.specializations.length > 0 && (
        <View style={styles.specializationsRow}>
          {priest.specializations.slice(0, 3).map((spec, index) => (
            <View key={index} style={styles.specBadge}>
              <Text style={styles.specText}>{spec}</Text>
            </View>
          ))}
        </View>
      )}
      
      {priest.bio && (
        <Text style={styles.priestBio} numberOfLines={2}>{priest.bio}</Text>
      )}
      
      <View style={styles.priestFooter}>
        <Text style={styles.priestPrice}>₹{priest.hourly_rate || 500}/hr</Text>
        {onBook && (
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={(e) => {
              e.stopPropagation();
              onBook(priest);
            }}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Festival Card
export const FestivalCard = ({ festival, onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={GRADIENTS.sunrise}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.festivalCard}
      >
        <Ionicons name="calendar-outline" size={24} color={COLORS.white} style={styles.festivalIcon} />
        <Text style={styles.festivalName}>{festival.name}</Text>
        <Text style={styles.festivalDate}>{festival.date}</Text>
        {festival.description && (
          <Text style={styles.festivalDesc} numberOfLines={2}>{festival.description}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Service Card (for Pooja services)
export const ServiceCard = ({ service, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.serviceCard} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.serviceIconContainer}>
        <Ionicons name={service.icon || 'flame-outline'} size={28} color={COLORS.saffron} />
      </View>
      <Text style={styles.serviceName}>{service.name}</Text>
      <Text style={styles.servicePrice}>₹{service.price}</Text>
      <Text style={styles.serviceDuration}>
        <Ionicons name="time-outline" size={12} color={COLORS.gray[500]} /> {service.duration}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  
  // Product Card
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    width: '48%',
    marginBottom: 16,
    ...SHADOWS.small,
  },
  productImageContainer: {
    aspectRatio: 1,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[800],
    marginBottom: 6,
    lineHeight: 18,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.gray[700],
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewsText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginLeft: 4,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.saffron,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  
  // Priest Card
  priestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  priestHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  priestAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  priestInfo: {
    flex: 1,
  },
  priestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priestName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.maroon,
    marginRight: 6,
  },
  priestRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priestExperience: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  specializationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specBadge: {
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  specText: {
    fontSize: 11,
    color: COLORS.saffronDark,
    fontWeight: '500',
  },
  priestBio: {
    fontSize: 13,
    color: COLORS.gray[600],
    lineHeight: 18,
    marginBottom: 12,
  },
  priestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  priestPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  bookButton: {
    backgroundColor: COLORS.saffron,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bookButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Festival Card
  festivalCard: {
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    ...SHADOWS.medium,
  },
  festivalIcon: {
    marginBottom: 8,
    opacity: 0.9,
  },
  festivalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  festivalDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  festivalDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 14,
  },
  
  // Service Card
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: 140,
    marginRight: 12,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 6,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.saffron,
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
});

export default Card;
