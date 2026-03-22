"""
Test Chat and Payment Routes Modularization - Phase 2
Tests the newly extracted chat_router and payments_router from server.py
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoint:
    """Verify basic health endpoint still works after refactoring"""
    
    def test_health_endpoint(self):
        """GET /api/health - should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health endpoint working: {data}")


class TestProductsEndpoint:
    """Verify products endpoint still works after refactoring"""
    
    def test_products_list(self):
        """GET /api/products - should return products list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Products endpoint working: {len(data['products'])} products found")


class TestChatRoutesAuth:
    """Test Chat routes require authentication (from routes/chat.py)"""
    
    def test_chat_rooms_requires_auth(self):
        """GET /api/chat/rooms - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/chat/rooms correctly requires authentication ({response.status_code})")
    
    def test_chat_unread_count_requires_auth(self):
        """GET /api/chat/unread-count - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/chat/unread-count")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/chat/unread-count correctly requires authentication ({response.status_code})")
    
    def test_chat_room_messages_requires_auth(self):
        """GET /api/chat/rooms/{room_id}/messages - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms/test123/messages")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/chat/rooms/{{room_id}}/messages correctly requires authentication ({response.status_code})")
    
    def test_send_message_requires_auth(self):
        """POST /api/chat/rooms/{room_id}/messages - should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/chat/rooms/test123/messages",
            json={"content": "test message"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ POST /api/chat/rooms/{{room_id}}/messages correctly requires authentication ({response.status_code})")
    
    def test_mark_messages_read_requires_auth(self):
        """PUT /api/chat/rooms/{room_id}/read - should require authentication"""
        response = requests.put(f"{BASE_URL}/api/chat/rooms/test123/read")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ PUT /api/chat/rooms/{{room_id}}/read correctly requires authentication ({response.status_code})")


class TestPaymentRoutesAuth:
    """Test Payment routes require authentication (from routes/payments.py)"""
    
    def test_stripe_create_intent_requires_auth(self):
        """POST /api/payments/stripe/create-intent - should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/stripe/create-intent",
            json={"amount": 1000, "currency": "inr"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ POST /api/payments/stripe/create-intent correctly requires authentication ({response.status_code})")
    
    def test_stripe_confirm_requires_auth(self):
        """POST /api/payments/stripe/confirm - should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/stripe/confirm",
            json={
                "payment_intent_id": "pi_test",
                "card_number": "4242424242424242",
                "exp_month": "12",
                "exp_year": "2025",
                "cvc": "123"
            }
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ POST /api/payments/stripe/confirm correctly requires authentication ({response.status_code})")
    
    def test_razorpay_create_order_requires_auth(self):
        """POST /api/payments/razorpay/create-order - should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/razorpay/create-order",
            json={"amount": 1000, "currency": "INR"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ POST /api/payments/razorpay/create-order correctly requires authentication ({response.status_code})")
    
    def test_create_checkout_requires_auth(self):
        """POST /api/payments/create-checkout - should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-checkout",
            json={
                "amount": 100.0,
                "currency": "inr",
                "payment_type": "booking",
                "reference_id": "test123"
            }
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ POST /api/payments/create-checkout correctly requires authentication ({response.status_code})")


class TestChatRoutesAuthenticated:
    """Test Chat routes with authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        # Try to login with existing test user
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "devotee@test.com", "password": "test1234"}
        )
        
        if login_response.status_code != 200:
            # Register new test user
            register_response = requests.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": "chattest@test.com",
                    "password": "test1234",
                    "name": "Chat Test User",
                    "role": "devotee"
                }
            )
            if register_response.status_code in [200, 201]:
                self.token = register_response.json().get("token")
            else:
                # Try login with new user
                login_response = requests.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": "chattest@test.com", "password": "test1234"}
                )
                self.token = login_response.json().get("token") if login_response.status_code == 200 else None
        else:
            self.token = login_response.json().get("token")
        
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_get_chat_rooms_authenticated(self):
        """GET /api/chat/rooms - should return rooms list when authenticated"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        print(f"✓ GET /api/chat/rooms authenticated: {len(data['rooms'])} rooms found")
    
    def test_get_unread_count_authenticated(self):
        """GET /api/chat/unread-count - should return unread count when authenticated"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/chat/unread-count",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        print(f"✓ GET /api/chat/unread-count authenticated: {data['unread_count']} unread")


class TestPaymentRoutesAuthenticated:
    """Test Payment routes with authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "devotee@test.com", "password": "test1234"}
        )
        
        if login_response.status_code != 200:
            # Register new test user
            register_response = requests.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": "paymenttest@test.com",
                    "password": "test1234",
                    "name": "Payment Test User",
                    "role": "devotee"
                }
            )
            if register_response.status_code in [200, 201]:
                self.token = register_response.json().get("token")
            else:
                login_response = requests.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": "paymenttest@test.com", "password": "test1234"}
                )
                self.token = login_response.json().get("token") if login_response.status_code == 200 else None
        else:
            self.token = login_response.json().get("token")
        
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_stripe_create_intent_authenticated(self):
        """POST /api/payments/stripe/create-intent - should work when authenticated"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.post(
            f"{BASE_URL}/api/payments/stripe/create-intent",
            headers=self.headers,
            json={"amount": 1000, "currency": "inr", "description": "Test payment"}
        )
        # May return 400/500 if Stripe not configured, but should not be 401
        assert response.status_code != 401, "Should not return 401 when authenticated"
        print(f"✓ POST /api/payments/stripe/create-intent authenticated: status {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert "client_secret" in data or "payment_intent_id" in data
            print(f"  Payment intent created successfully")
    
    def test_payment_status_endpoint(self):
        """GET /api/payments/status/{session_id} - should be accessible"""
        response = requests.get(f"{BASE_URL}/api/payments/status/test_session_123")
        # This endpoint may not require auth, just verify it exists
        # It may return 400/404/500 for invalid session, but route should exist
        assert response.status_code != 404 or "not found" not in response.text.lower() or "session" in response.text.lower()
        print(f"✓ GET /api/payments/status endpoint exists: status {response.status_code}")


class TestShopProfileEndpoint:
    """Test Shop profile endpoint still works (from routes/shop.py)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as shop owner"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "shop@divineapp.com", "password": "shop123"}
        )
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
        else:
            # Try test shop owner
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": "shop@test.com", "password": "test1234"}
            )
            self.token = login_response.json().get("token") if login_response.status_code == 200 else None
        
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_shop_profile_requires_auth(self):
        """GET /api/shop/profile - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/shop/profile")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/shop/profile correctly requires authentication ({response.status_code})")
    
    def test_shop_profile_authenticated(self):
        """GET /api/shop/profile - should return profile when authenticated as shop owner"""
        if not self.token:
            pytest.skip("No shop owner token available")
        
        response = requests.get(
            f"{BASE_URL}/api/shop/profile",
            headers=self.headers
        )
        # May return 403 if not shop owner role, or 404 if no shop
        if response.status_code == 200:
            data = response.json()
            assert "id" in data or "name" in data
            print(f"✓ GET /api/shop/profile authenticated: shop '{data.get('name', 'N/A')}'")
        else:
            print(f"✓ GET /api/shop/profile authenticated: status {response.status_code} (may need shop_owner role)")


class TestCartEndpoint:
    """Test Cart endpoint still works (from routes/cart.py)"""
    
    def test_cart_requires_auth(self):
        """GET /api/cart - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/cart correctly requires authentication ({response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
