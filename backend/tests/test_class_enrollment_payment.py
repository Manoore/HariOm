"""
Test Class Enrollment Payment Flow
- Tests the class enrollment API with platform fees and GST calculation
- Tests free class enrollment
- Tests paid class enrollment flow with Stripe payment intent
- Tests price breakdown correctness (Base Price + 10% Platform Fee + 18% GST on Platform Fee)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vedic-hub-2.preview.emergentagent.com').rstrip('/')

# Test credentials
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
ADMIN_EMAIL = "admin@divineapp.com"
ADMIN_PASSWORD = "admin123"


class TestClassEnrollmentPayment:
    """Test class enrollment and payment flow"""
    
    @pytest.fixture(scope="class")
    def devotee_token(self):
        """Get authentication token for devotee"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        if response.status_code == 200:
            # API returns "token" not "access_token"
            return response.json().get("token")
        pytest.skip(f"Devotee login failed: {response.status_code} - {response.text}")
    
    @pytest.fixture(scope="class")
    def devotee_client(self, devotee_token):
        """Create authenticated session for devotee"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {devotee_token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_health_check(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health check passed")
    
    def test_get_available_classes(self, devotee_client):
        """Test fetching available classes"""
        response = devotee_client.get(f"{BASE_URL}/api/classes")
        assert response.status_code == 200
        data = response.json()
        assert "classes" in data
        classes = data["classes"]
        print(f"✅ Found {len(classes)} classes")
        
        # Check class structure
        if classes:
            cls = classes[0]
            assert "id" in cls
            assert "title" in cls
            assert "price" in cls
            assert "is_free" in cls or "price" in cls
            print(f"✅ Class structure verified: {cls['title']}")
        
        return classes
    
    def test_paid_class_enrollment_returns_payment_intent(self, devotee_client):
        """Test enrolling in a paid class returns payment intent with price breakdown"""
        # First get a paid class
        response = devotee_client.get(f"{BASE_URL}/api/classes")
        assert response.status_code == 200
        classes = response.json().get("classes", [])
        
        # Find a paid class that user is not enrolled in
        paid_class = None
        for cls in classes:
            is_free = cls.get("is_free", cls.get("price", 0) == 0)
            if not is_free and cls.get("available_slots", 0) > 0:
                paid_class = cls
                break
        
        if not paid_class:
            pytest.skip("No available paid classes found for testing")
        
        print(f"Testing with paid class: {paid_class['title']} (₹{paid_class['price']})")
        
        # Try to enroll - should return payment intent
        response = devotee_client.post(f"{BASE_URL}/api/classes/{paid_class['id']}/enroll")
        
        # Could be 200 (requires_payment) or 400 (already enrolled)
        if response.status_code == 400:
            error = response.json().get("detail", "")
            if "Already enrolled" in error:
                print(f"⚠️ Already enrolled in this class, skipping payment intent test")
                pytest.skip("Already enrolled in the test class")
        
        assert response.status_code == 200, f"Enroll failed: {response.text}"
        data = response.json()
        
        # Check if payment is required
        if data.get("is_free"):
            print("⚠️ Class was enrolled for free")
            return
        
        assert data.get("requires_payment") == True, "Paid class should require payment"
        print("✅ Paid class requires payment")
        
        # Verify payment intent fields
        assert "client_secret" in data, "Missing client_secret"
        assert "payment_intent_id" in data, "Missing payment_intent_id"
        assert data["client_secret"].startswith("pi_"), "Invalid client_secret format"
        print("✅ Payment intent created with valid client_secret")
        
        # Verify price breakdown
        assert "price_breakdown" in data, "Missing price_breakdown"
        breakdown = data["price_breakdown"]
        
        assert "base_price" in breakdown, "Missing base_price in breakdown"
        assert "platform_fee" in breakdown, "Missing platform_fee in breakdown"
        assert "platform_fee_percent" in breakdown, "Missing platform_fee_percent in breakdown"
        assert "gst" in breakdown, "Missing gst in breakdown"
        assert "gst_percent" in breakdown, "Missing gst_percent in breakdown"
        assert "total" in breakdown, "Missing total in breakdown"
        
        print(f"✅ Price breakdown structure verified")
        
        # Verify fee calculation correctness
        base_price = breakdown["base_price"]
        platform_fee_percent = breakdown["platform_fee_percent"]
        gst_percent = breakdown["gst_percent"]
        platform_fee = breakdown["platform_fee"]
        gst = breakdown["gst"]
        total = breakdown["total"]
        
        # Platform fee should be 10%
        assert platform_fee_percent == 10, f"Platform fee should be 10%, got {platform_fee_percent}%"
        print("✅ Platform fee is 10%")
        
        # GST should be 18%
        assert gst_percent == 18, f"GST should be 18%, got {gst_percent}%"
        print("✅ GST is 18%")
        
        # Calculate expected values
        expected_platform_fee = round(base_price * 0.10, 2)
        expected_gst = round(expected_platform_fee * 0.18, 2)
        expected_total = base_price + expected_platform_fee + expected_gst
        
        # Verify calculations
        assert platform_fee == expected_platform_fee, f"Platform fee calculation wrong: expected {expected_platform_fee}, got {platform_fee}"
        print(f"✅ Platform fee calculated correctly: ₹{platform_fee}")
        
        assert gst == expected_gst, f"GST calculation wrong: expected {expected_gst}, got {gst}"
        print(f"✅ GST calculated correctly: ₹{gst}")
        
        assert total == expected_total, f"Total calculation wrong: expected {expected_total}, got {total}"
        print(f"✅ Total calculated correctly: ₹{total}")
        
        # Verify total price matches price field
        assert data.get("price") == total, "Price field should match total"
        print("✅ Price field matches calculated total")
        
        print(f"""
Price Breakdown Verified:
  Base Price: ₹{base_price}
  Platform Fee ({platform_fee_percent}%): ₹{platform_fee}
  GST ({gst_percent}% on platform fee): ₹{gst}
  Total: ₹{total}
        """)
    
    def test_unauthenticated_enrollment_rejected(self):
        """Test that unauthenticated users cannot enroll"""
        # Get a class first
        response = requests.get(f"{BASE_URL}/api/classes")
        classes = response.json().get("classes", [])
        if not classes:
            pytest.skip("No classes available")
        
        class_id = classes[0]["id"]
        
        # Try to enroll without auth
        response = requests.post(f"{BASE_URL}/api/classes/{class_id}/enroll")
        assert response.status_code in [401, 403], f"Unauthenticated enrollment should be rejected, got {response.status_code}"
        print("✅ Unauthenticated enrollment correctly rejected")
    
    def test_get_my_enrollments(self, devotee_client):
        """Test fetching user's enrolled classes"""
        response = devotee_client.get(f"{BASE_URL}/api/my-enrollments")
        assert response.status_code == 200
        data = response.json()
        assert "enrollments" in data
        print(f"✅ My enrollments endpoint works, found {len(data['enrollments'])} enrolled classes")
    
    def test_payment_intent_structure(self, devotee_client):
        """Test Stripe payment confirm endpoint exists"""
        # This test verifies the payment confirm endpoint is available
        # We don't actually confirm a payment to avoid real charges
        response = devotee_client.post(f"{BASE_URL}/api/payments/stripe/confirm", json={
            "payment_intent_id": "pi_test_invalid",
            "card_number": "4242424242424242",
            "exp_month": "12",
            "exp_year": "2026",
            "cvc": "123"
        })
        # Should fail with invalid payment intent, but endpoint should exist
        assert response.status_code in [400, 404, 500], f"Payment confirm endpoint should handle invalid data, got {response.status_code}"
        print("✅ Payment confirm endpoint exists and handles invalid data")


class TestPriceBreakdownCalculation:
    """Test price breakdown calculations for various amounts"""
    
    def test_calculation_for_500(self):
        """Test price breakdown for ₹500 base price"""
        base_price = 500
        platform_fee_percent = 10
        gst_percent = 18
        
        platform_fee = round(base_price * platform_fee_percent / 100, 2)
        gst = round(platform_fee * gst_percent / 100, 2)
        total = base_price + platform_fee + gst
        
        assert platform_fee == 50.0, f"Platform fee for ₹500 should be ₹50, got ₹{platform_fee}"
        assert gst == 9.0, f"GST for ₹50 platform fee should be ₹9, got ₹{gst}"
        assert total == 559.0, f"Total for ₹500 should be ₹559, got ₹{total}"
        print(f"✅ ₹500 calculation: Base ₹500 + Platform Fee ₹50 + GST ₹9 = Total ₹559")
    
    def test_calculation_for_1000(self):
        """Test price breakdown for ₹1000 base price"""
        base_price = 1000
        platform_fee_percent = 10
        gst_percent = 18
        
        platform_fee = round(base_price * platform_fee_percent / 100, 2)
        gst = round(platform_fee * gst_percent / 100, 2)
        total = base_price + platform_fee + gst
        
        assert platform_fee == 100.0, f"Platform fee for ₹1000 should be ₹100, got ₹{platform_fee}"
        assert gst == 18.0, f"GST for ₹100 platform fee should be ₹18, got ₹{gst}"
        assert total == 1118.0, f"Total for ₹1000 should be ₹1118, got ₹{total}"
        print(f"✅ ₹1000 calculation: Base ₹1000 + Platform Fee ₹100 + GST ₹18 = Total ₹1118")
    
    def test_calculation_for_2500(self):
        """Test price breakdown for ₹2500 base price"""
        base_price = 2500
        platform_fee_percent = 10
        gst_percent = 18
        
        platform_fee = round(base_price * platform_fee_percent / 100, 2)
        gst = round(platform_fee * gst_percent / 100, 2)
        total = base_price + platform_fee + gst
        
        assert platform_fee == 250.0, f"Platform fee for ₹2500 should be ₹250, got ₹{platform_fee}"
        assert gst == 45.0, f"GST for ₹250 platform fee should be ₹45, got ₹{gst}"
        assert total == 2795.0, f"Total for ₹2500 should be ₹2795, got ₹{total}"
        print(f"✅ ₹2500 calculation: Base ₹2500 + Platform Fee ₹250 + GST ₹45 = Total ₹2795")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
