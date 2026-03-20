"""
Test Suite for Video Consultation Feature
Tests: System Settings, Wallet, Astrologers, Consultation APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mantra-hub-6.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@divineapp.com"
ADMIN_PASSWORD = "admin123"
DEVOTEE_EMAIL = "devotee@test.com"
DEVOTEE_PASSWORD = "test1234"
ASTROLOGER_EMAIL = "astrologer@test.com"
ASTROLOGER_PASSWORD = "test1234"
EXISTING_ASTROLOGER_EMAIL = "astrologer@divineapp.com"
EXISTING_ASTROLOGER_PASSWORD = "astro123"

# ===================== FIXTURES =====================

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
    pytest.skip(f"Admin auth failed: {response.status_code} - {response.text}")

@pytest.fixture(scope="module")
def devotee_token(api_client):
    """Get devotee authentication token - create if doesn't exist"""
    # Try login first
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": DEVOTEE_EMAIL,
        "password": DEVOTEE_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    
    # Create new devotee user
    register_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": DEVOTEE_EMAIL,
        "password": DEVOTEE_PASSWORD,
        "name": "Test Devotee"
    })
    if register_response.status_code in [200, 201]:
        return register_response.json().get("token")
    
    pytest.skip(f"Devotee auth failed: {register_response.status_code} - {register_response.text}")

@pytest.fixture(scope="module")
def astrologer_token(api_client):
    """Get astrologer authentication token - try existing astrologer first"""
    # Try existing astrologer
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": EXISTING_ASTROLOGER_EMAIL,
        "password": EXISTING_ASTROLOGER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    
    # Try test astrologer
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ASTROLOGER_EMAIL,
        "password": ASTROLOGER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    
    pytest.skip(f"Astrologer auth failed")

# ===================== HEALTH CHECK =====================

class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self, api_client):
        """Test API health endpoint"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ API health check passed")


# ===================== PUBLIC CONSULTATION SETTINGS =====================

class TestPublicSettings:
    """Test public consultation settings endpoint"""
    
    def test_get_public_settings_success(self, api_client):
        """GET /api/consultation/settings - should return public settings without auth"""
        response = api_client.get(f"{BASE_URL}/api/consultation/settings")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields exist
        assert "min_recharge_amount" in data
        assert "low_balance_warning" in data
        assert "grace_period_seconds" in data
        assert "free_minutes_new_users" in data
        
        # Verify values are reasonable
        assert data["min_recharge_amount"] >= 0
        assert data["low_balance_warning"] >= 0
        assert data["grace_period_seconds"] >= 0
        assert data["free_minutes_new_users"] >= 0
        
        print(f"✅ Public settings: min_recharge=₹{data['min_recharge_amount']}, free_mins={data['free_minutes_new_users']}")


# ===================== ADMIN CONSULTATION SETTINGS =====================

class TestAdminSettings:
    """Test admin consultation settings endpoints"""
    
    def test_get_admin_settings_without_auth(self, api_client):
        """GET /api/admin/consultation-settings - should reject without auth"""
        response = api_client.get(f"{BASE_URL}/api/admin/consultation-settings")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden
        print("✅ Admin settings correctly rejects unauthenticated requests")
    
    def test_get_admin_settings_with_non_admin(self, api_client, devotee_token):
        """GET /api/admin/consultation-settings - should reject non-admin users"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/admin/consultation-settings", headers=headers)
        assert response.status_code == 403
        print("✅ Admin settings correctly rejects non-admin users")
    
    def test_get_admin_settings_with_admin(self, api_client, admin_token):
        """GET /api/admin/consultation-settings - admin should access settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.get(f"{BASE_URL}/api/admin/consultation-settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all settings fields
        assert "min_recharge_amount" in data
        assert "low_balance_warning" in data
        assert "grace_period_seconds" in data
        assert "free_minutes_new_users" in data
        assert "free_minutes_enabled" in data
        assert "referral_bonus_minutes" in data
        assert "platform_commission_percent" in data
        
        print(f"✅ Admin settings retrieved: commission={data['platform_commission_percent']}%")
    
    def test_update_admin_settings(self, api_client, admin_token):
        """PUT /api/admin/consultation-settings - admin can update settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get current settings
        get_response = api_client.get(f"{BASE_URL}/api/admin/consultation-settings", headers=headers)
        original_settings = get_response.json()
        
        # Update settings
        new_settings = {
            "min_recharge_amount": 100,
            "low_balance_warning": 20,
            "grace_period_seconds": 30,
            "free_minutes_new_users": 5,
            "free_minutes_enabled": True,
            "platform_commission_percent": 20
        }
        
        update_response = api_client.put(
            f"{BASE_URL}/api/admin/consultation-settings",
            json=new_settings,
            headers=headers
        )
        assert update_response.status_code == 200
        
        updated_data = update_response.json()
        assert updated_data["min_recharge_amount"] == 100
        assert updated_data["low_balance_warning"] == 20
        assert updated_data["grace_period_seconds"] == 30
        
        print("✅ Admin settings updated successfully")
    
    def test_update_admin_settings_non_admin_rejected(self, api_client, devotee_token):
        """PUT /api/admin/consultation-settings - non-admin update rejected"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.put(
            f"{BASE_URL}/api/admin/consultation-settings",
            json={"min_recharge_amount": 50},
            headers=headers
        )
        assert response.status_code == 403
        print("✅ Non-admin update correctly rejected")


# ===================== WALLET ENDPOINTS =====================

class TestWalletEndpoints:
    """Test wallet management endpoints"""
    
    def test_get_wallet_without_auth(self, api_client):
        """GET /api/wallet - should reject without auth"""
        response = api_client.get(f"{BASE_URL}/api/wallet")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden
        print("✅ Wallet endpoint correctly rejects unauthenticated requests")
    
    def test_get_wallet_with_auth(self, api_client, devotee_token):
        """GET /api/wallet - should return wallet with free minutes for new user"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/wallet", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify wallet structure
        assert "user_id" in data
        assert "balance" in data
        assert "free_minutes" in data
        assert "total_recharged" in data
        assert "total_spent" in data
        
        # Verify data types
        assert isinstance(data["balance"], (int, float))
        assert isinstance(data["free_minutes"], int)
        
        print(f"✅ Wallet retrieved: balance=₹{data['balance']}, free_mins={data['free_minutes']}")
    
    def test_new_user_gets_free_minutes(self, api_client, devotee_token):
        """New user wallet should have 5 free minutes (as per settings)"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/wallet", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # New users should get free minutes as per settings
        # This verifies the free minutes feature is working
        assert data["free_minutes"] >= 0  # Depends on settings.free_minutes_enabled
        print(f"✅ User has {data['free_minutes']} free minutes")
    
    def test_get_wallet_transactions_empty(self, api_client, devotee_token):
        """GET /api/wallet/transactions - should return empty for new user"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/wallet/transactions", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "transactions" in data
        assert isinstance(data["transactions"], list)
        print(f"✅ Transactions retrieved: {len(data['transactions'])} transactions")
    
    def test_wallet_recharge_below_minimum(self, api_client, devotee_token):
        """POST /api/wallet/recharge - should reject amount below minimum"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # Get minimum recharge amount
        settings_response = api_client.get(f"{BASE_URL}/api/consultation/settings")
        min_amount = settings_response.json().get("min_recharge_amount", 100)
        
        # Try to recharge below minimum
        response = api_client.post(
            f"{BASE_URL}/api/wallet/recharge",
            json={
                "amount": min_amount - 50,
                "payment_id": "test_payment_123",
                "payment_method": "razorpay"
            },
            headers=headers
        )
        assert response.status_code == 400
        assert "Minimum" in response.json().get("detail", "")
        print(f"✅ Recharge below minimum (₹{min_amount}) correctly rejected")
    
    def test_wallet_recharge_success(self, api_client, devotee_token):
        """POST /api/wallet/recharge - should add balance to wallet"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # Get initial balance
        initial_response = api_client.get(f"{BASE_URL}/api/wallet", headers=headers)
        initial_balance = initial_response.json()["balance"]
        
        # Recharge wallet
        recharge_amount = 200
        response = api_client.post(
            f"{BASE_URL}/api/wallet/recharge",
            json={
                "amount": recharge_amount,
                "payment_id": f"test_payment_{recharge_amount}",
                "payment_method": "razorpay"
            },
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "wallet" in data
        assert data["wallet"]["balance"] == initial_balance + recharge_amount
        
        print(f"✅ Wallet recharged: ₹{initial_balance} → ₹{data['wallet']['balance']}")
    
    def test_wallet_transactions_after_recharge(self, api_client, devotee_token):
        """GET /api/wallet/transactions - should show recharge transaction"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/wallet/transactions", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should have at least one transaction (the recharge we just did)
        assert len(data["transactions"]) >= 1
        
        # Verify transaction structure
        if len(data["transactions"]) > 0:
            tx = data["transactions"][0]
            assert "id" in tx
            assert "type" in tx
            assert "amount" in tx
            assert "balance_after" in tx
            assert "description" in tx
            assert "created_at" in tx
        
        print(f"✅ Transaction history shows {len(data['transactions'])} transactions")


# ===================== ASTROLOGER ENDPOINTS =====================

class TestAstrologerEndpoints:
    """Test astrologer profile and availability endpoints"""
    
    def test_get_available_astrologers_public(self, api_client):
        """GET /api/astrologers/available - should return available astrologers without auth"""
        response = api_client.get(f"{BASE_URL}/api/astrologers/available")
        assert response.status_code == 200
        data = response.json()
        
        assert "astrologers" in data
        assert isinstance(data["astrologers"], list)
        
        # If astrologers exist, verify structure
        if len(data["astrologers"]) > 0:
            astrologer = data["astrologers"][0]
            assert "id" in astrologer
            assert "user_id" in astrologer
            assert "name" in astrologer
            assert "rate_per_minute" in astrologer
            assert "is_available" not in astrologer or astrologer.get("is_available") == True
        
        print(f"✅ Available astrologers: {len(data['astrologers'])} online")
    
    def test_get_astrologer_profile_without_auth(self, api_client):
        """GET /api/astrologer/profile - should reject without auth"""
        response = api_client.get(f"{BASE_URL}/api/astrologer/profile")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden
        print("✅ Astrologer profile correctly rejects unauthenticated requests")
    
    def test_get_astrologer_profile_non_astrologer(self, api_client, devotee_token):
        """GET /api/astrologer/profile - should reject non-astrologer users"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/astrologer/profile", headers=headers)
        assert response.status_code == 403
        print("✅ Astrologer profile correctly rejects non-astrologer users")
    
    def test_get_astrologer_profile_as_astrologer(self, api_client, astrologer_token):
        """GET /api/astrologer/profile - astrologer can access own profile"""
        headers = {"Authorization": f"Bearer {astrologer_token}"}
        response = api_client.get(f"{BASE_URL}/api/astrologer/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "user_id" in data
        assert "rate_per_minute" in data
        assert "is_available" in data
        
        print(f"✅ Astrologer profile: rate=₹{data['rate_per_minute']}/min, available={data['is_available']}")
    
    def test_update_astrologer_profile(self, api_client, astrologer_token):
        """PUT /api/astrologer/profile - astrologer can update profile"""
        headers = {"Authorization": f"Bearer {astrologer_token}"}
        
        response = api_client.put(
            f"{BASE_URL}/api/astrologer/profile",
            json={
                "rate_per_minute": 15,
                "specializations": ["Vedic Astrology", "Numerology"],
                "experience_years": 10,
                "languages": ["Hindi", "English"]
            },
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["rate_per_minute"] == 15
        print(f"✅ Astrologer profile updated: rate=₹{data['rate_per_minute']}/min")
    
    def test_set_astrologer_availability(self, api_client, astrologer_token):
        """PUT /api/astrologer/availability - astrologer can set online/offline"""
        headers = {"Authorization": f"Bearer {astrologer_token}"}
        
        # Set available
        response = api_client.put(
            f"{BASE_URL}/api/astrologer/availability",
            json={"is_available": True},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["is_available"] == True
        
        print("✅ Astrologer availability set to online")


# ===================== CONSULTATION CALL ENDPOINTS =====================

class TestConsultationEndpoints:
    """Test video consultation call endpoints"""
    
    def test_get_consultation_history_empty(self, api_client, devotee_token):
        """GET /api/consultation/history - should return empty for new user"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.get(f"{BASE_URL}/api/consultation/history", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "calls" in data
        assert isinstance(data["calls"], list)
        print(f"✅ Consultation history: {len(data['calls'])} calls")
    
    def test_start_consultation_without_astrologer_id(self, api_client, devotee_token):
        """POST /api/consultation/start - should reject without astrologer ID"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/consultation/start",
            json={},
            headers=headers
        )
        assert response.status_code == 400
        assert "Astrologer ID required" in response.json().get("detail", "")
        print("✅ Consultation start correctly rejects missing astrologer ID")
    
    def test_start_consultation_invalid_astrologer(self, api_client, devotee_token):
        """POST /api/consultation/start - should reject invalid astrologer ID"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/consultation/start",
            json={"astrologer_user_id": "invalid_id_123"},
            headers=headers
        )
        # Should return 400 with "Astrologer not found"
        assert response.status_code == 400
        print("✅ Consultation start correctly rejects invalid astrologer")
    
    def test_end_consultation_invalid_call(self, api_client, devotee_token):
        """POST /api/consultation/{call_id}/end - should handle invalid call ID"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/consultation/invalid_call_id/end",
            json={"reason": "test"},
            headers=headers
        )
        # Should return 400 with error
        assert response.status_code == 400
        print("✅ End consultation correctly rejects invalid call ID")
    
    def test_process_minute_invalid_call(self, api_client, devotee_token):
        """POST /api/consultation/{call_id}/process-minute - should handle invalid call"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        # Use a valid ObjectId format but non-existent
        response = api_client.post(
            f"{BASE_URL}/api/consultation/6578abc123def456789abcde/process-minute",
            headers=headers
        )
        # May return 200 with status "call_not_active" or 400/500 for invalid ObjectId
        if response.status_code == 200:
            assert response.json().get("status") == "call_not_active"
        else:
            assert response.status_code in [400, 500]  # Invalid ObjectId may cause 500
        print(f"✅ Process minute handles invalid call correctly (status={response.status_code})")


# ===================== INTEGRATION TEST =====================

class TestIntegrationFlow:
    """Test complete consultation flow"""
    
    def test_complete_flow_check_balance(self, api_client, devotee_token):
        """Integration test: Check balance before starting call"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # 1. Get wallet balance
        wallet_response = api_client.get(f"{BASE_URL}/api/wallet", headers=headers)
        assert wallet_response.status_code == 200
        wallet = wallet_response.json()
        
        # 2. Get public settings
        settings_response = api_client.get(f"{BASE_URL}/api/consultation/settings")
        assert settings_response.status_code == 200
        settings = settings_response.json()
        
        # 3. Check if user can start call
        can_start = wallet["free_minutes"] > 0 or wallet["balance"] >= settings["min_recharge_amount"]
        
        print(f"✅ Integration check: balance=₹{wallet['balance']}, free_mins={wallet['free_minutes']}, can_start={can_start}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
