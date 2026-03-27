"""
Test Admin Payments Dashboard
Tests for:
- GET /api/admin/payments/dashboard - Revenue summary, by_type, gateway_split, provider_payouts
- GET /api/admin/payments/transactions - Paginated transactions with filters
- Admin role authorization (403 for non-admin)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@divine.com"
ADMIN_PASSWORD = "admin123"
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def devotee_token():
    """Get devotee (non-admin) authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": DEVOTEE_EMAIL,
        "password": DEVOTEE_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Devotee login failed: {response.status_code} - {response.text}")


class TestPaymentsDashboardAuth:
    """Test authorization for payments endpoints"""
    
    def test_dashboard_requires_auth(self):
        """Dashboard endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/payments/dashboard")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASSED: Dashboard requires authentication")
    
    def test_transactions_requires_auth(self):
        """Transactions endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/payments/transactions")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASSED: Transactions requires authentication")
    
    def test_dashboard_requires_admin_role(self, devotee_token):
        """Dashboard endpoint requires admin role (403 for devotee)"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments/dashboard", headers=headers)
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("PASSED: Dashboard returns 403 for non-admin user")
    
    def test_transactions_requires_admin_role(self, devotee_token):
        """Transactions endpoint requires admin role (403 for devotee)"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments/transactions", headers=headers)
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("PASSED: Transactions returns 403 for non-admin user")


class TestPaymentsDashboard:
    """Test payments dashboard endpoint"""
    
    def test_dashboard_returns_summary(self, admin_token):
        """Dashboard returns summary with revenue metrics"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments/dashboard", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check summary structure
        assert "summary" in data, "Response should contain 'summary'"
        summary = data["summary"]
        
        required_fields = ["total_revenue", "today_revenue", "week_revenue", "month_revenue", 
                          "platform_fees_earned", "gst_collected", "platform_fee_pct", "gst_pct"]
        for field in required_fields:
            assert field in summary, f"Summary should contain '{field}'"
        
        # Verify numeric values
        assert isinstance(summary["total_revenue"], (int, float)), "total_revenue should be numeric"
        assert isinstance(summary["platform_fees_earned"], (int, float)), "platform_fees_earned should be numeric"
        assert isinstance(summary["gst_collected"], (int, float)), "gst_collected should be numeric"
        
        print(f"PASSED: Dashboard summary - Total Revenue: ₹{summary['total_revenue']}, "
              f"Platform Fees: ₹{summary['platform_fees_earned']}, GST: ₹{summary['gst_collected']}")
    
    def test_dashboard_returns_by_type(self, admin_token):
        """Dashboard returns revenue breakdown by type"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments/dashboard", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check by_type structure
        assert "by_type" in data, "Response should contain 'by_type'"
        by_type = data["by_type"]
        
        expected_types = ["orders", "bookings", "classes", "wallet_recharges"]
        for type_name in expected_types:
            assert type_name in by_type, f"by_type should contain '{type_name}'"
            assert "total" in by_type[type_name], f"{type_name} should have 'total'"
            assert "count" in by_type[type_name], f"{type_name} should have 'count'"
        
        print(f"PASSED: Revenue by type - Orders: ₹{by_type['orders']['total']} ({by_type['orders']['count']}), "
              f"Bookings: ₹{by_type['bookings']['total']} ({by_type['bookings']['count']}), "
              f"Classes: ₹{by_type['classes']['total']} ({by_type['classes']['count']}), "
              f"Wallet: ₹{by_type['wallet_recharges']['total']} ({by_type['wallet_recharges']['count']})")
    
    def test_dashboard_returns_gateway_split(self, admin_token):
        """Dashboard returns gateway split (may be empty if no transactions)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments/dashboard", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check gateway_split structure
        assert "gateway_split" in data, "Response should contain 'gateway_split'"
        gateway_split = data["gateway_split"]
        
        # Gateway split can be empty if no payment transactions exist
        assert isinstance(gateway_split, dict), "gateway_split should be a dict"
        
        # If there are gateways, verify structure
        for gateway, stats in gateway_split.items():
            assert "total" in stats, f"Gateway {gateway} should have 'total'"
            assert "count" in stats, f"Gateway {gateway} should have 'count'"
        
        if gateway_split:
            print(f"PASSED: Gateway split - {gateway_split}")
        else:
            print("PASSED: Gateway split is empty (no payment transactions yet - expected)")
    
    def test_dashboard_returns_provider_payouts(self, admin_token):
        """Dashboard returns provider payouts summary"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments/dashboard", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check provider_payouts structure
        assert "provider_payouts" in data, "Response should contain 'provider_payouts'"
        payouts = data["provider_payouts"]
        
        assert "total_due" in payouts, "provider_payouts should have 'total_due'"
        assert "shop_owners" in payouts, "provider_payouts should have 'shop_owners'"
        assert "priests" in payouts, "provider_payouts should have 'priests'"
        
        print(f"PASSED: Provider payouts - Total Due: ₹{payouts['total_due']}, "
              f"Shop Owners: {payouts['shop_owners']}, Priests: {payouts['priests']}")


class TestPaymentsTransactions:
    """Test payments transactions endpoint"""
    
    def test_transactions_returns_list(self, admin_token):
        """Transactions endpoint returns paginated list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments/transactions", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "transactions" in data, "Response should contain 'transactions'"
        assert "total" in data, "Response should contain 'total'"
        assert "skip" in data, "Response should contain 'skip'"
        assert "limit" in data, "Response should contain 'limit'"
        
        assert isinstance(data["transactions"], list), "transactions should be a list"
        assert isinstance(data["total"], int), "total should be an integer"
        
        print(f"PASSED: Transactions list - Total: {data['total']}, Returned: {len(data['transactions'])}")
    
    def test_transactions_pagination(self, admin_token):
        """Transactions endpoint supports pagination"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test with skip and limit
        response = requests.get(f"{BASE_URL}/api/admin/payments/transactions?skip=0&limit=10", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["skip"] == 0, "skip should be 0"
        assert data["limit"] == 10, "limit should be 10"
        assert len(data["transactions"]) <= 10, "Should return at most 10 transactions"
        
        print(f"PASSED: Pagination works - skip=0, limit=10, returned={len(data['transactions'])}")
    
    def test_transactions_filter_by_payment_type(self, admin_token):
        """Transactions can be filtered by payment_type"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test filter by payment_type
        response = requests.get(f"{BASE_URL}/api/admin/payments/transactions?payment_type=wallet_recharge", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # All returned transactions should have the filtered payment_type (if any exist)
        for tx in data["transactions"]:
            assert tx["payment_type"] == "wallet_recharge", f"Expected wallet_recharge, got {tx['payment_type']}"
        
        print(f"PASSED: Filter by payment_type=wallet_recharge - {len(data['transactions'])} transactions")
    
    def test_transactions_filter_by_gateway(self, admin_token):
        """Transactions can be filtered by gateway"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test filter by gateway
        response = requests.get(f"{BASE_URL}/api/admin/payments/transactions?gateway=stripe", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # All returned transactions should have the filtered gateway (if any exist)
        for tx in data["transactions"]:
            assert tx["payment_method"] == "stripe", f"Expected stripe, got {tx['payment_method']}"
        
        print(f"PASSED: Filter by gateway=stripe - {len(data['transactions'])} transactions")
    
    def test_transactions_filter_by_status(self, admin_token):
        """Transactions can be filtered by status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test filter by status
        response = requests.get(f"{BASE_URL}/api/admin/payments/transactions?status=completed", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # All returned transactions should have the filtered status (if any exist)
        for tx in data["transactions"]:
            assert tx["payment_status"] == "completed", f"Expected completed, got {tx['payment_status']}"
        
        print(f"PASSED: Filter by status=completed - {len(data['transactions'])} transactions")
    
    def test_transactions_structure(self, admin_token):
        """Transactions have correct structure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/payments/transactions", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if data["transactions"]:
            tx = data["transactions"][0]
            expected_fields = ["id", "user_id", "user_name", "user_email", "amount", 
                             "currency", "payment_type", "payment_method", "payment_status", "created_at"]
            for field in expected_fields:
                assert field in tx, f"Transaction should have '{field}'"
            
            print(f"PASSED: Transaction structure verified - {expected_fields}")
        else:
            print("PASSED: No transactions to verify structure (expected if no payment transactions exist)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
