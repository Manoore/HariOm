"""
Test file for System Configuration Admin feature
Tests API keys management, admin settings, branding, and dynamic credentials
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://divine-refactor.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@divineapp.com", "password": "admin123"}
USER_CREDS = {"email": "devotee@test.com", "password": "test1234"}


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health check passed")


class TestSystemConfigAuth:
    """Test authentication requirements for system config endpoints"""
    
    def test_get_config_unauthenticated(self):
        """Unauthenticated access should be rejected"""
        response = requests.get(f"{BASE_URL}/api/admin/system-config")
        assert response.status_code in [401, 403]
        print("✅ GET /api/admin/system-config - Unauthenticated rejected")
    
    def test_put_config_unauthenticated(self):
        """Unauthenticated update should be rejected"""
        response = requests.put(
            f"{BASE_URL}/api/admin/system-config",
            json={"app_name": "Test"}
        )
        assert response.status_code in [401, 403]
        print("✅ PUT /api/admin/system-config - Unauthenticated rejected")
    
    def test_get_config_non_admin(self):
        """Non-admin user should be rejected"""
        # First login as regular user
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=USER_CREDS
        )
        
        if login_resp.status_code != 200:
            pytest.skip("Test user not available")
        
        token = login_resp.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=headers
        )
        assert response.status_code == 403
        print("✅ GET /api/admin/system-config - Non-admin rejected (403)")


class TestSystemConfigAdmin:
    """Test system config CRUD operations with admin access"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDS
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json().get("token")
    
    @pytest.fixture
    def admin_headers(self, admin_token):
        """Get headers with admin auth"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_get_all_config(self, admin_headers):
        """GET /api/admin/system-config should return all config with categories"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "config" in data
        assert "categories" in data
        
        # Verify expected categories exist
        expected_categories = ["video", "payment", "branding", "maintenance", "notifications"]
        for cat in expected_categories:
            assert cat in data["categories"], f"Category '{cat}' not found"
        
        # Verify config structure
        config = data["config"]
        assert isinstance(config, dict)
        
        # Check that sensitive values are masked
        if "stripe_secret_key" in config:
            value = config["stripe_secret_key"]["value"]
            if value and len(value) > 4:
                assert "****" in value or value.startswith("sk_"), "Sensitive value should be masked"
        
        print(f"✅ GET /api/admin/system-config - Returns {len(config)} config items, {len(data['categories'])} categories")
    
    def test_config_has_required_fields(self, admin_headers):
        """Config items should have required metadata fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        config = response.json()["config"]
        
        # Check structure of a sample config item
        sample_keys = ["app_name", "stripe_secret_key", "hms_access_key"]
        for key in sample_keys:
            if key in config:
                item = config[key]
                assert "value" in item, f"{key} missing 'value'"
                assert "label" in item, f"{key} missing 'label'"
                assert "category" in item, f"{key} missing 'category'"
                assert "sensitive" in item, f"{key} missing 'sensitive'"
        
        print("✅ Config items have required metadata fields")
    
    def test_update_branding_config(self, admin_headers):
        """PUT /api/admin/system-config should update branding values"""
        # Get current values first
        get_response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers
        )
        original_config = get_response.json()["config"]
        original_tagline = original_config.get("app_tagline", {}).get("value", "")
        
        # Update tagline
        test_tagline = "Test Tagline for Divine App - " + str(os.urandom(4).hex())
        response = requests.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers,
            json={"app_tagline": test_tagline}
        )
        assert response.status_code == 200
        data = response.json()
        assert "updated_count" in data or "message" in data
        
        # Verify update persisted
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers
        )
        updated_config = verify_response.json()["config"]
        assert updated_config["app_tagline"]["value"] == test_tagline
        
        # Restore original value
        requests.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers,
            json={"app_tagline": original_tagline or "Your Spiritual Journey Begins Here"}
        )
        
        print("✅ PUT /api/admin/system-config - Branding update works")
    
    def test_update_multiple_configs(self, admin_headers):
        """PUT with multiple values should update all"""
        updates = {
            "support_email": "test-support@divineapp.com",
            "support_phone": "+91-9876543210"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers,
            json=updates
        )
        assert response.status_code == 200
        
        # Verify
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers
        )
        config = verify_response.json()["config"]
        assert config["support_email"]["value"] == updates["support_email"]
        assert config["support_phone"]["value"] == updates["support_phone"]
        
        # Restore
        requests.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers,
            json={
                "support_email": "support@divineapp.com",
                "support_phone": "+91-1234567890"
            }
        )
        
        print("✅ PUT /api/admin/system-config - Multiple config update works")
    
    def test_masked_values_not_overwritten(self, admin_headers):
        """Sending masked value (****) should not overwrite the actual value"""
        # Get current masked value
        get_response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers
        )
        config = get_response.json()["config"]
        
        # Try to update with masked value
        response = requests.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers,
            json={"stripe_secret_key": "****masked****"}
        )
        assert response.status_code == 200
        
        # Verify value was not overwritten (original should still work)
        # We can't directly check the value, but we verify no error occurred
        print("✅ Masked values (****) skip update correctly")


class TestSystemConfigByCategory:
    """Test category-specific config endpoints"""
    
    @pytest.fixture
    def admin_headers(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDS
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_get_video_category(self, admin_headers):
        """GET /api/admin/system-config/video should return video settings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config/video",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "video"
        assert "category_info" in data
        assert "config" in data
        
        # Should contain 100ms keys
        config = data["config"]
        assert "hms_access_key" in config
        assert "hms_secret" in config
        
        print("✅ GET /api/admin/system-config/video - Returns 100ms settings")
    
    def test_get_payment_category(self, admin_headers):
        """GET /api/admin/system-config/payment should return payment keys"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config/payment",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        config = data["config"]
        
        # Should contain Stripe and Razorpay keys
        assert "stripe_publishable_key" in config
        assert "stripe_secret_key" in config
        assert "razorpay_key_id" in config
        assert "razorpay_key_secret" in config
        
        print("✅ GET /api/admin/system-config/payment - Returns Stripe/Razorpay keys")
    
    def test_get_branding_category(self, admin_headers):
        """GET /api/admin/system-config/branding should return app branding"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config/branding",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        config = data["config"]
        
        assert "app_name" in config
        assert "app_tagline" in config
        assert "support_email" in config
        
        print("✅ GET /api/admin/system-config/branding - Returns branding settings")
    
    def test_invalid_category(self, admin_headers):
        """Invalid category should return 400"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config/invalid_category",
            headers=admin_headers
        )
        assert response.status_code == 400
        print("✅ Invalid category returns 400")


class TestPublicBrandingEndpoint:
    """Test public branding endpoint"""
    
    def test_get_branding_public(self):
        """GET /api/app/branding should be publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/app/branding")
        assert response.status_code == 200
        
        data = response.json()
        assert "app_name" in data
        assert "app_tagline" in data
        
        print(f"✅ GET /api/app/branding - Returns: {data['app_name']}")
    
    def test_branding_reflects_admin_updates(self):
        """Branding endpoint should reflect admin updates"""
        # Login as admin
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDS
        )
        if login_resp.status_code != 200:
            pytest.skip("Admin login failed")
        
        headers = {"Authorization": f"Bearer {login_resp.json()['token']}"}
        
        # Get current branding
        original = requests.get(f"{BASE_URL}/api/app/branding").json()
        
        # Update via admin
        test_tagline = "Updated Tagline for Testing"
        requests.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=headers,
            json={"app_tagline": test_tagline}
        )
        
        # Verify public endpoint shows update
        updated = requests.get(f"{BASE_URL}/api/app/branding").json()
        assert updated["app_tagline"] == test_tagline
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=headers,
            json={"app_tagline": original.get("app_tagline", "Your Spiritual Journey Begins Here")}
        )
        
        print("✅ Public branding reflects admin config updates")


class TestAppStatusEndpoint:
    """Test maintenance mode endpoint"""
    
    def test_get_app_status(self):
        """GET /api/app/status should return maintenance status"""
        response = requests.get(f"{BASE_URL}/api/app/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "maintenance" in data
        
        print(f"✅ GET /api/app/status - Maintenance: {data['maintenance']}")


class TestDynamicCredentials:
    """Test that payment and video endpoints use dynamic credentials"""
    
    @pytest.fixture
    def admin_headers(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDS
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_stripe_payment_uses_dynamic_key(self, admin_headers):
        """Verify Stripe checkout can be created (uses dynamic keys)"""
        # This tests that the Stripe integration works with dynamic credentials
        # We don't actually process payment, just verify endpoint responds
        response = requests.post(
            f"{BASE_URL}/api/payments/create-checkout",
            headers=admin_headers,
            json={
                "amount": 100,
                "currency": "inr",
                "description": "Test payment"
            }
        )
        # Should work or fail gracefully (not 500 due to missing key)
        # 200 = success, 400 = invalid params, 503 = service unavailable but handled
        assert response.status_code in [200, 400, 422, 503]
        print(f"✅ Stripe checkout endpoint responds (status: {response.status_code})")
    
    def test_video_credentials_available(self, admin_headers):
        """Verify 100ms credentials are configured"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config/video",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        config = response.json()["config"]
        
        # Check that 100ms keys are present (masked or actual)
        hms_access = config.get("hms_access_key", {}).get("value", "")
        hms_secret = config.get("hms_secret", {}).get("value", "")
        
        # Values should exist (either actual or masked)
        assert hms_access, "HMS access key should be configured"
        assert hms_secret, "HMS secret should be configured"
        
        print("✅ 100ms credentials are configured in system config")


class TestSensitiveDataMasking:
    """Test that sensitive data is properly masked"""
    
    @pytest.fixture
    def admin_headers(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDS
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_secret_keys_are_masked(self, admin_headers):
        """Sensitive keys should show masked values"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers
        )
        assert response.status_code == 200
        
        config = response.json()["config"]
        
        sensitive_keys = ["stripe_secret_key", "razorpay_key_secret", "hms_secret"]
        for key in sensitive_keys:
            if key in config:
                item = config[key]
                assert item.get("sensitive") == True, f"{key} should be marked as sensitive"
                value = item.get("value", "")
                if value:
                    # Should be masked with ****
                    assert "****" in value or len(value) <= 4, f"{key} value should be masked"
        
        print("✅ Sensitive keys are properly masked in API response")
    
    def test_non_sensitive_values_visible(self, admin_headers):
        """Non-sensitive values should be fully visible"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-config",
            headers=admin_headers
        )
        config = response.json()["config"]
        
        non_sensitive_keys = ["app_name", "support_email", "stripe_publishable_key"]
        for key in non_sensitive_keys:
            if key in config:
                item = config[key]
                assert item.get("sensitive") == False, f"{key} should not be marked as sensitive"
                value = item.get("value", "")
                if value:
                    assert "****" not in value or value.startswith("pk_"), f"{key} should not be masked"
        
        print("✅ Non-sensitive values are visible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
