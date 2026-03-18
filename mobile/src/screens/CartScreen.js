import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';
import { useCart } from '../contexts/CartContext';

const CartScreen = ({ navigation }) => {
  const { 
    cart, 
    cartTotal, 
    cartItemCount, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    loading 
  } = useCart();

  const handleUpdateQuantity = async (productId, newQuantity) => {
    await updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId, productName) => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${productName} from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeFromCart(productId)
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => clearCart()
        },
      ]
    );
  };

  const CartItem = ({ item }) => {
    const product = item.product || {};
    const imageUrl = product.images?.[0] || null;

    return (
      <View style={styles.cartItem}>
        <View style={styles.itemImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="cube-outline" size={24} color={COLORS.gray[300]} />
            </View>
          )}
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>{product.name || 'Product'}</Text>
          <Text style={styles.itemPrice}>₹{product.price || 0}</Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(product.id, item.quantity - 1)}
              disabled={loading}
            >
              <Icon name="remove" size={18} color={COLORS.saffron} />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(product.id, item.quantity + 1)}
              disabled={loading}
            >
              <Icon name="add" size={18} color={COLORS.saffron} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemRight}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(product.id, product.name)}
          >
            <Icon name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>

          <Text style={styles.itemTotal}>
            ₹{(product.price || 0) * item.quantity}
          </Text>
        </View>
      </View>
    );
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="cart-outline" size={80} color={COLORS.gray[300]} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added any items to your cart yet
          </Text>
          <Button
            title="Start Shopping"
            onPress={() => navigation.navigate('Store')}
            style={styles.emptyButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({cartItemCount})</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.cartItems}>
          {cart.map((item, index) => (
            <CartItem key={item.product?.id || index} item={item} />
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cartItemCount} items)</Text>
            <Text style={styles.summaryValue}>₹{cartTotal}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{cartTotal}</Text>
          </View>

          <Text style={styles.taxNote}>
            * Taxes and platform fees will be calculated at checkout
          </Text>
        </View>

        {/* Promo Code */}
        <TouchableOpacity style={styles.promoContainer}>
          <Icon name="pricetag-outline" size={20} color={COLORS.saffron} />
          <Text style={styles.promoText}>Apply Promo Code</Text>
          <Icon name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Checkout Button */}
      <View style={styles.checkoutContainer}>
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutLabel}>Total Amount</Text>
          <Text style={styles.checkoutTotal}>₹{cartTotal}</Text>
        </View>
        <Button
          title="Proceed to Checkout"
          onPress={() => navigation.navigate('Checkout')}
          style={styles.checkoutButton}
          icon={<Icon name="arrow-forward" size={18} color={COLORS.white} />}
          iconPosition="right"
        />
      </View>
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.maroon,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  cartItems: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[50],
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[800],
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.saffron,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginHorizontal: 16,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.small,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.gray[800],
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.saffron,
  },
  taxNote: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 12,
    fontStyle: 'italic',
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  promoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[700],
    marginLeft: 12,
    fontWeight: '500',
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    ...SHADOWS.large,
  },
  checkoutInfo: {
    marginRight: 16,
  },
  checkoutLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  checkoutTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.maroon,
  },
  checkoutButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 40,
  },
});

export default CartScreen;
