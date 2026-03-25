"""
Test Order Tracking and Stripe Webhook Features
Tests:
1. POST /api/webhooks/stripe - Stripe webhook endpoint
2. GET /api/orders/{order_id} - Order detail with status_history, paid_at, shipped_at, delivered_at, tracking_number, tracking_url, order_number
3. GET /api/orders - Orders list with order_number for each order
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"


@pytest.fixture(scope="module")
def devotee_token():
    """Get authentication token for devotee user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": DEVOTEE_EMAIL,
        "password": DEVOTEE_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Devotee authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def authenticated_client(devotee_token):
    """Session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {devotee_token}"
    })
    return session


class TestStripeWebhook:
    """Test Stripe webhook endpoint"""
    
    def test_webhook_endpoint_exists(self):
        """Test that POST /api/webhooks/stripe endpoint exists and returns {status: ok}"""
        # Send a minimal payload - without signature verification it should still process
        response = requests.post(
            f"{BASE_URL}/api/webhooks/stripe",
            json={"type": "test_event", "data": {"object": {}}},
            headers={"Content-Type": "application/json"}
        )
        # Should return 200 with {status: ok} or 400 for invalid payload
        # The endpoint exists if we don't get 404
        assert response.status_code != 404, f"Webhook endpoint not found: {response.status_code}"
        print(f"Webhook endpoint response: {response.status_code} - {response.text}")
        
        # If no webhook secret is configured, it should process the event
        if response.status_code == 200:
            data = response.json()
            assert data.get("status") == "ok", f"Expected status: ok, got: {data}"
            print("PASS: Webhook endpoint returns {status: ok}")


class TestOrderDetailAPI:
    """Test order detail API returns all required fields"""
    
    def test_orders_list_has_order_number(self, authenticated_client):
        """Test GET /api/orders returns order_number for each order"""
        response = authenticated_client.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200, f"Failed to get orders: {response.status_code}"
        
        data = response.json()
        orders = data.get("orders", [])
        print(f"Found {len(orders)} orders")
        
        if len(orders) > 0:
            first_order = orders[0]
            assert "order_number" in first_order, f"order_number missing from order list item. Keys: {first_order.keys()}"
            assert "id" in first_order, f"id missing from order list item"
            print(f"PASS: Order list item has order_number: {first_order.get('order_number')}")
            return first_order["id"]
        else:
            print("No orders found for devotee user")
            pytest.skip("No orders to test")
    
    def test_order_detail_has_tracking_fields(self, authenticated_client):
        """Test GET /api/orders/{order_id} returns status_history and tracking fields"""
        # First get an order ID
        response = authenticated_client.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        
        orders = response.json().get("orders", [])
        if len(orders) == 0:
            pytest.skip("No orders to test")
        
        order_id = orders[0]["id"]
        print(f"Testing order detail for order_id: {order_id}")
        
        # Get order detail
        detail_response = authenticated_client.get(f"{BASE_URL}/api/orders/{order_id}")
        assert detail_response.status_code == 200, f"Failed to get order detail: {detail_response.status_code}"
        
        order = detail_response.json()
        print(f"Order detail keys: {order.keys()}")
        
        # Check required fields
        required_fields = ["id", "order_number", "status_history", "paid_at", "shipped_at", "delivered_at", "tracking_number", "tracking_url"]
        missing_fields = []
        for field in required_fields:
            if field not in order:
                missing_fields.append(field)
            else:
                print(f"  {field}: {order.get(field)}")
        
        assert len(missing_fields) == 0, f"Missing fields in order detail: {missing_fields}"
        print("PASS: Order detail has all required tracking fields")
    
    def test_order_detail_status_history_structure(self, authenticated_client):
        """Test that status_history is an array with proper structure"""
        response = authenticated_client.get(f"{BASE_URL}/api/orders")
        orders = response.json().get("orders", [])
        if len(orders) == 0:
            pytest.skip("No orders to test")
        
        order_id = orders[0]["id"]
        detail_response = authenticated_client.get(f"{BASE_URL}/api/orders/{order_id}")
        order = detail_response.json()
        
        status_history = order.get("status_history", [])
        assert isinstance(status_history, list), f"status_history should be a list, got: {type(status_history)}"
        print(f"status_history has {len(status_history)} entries")
        
        # If there are entries, check structure
        if len(status_history) > 0:
            entry = status_history[0]
            assert "status" in entry, f"status_history entry missing 'status' field"
            assert "timestamp" in entry, f"status_history entry missing 'timestamp' field"
            print(f"PASS: status_history entry structure: {entry}")
        else:
            print("Note: status_history is empty (order created before tracking feature)")


class TestOrderNumberFormat:
    """Test order_number format"""
    
    def test_order_number_format(self, authenticated_client):
        """Test that order_number is last 8 chars of ID in uppercase"""
        response = authenticated_client.get(f"{BASE_URL}/api/orders")
        orders = response.json().get("orders", [])
        if len(orders) == 0:
            pytest.skip("No orders to test")
        
        for order in orders[:3]:  # Check first 3 orders
            order_id = order["id"]
            order_number = order.get("order_number", "")
            expected_number = order_id[-8:].upper()
            
            print(f"Order ID: {order_id}, order_number: {order_number}, expected: {expected_number}")
            assert order_number == expected_number, f"order_number mismatch: got {order_number}, expected {expected_number}"
        
        print("PASS: order_number format is correct (last 8 chars of ID, uppercase)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
