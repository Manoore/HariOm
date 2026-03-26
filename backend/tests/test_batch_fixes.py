"""
Test batch fixes for Divine App:
1. Signup settings API returns astrologer and shop_owner enabled
2. Login still works for existing users
3. Firebase sync works for new users
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSignupSettings:
    """Test signup settings API"""
    
    def test_signup_settings_returns_all_roles_enabled(self):
        """GET /api/admin/signup-settings should return all roles enabled"""
        response = requests.get(f"{BASE_URL}/api/admin/signup-settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "settings" in data
        
        settings = data["settings"]
        assert settings.get("enable_priest_signup") == True
        assert settings.get("enable_astrologer_signup") == True
        assert settings.get("enable_shop_owner_signup") == True
        print("TEST PASSED: Signup settings return all roles enabled")


class TestExistingUserLogin:
    """Test existing user login"""
    
    def test_devotee_login(self):
        """Devotee login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "devotee@divineapp.com",
            "password": "devotee123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "devotee"
        print("TEST PASSED: Devotee login works")
    
    def test_priest_login(self):
        """Priest login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "pandit.sharma@divineapp.com",
            "password": "priest123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "priest"
        print("TEST PASSED: Priest login works")
    
    def test_admin_login(self):
        """Admin login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@divine.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] in ["admin", "super_admin"]
        print("TEST PASSED: Admin login works")


class TestFirebaseSync:
    """Test firebase sync endpoint"""
    
    def test_firebase_sync_existing_user(self):
        """Firebase sync should return existing user data"""
        response = requests.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "email": "devotee@divineapp.com",
            "name": "Test Devotee",
            "firebase_uid": "test_firebase_uid_123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "devotee@divineapp.com"
        print("TEST PASSED: Firebase sync returns existing user")
    
    def test_firebase_sync_new_user(self):
        """Firebase sync should create new user"""
        import uuid
        unique_email = f"test_new_user_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "email": unique_email,
            "name": "Test New User",
            "firebase_uid": f"firebase_uid_{uuid.uuid4().hex[:8]}",
            "role": "devotee"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == unique_email
        print("TEST PASSED: Firebase sync creates new user")


class TestDevoteeBookingsAndOrders:
    """Test devotee bookings and orders endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for devotee"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "devotee@divineapp.com",
            "password": "devotee123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_get_bookings(self, auth_token):
        """GET /api/bookings should return bookings list"""
        response = requests.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "bookings" in data
        print(f"TEST PASSED: Got {len(data['bookings'])} bookings")
    
    def test_get_orders(self, auth_token):
        """GET /api/orders should return orders list"""
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        print(f"TEST PASSED: Got {len(data['orders'])} orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
