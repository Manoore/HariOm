"""
Test Razorpay Payment Integration and Admin System Config
Tests:
- POST /api/checkout with payment_method=razorpay
- POST /api/checkout with payment_method=stripe
- POST /api/razorpay/verify (signature validation)
- POST /api/webhooks/stripe
- GET /api/admin/system-config/fees_taxes
- GET /api/admin/system-config/order_settings
- PUT /api/admin/system-config (update GST settings)
"""
import pytest
import requests
import os
import hmac
import hashlib

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
ADMIN_EMAIL = "admin@divine.com"
ADMIN_PASSWORD = "admin123"

# Test product
TEST_PRODUCT_ID = "69c4147af290f1e54eac5ecb"  # Sandyavande set, price: 2000


class TestRazorpayPaymentIntegration:
    """Test Razorpay and Stripe payment flows"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.devotee_token = None
        self.admin_token = None
    
    def login_devotee(self):
        """Login as devotee and get token"""
        if self.devotee_token:
            return self.devotee_token
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200, f"Devotee login failed: {response.text}"
        data = response.json()
        self.devotee_token = data.get("token") or data.get("access_token")
        assert self.devotee_token, "No token in login response"
        return self.devotee_token
    
    def login_admin(self):
        """Login as admin and get token"""
        if self.admin_token:
            return self.admin_token
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        self.admin_token = data.get("token") or data.get("access_token")
        assert self.admin_token, "No token in admin login response"
        return self.admin_token
    
    def clear_cart(self, token):
        """Clear cart before testing"""
        headers = {"Authorization": f"Bearer {token}"}
        # Get cart first
        cart_res = self.session.get(f"{BASE_URL}/api/cart", headers=headers)
        if cart_res.status_code == 200:
            cart_data = cart_res.json()
            items = cart_data.get("items", [])
            for item in items:
                product_id = item.get("product_id")
                if product_id:
                    self.session.delete(f"{BASE_URL}/api/cart/remove/{product_id}", headers=headers)
    
    def add_to_cart(self, token):
        """Add test product to cart"""
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.post(
            f"{BASE_URL}/api/cart/add",
            headers=headers,
            json={"product_id": TEST_PRODUCT_ID, "quantity": 1}
        )
        return response
    
    # ==================== RAZORPAY CHECKOUT TESTS ====================
    
    def test_checkout_razorpay_returns_order_details(self):
        """Test POST /api/checkout with payment_method=razorpay returns razorpay_order_id, razorpay_key_id, amount"""
        token = self.login_devotee()
        headers = {"Authorization": f"Bearer {token}"}
        
        # Clear cart and add item
        self.clear_cart(token)
        add_res = self.add_to_cart(token)
        assert add_res.status_code in [200, 201], f"Failed to add to cart: {add_res.text}"
        
        # Create checkout with Razorpay
        checkout_data = {
            "shipping_name": "Test User",
            "shipping_phone": "+919876543210",
            "shipping_address": "123 Test Street, Test Area",
            "shipping_city": "Hyderabad",
            "payment_method": "razorpay",
            "notes": "Test order"
        }
        
        response = self.session.post(f"{BASE_URL}/api/checkout", headers=headers, json=checkout_data)
        
        print(f"Razorpay checkout response status: {response.status_code}")
        print(f"Razorpay checkout response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        
        data = response.json()
        
        # Verify Razorpay-specific fields
        assert "razorpay_order_id" in data, "Missing razorpay_order_id in response"
        assert "razorpay_key_id" in data, "Missing razorpay_key_id in response"
        assert "amount" in data, "Missing amount in response"
        
        # Verify razorpay_order_id format (starts with order_)
        assert data["razorpay_order_id"].startswith("order_"), f"Invalid razorpay_order_id format: {data['razorpay_order_id']}"
        
        # Verify razorpay_key_id is the test key
        assert data["razorpay_key_id"] == "rzp_test_SVZBliAYPQjeKo", f"Unexpected razorpay_key_id: {data['razorpay_key_id']}"
        
        # Verify amount is in paise (integer)
        assert isinstance(data["amount"], int), f"Amount should be integer (paise): {data['amount']}"
        assert data["amount"] > 0, "Amount should be positive"
        
        # Verify other expected fields
        assert "order_id" in data, "Missing order_id"
        assert "payment_method" in data and data["payment_method"] == "razorpay", "payment_method should be razorpay"
        
        print(f"✓ Razorpay checkout successful: order_id={data['razorpay_order_id']}, amount={data['amount']} paise")
    
    # ==================== STRIPE CHECKOUT TESTS ====================
    
    def test_checkout_stripe_returns_checkout_url(self):
        """Test POST /api/checkout with payment_method=stripe returns checkout_url"""
        token = self.login_devotee()
        headers = {"Authorization": f"Bearer {token}"}
        
        # Clear cart and add item
        self.clear_cart(token)
        add_res = self.add_to_cart(token)
        assert add_res.status_code in [200, 201], f"Failed to add to cart: {add_res.text}"
        
        # Create checkout with Stripe
        checkout_data = {
            "shipping_name": "Test User",
            "shipping_phone": "+919876543210",
            "shipping_address": "123 Test Street, Test Area",
            "shipping_city": "Hyderabad",
            "payment_method": "stripe",
            "notes": "Test order"
        }
        
        response = self.session.post(f"{BASE_URL}/api/checkout", headers=headers, json=checkout_data)
        
        print(f"Stripe checkout response status: {response.status_code}")
        print(f"Stripe checkout response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        
        data = response.json()
        
        # Verify Stripe-specific fields
        assert "checkout_url" in data, "Missing checkout_url in response"
        
        # Verify checkout_url is a valid Stripe URL
        checkout_url = data["checkout_url"]
        assert checkout_url.startswith("https://checkout.stripe.com/"), f"Invalid Stripe checkout URL: {checkout_url}"
        
        # Verify other expected fields
        assert "order_id" in data, "Missing order_id"
        assert "payment_method" in data and data["payment_method"] == "stripe", "payment_method should be stripe"
        
        print(f"✓ Stripe checkout successful: checkout_url starts with https://checkout.stripe.com/")
    
    # ==================== RAZORPAY VERIFY TESTS ====================
    
    def test_razorpay_verify_missing_data(self):
        """Test POST /api/razorpay/verify returns 400 for missing data"""
        token = self.login_devotee()
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to verify with missing data
        response = self.session.post(f"{BASE_URL}/api/razorpay/verify", headers=headers, json={
            "razorpay_order_id": "order_test123"
            # Missing razorpay_payment_id, razorpay_signature, order_id
        })
        
        print(f"Razorpay verify (missing data) response: {response.status_code}")
        
        assert response.status_code == 400, f"Expected 400 for missing data, got {response.status_code}"
        print("✓ Razorpay verify correctly rejects missing data")
    
    def test_razorpay_verify_invalid_signature(self):
        """Test POST /api/razorpay/verify returns 400 for invalid signature"""
        token = self.login_devotee()
        headers = {"Authorization": f"Bearer {token}"}
        
        # First create a Razorpay order to get a valid order_id
        self.clear_cart(token)
        self.add_to_cart(token)
        
        checkout_data = {
            "shipping_name": "Test User",
            "shipping_phone": "+919876543210",
            "shipping_address": "123 Test Street",
            "shipping_city": "Hyderabad",
            "payment_method": "razorpay"
        }
        
        checkout_res = self.session.post(f"{BASE_URL}/api/checkout", headers=headers, json=checkout_data)
        if checkout_res.status_code != 200:
            pytest.skip("Could not create checkout for signature test")
        
        checkout_data = checkout_res.json()
        order_id = checkout_data.get("order_id")
        razorpay_order_id = checkout_data.get("razorpay_order_id")
        
        # Try to verify with invalid signature
        response = self.session.post(f"{BASE_URL}/api/razorpay/verify", headers=headers, json={
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": "pay_test123",
            "razorpay_signature": "invalid_signature_12345",
            "order_id": order_id
        })
        
        print(f"Razorpay verify (invalid signature) response: {response.status_code}")
        
        assert response.status_code == 400, f"Expected 400 for invalid signature, got {response.status_code}"
        print("✓ Razorpay verify correctly rejects invalid signature")
    
    # ==================== STRIPE WEBHOOK TESTS ====================
    
    def test_stripe_webhook_returns_ok(self):
        """Test POST /api/webhooks/stripe returns {status: ok}"""
        # Stripe webhook doesn't require auth, but needs valid payload format
        # Without webhook secret, it should still return ok for valid JSON
        # Note: The webhook may return 500 if it tries to process an invalid order_id
        # We test with a ping event which should always succeed
        
        response = self.session.post(
            f"{BASE_URL}/api/webhooks/stripe",
            json={
                "type": "ping",  # Use ping event which doesn't require order processing
                "data": {
                    "object": {}
                }
            }
        )
        
        print(f"Stripe webhook response status: {response.status_code}")
        print(f"Stripe webhook response: {response.text}")
        
        # Should return 200 with {status: ok}
        assert response.status_code == 200, f"Webhook failed: {response.text}"
        
        data = response.json()
        assert data.get("status") == "ok", f"Expected status: ok, got: {data}"
        
        print("✓ Stripe webhook returns {status: ok}")


class TestAdminSystemConfig:
    """Test Admin System Config endpoints for fees, taxes, and order settings"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_token = None
    
    def login_admin(self):
        """Login as admin and get token"""
        if self.admin_token:
            return self.admin_token
        
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        self.admin_token = data.get("token") or data.get("access_token")
        assert self.admin_token, "No token in admin login response"
        return self.admin_token
    
    # ==================== FEES & TAXES CONFIG TESTS ====================
    
    def test_get_fees_taxes_config(self):
        """Test GET /api/admin/system-config/fees_taxes returns platform fee and GST settings"""
        token = self.login_admin()
        headers = {"Authorization": f"Bearer {token}"}
        
        response = self.session.get(f"{BASE_URL}/api/admin/system-config/fees_taxes", headers=headers)
        
        print(f"Fees/taxes config response status: {response.status_code}")
        print(f"Fees/taxes config response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Failed to get fees config: {response.text}"
        
        data = response.json()
        
        # Check response structure
        assert "config" in data or "configs" in data, "Missing config/configs in response"
        
        # Get the config object
        config = data.get("config") or {}
        configs_list = data.get("configs") or []
        
        # If configs is a list, convert to dict
        if configs_list:
            config = {c["key"]: c["value"] for c in configs_list}
        
        # Verify expected keys exist (either in config dict or configs list)
        expected_keys = ["platform_fee_enabled", "platform_fee_type", "platform_fee_value", "gst_enabled", "gst_percentage"]
        
        for key in expected_keys:
            if config:
                assert key in config, f"Missing {key} in fees config"
            print(f"  {key}: {config.get(key, 'N/A')}")
        
        print("✓ Fees & taxes config retrieved successfully")
    
    # ==================== ORDER SETTINGS CONFIG TESTS ====================
    
    def test_get_order_settings_config(self):
        """Test GET /api/admin/system-config/order_settings returns auto_confirm_days and auto_payout_enabled"""
        token = self.login_admin()
        headers = {"Authorization": f"Bearer {token}"}
        
        response = self.session.get(f"{BASE_URL}/api/admin/system-config/order_settings", headers=headers)
        
        print(f"Order settings config response status: {response.status_code}")
        print(f"Order settings config response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Failed to get order settings: {response.text}"
        
        data = response.json()
        
        # Check response structure
        assert "config" in data or "configs" in data, "Missing config/configs in response"
        
        # Get the config object
        config = data.get("config") or {}
        configs_list = data.get("configs") or []
        
        # If configs is a list, convert to dict
        if configs_list:
            config = {c["key"]: c["value"] for c in configs_list}
        
        # Verify expected keys exist
        expected_keys = ["auto_confirm_days", "auto_payout_enabled"]
        
        for key in expected_keys:
            if config:
                assert key in config, f"Missing {key} in order settings"
            print(f"  {key}: {config.get(key, 'N/A')}")
        
        print("✓ Order settings config retrieved successfully")
    
    # ==================== UPDATE GST SETTINGS TESTS ====================
    
    def test_update_gst_settings(self):
        """Test PUT /api/admin/system-config to enable GST, verify, then disable"""
        token = self.login_admin()
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 1: Enable GST with 18%
        print("Step 1: Enabling GST with 18%...")
        update_response = self.session.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=headers,
            json={
                "gst_enabled": True,
                "gst_percentage": "18"
            }
        )
        
        print(f"Update GST response status: {update_response.status_code}")
        print(f"Update GST response: {update_response.text}")
        
        assert update_response.status_code == 200, f"Failed to update GST settings: {update_response.text}"
        
        # Step 2: Verify GST is enabled
        print("Step 2: Verifying GST is enabled...")
        verify_response = self.session.get(f"{BASE_URL}/api/admin/system-config/fees_taxes", headers=headers)
        assert verify_response.status_code == 200, f"Failed to verify GST: {verify_response.text}"
        
        verify_data = verify_response.json()
        config = verify_data.get("config") or {}
        configs_list = verify_data.get("configs") or []
        
        if configs_list:
            config = {c["key"]: c["value"] for c in configs_list}
        
        # Check GST is enabled - handle nested structure where value is in config[key]["value"]
        gst_enabled_raw = config.get("gst_enabled")
        gst_percentage_raw = config.get("gst_percentage")
        
        # Extract actual value if it's a dict with 'value' key
        if isinstance(gst_enabled_raw, dict):
            gst_enabled = gst_enabled_raw.get("value")
        else:
            gst_enabled = gst_enabled_raw
            
        if isinstance(gst_percentage_raw, dict):
            gst_percentage = gst_percentage_raw.get("value")
        else:
            gst_percentage = gst_percentage_raw
        
        print(f"  gst_enabled: {gst_enabled}")
        print(f"  gst_percentage: {gst_percentage}")
        
        # GST should be enabled (could be True or "true" or "True")
        assert gst_enabled in [True, "true", "True"], f"GST should be enabled, got: {gst_enabled}"
        assert str(gst_percentage) == "18", f"GST percentage should be 18, got: {gst_percentage}"
        
        print("✓ GST enabled successfully")
        
        # Step 3: Disable GST
        print("Step 3: Disabling GST...")
        disable_response = self.session.put(
            f"{BASE_URL}/api/admin/system-config",
            headers=headers,
            json={
                "gst_enabled": False
            }
        )
        
        assert disable_response.status_code == 200, f"Failed to disable GST: {disable_response.text}"
        
        # Step 4: Verify GST is disabled
        print("Step 4: Verifying GST is disabled...")
        final_response = self.session.get(f"{BASE_URL}/api/admin/system-config/fees_taxes", headers=headers)
        assert final_response.status_code == 200
        
        final_data = final_response.json()
        final_config = final_data.get("config") or {}
        final_configs_list = final_data.get("configs") or []
        
        if final_configs_list:
            final_config = {c["key"]: c["value"] for c in final_configs_list}
        
        final_gst_enabled_raw = final_config.get("gst_enabled")
        
        # Extract actual value if it's a dict with 'value' key
        if isinstance(final_gst_enabled_raw, dict):
            final_gst_enabled = final_gst_enabled_raw.get("value")
        else:
            final_gst_enabled = final_gst_enabled_raw
            
        print(f"  Final gst_enabled: {final_gst_enabled}")
        
        assert final_gst_enabled in [False, "false", "False"], f"GST should be disabled, got: {final_gst_enabled}"
        
        print("✓ GST disabled successfully")
        print("✓ Full GST update cycle completed")


class TestCheckoutFeesEndpoint:
    """Test public checkout fees endpoint"""
    
    def test_get_checkout_fees_taxes(self):
        """Test GET /api/checkout/fees-taxes returns fees config"""
        session = requests.Session()
        
        response = session.get(f"{BASE_URL}/api/checkout/fees-taxes")
        
        print(f"Checkout fees-taxes response status: {response.status_code}")
        print(f"Checkout fees-taxes response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Failed to get checkout fees: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "platform_fee" in data, "Missing platform_fee in response"
        assert "tax" in data, "Missing tax in response"
        
        # Verify platform_fee structure
        pf = data["platform_fee"]
        assert "enabled" in pf, "Missing platform_fee.enabled"
        assert "type" in pf, "Missing platform_fee.type"
        assert "value" in pf, "Missing platform_fee.value"
        
        # Verify tax structure
        tax = data["tax"]
        assert "enabled" in tax, "Missing tax.enabled"
        assert "percentage" in tax, "Missing tax.percentage"
        assert "label" in tax, "Missing tax.label"
        
        print(f"  Platform Fee: enabled={pf['enabled']}, type={pf['type']}, value={pf['value']}")
        print(f"  Tax: enabled={tax['enabled']}, percentage={tax['percentage']}, label={tax['label']}")
        
        print("✓ Checkout fees-taxes endpoint working correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
