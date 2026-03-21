"""
Divine App Backend API Tests
Tests for auth, Firebase sync, payment endpoints, priests, products, horoscope, etc.
"""
import pytest
import requests
import os

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://vedic-hub-2.preview.emergentagent.com"

# Test credentials
ADMIN_EMAIL = "admin@divineapp.com"
ADMIN_PASSWORD = "admin123"
DEVOTEE_EMAIL = "priya@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


# ===================== HEALTH CHECK TESTS =====================
class TestHealthCheck:
    """Health endpoint tests"""
    
    def test_health_check(self, api_client):
        """Test /api/health returns healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print(f"✅ Health check passed: {data}")


# ===================== AUTH TESTS =====================
class TestAuth:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful: {data['user']['email']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid credentials correctly rejected with 401")
    
    def test_get_me_with_auth(self, authenticated_client):
        """Test /api/auth/me returns user info"""
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        
        data = response.json()
        assert "email" in data
        assert "role" in data
        print(f"✅ Auth me endpoint returned: {data['email']}, role: {data['role']}")
    
    def test_get_me_without_auth(self, api_client):
        """Test /api/auth/me without auth returns 401"""
        temp_client = requests.Session()
        temp_client.headers.update({"Content-Type": "application/json"})
        response = temp_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401 or response.status_code == 403
        print("✅ Auth me correctly requires authentication")


# ===================== FIREBASE AUTH TESTS =====================
class TestFirebaseSync:
    """Firebase authentication sync tests"""
    
    def test_firebase_sync_new_user(self, api_client):
        """Test firebase-sync creates new user"""
        test_uid = f"firebase_test_{os.urandom(4).hex()}"
        test_email = f"test_{os.urandom(4).hex()}@example.com"
        
        response = api_client.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "firebase_uid": test_uid,
            "email": test_email,
            "name": "Firebase Test User"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == test_email
        assert data["user"]["role"] == "devotee"  # Default role for new users
        print(f"✅ Firebase sync created user: {data['user']['email']}")
    
    def test_firebase_sync_existing_user(self, api_client):
        """Test firebase-sync returns existing user"""
        response = api_client.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "firebase_uid": "existing_uid_test",
            "email": ADMIN_EMAIL,
            "name": "Admin User"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"  # Should preserve existing role
        print(f"✅ Firebase sync returned existing user: {data['user']['email']}")


# ===================== PRIEST TESTS =====================
class TestPriests:
    """Priest endpoint tests"""
    
    def test_get_priests_list(self, api_client):
        """Test get priests list"""
        response = api_client.get(f"{BASE_URL}/api/priests")
        assert response.status_code == 200
        
        data = response.json()
        assert "priests" in data
        assert "total" in data
        assert isinstance(data["priests"], list)
        
        if data["total"] > 0:
            priest = data["priests"][0]
            assert "user_name" in priest
            assert "services" in priest
            assert "rating" in priest
        print(f"✅ Priests list returned {data['total']} priests")
    
    def test_get_priests_by_specialization(self, api_client):
        """Test filtering priests by specialization"""
        response = api_client.get(f"{BASE_URL}/api/priests?specialization=Vedic")
        assert response.status_code == 200
        
        data = response.json()
        assert "priests" in data
        print(f"✅ Filtered priests returned {len(data['priests'])} results")


# ===================== PRODUCT TESTS =====================
class TestProducts:
    """Product/marketplace endpoint tests"""
    
    def test_get_products_list(self, api_client):
        """Test get products list"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert isinstance(data["products"], list)
        
        if data["total"] > 0:
            product = data["products"][0]
            assert "name" in product
            assert "price" in product
            assert "category" in product
        print(f"✅ Products list returned {data['total']} products")
    
    def test_get_product_categories(self, api_client):
        """Test get product categories"""
        response = api_client.get(f"{BASE_URL}/api/product-categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)
        print(f"✅ Product categories: {data['categories']}")


# ===================== HOROSCOPE TESTS =====================
class TestHoroscope:
    """Horoscope endpoint tests"""
    
    def test_get_zodiac_signs(self, api_client):
        """Test get zodiac signs list"""
        response = api_client.get(f"{BASE_URL}/api/horoscope/zodiac-signs")
        assert response.status_code == 200
        
        data = response.json()
        assert "signs" in data
        assert len(data["signs"]) == 12  # 12 zodiac signs
        print(f"✅ Zodiac signs returned: {len(data['signs'])} signs")
    
    def test_get_daily_horoscope(self, api_client):
        """Test get daily horoscope for Aries"""
        response = api_client.get(f"{BASE_URL}/api/horoscope/daily/Aries")
        assert response.status_code == 200
        
        data = response.json()
        assert "daily_prediction" in data or "prediction" in data or "horoscope" in data
        assert "lucky_number" in data
        print(f"✅ Daily horoscope for Aries returned")


# ===================== PAYMENT TESTS (STRIPE) =====================
class TestStripePayments:
    """Stripe payment endpoint tests"""
    
    def test_create_stripe_payment_intent(self, authenticated_client):
        """Test creating Stripe payment intent"""
        response = authenticated_client.post(f"{BASE_URL}/api/payments/stripe/create-intent", json={
            "amount": 1000,  # $10.00 in cents
            "currency": "usd",
            "description": "Test payment"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "client_secret" in data
        assert "payment_intent_id" in data
        assert data["payment_intent_id"].startswith("pi_")
        print(f"✅ Stripe payment intent created: {data['payment_intent_id']}")
    
    def test_create_stripe_intent_without_auth(self, api_client):
        """Test stripe intent requires authentication"""
        temp_client = requests.Session()
        temp_client.headers.update({"Content-Type": "application/json"})
        response = temp_client.post(f"{BASE_URL}/api/payments/stripe/create-intent", json={
            "amount": 1000,
            "currency": "usd"
        })
        assert response.status_code == 401 or response.status_code == 403
        print("✅ Stripe payment intent correctly requires authentication")


# ===================== FESTIVAL & TEMPLE TESTS =====================
class TestFestivalsTemples:
    """Festival and temple endpoint tests"""
    
    def test_get_festivals(self, api_client):
        """Test get festivals list"""
        response = api_client.get(f"{BASE_URL}/api/festivals")
        assert response.status_code == 200
        
        data = response.json()
        assert "festivals" in data
        assert isinstance(data["festivals"], list)
        print(f"✅ Festivals returned: {len(data['festivals'])} festivals")
    
    def test_get_temples(self, api_client):
        """Test get temples list"""
        response = api_client.get(f"{BASE_URL}/api/temples")
        assert response.status_code == 200
        
        data = response.json()
        assert "temples" in data
        assert isinstance(data["temples"], list)
        print(f"✅ Temples returned: {len(data['temples'])} temples")


# ===================== ASTROLOGER TESTS =====================
class TestAstrologers:
    """Astrologer endpoint tests"""
    
    def test_get_astrologers(self, api_client):
        """Test get astrologers list"""
        response = api_client.get(f"{BASE_URL}/api/astrologers")
        assert response.status_code == 200
        
        data = response.json()
        assert "astrologers" in data
        assert isinstance(data["astrologers"], list)
        print(f"✅ Astrologers returned: {len(data['astrologers'])} astrologers")


# ===================== ADMIN TESTS =====================
class TestAdminEndpoints:
    """Admin endpoint tests"""
    
    def test_get_admin_stats(self, authenticated_client):
        """Test admin stats endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_users" in data
        assert "total_priests" in data
        assert "total_products" in data
        print(f"✅ Admin stats: {data['total_users']} users, {data['total_priests']} priests, {data['total_products']} products")
    
    def test_get_admin_users(self, authenticated_client):
        """Test admin users list endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        data = response.json()
        assert "users" in data
        assert "total" in data
        print(f"✅ Admin users list: {data['total']} users")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
