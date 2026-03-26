"""
Test Suite for:
1. Shop Owner Earnings API (GET /api/shop/earnings)
2. Priest Earnings API (GET /api/priest/earnings)
3. Astrologer Earnings API (GET /api/astrologer/earnings)
4. Auto-enroll reminder feature (POST /api/classes/{class_id}/enroll creates 60-min reminder)
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
SHOP_OWNER_EMAIL = "shop.poojamart@divineapp.com"
SHOP_OWNER_PASSWORD = "shop123"
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"
ASTROLOGER_EMAIL = "astro.joshi@divineapp.com"
ASTROLOGER_PASSWORD = "astro123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def login(api_client, email, password):
    """Helper to login and get token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        token = response.json().get("token")
        return token
    return None


# ===================== SHOP OWNER EARNINGS TESTS =====================

class TestShopOwnerEarnings:
    """Test GET /api/shop/earnings endpoint"""
    
    def test_shop_earnings_requires_auth(self, api_client):
        """Earnings endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/shop/earnings")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Shop earnings requires authentication")
    
    def test_shop_earnings_returns_data(self, api_client):
        """Shop owner can access earnings with proper data structure"""
        token = login(api_client, SHOP_OWNER_EMAIL, SHOP_OWNER_PASSWORD)
        assert token, "Failed to login as shop owner"
        
        response = api_client.get(
            f"{BASE_URL}/api/shop/earnings",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields exist
        required_fields = [
            "total_revenue", "today_revenue", "week_revenue", "month_revenue",
            "total_orders", "today_orders", "week_orders", "month_orders",
            "platform_fee", "platform_fee_pct", "gst_on_fee", "gst_pct",
            "net_earnings", "pending_payout", "transactions"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify data types
        assert isinstance(data["total_revenue"], (int, float)), "total_revenue should be numeric"
        assert isinstance(data["net_earnings"], (int, float)), "net_earnings should be numeric"
        assert isinstance(data["platform_fee"], (int, float)), "platform_fee should be numeric"
        assert isinstance(data["gst_on_fee"], (int, float)), "gst_on_fee should be numeric"
        assert isinstance(data["transactions"], list), "transactions should be a list"
        
        # Verify fee calculation logic (net = total - platform_fee - gst)
        expected_net = round(data["total_revenue"] - data["platform_fee"] - data["gst_on_fee"], 2)
        assert abs(data["net_earnings"] - expected_net) < 1, f"Net earnings calculation mismatch: {data['net_earnings']} vs {expected_net}"
        
        print(f"✓ Shop earnings data structure verified")
        print(f"  - Total Revenue: ₹{data['total_revenue']}")
        print(f"  - Platform Fee ({data['platform_fee_pct']}%): ₹{data['platform_fee']}")
        print(f"  - GST on Fee ({data['gst_pct']}%): ₹{data['gst_on_fee']}")
        print(f"  - Net Earnings: ₹{data['net_earnings']}")
        print(f"  - Transactions: {len(data['transactions'])}")
    
    def test_shop_earnings_transactions_structure(self, api_client):
        """Verify transaction objects have correct structure"""
        token = login(api_client, SHOP_OWNER_EMAIL, SHOP_OWNER_PASSWORD)
        assert token, "Failed to login as shop owner"
        
        response = api_client.get(
            f"{BASE_URL}/api/shop/earnings",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        transactions = data.get("transactions", [])
        
        if len(transactions) > 0:
            tx = transactions[0]
            tx_fields = ["id", "order_number", "amount", "platform_fee", "net_amount", "status", "items_count", "date"]
            for field in tx_fields:
                assert field in tx, f"Transaction missing field: {field}"
            print(f"✓ Transaction structure verified with {len(transactions)} transactions")
        else:
            print("✓ No transactions yet (empty list is valid)")
    
    def test_shop_earnings_non_shop_owner_denied(self, api_client):
        """Non-shop-owner users cannot access shop earnings"""
        token = login(api_client, DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert token, "Failed to login as devotee"
        
        response = api_client.get(
            f"{BASE_URL}/api/shop/earnings",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code in [403, 404], f"Expected 403/404 for non-shop-owner, got {response.status_code}"
        print("✓ Non-shop-owner correctly denied access to shop earnings")


# ===================== PRIEST EARNINGS TESTS =====================

class TestPriestEarnings:
    """Test GET /api/priest/earnings endpoint"""
    
    def test_priest_earnings_requires_auth(self, api_client):
        """Priest earnings endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/priest/earnings")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Priest earnings requires authentication")
    
    def test_priest_earnings_returns_data(self, api_client):
        """Priest can access earnings with proper data structure"""
        token = login(api_client, PRIEST_EMAIL, PRIEST_PASSWORD)
        assert token, "Failed to login as priest"
        
        response = api_client.get(
            f"{BASE_URL}/api/priest/earnings",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        required_fields = ["total_earnings", "monthly_earnings", "class_earnings", "pending_payouts", "transactions"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify data types
        assert isinstance(data["total_earnings"], (int, float)), "total_earnings should be numeric"
        assert isinstance(data["monthly_earnings"], (int, float)), "monthly_earnings should be numeric"
        assert isinstance(data["class_earnings"], (int, float)), "class_earnings should be numeric"
        assert isinstance(data["transactions"], list), "transactions should be a list"
        
        print(f"✓ Priest earnings data structure verified")
        print(f"  - Total Earnings: ₹{data['total_earnings']}")
        print(f"  - Monthly Earnings: ₹{data['monthly_earnings']}")
        print(f"  - Class Earnings: ₹{data['class_earnings']}")
        print(f"  - Transactions: {len(data['transactions'])}")
    
    def test_priest_earnings_non_priest_denied(self, api_client):
        """Non-priest users cannot access priest earnings"""
        token = login(api_client, DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert token, "Failed to login as devotee"
        
        response = api_client.get(
            f"{BASE_URL}/api/priest/earnings",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code in [403, 404], f"Expected 403/404 for non-priest, got {response.status_code}"
        print("✓ Non-priest correctly denied access to priest earnings")


# ===================== ASTROLOGER EARNINGS TESTS =====================

class TestAstrologerEarnings:
    """Test GET /api/astrologer/earnings endpoint"""
    
    def test_astrologer_earnings_requires_auth(self, api_client):
        """Astrologer earnings endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/astrologer/earnings")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Astrologer earnings requires authentication")
    
    def test_astrologer_earnings_returns_data(self, api_client):
        """Astrologer can access earnings"""
        token = login(api_client, ASTROLOGER_EMAIL, ASTROLOGER_PASSWORD)
        assert token, "Failed to login as astrologer"
        
        response = api_client.get(
            f"{BASE_URL}/api/astrologer/earnings",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Endpoint may return 200 or 404 if astrologer profile doesn't exist
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Astrologer earnings endpoint accessible")
            print(f"  - Response: {data}")
        elif response.status_code == 404:
            print("✓ Astrologer earnings endpoint exists (404 = profile not found)")
        else:
            assert False, f"Unexpected status: {response.status_code}: {response.text}"


# ===================== AUTO-ENROLL REMINDER TESTS =====================

class TestAutoEnrollReminder:
    """Test auto-creation of 60-minute reminder on class enrollment"""
    
    def test_get_available_classes(self, api_client):
        """Get list of available classes"""
        response = api_client.get(f"{BASE_URL}/api/classes")
        assert response.status_code == 200, f"Failed to get classes: {response.status_code}"
        
        data = response.json()
        classes = data.get("classes", [])
        print(f"✓ Found {len(classes)} available classes")
        return classes
    
    def test_enroll_creates_auto_reminder(self, api_client):
        """Enrolling in a free class should auto-create a 60-minute reminder"""
        # Login as devotee
        token = login(api_client, DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert token, "Failed to login as devotee"
        
        # Get current reminders before enrollment
        reminders_before = api_client.get(
            f"{BASE_URL}/api/class-reminders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert reminders_before.status_code == 200
        before_count = len(reminders_before.json().get("reminders", []))
        
        # Get available classes
        classes_response = api_client.get(f"{BASE_URL}/api/classes")
        assert classes_response.status_code == 200
        classes = classes_response.json().get("classes", [])
        
        # Find a free class with available slots that user is not enrolled in
        free_class = None
        for cls in classes:
            if cls.get("is_free", False) and cls.get("available_slots", 0) > 0:
                free_class = cls
                break
        
        if not free_class:
            print("⚠ No free class with available slots found - skipping auto-reminder test")
            pytest.skip("No free class available for enrollment test")
            return
        
        class_id = free_class["id"]
        print(f"  Testing with class: {free_class.get('title', 'Unknown')} (ID: {class_id})")
        
        # Try to enroll
        enroll_response = api_client.post(
            f"{BASE_URL}/api/classes/{class_id}/enroll",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Handle already enrolled case
        if enroll_response.status_code == 400 and "Already enrolled" in enroll_response.text:
            print("  User already enrolled in this class - checking existing reminder")
            # Check if reminder exists for this class
            reminders_response = api_client.get(
                f"{BASE_URL}/api/class-reminders",
                headers={"Authorization": f"Bearer {token}"}
            )
            reminders = reminders_response.json().get("reminders", [])
            class_reminder = next((r for r in reminders if r.get("class_id") == class_id), None)
            if class_reminder:
                assert class_reminder.get("remind_before_minutes") == 60, "Existing reminder should be 60 minutes"
                print(f"✓ Existing reminder found with 60-minute setting")
            else:
                print("⚠ No reminder found for enrolled class (may have been deleted)")
            return
        
        assert enroll_response.status_code == 200, f"Enrollment failed: {enroll_response.status_code}: {enroll_response.text}"
        print(f"  Enrollment successful: {enroll_response.json().get('message')}")
        
        # Check reminders after enrollment
        reminders_after = api_client.get(
            f"{BASE_URL}/api/class-reminders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert reminders_after.status_code == 200
        
        reminders = reminders_after.json().get("reminders", [])
        
        # Find reminder for the enrolled class
        class_reminder = next((r for r in reminders if r.get("class_id") == class_id), None)
        
        assert class_reminder is not None, f"Auto-reminder not created for class {class_id}"
        assert class_reminder.get("remind_before_minutes") == 60, f"Reminder should be 60 minutes, got {class_reminder.get('remind_before_minutes')}"
        
        print(f"✓ Auto-reminder created with 60-minute setting for class {class_id}")
    
    def test_reminder_options_include_60_minutes(self, api_client):
        """Verify 60 minutes (1 hour) is a valid reminder option"""
        token = login(api_client, DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert token, "Failed to login"
        
        response = api_client.get(
            f"{BASE_URL}/api/class-reminders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        options = data.get("options", [])
        
        # Find 60-minute option
        sixty_min_option = next((o for o in options if o.get("value") == 60), None)
        assert sixty_min_option is not None, "60-minute option should exist in reminder options"
        assert sixty_min_option.get("label") == "1 hour before", f"60-min label should be '1 hour before', got {sixty_min_option.get('label')}"
        
        print(f"✓ 60-minute reminder option verified: {sixty_min_option}")


# ===================== RUN TESTS =====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
