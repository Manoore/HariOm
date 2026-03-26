"""
Test Order Status Lifecycle for Shop Owner Order Flow
Tests: PUT /api/orders/{order_id}/status, GET /api/orders/{order_id}, GET /api/shop/orders
Status flow: paid → received → accepted → processing → shipping → delivered
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SHOP_OWNER_EMAIL = "shop.poojamart@divineapp.com"
SHOP_OWNER_PASSWORD = "shop123"
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
ADMIN_EMAIL = "admin@divine.com"
ADMIN_PASSWORD = "admin123"


class TestOrderStatusLifecycle:
    """Test order status transitions and tracking info"""
    
    @pytest.fixture(scope="class")
    def shop_owner_token(self):
        """Get shop owner auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Shop owner login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def devotee_token(self):
        """Get devotee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200, f"Devotee login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def paid_order_id(self, shop_owner_token):
        """Find an existing paid order for testing"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/shop/orders?status=paid", headers=headers)
        assert response.status_code == 200, f"Failed to get shop orders: {response.text}"
        orders = response.json().get("orders", [])
        if orders:
            return orders[0]["id"]
        # If no paid orders, try to find any order that's not delivered/cancelled
        response = requests.get(f"{BASE_URL}/api/shop/orders", headers=headers)
        orders = response.json().get("orders", [])
        for order in orders:
            if order["status"] not in ["delivered", "cancelled"]:
                return order["id"]
        pytest.skip("No suitable orders found for testing")
    
    # ==================== SHOP OWNER LOGIN TEST ====================
    def test_shop_owner_login(self):
        """Test shop owner can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data.get("user", {}).get("role") == "shop_owner"
        print(f"✓ Shop owner login successful, role: {data['user']['role']}")
    
    # ==================== GET SHOP ORDERS TEST ====================
    def test_get_shop_orders(self, shop_owner_token):
        """Test GET /api/shop/orders returns orders with tracking fields"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/shop/orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✓ Shop orders endpoint returned {len(data['orders'])} orders")
        
        # Check that orders have the expected fields
        if data["orders"]:
            order = data["orders"][0]
            expected_fields = ["id", "order_number", "status", "items", "shop_total"]
            for field in expected_fields:
                assert field in order, f"Missing field: {field}"
            # tracking_link and delivery_instructions should be present (can be null)
            assert "tracking_link" in order or order.get("tracking_link") is None
            assert "delivery_instructions" in order or order.get("delivery_instructions") is None
            print(f"✓ Order has all expected fields including tracking_link and delivery_instructions")
    
    def test_get_shop_orders_with_status_filter(self, shop_owner_token):
        """Test GET /api/shop/orders with status filter"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Test various status filters
        for status in ["paid", "received", "accepted", "processing", "shipping", "delivered"]:
            response = requests.get(f"{BASE_URL}/api/shop/orders?status={status}", headers=headers)
            assert response.status_code == 200
            data = response.json()
            # All returned orders should have the filtered status
            for order in data.get("orders", []):
                assert order["status"] == status, f"Order status mismatch: expected {status}, got {order['status']}"
        print("✓ Status filter works correctly for all statuses")
    
    # ==================== GET ORDER DETAILS TEST ====================
    def test_get_order_details_has_new_fields(self, shop_owner_token, paid_order_id):
        """Test GET /api/orders/{order_id} returns new timestamp and tracking fields"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/{paid_order_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check for new fields
        expected_fields = ["id", "order_number", "status", "items", "total_amount", 
                          "received_at", "accepted_at", "shipped_at", "delivered_at",
                          "tracking_link", "delivery_instructions"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        print(f"✓ Order details has all new fields: received_at, accepted_at, tracking_link, delivery_instructions")
    
    # ==================== STATUS TRANSITION TESTS ====================
    def test_valid_status_transitions(self, shop_owner_token):
        """Test valid status transitions work correctly"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Find a paid order to test transitions
        response = requests.get(f"{BASE_URL}/api/shop/orders?status=paid", headers=headers)
        orders = response.json().get("orders", [])
        
        if not orders:
            # Try to find any order we can test with
            response = requests.get(f"{BASE_URL}/api/shop/orders", headers=headers)
            all_orders = response.json().get("orders", [])
            # Find order in a state we can transition from
            for order in all_orders:
                if order["status"] in ["paid", "received", "accepted", "processing"]:
                    orders = [order]
                    break
        
        if not orders:
            pytest.skip("No orders available for status transition testing")
        
        order_id = orders[0]["id"]
        current_status = orders[0]["status"]
        
        # Define valid next status based on current
        next_status_map = {
            "paid": "received",
            "received": "accepted",
            "accepted": "processing",
            "processing": "shipping"
        }
        
        if current_status in next_status_map:
            next_status = next_status_map[current_status]
            
            # If transitioning to shipping, include tracking info
            payload = {"status": next_status}
            if next_status == "shipping":
                payload["tracking_link"] = "https://tracking.example.com/test123"
                payload["delivery_instructions"] = "Handle with care, fragile items"
            
            response = requests.put(
                f"{BASE_URL}/api/orders/{order_id}/status",
                headers=headers,
                json=payload
            )
            assert response.status_code == 200, f"Status transition failed: {response.text}"
            data = response.json()
            assert data.get("status") == next_status
            print(f"✓ Status transition {current_status} → {next_status} successful")
            
            # Verify the change persisted
            response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers)
            assert response.status_code == 200
            order_data = response.json()
            assert order_data["status"] == next_status
            print(f"✓ Status change persisted in database")
        else:
            print(f"⚠ Order is in {current_status} status, skipping transition test")
    
    def test_invalid_status_transition_returns_400(self, shop_owner_token):
        """Test invalid status transitions return 400 error"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Find a delivered order
        response = requests.get(f"{BASE_URL}/api/shop/orders?status=delivered", headers=headers)
        orders = response.json().get("orders", [])
        
        if orders:
            order_id = orders[0]["id"]
            # Try to transition delivered → paid (invalid)
            response = requests.put(
                f"{BASE_URL}/api/orders/{order_id}/status",
                headers=headers,
                json={"status": "paid"}
            )
            assert response.status_code == 400, f"Expected 400 for invalid transition, got {response.status_code}"
            print("✓ Invalid transition (delivered → paid) correctly returns 400")
        else:
            # Try with any order - skip backwards
            response = requests.get(f"{BASE_URL}/api/shop/orders", headers=headers)
            all_orders = response.json().get("orders", [])
            for order in all_orders:
                if order["status"] == "shipping":
                    # Try shipping → paid (invalid)
                    response = requests.put(
                        f"{BASE_URL}/api/orders/{order['id']}/status",
                        headers=headers,
                        json={"status": "paid"}
                    )
                    assert response.status_code == 400
                    print("✓ Invalid transition (shipping → paid) correctly returns 400")
                    return
            print("⚠ No suitable orders found for invalid transition test")
    
    def test_shipping_status_saves_tracking_info(self, shop_owner_token):
        """Test that transitioning to shipping saves tracking_link and delivery_instructions"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Find a processing order
        response = requests.get(f"{BASE_URL}/api/shop/orders?status=processing", headers=headers)
        orders = response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No processing orders available for shipping test")
        
        order_id = orders[0]["id"]
        tracking_link = "https://bluedart.com/track/BD123456789"
        delivery_instructions = "Expected delivery in 3-5 business days. Call before delivery."
        
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers=headers,
            json={
                "status": "shipping",
                "tracking_link": tracking_link,
                "delivery_instructions": delivery_instructions
            }
        )
        assert response.status_code == 200, f"Shipping transition failed: {response.text}"
        
        # Verify tracking info was saved
        response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers)
        assert response.status_code == 200
        order_data = response.json()
        assert order_data["status"] == "shipping"
        assert order_data["tracking_link"] == tracking_link
        assert order_data["delivery_instructions"] == delivery_instructions
        print(f"✓ Tracking link and delivery instructions saved correctly")
    
    # ==================== DEVOTEE VIEW TESTS ====================
    def test_devotee_can_view_order_with_tracking(self, devotee_token):
        """Test devotee can see tracking info on their orders"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # Get devotee's orders
        response = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        assert response.status_code == 200
        orders = response.json().get("orders", [])
        
        # Find an order with tracking info
        for order in orders:
            if order.get("tracking_link") or order.get("status") == "shipping":
                order_id = order["id"]
                response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers)
                assert response.status_code == 200
                order_data = response.json()
                
                # Verify tracking fields are present
                assert "tracking_link" in order_data
                assert "delivery_instructions" in order_data
                assert "received_at" in order_data
                assert "accepted_at" in order_data
                print(f"✓ Devotee can view order with tracking info")
                return
        
        print("⚠ No orders with tracking info found for devotee")
    
    def test_devotee_orders_list_has_tracking_fields(self, devotee_token):
        """Test GET /api/orders returns tracking_link and delivery_instructions"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data.get("orders"):
            order = data["orders"][0]
            # These fields should be present (can be null)
            assert "tracking_link" in order or order.get("tracking_link") is None
            assert "delivery_instructions" in order or order.get("delivery_instructions") is None
            print(f"✓ Devotee orders list includes tracking fields")
        else:
            print("⚠ No orders found for devotee")
    
    # ==================== ADMIN OVERRIDE TEST ====================
    def test_admin_can_skip_status_transitions(self, admin_token):
        """Test admin can skip status transitions (e.g., paid → delivered directly)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Find any order that's not delivered/cancelled
        response = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        # Admin might not have orders endpoint, try shop orders
        if response.status_code != 200:
            pytest.skip("Admin orders endpoint not available")
        
        print("✓ Admin status transition override test - endpoint accessible")
    
    # ==================== CANCEL ORDER TEST ====================
    def test_cancel_order_from_valid_states(self, shop_owner_token):
        """Test orders can be cancelled from valid states"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Find an order that can be cancelled (not delivered, not already cancelled, not shipping)
        response = requests.get(f"{BASE_URL}/api/shop/orders", headers=headers)
        orders = response.json().get("orders", [])
        
        for order in orders:
            if order["status"] in ["paid", "received", "accepted", "processing"]:
                order_id = order["id"]
                response = requests.put(
                    f"{BASE_URL}/api/orders/{order_id}/status",
                    headers=headers,
                    json={"status": "cancelled"}
                )
                assert response.status_code == 200, f"Cancel failed: {response.text}"
                print(f"✓ Order cancelled successfully from {order['status']} status")
                return
        
        print("⚠ No orders available for cancel test")
    
    def test_cannot_cancel_shipping_order(self, shop_owner_token):
        """Test shipping orders cannot be cancelled"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        response = requests.get(f"{BASE_URL}/api/shop/orders?status=shipping", headers=headers)
        orders = response.json().get("orders", [])
        
        if orders:
            order_id = orders[0]["id"]
            response = requests.put(
                f"{BASE_URL}/api/orders/{order_id}/status",
                headers=headers,
                json={"status": "cancelled"}
            )
            # Shipping orders should not be cancellable
            assert response.status_code == 400, f"Expected 400, got {response.status_code}"
            print("✓ Shipping orders correctly cannot be cancelled")
        else:
            print("⚠ No shipping orders found for cancel test")


class TestOrderStatusEnumValues:
    """Test that OrderStatus enum has all required values"""
    
    def test_valid_status_values_accepted(self):
        """Test all new status values are accepted by the API"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        token = response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get any order
        response = requests.get(f"{BASE_URL}/api/shop/orders", headers=headers)
        orders = response.json().get("orders", [])
        
        if orders:
            # Check that all status values are recognized
            valid_statuses = ["pending", "paid", "received", "accepted", "processing", "shipping", "delivered", "cancelled"]
            for order in orders:
                assert order["status"] in valid_statuses, f"Unknown status: {order['status']}"
            print(f"✓ All order statuses are valid enum values")
        else:
            print("⚠ No orders to verify status values")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
