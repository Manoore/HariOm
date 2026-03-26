"""
Test Wallet Recharge Payment Integration
Tests the wallet recharge flow with real Stripe/Razorpay payment intents
- POST /api/wallet/create-recharge-intent - creates payment intents
- POST /api/wallet/recharge - verifies payment and adds balance
- GET /api/wallet - returns wallet balance
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
ADMIN_EMAIL = "admin@divine.com"
ADMIN_PASSWORD = "admin123"


class TestWalletRechargePayment:
    """Test wallet recharge with real payment gateway integration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.auth_token = None
    
    def login_as_devotee(self):
        """Login as devotee and get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("token") or data.get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
            return True
        return False
    
    # ===================== GET /api/wallet Tests =====================
    
    def test_get_wallet_requires_auth(self):
        """GET /api/wallet should require authentication"""
        response = requests.get(f"{BASE_URL}/api/wallet")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASSED: GET /api/wallet requires authentication")
    
    def test_get_wallet_returns_balance(self):
        """GET /api/wallet should return wallet balance for authenticated user"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        response = self.session.get(f"{BASE_URL}/api/wallet")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify wallet structure
        assert "balance" in data, "Response should contain 'balance'"
        assert isinstance(data["balance"], (int, float)), "Balance should be a number"
        
        print(f"PASSED: GET /api/wallet returns balance: {data.get('balance')}")
        print(f"  - Total recharged: {data.get('total_recharged', 0)}")
        print(f"  - Total spent: {data.get('total_spent', 0)}")
        print(f"  - Free minutes: {data.get('free_minutes', 0)}")
    
    # ===================== POST /api/wallet/create-recharge-intent Tests =====================
    
    def test_create_recharge_intent_requires_auth(self):
        """POST /api/wallet/create-recharge-intent should require authentication"""
        response = requests.post(f"{BASE_URL}/api/wallet/create-recharge-intent", json={"amount": 100})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASSED: POST /api/wallet/create-recharge-intent requires authentication")
    
    def test_create_recharge_intent_rejects_low_amount(self):
        """POST /api/wallet/create-recharge-intent should reject amounts below minimum (100)"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        response = self.session.post(f"{BASE_URL}/api/wallet/create-recharge-intent", json={"amount": 50})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        assert "minimum" in data["detail"].lower() or "100" in data["detail"], \
            f"Error should mention minimum amount: {data['detail']}"
        
        print(f"PASSED: Rejects amount below minimum with message: {data['detail']}")
    
    def test_create_recharge_intent_success(self):
        """POST /api/wallet/create-recharge-intent should return payment intent data"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        response = self.session.post(f"{BASE_URL}/api/wallet/create-recharge-intent", json={"amount": 100})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response contains expected fields
        assert "amount" in data, "Response should contain 'amount'"
        assert data["amount"] == 100, f"Amount should be 100, got {data['amount']}"
        
        # Should have at least one payment gateway configured
        has_stripe = "client_secret" in data and "payment_intent_id" in data
        has_razorpay = "razorpay_order_id" in data and "razorpay_key" in data
        
        assert has_stripe or has_razorpay, \
            f"Response should contain Stripe or Razorpay data. Got: {list(data.keys())}"
        
        print(f"PASSED: Create recharge intent returns payment data")
        print(f"  - Amount: {data.get('amount')}")
        if has_stripe:
            print(f"  - Stripe client_secret: {data.get('client_secret', '')[:30]}...")
            print(f"  - Stripe payment_intent_id: {data.get('payment_intent_id')}")
        if has_razorpay:
            print(f"  - Razorpay order_id: {data.get('razorpay_order_id')}")
            print(f"  - Razorpay key: {data.get('razorpay_key')}")
    
    def test_create_recharge_intent_with_custom_amount(self):
        """POST /api/wallet/create-recharge-intent should work with custom amounts"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        # Test with preset amounts
        for amount in [200, 500, 1000]:
            response = self.session.post(f"{BASE_URL}/api/wallet/create-recharge-intent", json={"amount": amount})
            assert response.status_code == 200, f"Expected 200 for amount {amount}, got {response.status_code}"
            
            data = response.json()
            assert data["amount"] == amount, f"Amount should be {amount}, got {data['amount']}"
            print(f"  - Amount {amount}: OK")
        
        print("PASSED: Create recharge intent works with preset amounts (200, 500, 1000)")
    
    # ===================== POST /api/wallet/recharge Tests =====================
    
    def test_recharge_requires_auth(self):
        """POST /api/wallet/recharge should require authentication"""
        response = requests.post(f"{BASE_URL}/api/wallet/recharge", json={
            "amount": 100,
            "payment_method": "stripe",
            "payment_id": "test_payment_id"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASSED: POST /api/wallet/recharge requires authentication")
    
    def test_recharge_rejects_unverified_payment(self):
        """POST /api/wallet/recharge should reject unverified payments"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        # Try to recharge with fake payment ID
        response = self.session.post(f"{BASE_URL}/api/wallet/recharge", json={
            "amount": 100,
            "payment_method": "stripe",
            "payment_id": "fake_payment_id",
            "payment_intent_id": "pi_fake_intent"
        })
        
        # Should return 400 because payment verification fails
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        assert "verification" in data["detail"].lower() or "failed" in data["detail"].lower(), \
            f"Error should mention verification failure: {data['detail']}"
        
        print(f"PASSED: Rejects unverified payment with message: {data['detail']}")
    
    def test_recharge_rejects_low_amount(self):
        """POST /api/wallet/recharge should reject amounts below minimum"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        response = self.session.post(f"{BASE_URL}/api/wallet/recharge", json={
            "amount": 50,
            "payment_method": "stripe",
            "payment_id": "test_payment_id"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        print(f"PASSED: Rejects low amount with message: {data['detail']}")
    
    # ===================== GET /api/wallet/transactions Tests =====================
    
    def test_get_transactions_requires_auth(self):
        """GET /api/wallet/transactions should require authentication"""
        response = requests.get(f"{BASE_URL}/api/wallet/transactions")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASSED: GET /api/wallet/transactions requires authentication")
    
    def test_get_transactions_returns_list(self):
        """GET /api/wallet/transactions should return transaction list"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        response = self.session.get(f"{BASE_URL}/api/wallet/transactions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "transactions" in data, "Response should contain 'transactions'"
        assert isinstance(data["transactions"], list), "Transactions should be a list"
        
        print(f"PASSED: GET /api/wallet/transactions returns {len(data['transactions'])} transactions")
    
    # ===================== GET /api/consultation/settings Tests =====================
    
    def test_consultation_settings_returns_min_recharge(self):
        """GET /api/consultation/settings should return min_recharge_amount"""
        response = requests.get(f"{BASE_URL}/api/consultation/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "min_recharge_amount" in data, "Response should contain 'min_recharge_amount'"
        assert data["min_recharge_amount"] >= 100, f"Min recharge should be >= 100, got {data['min_recharge_amount']}"
        
        print(f"PASSED: Consultation settings returns min_recharge_amount: {data['min_recharge_amount']}")
        print(f"  - Low balance warning: {data.get('low_balance_warning')}")
        print(f"  - Grace period seconds: {data.get('grace_period_seconds')}")


class TestStripePaymentIntentCreation:
    """Test Stripe payment intent creation specifically"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def login_as_devotee(self):
        """Login as devotee and get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            return True
        return False
    
    def test_stripe_intent_has_valid_format(self):
        """Stripe payment intent should have valid format"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        response = self.session.post(f"{BASE_URL}/api/wallet/create-recharge-intent", json={"amount": 100})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        if "client_secret" in data:
            # Validate Stripe client_secret format (pi_xxx_secret_xxx)
            client_secret = data["client_secret"]
            assert client_secret.startswith("pi_"), f"Client secret should start with 'pi_': {client_secret[:20]}"
            assert "_secret_" in client_secret, f"Client secret should contain '_secret_': {client_secret[:30]}"
            
            # Validate payment_intent_id format
            payment_intent_id = data.get("payment_intent_id", "")
            assert payment_intent_id.startswith("pi_"), f"Payment intent ID should start with 'pi_': {payment_intent_id}"
            
            print("PASSED: Stripe payment intent has valid format")
            print(f"  - Payment Intent ID: {payment_intent_id}")
        else:
            pytest.skip("Stripe not configured - skipping Stripe-specific tests")


class TestRazorpayOrderCreation:
    """Test Razorpay order creation specifically"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def login_as_devotee(self):
        """Login as devotee and get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            return True
        return False
    
    def test_razorpay_order_has_valid_format(self):
        """Razorpay order should have valid format"""
        assert self.login_as_devotee(), "Failed to login as devotee"
        
        response = self.session.post(f"{BASE_URL}/api/wallet/create-recharge-intent", json={"amount": 100})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        if "razorpay_order_id" in data:
            # Validate Razorpay order_id format (order_xxx)
            order_id = data["razorpay_order_id"]
            assert order_id.startswith("order_"), f"Order ID should start with 'order_': {order_id}"
            
            # Validate razorpay_key format (rzp_xxx)
            razorpay_key = data.get("razorpay_key", "")
            assert razorpay_key.startswith("rzp_"), f"Razorpay key should start with 'rzp_': {razorpay_key}"
            
            print("PASSED: Razorpay order has valid format")
            print(f"  - Order ID: {order_id}")
            print(f"  - Razorpay Key: {razorpay_key}")
        else:
            pytest.skip("Razorpay not configured - skipping Razorpay-specific tests")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
