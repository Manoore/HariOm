"""
Test Orders/Checkout and Astrology Routes - Phase 3 Backend Refactoring
Tests the newly extracted routes from server.py:
- /app/backend/routes/orders_new.py - Orders and Checkout routes (430 lines)
- /app/backend/routes/astrology.py - Astrology/Horoscope routes (410 lines)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://otp-blank-screen.preview.emergentagent.com').rstrip('/')

# Test credentials from previous tests
TEST_DEVOTEE = {"email": "devotee@test.com", "password": "test1234"}
TEST_SHOP_OWNER = {"email": "shop@divineapp.com", "password": "shop123"}


class TestHealthAndBasicEndpoints:
    """Basic health and product endpoints to verify server is running"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health endpoint working: {data}")
    
    def test_products_endpoint(self):
        """Test /api/products returns products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data or isinstance(data, list)
        print(f"✓ Products endpoint working: {len(data.get('products', data))} products")


class TestPanchangEndpoints:
    """Test Panchang (Hindu calendar) endpoints from astrology.py"""
    
    def test_panchang_today(self):
        """Test /api/panchang/today returns panchang data"""
        response = requests.get(f"{BASE_URL}/api/panchang/today")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert "date" in data
        assert "tithi" in data
        assert "nakshatra" in data
        assert "yoga" in data
        assert "karana" in data
        assert "hindu_month" in data
        print(f"✓ Panchang today working: {data.get('date')}, Tithi: {data.get('tithi', {}).get('name')}")
    
    def test_panchang_today_with_location(self):
        """Test /api/panchang/today with custom lat/lon"""
        response = requests.get(f"{BASE_URL}/api/panchang/today?lat=19.0760&lon=72.8777")  # Mumbai
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert data.get("location", {}).get("lat") == 19.0760
        print(f"✓ Panchang with location working: {data.get('location')}")


class TestHoroscopeEndpoints:
    """Test Horoscope endpoints from astrology.py"""
    
    def test_daily_horoscope_aries(self):
        """Test /api/horoscope/daily/aries returns horoscope"""
        response = requests.get(f"{BASE_URL}/api/horoscope/daily/aries")
        assert response.status_code == 200
        data = response.json()
        assert "sign" in data or "prediction" in data
        print(f"✓ Daily horoscope for Aries working: {data.get('sign', data.get('prediction', '')[:50])}")
    
    def test_daily_horoscope_various_signs(self):
        """Test horoscope for multiple zodiac signs"""
        signs = ["taurus", "gemini", "cancer", "leo", "virgo"]
        for sign in signs:
            response = requests.get(f"{BASE_URL}/api/horoscope/daily/{sign}")
            assert response.status_code == 200
            print(f"✓ Horoscope for {sign.title()} working")
    
    def test_nakshatras_list(self):
        """Test /api/horoscope/nakshatras returns nakshatra list"""
        response = requests.get(f"{BASE_URL}/api/horoscope/nakshatras")
        assert response.status_code == 200
        data = response.json()
        assert "nakshatras" in data
        assert len(data["nakshatras"]) == 27  # 27 nakshatras
        print(f"✓ Nakshatras list working: {len(data['nakshatras'])} nakshatras")
    
    def test_zodiac_signs_list(self):
        """Test /api/horoscope/zodiac-signs returns zodiac signs"""
        response = requests.get(f"{BASE_URL}/api/horoscope/zodiac-signs")
        assert response.status_code == 200
        data = response.json()
        assert "signs" in data
        assert len(data["signs"]) == 12  # 12 zodiac signs
        print(f"✓ Zodiac signs list working: {len(data['signs'])} signs")


class TestCheckoutFeesEndpoint:
    """Test checkout fees/taxes endpoint from orders_new.py"""
    
    def test_checkout_fees_taxes(self):
        """Test /api/checkout/fees-taxes returns fee configuration (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/checkout/fees-taxes")
        assert response.status_code == 200
        data = response.json()
        # Should return fees configuration
        assert isinstance(data, dict)
        print(f"✓ Checkout fees-taxes endpoint working: {data}")


class TestOrdersAuthRequired:
    """Test that Orders endpoints require authentication"""
    
    def test_orders_list_requires_auth(self):
        """Test /api/orders requires authentication"""
        response = requests.get(f"{BASE_URL}/api/orders")
        # Should return 401 or 403 for unauthenticated requests
        assert response.status_code in [401, 403]
        print(f"✓ Orders list requires auth: {response.status_code}")
    
    def test_create_order_requires_auth(self):
        """Test POST /api/orders requires authentication"""
        response = requests.post(f"{BASE_URL}/api/orders", json={
            "shipping_address": "Test Address",
            "payment_method": "cod"
        })
        assert response.status_code in [401, 403]
        print(f"✓ Create order requires auth: {response.status_code}")


class TestCheckoutAuthRequired:
    """Test that Checkout endpoints require authentication"""
    
    def test_checkout_requires_auth(self):
        """Test POST /api/checkout requires authentication"""
        response = requests.post(f"{BASE_URL}/api/checkout", json={
            "shipping_address": "Test Address",
            "shipping_city": "Mumbai",
            "shipping_phone": "9876543210",
            "shipping_name": "Test User",
            "payment_method": "stripe"
        })
        assert response.status_code in [401, 403]
        print(f"✓ Checkout requires auth: {response.status_code}")
    
    def test_payment_confirm_requires_auth(self):
        """Test POST /api/payment/confirm/{order_id} requires authentication"""
        response = requests.post(f"{BASE_URL}/api/payment/confirm/test_order_id")
        assert response.status_code in [401, 403, 404]  # 404 is also acceptable if order not found
        print(f"✓ Payment confirm requires auth: {response.status_code}")


class TestAuthenticatedOrdersEndpoints:
    """Test Orders endpoints with authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        # Try devotee first
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_DEVOTEE)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token") or data.get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            # Try shop owner
            response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_SHOP_OWNER)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token") or data.get("access_token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
            else:
                pytest.skip("Could not authenticate with test credentials")
    
    def test_get_orders_authenticated(self):
        """Test GET /api/orders with authentication"""
        response = requests.get(f"{BASE_URL}/api/orders", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✓ Get orders authenticated: {len(data.get('orders', []))} orders")


class TestAuthenticatedAstrologyEndpoints:
    """Test Astrology endpoints that require authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_DEVOTEE)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token") or data.get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_SHOP_OWNER)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token") or data.get("access_token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
            else:
                pytest.skip("Could not authenticate with test credentials")
    
    def test_personalized_horoscope(self):
        """Test /api/horoscope/personalized with authentication"""
        response = requests.get(f"{BASE_URL}/api/horoscope/personalized", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "sign" in data or "user_sign" in data or "prediction" in data
        print(f"✓ Personalized horoscope working: {data.get('sign', data.get('user_sign', 'N/A'))}")


class TestAstrologyPanchangEndpoint:
    """Test the /api/astrology/panchang endpoint from astrology.py"""
    
    def test_astrology_panchang(self):
        """Test /api/astrology/panchang endpoint"""
        response = requests.get(f"{BASE_URL}/api/astrology/panchang")
        assert response.status_code == 200
        data = response.json()
        # Should return panchang data or error from external API (Prokerala)
        # If Prokerala fails, it falls back to local calculation
        assert "status" in data or "tithi" in data or "nakshatra" in data or "error" in data
        if "error" in data:
            print(f"✓ Astrology panchang endpoint accessible (external API error: {data.get('error', '')[:50]}...)")
        else:
            print(f"✓ Astrology panchang endpoint working")
    
    def test_astrology_panchang_with_coords(self):
        """Test /api/astrology/panchang with coordinates"""
        response = requests.get(f"{BASE_URL}/api/astrology/panchang?latitude=28.6139&longitude=77.2090")
        assert response.status_code == 200
        print(f"✓ Astrology panchang with coordinates working")


class TestRouterIntegration:
    """Verify routers are properly integrated in server.py"""
    
    def test_orders_router_prefix(self):
        """Verify orders_new_router is using /api prefix"""
        # Test an endpoint from orders_new.py
        response = requests.get(f"{BASE_URL}/api/checkout/fees-taxes")
        assert response.status_code == 200
        print(f"✓ Orders router prefix /api working")
    
    def test_astrology_router_prefix(self):
        """Verify astrology_router is using /api prefix"""
        # Test an endpoint from astrology.py
        response = requests.get(f"{BASE_URL}/api/horoscope/zodiac-signs")
        assert response.status_code == 200
        print(f"✓ Astrology router prefix /api working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
