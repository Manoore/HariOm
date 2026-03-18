import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { ProductCard } from '../components/Cards';
import { SearchInput } from '../components/Input';
import { useCart } from '../contexts/CartContext';
import { productAPI } from '../services/api';

const StoreScreen = ({ navigation }) => {
  const { addToCart, cartItemCount } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts(true);
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(['all', ...(response.data.categories || [])]);
    } catch (error) {
      console.log('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      }

      const params = { limit: 20 };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await productAPI.getAll(params);
      setProducts(response.data.products || []);
    } catch (error) {
      console.log('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
  };

  const handleAddToCart = async (product) => {
    const result = await addToCart(product.id);
    if (result.success) {
      Alert.alert('Added!', `${product.name} added to cart`);
    }
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const CategoryPill = ({ category, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
        {category === 'all' ? 'All' : category}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
        />
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <CategoryPill
            category={item}
            isSelected={selectedCategory === item}
            onPress={() => setSelectedCategory(item)}
          />
        )}
      />

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {products.length} Products Found
        </Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => Alert.alert('Filter', 'Filter functionality coming soon!')}
        >
          <Icon name="filter-outline" size={18} color={COLORS.gray[600]} />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProduct = ({ item, index }) => (
    <View style={[styles.productWrapper, index % 2 === 0 ? styles.productLeft : styles.productRight]}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
        onAddToCart={() => handleAddToCart(item)}
      />
    </View>
  );

  const renderFooter = () => {
    if (loading && products.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={COLORS.saffron} />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pooja Store</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.7}
        >
          <Icon name="cart-outline" size={24} color={COLORS.gray[700]} />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.saffron} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          renderItem={renderProduct}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.saffron]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="cube-outline" size={64} color={COLORS.gray[300]} />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.maroon,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.saffron,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  categoryPillSelected: {
    backgroundColor: COLORS.saffron,
    borderColor: COLORS.saffron,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  categoryTextSelected: {
    color: COLORS.white,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  listContent: {
    paddingBottom: 100,
  },
  productWrapper: {
    width: '50%',
    paddingHorizontal: 10,
  },
  productLeft: {
    paddingLeft: 20,
    paddingRight: 5,
  },
  productRight: {
    paddingLeft: 5,
    paddingRight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[500],
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
  },
});

export default StoreScreen;
