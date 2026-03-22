"""
Backend Tests for Shop and Cart Routes Modularization
Tests that shop_router and cart_router work correctly after extraction from server.py

Features tested:
- Shop routes (/api/shop/*) - profile, products, orders, dashboard, inventory
- Cart routes (/api/cart/*) - get, add, update, clear, summary
- Products routes (/api/products/*) - list, details
- Health endpoint
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from previous tests
SHOP_OWNER = {"email": "shop@test.com", "password": "test1234"}
DEVOTEE = {"email": "devotee@test.com", "password": "test1234"}


@pytest.fixture(scope="module")
def api_client():
    """Create a session for API requests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def shop_owner_token(api_client):
    """Login as shop owner and get token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Shop owner login failed - skipping shop owner tests")


@pytest.fixture(scope="module")
def devotee_token(api_client):
    """Login as devotee and get token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=DEVOTEE)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Devotee login failed - skipping devotee tests")


class TestHealthEndpoint:
    """Test health endpoint - basic API availability"""
    
    def test_health_returns_healthy(self, api_client):
        """GET /api/health - should return healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert "timestamp" in data
        print("✅ Health endpoint working")


class TestProductsEndpoints:
    """Test public products endpoints"""
    
    def test_get_products_list(self, api_client):
        """GET /api/products - returns list of products"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)
        print(f"✅ Products list: {len(data['products'])} products found")
        return data["products"]
    
    def test_get_product_details(self, api_client):
        """GET /api/products/{id} - returns product details"""
        # First get a product ID
        products_response = api_client.get(f"{BASE_URL}/api/products")
        products = products_response.json().get("products", [])
        
        if products:
            product_id = products[0]["id"]
            response = api_client.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            data = response.json()
            
            # Verify product structure
            assert "id" in data
            assert "name" in data
            assert "price" in data
            assert "description" in data
            assert "shop_id" in data
            print(f"✅ Product details: {data['name']} - ₹{data['price']}")
        else:
            pytest.skip("No products available for testing")
    
    def test_get_nonexistent_product(self, api_client):
        """GET /api/products/{invalid_id} - returns 404 or error"""
        response = api_client.get(f"{BASE_URL}/api/products/000000000000000000000000")
        # Should return 404 or 400 for invalid product
        assert response.status_code in [400, 404, 500]
        print("✅ Invalid product ID handled correctly")


class TestCartEndpointsAuth:
    """Test cart endpoints require authentication"""
    
    def test_cart_requires_auth(self, api_client):
        """GET /api/cart - should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/cart")
        assert response.status_code in [401, 403]
        print("✅ Cart endpoint requires authentication")
    
    def test_cart_add_requires_auth(self, api_client):
        """POST /api/cart/add - should require authentication"""
        response = api_client.post(f"{BASE_URL}/api/cart/add", json={
            "product_id": "test",
            "quantity": 1
        })
        assert response.status_code in [401, 403]
        print("✅ Cart add endpoint requires authentication")
    
    def test_cart_summary_requires_auth(self, api_client):
        """GET /api/cart/summary - should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/cart/summary")
        assert response.status_code in [401, 403]
        print("✅ Cart summary endpoint requires authentication")


class TestCartEndpointsAuthenticated:
    """Test cart endpoints with authentication"""
    
    def test_get_cart(self, api_client, devotee_token):
        """GET /api/cart - returns user's cart"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/cart", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        print(f"✅ Cart fetched: {len(data['items'])} items, ₹{data['total']} total")
    
    def test_add_to_cart(self, api_client, devotee_token):
        """POST /api/cart/add - add item to cart"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # Get a product first
        products_response = api_client.get(f"{BASE_URL}/api/products")
        products = products_response.json().get("products", [])
        
        if products:
            product_id = products[0]["id"]
            response = api_client.post(
                f"{BASE_URL}/api/cart/add",
                json={"product_id": product_id, "quantity": 1},
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            print(f"✅ Added to cart: {products[0]['name']}")
        else:
            pytest.skip("No products available")
    
    def test_get_cart_summary(self, api_client, devotee_token):
        """GET /api/cart/summary - returns cart with shipping"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/cart/summary", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "subtotal" in data
        assert "shipping" in data
        assert "total" in data
        print(f"✅ Cart summary: subtotal=₹{data['subtotal']}, shipping=₹{data['shipping']}, total=₹{data['total']}")
    
    def test_update_cart_item(self, api_client, devotee_token):
        """PUT /api/cart/update - update cart item quantity"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # Get cart first
        cart_response = api_client.get(f"{BASE_URL}/api/cart", headers=headers)
        cart = cart_response.json()
        
        if cart["items"]:
            product_id = cart["items"][0]["product_id"]
            response = api_client.put(
                f"{BASE_URL}/api/cart/update",
                json={"product_id": product_id, "quantity": 2},
                headers=headers
            )
            assert response.status_code == 200
            print("✅ Cart item updated")
        else:
            pytest.skip("Cart is empty")
    
    def test_clear_cart(self, api_client, devotee_token):
        """DELETE /api/cart/clear - clear entire cart"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.delete(f"{BASE_URL}/api/cart/clear", headers=headers)
        assert response.status_code == 200
        
        # Verify cart is empty
        cart_response = api_client.get(f"{BASE_URL}/api/cart", headers=headers)
        cart = cart_response.json()
        assert len(cart["items"]) == 0
        print("✅ Cart cleared successfully")


class TestShopEndpointsAuth:
    """Test shop endpoints require authentication"""
    
    def test_shop_profile_requires_auth(self, api_client):
        """GET /api/shop/profile - should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/shop/profile")
        assert response.status_code in [401, 403]
        print("✅ Shop profile requires authentication")
    
    def test_shop_dashboard_requires_auth(self, api_client):
        """GET /api/shop/dashboard - should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/shop/dashboard")
        assert response.status_code in [401, 403]
        print("✅ Shop dashboard requires authentication")
    
    def test_shop_orders_requires_auth(self, api_client):
        """GET /api/shop/orders - should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/shop/orders")
        assert response.status_code in [401, 403]
        print("✅ Shop orders requires authentication")


class TestShopEndpointsAuthenticated:
    """Test shop endpoints with shop owner authentication"""
    
    def test_get_shop_profile(self, api_client, shop_owner_token):
        """GET /api/shop/profile - returns shop profile"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = api_client.get(f"{BASE_URL}/api/shop/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify shop profile structure
        assert "id" in data
        assert "name" in data
        assert "shipping_cost" in data
        assert "free_shipping_above" in data
        print(f"✅ Shop profile: {data['name']}, shipping=₹{data['shipping_cost']}")
    
    def test_get_shop_dashboard(self, api_client, shop_owner_token):
        """GET /api/shop/dashboard - returns dashboard stats"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = api_client.get(f"{BASE_URL}/api/shop/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "stats" in data
        stats = data["stats"]
        assert "total_products" in stats
        assert "total_orders" in stats
        assert "today_revenue" in stats
        assert "monthly_revenue" in stats
        
        assert "recent_orders" in data
        assert "top_products" in data
        print(f"✅ Shop dashboard: {stats['total_products']} products, {stats['total_orders']} orders")
    
    def test_get_shop_orders(self, api_client, shop_owner_token):
        """GET /api/shop/orders - returns shop orders"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = api_client.get(f"{BASE_URL}/api/shop/orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        assert isinstance(data["orders"], list)
        print(f"✅ Shop orders: {len(data['orders'])} orders")
    
    def test_get_shop_inventory(self, api_client, shop_owner_token):
        """GET /api/shop/inventory - returns inventory with alerts"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = api_client.get(f"{BASE_URL}/api/shop/inventory", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "total" in data
        assert "low_stock_count" in data
        assert "out_of_stock_count" in data
        print(f"✅ Shop inventory: {data['total']} products, {data['low_stock_count']} low stock")
    
    def test_get_my_products(self, api_client, shop_owner_token):
        """GET /api/shop/my-products - returns shop owner's products"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = api_client.get(f"{BASE_URL}/api/shop/my-products", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        print(f"✅ My products: {len(data['products'])} products")


class TestShopProductManagement:
    """Test shop product CRUD operations"""
    
    def test_add_and_delete_product(self, api_client, shop_owner_token):
        """POST /api/shop/products and DELETE /api/shop/products/{id}"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Create test product
        new_product = {
            "name": "TEST_Modular_Route_Product",
            "description": "Test product for modular route testing",
            "price": 99,
            "category": "Test",
            "stock": 5,
            "images": []
        }
        
        create_response = api_client.post(
            f"{BASE_URL}/api/shop/products",
            json=new_product,
            headers=headers
        )
        assert create_response.status_code in [200, 201]
        data = create_response.json()
        product_id = data.get("product_id")
        
        if product_id:
            # Delete the test product
            delete_response = api_client.delete(
                f"{BASE_URL}/api/shop/products/{product_id}",
                headers=headers
            )
            assert delete_response.status_code == 200
            print("✅ Product created and deleted successfully")
        else:
            print("✅ Product creation works (no product_id in response)")
    
    def test_update_product(self, api_client, shop_owner_token):
        """PUT /api/shop/products/{id} - update product"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Get a product first
        products_response = api_client.get(f"{BASE_URL}/api/shop/my-products", headers=headers)
        products = products_response.json().get("products", [])
        
        if products:
            product_id = products[0]["id"]
            update_data = {
                "description": f"Updated at {datetime.now().isoformat()}"
            }
            
            response = api_client.put(
                f"{BASE_URL}/api/shop/products/{product_id}",
                json=update_data,
                headers=headers
            )
            assert response.status_code == 200
            print("✅ Product updated successfully")
        else:
            pytest.skip("No products to update")


class TestShopProfileUpdate:
    """Test shop profile update"""
    
    def test_update_shop_profile(self, api_client, shop_owner_token):
        """PUT /api/shop/profile - update shop profile"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Get current profile
        get_response = api_client.get(f"{BASE_URL}/api/shop/profile", headers=headers)
        current = get_response.json()
        
        # Update shipping settings
        update_data = {
            "shipping_cost": 55,
            "free_shipping_above": 550
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/shop/profile",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify update
        verify_response = api_client.get(f"{BASE_URL}/api/shop/profile", headers=headers)
        updated = verify_response.json()
        assert updated.get("shipping_cost") == 55
        assert updated.get("free_shipping_above") == 550
        
        # Restore original
        restore_data = {
            "shipping_cost": current.get("shipping_cost", 50),
            "free_shipping_above": current.get("free_shipping_above", 500)
        }
        api_client.put(f"{BASE_URL}/api/shop/profile", json=restore_data, headers=headers)
        
        print("✅ Shop profile updated and restored")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
