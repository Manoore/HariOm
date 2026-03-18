import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderAPI, settingsAPI } from '../services/api';

const CheckoutScreen = ({ navigation }) => {
  const { cart, cartTotal, cartItemCount, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Review
  
  const [formData, setFormData] = useState({
    shipping_name: user?.name || '',
    shipping_phone: user?.phone || '',
    shipping_email: user?.email || '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
  });

  const [errors, setErrors] = useState({});
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Calculate totals
  const subtotal = cartTotal;
  const platformFee = Math.round(subtotal * 0.025); // 2.5%
  const tax = Math.round((subtotal + platformFee) * 0.18); // 18% GST
  const total = subtotal + platformFee + tax;

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  // Auto-fill city/state from pincode
  const handlePincodeChange = async (pincode) => {
    updateFormData('shipping_pincode', pincode);
    
    if (pincode.length === 6) {
      setPincodeLoading(true);
      try {
        const response = await settingsAPI.getPincode(pincode);
        if (response.data && response.data.city) {
          setFormData(prev => ({
            ...prev,
            shipping_city: response.data.city,
            shipping_state: response.data.state,
          }));
        }
      } catch (error) {
        console.log('Pincode lookup failed:', error);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.shipping_name.trim()) {
      newErrors.shipping_name = 'Name is required';
    }
    if (!formData.shipping_phone.trim()) {
      newErrors.shipping_phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.shipping_phone.replace(/\D/g, ''))) {
      newErrors.shipping_phone = 'Enter valid 10-digit phone number';
    }
    if (!formData.shipping_address.trim()) {
      newErrors.shipping_address = 'Address is required';
    }
    if (!formData.shipping_city.trim()) {
      newErrors.shipping_city = 'City is required';
    }
    if (!formData.shipping_state.trim()) {
      newErrors.shipping_state = 'State is required';
    }
    if (!formData.shipping_pincode.trim()) {
      newErrors.shipping_pincode = 'Pincode is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // Step 1: Create order
      const shippingAddress = `${formData.shipping_name}, ${formData.shipping_address}, ${formData.shipping_city}, ${formData.shipping_state} - ${formData.shipping_pincode}. Phone: ${formData.shipping_phone}`;
      
      const orderResponse = await orderAPI.create({
        items: cart.map(item => ({
          product_id: item.product_id || item.product?.id,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
        payment_method: 'stripe',
      });

      const orderId = orderResponse.data.order_id || orderResponse.data.id;

      // Step 2: Create payment checkout session
      const paymentResponse = await orderAPI.createPayment({
        amount: total * 100, // Convert to paise
        payment_type: 'order',
        reference_id: orderId,
        payment_method: 'stripe',
      });

      // Get Stripe checkout URL
      const checkoutUrl = paymentResponse.data.url || paymentResponse.data.checkout_url;
      
      if (checkoutUrl) {
        // Clear cart
        await clearCart();
        
        // Open Stripe checkout in browser
        Alert.alert(
          'Payment',
          'You will be redirected to Stripe to complete your payment.',
          [
            {
              text: 'Continue to Payment',
              onPress: () => {
                Linking.openURL(checkoutUrl);
                // Navigate back to home after opening payment
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              },
            },
          ]
        );
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Checkout Failed',
        error.response?.data?.detail || 'Failed to process checkout. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType, error, multiline, editable = true, rightElement }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            error && styles.inputError,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray[400]}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
        />
        {rightElement}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const OrderSummaryItem = ({ item }) => {
    const product = item.product || {};
    return (
      <View style={styles.summaryItem}>
        <View style={styles.summaryItemInfo}>
          <Text style={styles.summaryItemName} numberOfLines={1}>
            {product.name || item.name || 'Product'}
          </Text>
          <Text style={styles.summaryItemQty}>Qty: {item.quantity}</Text>
        </View>
        <Text style={styles.summaryItemPrice}>
          ₹{((product.price || item.price || 0) * item.quantity).toLocaleString()}
        </Text>
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
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Button
            title="Continue Shopping"
            onPress={() => navigation.navigate('Store')}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Shipping Details' : 'Review Order'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]}>
            {step > 1 ? (
              <Icon name="checkmark" size={14} color={COLORS.white} />
            ) : (
              <Text style={styles.progressDotText}>1</Text>
            )}
          </View>
          <Text style={[styles.progressLabel, step >= 1 && styles.progressLabelActive]}>
            Shipping
          </Text>
        </View>
        <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]}>
            <Text style={styles.progressDotText}>2</Text>
          </View>
          <Text style={[styles.progressLabel, step >= 2 && styles.progressLabelActive]}>
            Review
          </Text>
        </View>
        <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
        <View style={styles.progressStep}>
          <View style={styles.progressDot}>
            <Text style={styles.progressDotText}>3</Text>
          </View>
          <Text style={styles.progressLabel}>Payment</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          // Step 1: Shipping Details
          <View style={styles.formCard}>
            <InputField
              label="Full Name *"
              value={formData.shipping_name}
              onChangeText={(v) => updateFormData('shipping_name', v)}
              placeholder="Enter your full name"
              error={errors.shipping_name}
            />
            <InputField
              label="Phone Number *"
              value={formData.shipping_phone}
              onChangeText={(v) => updateFormData('shipping_phone', v)}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              error={errors.shipping_phone}
            />
            <InputField
              label="Email"
              value={formData.shipping_email}
              onChangeText={(v) => updateFormData('shipping_email', v)}
              placeholder="Email for order updates"
              keyboardType="email-address"
            />
            <InputField
              label="Address *"
              value={formData.shipping_address}
              onChangeText={(v) => updateFormData('shipping_address', v)}
              placeholder="House no, Building, Street, Area"
              multiline
              error={errors.shipping_address}
            />
            <InputField
              label="Pincode *"
              value={formData.shipping_pincode}
              onChangeText={handlePincodeChange}
              placeholder="6-digit pincode"
              keyboardType="number-pad"
              error={errors.shipping_pincode}
              rightElement={pincodeLoading && (
                <ActivityIndicator size="small" color={COLORS.saffron} style={styles.pincodeLoader} />
              )}
            />
            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputField
                  label="City *"
                  value={formData.shipping_city}
                  onChangeText={(v) => updateFormData('shipping_city', v)}
                  placeholder="City"
                  error={errors.shipping_city}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputField
                  label="State *"
                  value={formData.shipping_state}
                  onChangeText={(v) => updateFormData('shipping_state', v)}
                  placeholder="State"
                  error={errors.shipping_state}
                />
              </View>
            </View>
          </View>
        ) : (
          // Step 2: Review Order
          <>
            {/* Shipping Address Card */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewCardHeader}>
                <Icon name="location-outline" size={20} color={COLORS.saffron} />
                <Text style={styles.reviewCardTitle}>Delivery Address</Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.addressText}>
                {formData.shipping_name}{'\n'}
                {formData.shipping_address}{'\n'}
                {formData.shipping_city}, {formData.shipping_state} - {formData.shipping_pincode}{'\n'}
                Phone: {formData.shipping_phone}
              </Text>
            </View>

            {/* Order Items */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewCardHeader}>
                <Icon name="cart-outline" size={20} color={COLORS.saffron} />
                <Text style={styles.reviewCardTitle}>Order Items ({cartItemCount})</Text>
              </View>
              {cart.map((item, index) => (
                <OrderSummaryItem key={index} item={item} />
              ))}
            </View>

            {/* Price Summary */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewCardHeader}>
                <Icon name="receipt-outline" size={20} color={COLORS.saffron} />
                <Text style={styles.reviewCardTitle}>Price Details</Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>₹{subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Platform Fee (2.5%)</Text>
                <Text style={styles.priceValue}>₹{platformFee.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>GST (18%)</Text>
                <Text style={styles.priceValue}>₹{tax.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery</Text>
                <Text style={[styles.priceValue, { color: COLORS.success }]}>FREE</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewCardHeader}>
                <Icon name="card-outline" size={20} color={COLORS.saffron} />
                <Text style={styles.reviewCardTitle}>Payment Method</Text>
              </View>
              <View style={styles.paymentMethod}>
                <View style={styles.paymentIcon}>
                  <Text style={styles.stripeText}>Stripe</Text>
                </View>
                <View>
                  <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
                  <Text style={styles.paymentSubtitle}>Secure payment via Stripe</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        {step === 2 && (
          <View style={styles.bottomTotal}>
            <Text style={styles.bottomTotalLabel}>Total</Text>
            <Text style={styles.bottomTotalValue}>₹{total.toLocaleString()}</Text>
          </View>
        )}
        <Button
          title={step === 1 ? 'Continue' : 'Place Order'}
          onPress={step === 1 ? handleContinue : handlePlaceOrder}
          loading={loading}
          style={styles.bottomButton}
          icon={
            <Icon 
              name={step === 1 ? 'arrow-forward' : 'card-outline'} 
              size={18} 
              color={COLORS.white} 
            />
          }
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: COLORS.white,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressDotActive: {
    backgroundColor: COLORS.saffron,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.gray[400],
  },
  progressLabelActive: {
    color: COLORS.saffron,
    fontWeight: '500',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 8,
    marginBottom: 20,
  },
  progressLineActive: {
    backgroundColor: COLORS.saffron,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.small,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.gray[800],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.gray[100],
    color: COLORS.gray[500],
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  pincodeLoader: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginLeft: 8,
    flex: 1,
  },
  editText: {
    fontSize: 13,
    color: COLORS.saffron,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 22,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  summaryItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  summaryItemName: {
    fontSize: 14,
    color: COLORS.gray[800],
    marginBottom: 2,
  },
  summaryItemQty: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.gray[800],
  },
  priceDivider: {
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
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
  },
  paymentIcon: {
    width: 50,
    height: 32,
    backgroundColor: '#635BFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stripeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[800],
  },
  paymentSubtitle: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  bottomContainer: {
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
  bottomTotal: {
    marginRight: 16,
  },
  bottomTotalLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.maroon,
  },
  bottomButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 16,
  },
});

export default CheckoutScreen;
