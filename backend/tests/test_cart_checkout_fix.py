"""
Cart and Checkout API Tests
Tests for the P0 bug fix: Cart sidebar and checkout page now use /api/cart/summary
instead of /api/cart to get complete cart data including subtotal, item_count, shipping, etc.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"

class TestCartAPIs:
    """Test cart API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test - login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_basic_cart_endpoint(self):
        """Test /api/cart returns basic cart data"""
        response = requests.get(f"{BASE_URL}/api/cart", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        # Basic cart should have items and total
        assert "items" in data
        assert "total" in data
        
        # Verify items structure
        if data["items"]:
            item = data["items"][0]
            assert "product_id" in item
            assert "name" in item
            assert "price" in item
            assert "quantity" in item
            assert "subtotal" in item
            assert "stock" in item
        
        print(f"Basic cart: {len(data['items'])} items, total: {data['total']}")
    
    def test_cart_summary_endpoint(self):
        """Test /api/cart/summary returns complete cart data with shipping info"""
        response = requests.get(f"{BASE_URL}/api/cart/summary", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Summary should have all fields needed by CartSidebar and CheckoutPage
        assert "items" in data
        assert "subtotal" in data
        assert "shipping" in data
        assert "total" in data
        
        # If cart has items, verify additional fields
        if data["items"]:
            assert "item_count" in data
            assert "shipping_breakdown" in data
            
            # Verify item structure includes shop info
            item = data["items"][0]
            assert "product_id" in item
            assert "name" in item
            assert "price" in item
            assert "quantity" in item
            assert "subtotal" in item
            assert "stock" in item
            assert "shop_name" in item
            
            # Verify shipping breakdown structure
            if data["shipping_breakdown"]:
                breakdown = data["shipping_breakdown"][0]
                assert "shop" in breakdown
                assert "cost" in breakdown
        
        print(f"Cart summary: {data.get('item_count', 0)} items, subtotal: {data['subtotal']}, shipping: {data['shipping']}, total: {data['total']}")
    
    def test_cart_summary_has_more_data_than_basic(self):
        """Verify /api/cart/summary returns more fields than /api/cart"""
        basic_response = requests.get(f"{BASE_URL}/api/cart", headers=self.headers)
        summary_response = requests.get(f"{BASE_URL}/api/cart/summary", headers=self.headers)
        
        assert basic_response.status_code == 200
        assert summary_response.status_code == 200
        
        basic_data = basic_response.json()
        summary_data = summary_response.json()
        
        # Summary should have additional fields
        summary_keys = set(summary_data.keys())
        basic_keys = set(basic_data.keys())
        
        # These fields should only be in summary
        expected_extra_fields = {"subtotal", "shipping", "shipping_breakdown", "item_count"}
        
        if summary_data.get("items"):
            # Verify summary has the extra fields
            for field in expected_extra_fields:
                assert field in summary_data, f"Missing field '{field}' in cart summary"
        
        print(f"Basic cart fields: {basic_keys}")
        print(f"Summary cart fields: {summary_keys}")
        print(f"Extra fields in summary: {summary_keys - basic_keys}")


class TestCartOperations:
    """Test cart CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test - login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_add_to_cart(self):
        """Test adding item to cart"""
        # First get products to find a valid product ID
        products_response = requests.get(f"{BASE_URL}/api/products")
        assert products_response.status_code == 200
        products = products_response.json().get("products", [])
        
        if not products:
            pytest.skip("No products available for testing")
        
        product = products[0]
        product_id = product["id"]
        
        # Add to cart
        response = requests.post(f"{BASE_URL}/api/cart/add", 
            headers=self.headers,
            json={"product_id": product_id, "quantity": 1}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        print(f"Added product {product_id} to cart: {data['message']}")
    
    def test_update_cart_quantity(self):
        """Test updating cart item quantity"""
        # Get current cart
        cart_response = requests.get(f"{BASE_URL}/api/cart", headers=self.headers)
        assert cart_response.status_code == 200
        cart = cart_response.json()
        
        if not cart.get("items"):
            pytest.skip("Cart is empty, cannot test update")
        
        product_id = cart["items"][0]["product_id"]
        current_qty = cart["items"][0]["quantity"]
        
        # Update quantity
        new_qty = current_qty + 1
        response = requests.put(f"{BASE_URL}/api/cart/update",
            headers=self.headers,
            json={"product_id": product_id, "quantity": new_qty}
        )
        assert response.status_code == 200
        
        # Verify update
        verify_response = requests.get(f"{BASE_URL}/api/cart", headers=self.headers)
        verify_cart = verify_response.json()
        updated_item = next((i for i in verify_cart["items"] if i["product_id"] == product_id), None)
        
        if updated_item:
            assert updated_item["quantity"] == new_qty
            print(f"Updated quantity from {current_qty} to {new_qty}")
        
        # Restore original quantity
        requests.put(f"{BASE_URL}/api/cart/update",
            headers=self.headers,
            json={"product_id": product_id, "quantity": current_qty}
        )


class TestCheckoutAPIs:
    """Test checkout-related APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test - login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_fees_taxes_endpoint(self):
        """Test /api/checkout/fees-taxes returns fee configuration"""
        response = requests.get(f"{BASE_URL}/api/checkout/fees-taxes", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        # Should have platform_fee and tax configuration
        assert "platform_fee" in data or "tax" in data
        
        print(f"Fees config: {data}")
    
    def test_orders_endpoint(self):
        """Test /api/orders returns user orders"""
        response = requests.get(f"{BASE_URL}/api/orders", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        
        print(f"User has {len(data['orders'])} orders")


class TestProductsAPI:
    """Test products API for shop functionality"""
    
    def test_get_products(self):
        """Test /api/products returns product list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        
        if data["products"]:
            product = data["products"][0]
            # Verify product structure
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert "stock" in product
            
            print(f"Found {len(data['products'])} products")
            print(f"First product: {product['name']} - ₹{product['price']}")
        else:
            print("No products found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
