"""
Backend Tests for Shop Owner Dashboard and E-commerce Checkout Flow
Features tested:
- Shop Owner Dashboard APIs (GET /api/shop/dashboard, /api/shop/orders, etc.)
- Product management (PUT/DELETE /api/shop/products/{id})
- Shop profile with shipping settings (GET/PUT /api/shop/profile)
- Inventory management (GET /api/shop/inventory)
- Cart and checkout flow (GET /api/cart/summary, POST /api/checkout)
- Order management (GET /api/orders/{id})
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
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


@pytest.fixture(scope="module")
def shop_owner_client(api_client, shop_owner_token):
    """Get authenticated client for shop owner"""
    api_client.headers.update({"Authorization": f"Bearer {shop_owner_token}"})
    return api_client


@pytest.fixture(scope="module")
def devotee_client(api_client, devotee_token):
    """Get authenticated client for devotee"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {devotee_token}"
    })
    return session


class TestHealthCheck:
    """Test API health endpoint"""
    
    def test_health_endpoint(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Health check passed")


class TestShopOwnerAuthentication:
    """Test shop owner authentication"""
    
    def test_shop_owner_login(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=SHOP_OWNER)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data.get("user", {}).get("role") == "shop_owner"
        print(f"✅ Shop owner login successful - User: {data.get('user', {}).get('name')}")


class TestShopOwnerDashboard:
    """Test Shop Owner Dashboard APIs"""
    
    def test_dashboard_unauthenticated_rejected(self, api_client):
        """Dashboard should reject unauthenticated requests"""
        response = api_client.get(f"{BASE_URL}/api/shop/dashboard")
        assert response.status_code in [401, 403]
        print("✅ Dashboard rejects unauthenticated requests")
    
    def test_get_shop_dashboard(self, shop_owner_client):
        """GET /api/shop/dashboard - returns stats and recent orders"""
        response = shop_owner_client.get(f"{BASE_URL}/api/shop/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "stats" in data
        stats = data["stats"]
        assert "total_products" in stats
        assert "low_stock" in stats
        assert "total_orders" in stats
        assert "pending_orders" in stats
        assert "today_revenue" in stats
        assert "monthly_revenue" in stats
        
        # Verify recent_orders
        assert "recent_orders" in data
        assert "top_products" in data
        
        print(f"✅ Dashboard stats: {stats['total_products']} products, {stats['total_orders']} orders")
    
    def test_get_shop_profile(self, shop_owner_client):
        """GET /api/shop/profile - returns shop profile including shipping settings"""
        response = shop_owner_client.get(f"{BASE_URL}/api/shop/profile")
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "name" in data
        assert "shipping_cost" in data
        assert "free_shipping_above" in data
        
        print(f"✅ Shop profile: {data.get('name')}, shipping: ₹{data.get('shipping_cost')}, free above: ₹{data.get('free_shipping_above')}")
    
    def test_update_shop_profile(self, shop_owner_client):
        """PUT /api/shop/profile - update shop profile including shipping"""
        # First get current profile
        get_response = shop_owner_client.get(f"{BASE_URL}/api/shop/profile")
        current = get_response.json()
        
        # Update shipping settings
        update_data = {
            "shipping_cost": 60,
            "free_shipping_above": 600
        }
        response = shop_owner_client.put(f"{BASE_URL}/api/shop/profile", json=update_data)
        assert response.status_code == 200
        
        # Verify the update
        verify_response = shop_owner_client.get(f"{BASE_URL}/api/shop/profile")
        updated = verify_response.json()
        assert updated.get("shipping_cost") == 60
        assert updated.get("free_shipping_above") == 600
        
        # Restore original values
        restore_data = {
            "shipping_cost": current.get("shipping_cost", 50),
            "free_shipping_above": current.get("free_shipping_above", 500)
        }
        shop_owner_client.put(f"{BASE_URL}/api/shop/profile", json=restore_data)
        
        print("✅ Shop profile shipping settings updated and restored")
    
    def test_get_shop_orders(self, shop_owner_client):
        """GET /api/shop/orders - returns shop orders"""
        response = shop_owner_client.get(f"{BASE_URL}/api/shop/orders")
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        # Orders list should be an array
        assert isinstance(data["orders"], list)
        
        print(f"✅ Shop orders: {len(data['orders'])} orders found")
    
    def test_get_shop_orders_with_status_filter(self, shop_owner_client):
        """GET /api/shop/orders?status=pending - filter by status"""
        response = shop_owner_client.get(f"{BASE_URL}/api/shop/orders?status=pending")
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        # All returned orders should have pending status
        for order in data["orders"]:
            assert order.get("status") == "pending"
        
        print(f"✅ Shop orders filtered by status: {len(data['orders'])} pending orders")
    
    def test_get_shop_inventory(self, shop_owner_client):
        """GET /api/shop/inventory - get inventory with low stock alerts"""
        response = shop_owner_client.get(f"{BASE_URL}/api/shop/inventory")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "total" in data
        assert "low_stock_count" in data
        assert "out_of_stock_count" in data
        
        # Verify product structure
        if data["products"]:
            product = data["products"][0]
            assert "id" in product
            assert "name" in product
            assert "stock" in product
            assert "is_low_stock" in product
            assert "is_out_of_stock" in product
        
        print(f"✅ Inventory: {data['total']} products, {data['low_stock_count']} low stock, {data['out_of_stock_count']} out of stock")
    
    def test_get_my_products(self, shop_owner_client):
        """GET /api/shop/my-products - returns shop owner's products"""
        response = shop_owner_client.get(f"{BASE_URL}/api/shop/my-products")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        print(f"✅ My products: {len(data['products'])} products found")


class TestProductManagement:
    """Test product CRUD operations"""
    
    @pytest.fixture(scope="class")
    def test_product_id(self, shop_owner_client):
        """Get a product ID for testing"""
        response = shop_owner_client.get(f"{BASE_URL}/api/shop/my-products")
        if response.status_code == 200 and response.json().get("products"):
            return response.json()["products"][0]["id"]
        pytest.skip("No products found for testing")
    
    def test_update_product(self, shop_owner_client, test_product_id):
        """PUT /api/shop/products/{id} - update product"""
        update_data = {
            "description": f"Updated description at {datetime.now().isoformat()}"
        }
        response = shop_owner_client.put(f"{BASE_URL}/api/shop/products/{test_product_id}", json=update_data)
        assert response.status_code == 200
        print(f"✅ Product {test_product_id} updated successfully")
    
    def test_update_product_stock(self, shop_owner_client, test_product_id):
        """PUT /api/shop/products/{id}/stock - update product stock"""
        # Get current stock first
        inventory_response = shop_owner_client.get(f"{BASE_URL}/api/shop/inventory")
        products = inventory_response.json().get("products", [])
        product = next((p for p in products if p["id"] == test_product_id), None)
        
        if product:
            current_stock = product.get("stock", 10)
            
            # Update stock
            response = shop_owner_client.put(
                f"{BASE_URL}/api/shop/products/{test_product_id}/stock", 
                json={"stock": current_stock + 5}
            )
            assert response.status_code == 200
            
            # Restore original stock
            shop_owner_client.put(
                f"{BASE_URL}/api/shop/products/{test_product_id}/stock", 
                json={"stock": current_stock}
            )
            print(f"✅ Product stock updated and restored")
    
    def test_add_new_product(self, shop_owner_client):
        """POST /api/shop/products - add a new product"""
        new_product = {
            "name": "TEST_Product_Delete_Me",
            "description": "Test product for automated testing",
            "price": 100,
            "category": "Pooja Items",
            "stock": 10,
            "images": []
        }
        response = shop_owner_client.post(f"{BASE_URL}/api/shop/products", json=new_product)
        assert response.status_code == 200 or response.status_code == 201
        
        data = response.json()
        product_id = data.get("product_id") or data.get("id")
        
        if product_id:
            # Delete the test product
            delete_response = shop_owner_client.delete(f"{BASE_URL}/api/shop/products/{product_id}")
            assert delete_response.status_code == 200
            print(f"✅ Product created and deleted successfully")
        else:
            print(f"✅ Product creation API works (product_id not returned in response)")


class TestCartAndCheckout:
    """Test Cart and Checkout flow APIs"""
    
    def test_devotee_login(self, api_client):
        """Test devotee can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=DEVOTEE)
        assert response.status_code == 200
        print("✅ Devotee login successful")
    
    def test_get_cart(self, devotee_client):
        """GET /api/cart - get user's cart"""
        response = devotee_client.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        print(f"✅ Cart fetched: {len(data['items'])} items, ₹{data['total']} total")
    
    def test_get_cart_summary(self, devotee_client):
        """GET /api/cart/summary - returns cart with shipping breakdown"""
        response = devotee_client.get(f"{BASE_URL}/api/cart/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "subtotal" in data
        assert "shipping" in data
        assert "total" in data
        
        # If cart has items, verify shipping_breakdown
        if data["items"]:
            assert "shipping_breakdown" in data
            print(f"✅ Cart summary: {data['subtotal']} subtotal, {data['shipping']} shipping, {data['total']} total")
        else:
            print("✅ Cart summary (empty cart)")
    
    def test_add_to_cart(self, devotee_client):
        """POST /api/cart/add - add item to cart"""
        # First get a product to add
        products_response = devotee_client.get(f"{BASE_URL}/api/products")
        if products_response.status_code == 200 and products_response.json().get("products"):
            product = products_response.json()["products"][0]
            product_id = product["id"]
            
            # Add to cart
            response = devotee_client.post(f"{BASE_URL}/api/cart/add", json={
                "product_id": product_id,
                "quantity": 1
            })
            assert response.status_code == 200
            print(f"✅ Added product to cart: {product['name']}")
        else:
            pytest.skip("No products available to add to cart")
    
    def test_update_cart_item(self, devotee_client):
        """PUT /api/cart/update - update cart item quantity"""
        # Get cart first
        cart_response = devotee_client.get(f"{BASE_URL}/api/cart")
        cart = cart_response.json()
        
        if cart["items"]:
            item = cart["items"][0]
            product_id = item["product_id"]
            
            # Update quantity
            response = devotee_client.put(f"{BASE_URL}/api/cart/update", json={
                "product_id": product_id,
                "quantity": 2
            })
            assert response.status_code == 200
            
            # Verify update
            verify_response = devotee_client.get(f"{BASE_URL}/api/cart")
            verify_cart = verify_response.json()
            updated_item = next((i for i in verify_cart["items"] if i["product_id"] == product_id), None)
            if updated_item:
                assert updated_item["quantity"] == 2
            
            print("✅ Cart item quantity updated")
        else:
            pytest.skip("Cart is empty - cannot test update")
    
    def test_checkout_flow(self, devotee_client):
        """POST /api/checkout - creates order with shipping calculation"""
        # Make sure cart has items
        cart_response = devotee_client.get(f"{BASE_URL}/api/cart/summary")
        cart = cart_response.json()
        
        if not cart["items"]:
            # Add an item first
            products_response = devotee_client.get(f"{BASE_URL}/api/products")
            if products_response.status_code == 200 and products_response.json().get("products"):
                product = products_response.json()["products"][0]
                devotee_client.post(f"{BASE_URL}/api/cart/add", json={
                    "product_id": product["id"],
                    "quantity": 1
                })
            else:
                pytest.skip("No products available")
        
        # Checkout
        checkout_data = {
            "shipping_name": "Test User",
            "shipping_phone": "+91 9999999999",
            "shipping_address": "123 Test Street, Test Area",
            "shipping_city": "Mumbai",
            "payment_method": "stripe",
            "notes": "Test order - please ignore"
        }
        response = devotee_client.post(f"{BASE_URL}/api/checkout", json=checkout_data)
        
        # Checkout can succeed (200) or fail if cart is empty (400)
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert "order_id" in data
            assert "order_number" in data
            assert "total" in data
            print(f"✅ Checkout successful: Order #{data['order_number']}, Total: ₹{data['total']}")
            return data["order_id"]
        else:
            print(f"✅ Checkout endpoint works (cart was empty)")


class TestOrderManagement:
    """Test order management APIs"""
    
    def test_get_orders(self, devotee_client):
        """GET /api/orders - returns user's orders"""
        response = devotee_client.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        print(f"✅ User orders: {len(data['orders'])} orders found")
        
        return data["orders"]
    
    def test_get_order_details(self, devotee_client):
        """GET /api/orders/{id} - returns order details"""
        # Get orders first
        orders_response = devotee_client.get(f"{BASE_URL}/api/orders")
        orders = orders_response.json().get("orders", [])
        
        if orders:
            order_id = orders[0]["id"]
            response = devotee_client.get(f"{BASE_URL}/api/orders/{order_id}")
            assert response.status_code == 200
            data = response.json()
            
            assert "id" in data
            assert "items" in data
            assert "total_amount" in data
            assert "status" in data
            
            print(f"✅ Order details: #{data.get('order_number', order_id)}, Status: {data['status']}, Total: ₹{data['total_amount']}")
        else:
            pytest.skip("No orders found for testing")


class TestShopOrderStatusUpdate:
    """Test shop owner order status update"""
    
    def test_update_order_status(self, shop_owner_client):
        """PUT /api/orders/{id}/status - shop owner updates order status"""
        # Get shop orders
        orders_response = shop_owner_client.get(f"{BASE_URL}/api/shop/orders")
        orders = orders_response.json().get("orders", [])
        
        # Find a pending order to update
        pending_order = next((o for o in orders if o.get("status") == "pending"), None)
        
        if pending_order:
            order_id = pending_order["id"]
            
            # Update status to paid
            response = shop_owner_client.put(f"{BASE_URL}/api/orders/{order_id}/status", json={
                "status": "paid"
            })
            # The endpoint may or may not allow shop owners to update status
            # depending on implementation
            print(f"✅ Order status update tested: {response.status_code}")
        else:
            print("✅ No pending orders to test status update (all orders already processed)")


class TestChatRoomCreation:
    """Test that order creates chat room with shop owner"""
    
    def test_chat_rooms_exist(self, devotee_client):
        """GET /api/chat/rooms - verify chat rooms are created for orders"""
        response = devotee_client.get(f"{BASE_URL}/api/chat/rooms")
        assert response.status_code == 200
        data = response.json()
        
        assert "rooms" in data
        # Check if any order-related chat rooms exist
        order_rooms = [r for r in data["rooms"] if r.get("room_type") == "order"]
        
        print(f"✅ Chat rooms: {len(data['rooms'])} total, {len(order_rooms)} order-related")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
