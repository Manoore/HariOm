"""
Test Auth Firebase Sync and Login Endpoints
Tests for the P0 bug fix: New users seeing blank screen after auth on mobile

Tests cover:
1. Existing user email/password login
2. Firebase-sync endpoint for new users
3. Firebase-sync endpoint for existing users
4. API interceptor behavior (401 handling)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://intent-generation.preview.emergentagent.com')

class TestExistingUserLogin:
    """Test existing user email/password login - should still work (no regression)"""
    
    def test_devotee_login_success(self):
        """Test devotee@divineapp.com / devotee123 login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "devotee@divineapp.com",
            "password": "devotee123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == "devotee@divineapp.com"
        assert data["user"]["role"] == "devotee"
        assert "id" in data["user"]
        print(f"SUCCESS: Devotee login works - user: {data['user']['name']}")
    
    def test_admin_login_success(self):
        """Test admin@divine.com / admin123 login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@divine.com",
            "password": "admin123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == "admin@divine.com"
        assert data["user"]["role"] == "admin"
        print(f"SUCCESS: Admin login works - user: {data['user']['name']}")
    
    def test_priest_login_success(self):
        """Test pandit.sharma@divineapp.com / priest123 login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "pandit.sharma@divineapp.com",
            "password": "priest123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] == "priest"
        print(f"SUCCESS: Priest login works - user: {data['user']['name']}")
    
    def test_invalid_credentials_returns_401(self):
        """Test that invalid credentials return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Invalid credentials correctly return 401")


class TestFirebaseSyncNewUsers:
    """Test firebase-sync endpoint for new users"""
    
    def test_firebase_sync_creates_new_user(self):
        """Test that firebase-sync creates a new user when not exists"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = requests.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "firebase_uid": f"test_firebase_uid_{unique_id}",
            "email": f"testuser_{unique_id}@example.com",
            "name": f"Test User {unique_id}",
            "role": "devotee",
            "auth_type": "email"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data, "Response should contain user"
        assert data["user"]["email"] == f"testuser_{unique_id}@example.com"
        assert data["user"]["name"] == f"Test User {unique_id}"
        assert data["user"]["role"] == "devotee"
        assert data["user"]["firebase_uid"] == f"test_firebase_uid_{unique_id}"
        assert data["user"]["is_verified"] == True
        assert "id" in data["user"]
        print(f"SUCCESS: Firebase sync created new user: {data['user']['id']}")
    
    def test_firebase_sync_with_phone_auth(self):
        """Test firebase-sync for phone OTP authentication"""
        unique_id = str(uuid.uuid4())[:8]
        phone_number = f"+91999{unique_id[:7]}"
        
        response = requests.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "firebase_uid": f"phone_firebase_uid_{unique_id}",
            "email": phone_number,  # Phone number as email placeholder
            "name": phone_number,
            "phone": phone_number,
            "role": "devotee",
            "auth_type": "phone"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert data["user"]["phone"] == phone_number
        assert data["user"]["auth_type"] == "phone"
        print(f"SUCCESS: Firebase sync with phone auth works: {data['user']['id']}")
    
    def test_firebase_sync_with_google_auth(self):
        """Test firebase-sync for Google authentication"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = requests.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "firebase_uid": f"google_firebase_uid_{unique_id}",
            "email": f"googleuser_{unique_id}@gmail.com",
            "name": f"Google User {unique_id}",
            "photo_url": "https://example.com/photo.jpg",
            "role": "devotee"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == f"googleuser_{unique_id}@gmail.com"
        print(f"SUCCESS: Firebase sync with Google auth works: {data['user']['id']}")


class TestFirebaseSyncExistingUsers:
    """Test firebase-sync endpoint for existing users"""
    
    def test_firebase_sync_returns_existing_user_by_email(self):
        """Test that firebase-sync returns existing user when email matches"""
        response = requests.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "firebase_uid": "new_firebase_uid_for_existing",
            "email": "devotee@divineapp.com",
            "name": "Priya Sharma"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "devotee@divineapp.com"
        assert data["user"]["role"] == "devotee"
        # Should update firebase_uid
        assert data["user"]["firebase_uid"] == "new_firebase_uid_for_existing"
        print(f"SUCCESS: Firebase sync returns existing user: {data['user']['name']}")
    
    def test_firebase_sync_returns_existing_user_by_firebase_uid(self):
        """Test that firebase-sync returns existing user when firebase_uid matches"""
        # First create a user
        unique_id = str(uuid.uuid4())[:8]
        create_response = requests.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "firebase_uid": f"persistent_uid_{unique_id}",
            "email": f"persistent_{unique_id}@example.com",
            "name": f"Persistent User {unique_id}"
        })
        assert create_response.status_code == 200
        created_user = create_response.json()["user"]
        
        # Now sync again with same firebase_uid
        sync_response = requests.post(f"{BASE_URL}/api/auth/firebase-sync", json={
            "firebase_uid": f"persistent_uid_{unique_id}",
            "email": f"different_email_{unique_id}@example.com",  # Different email
            "name": "Different Name"
        })
        
        assert sync_response.status_code == 200
        synced_user = sync_response.json()["user"]
        
        # Should return same user (by firebase_uid match)
        assert synced_user["id"] == created_user["id"]
        print(f"SUCCESS: Firebase sync finds existing user by firebase_uid")


class TestAPIInterceptorBehavior:
    """Test API interceptor behavior - 401 handling"""
    
    def test_auth_me_returns_401_or_403_without_token(self):
        """Test that /auth/me returns 401 or 403 without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
        print(f"SUCCESS: /auth/me returns {response.status_code} without token")
    
    def test_auth_me_returns_user_with_valid_token(self):
        """Test that /auth/me returns user with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "devotee@divineapp.com",
            "password": "devotee123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Now call /auth/me with token
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["email"] == "devotee@divineapp.com"
        print(f"SUCCESS: /auth/me returns user with valid token: {data['name']}")
    
    def test_data_endpoint_401_should_not_clear_session(self):
        """
        Test that 401 on data endpoints (bookings, orders) should NOT clear session.
        This is the key fix for the blank screen bug.
        
        The API interceptor should only clear tokens on /auth/me and /auth/login 401s,
        NOT on data endpoints like /bookings or /orders.
        """
        # This test verifies the backend returns 401 for unauthorized data access
        # The frontend interceptor behavior is tested via Playwright
        
        response = requests.get(f"{BASE_URL}/api/bookings")
        
        # Should return 401 (unauthorized) or 403 (forbidden)
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}"
        print(f"SUCCESS: Data endpoint returns {response.status_code} without auth (expected behavior)")


class TestFirebaseRegister:
    """Test firebase-register endpoint"""
    
    def test_firebase_register_creates_new_user(self):
        """Test that firebase-register creates a new user"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = requests.post(f"{BASE_URL}/api/auth/firebase-register", json={
            "firebase_uid": f"register_uid_{unique_id}",
            "email": f"register_{unique_id}@example.com",
            "name": f"Register User {unique_id}",
            "phone": f"+91888{unique_id[:7]}",
            "role": "devotee"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == f"register_{unique_id}@example.com"
        assert data["user"]["role"] == "devotee"
        print(f"SUCCESS: Firebase register created new user: {data['user']['id']}")
    
    def test_firebase_register_rejects_duplicate(self):
        """Test that firebase-register rejects duplicate users"""
        unique_id = str(uuid.uuid4())[:8]
        
        # First registration
        first_response = requests.post(f"{BASE_URL}/api/auth/firebase-register", json={
            "firebase_uid": f"dup_uid_{unique_id}",
            "email": f"dup_{unique_id}@example.com",
            "name": f"Dup User {unique_id}",
            "role": "devotee"
        })
        assert first_response.status_code == 200
        
        # Second registration with same firebase_uid
        second_response = requests.post(f"{BASE_URL}/api/auth/firebase-register", json={
            "firebase_uid": f"dup_uid_{unique_id}",
            "email": f"different_{unique_id}@example.com",
            "name": "Different Name",
            "role": "devotee"
        })
        
        assert second_response.status_code == 400, f"Expected 400, got {second_response.status_code}"
        print("SUCCESS: Firebase register correctly rejects duplicate")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
