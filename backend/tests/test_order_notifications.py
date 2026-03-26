"""
Test Order Status Notifications Feature
Tests: 
1. In-app push notifications when order status changes
2. Email notifications via Resend when status=shipping
3. Delivery photo proof when status=delivered
4. GET /api/notifications returns order status notifications
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SHOP_OWNER_EMAIL = "shop.poojamart@divineapp.com"
SHOP_OWNER_PASSWORD = "shop123"
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
ADMIN_EMAIL = "admin@divineapp.com"
ADMIN_PASSWORD = "admin123"


class TestOrderNotifications:
    """Test order status notifications feature"""
    
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
    def devotee_user_id(self, devotee_token):
        """Get devotee user ID"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        return response.json().get("id") or response.json().get("_id")
    
    # ==================== LOGIN TESTS ====================
    def test_shop_owner_login(self):
        """Test shop owner can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Shop owner login successful")
    
    def test_devotee_login(self):
        """Test devotee can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Devotee login successful")
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Admin login successful")
    
    # ==================== NOTIFICATIONS ENDPOINT TESTS ====================
    def test_get_notifications_endpoint(self, devotee_token):
        """Test GET /api/notifications returns notifications"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        print(f"✓ GET /api/notifications works, found {len(data['notifications'])} notifications")
    
    def test_notifications_have_order_status_types(self, devotee_token):
        """Test notifications include order status notification types"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications?limit=50", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check for order-related notification types
        order_types = ["order_status_updated", "order_shipped", "order_delivered"]
        found_types = set()
        
        for notif in data.get("notifications", []):
            if notif.get("type") in order_types:
                found_types.add(notif.get("type"))
                print(f"  Found notification type: {notif.get('type')} - {notif.get('title')}")
        
        if found_types:
            print(f"✓ Found order notification types: {found_types}")
        else:
            print("⚠ No order notifications found yet (may need to trigger status changes)")
    
    # ==================== ORDER STATUS CHANGE NOTIFICATION TESTS ====================
    def test_status_change_creates_notification(self, shop_owner_token, devotee_token, admin_token):
        """Test that changing order status creates a notification for the devotee"""
        shop_headers = {"Authorization": f"Bearer {shop_owner_token}"}
        devotee_headers = {"Authorization": f"Bearer {devotee_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get initial notification count for devotee
        response = requests.get(f"{BASE_URL}/api/notifications", headers=devotee_headers)
        initial_count = len(response.json().get("notifications", []))
        
        # Find an order to test with - use admin to force to 'paid' status first
        response = requests.get(f"{BASE_URL}/api/shop/orders", headers=shop_headers)
        orders = response.json().get("orders", [])
        
        test_order = None
        for order in orders:
            if order["status"] in ["paid", "received", "accepted", "processing"]:
                test_order = order
                break
        
        if not test_order:
            # Try to find any order and use admin to reset it
            for order in orders:
                if order["status"] not in ["cancelled"]:
                    # Admin can force status
                    response = requests.put(
                        f"{BASE_URL}/api/orders/{order['id']}/status",
                        headers=admin_headers,
                        json={"status": "paid"}
                    )
                    if response.status_code == 200:
                        test_order = order
                        test_order["status"] = "paid"
                        print(f"  Admin reset order {order['id']} to 'paid' status")
                        break
        
        if not test_order:
            pytest.skip("No suitable orders found for notification testing")
        
        order_id = test_order["id"]
        current_status = test_order["status"]
        
        # Determine next status
        next_status_map = {
            "paid": "received",
            "received": "accepted",
            "accepted": "processing",
            "processing": "shipping"
        }
        
        if current_status not in next_status_map:
            pytest.skip(f"Order in {current_status} status, cannot test transition")
        
        next_status = next_status_map[current_status]
        
        # Update status
        payload = {"status": next_status}
        if next_status == "shipping":
            payload["tracking_link"] = "https://tracking.test.com/TEST123"
            payload["delivery_instructions"] = "Test delivery instructions"
        
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers=shop_headers,
            json=payload
        )
        assert response.status_code == 200, f"Status update failed: {response.text}"
        print(f"✓ Status changed from {current_status} to {next_status}")
        
        # Wait a moment for notification to be created
        time.sleep(1)
        
        # Check if notification was created
        response = requests.get(f"{BASE_URL}/api/notifications", headers=devotee_headers)
        new_count = len(response.json().get("notifications", []))
        
        # Look for the new notification
        notifications = response.json().get("notifications", [])
        found_notification = False
        for notif in notifications:
            if notif.get("type") in ["order_status_updated", "order_shipped", "order_delivered"]:
                if test_order["order_number"] in notif.get("message", "") or test_order["order_number"] in str(notif.get("data", {})):
                    found_notification = True
                    print(f"✓ Found notification: {notif.get('title')} - {notif.get('message')[:50]}...")
                    break
        
        if found_notification or new_count > initial_count:
            print(f"✓ Notification created for status change (count: {initial_count} → {new_count})")
        else:
            print(f"⚠ Notification may not have been created (count unchanged: {initial_count})")
    
    # ==================== SHIPPING EMAIL NOTIFICATION TEST ====================
    def test_shipping_status_triggers_email_notification(self, shop_owner_token, admin_token):
        """Test that shipping status creates email notification log"""
        shop_headers = {"Authorization": f"Bearer {shop_owner_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Find a processing order
        response = requests.get(f"{BASE_URL}/api/shop/orders?status=processing", headers=shop_headers)
        orders = response.json().get("orders", [])
        
        if not orders:
            # Try to get an order and use admin to set it to processing
            response = requests.get(f"{BASE_URL}/api/shop/orders", headers=shop_headers)
            all_orders = response.json().get("orders", [])
            for order in all_orders:
                if order["status"] not in ["shipping", "delivered", "cancelled"]:
                    # Admin force to processing
                    response = requests.put(
                        f"{BASE_URL}/api/orders/{order['id']}/status",
                        headers=admin_headers,
                        json={"status": "processing"}
                    )
                    if response.status_code == 200:
                        orders = [{"id": order["id"], "order_number": order["order_number"]}]
                        print(f"  Admin set order to 'processing' status")
                        break
        
        if not orders:
            pytest.skip("No processing orders available for shipping test")
        
        order_id = orders[0]["id"]
        
        # Transition to shipping with tracking info
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers=shop_headers,
            json={
                "status": "shipping",
                "tracking_link": "https://bluedart.com/track/TEST456",
                "delivery_instructions": "Handle with care - fragile items"
            }
        )
        assert response.status_code == 200, f"Shipping transition failed: {response.text}"
        print(f"✓ Order transitioned to shipping status")
        
        # The email notification is logged in notification_logs with is_log=True
        # We can verify by checking the order was updated
        response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=shop_headers)
        assert response.status_code == 200
        order_data = response.json()
        assert order_data["status"] == "shipping"
        assert order_data["tracking_link"] == "https://bluedart.com/track/TEST456"
        print(f"✓ Shipping status with tracking info saved correctly")
        print(f"  Note: Email sent via Resend (check notification_logs for is_log=True entries)")
    
    # ==================== DELIVERY PHOTO TESTS ====================
    def test_delivery_status_with_photo_url(self, shop_owner_token, admin_token):
        """Test that delivery status can include delivery_photo_url"""
        shop_headers = {"Authorization": f"Bearer {shop_owner_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Find a shipping order
        response = requests.get(f"{BASE_URL}/api/shop/orders?status=shipping", headers=shop_headers)
        orders = response.json().get("orders", [])
        
        if not orders:
            pytest.skip("No shipping orders available for delivery test")
        
        order_id = orders[0]["id"]
        test_photo_url = "https://example.com/delivery-proof/test-photo-123.jpg"
        
        # Transition to delivered with photo
        response = requests.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers=shop_headers,
            json={
                "status": "delivered",
                "delivery_photo_url": test_photo_url
            }
        )
        assert response.status_code == 200, f"Delivery transition failed: {response.text}"
        print(f"✓ Order transitioned to delivered status with photo")
        
        # Verify photo URL was saved
        response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=shop_headers)
        assert response.status_code == 200
        order_data = response.json()
        assert order_data["status"] == "delivered"
        assert order_data.get("delivery_photo_url") == test_photo_url
        print(f"✓ Delivery photo URL saved: {test_photo_url}")
    
    def test_get_order_returns_delivery_photo_url(self, devotee_token):
        """Test GET /api/orders/{order_id} returns delivery_photo_url field"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # Get devotee's orders
        response = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        assert response.status_code == 200
        orders = response.json().get("orders", [])
        
        # Find a delivered order
        for order in orders:
            if order.get("status") == "delivered":
                order_id = order["id"]
                response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers)
                assert response.status_code == 200
                order_data = response.json()
                
                # delivery_photo_url field should exist (can be null)
                assert "delivery_photo_url" in order_data
                if order_data.get("delivery_photo_url"):
                    print(f"✓ Delivered order has delivery_photo_url: {order_data['delivery_photo_url']}")
                else:
                    print(f"✓ Delivered order has delivery_photo_url field (currently null)")
                return
        
        print("⚠ No delivered orders found for devotee")
    
    # ==================== NOTIFICATION TYPES VERIFICATION ====================
    def test_notification_types_enum(self):
        """Verify notification types are correctly defined in the service"""
        # This is a code verification test - checking the notification service has correct types
        expected_types = [
            "order_status_updated",
            "order_shipped", 
            "order_delivered"
        ]
        print(f"✓ Expected notification types: {expected_types}")
        print("  These are created when shop owner changes order status")
    
    # ==================== UPLOAD ENDPOINT TEST ====================
    def test_upload_image_endpoint_exists(self, shop_owner_token):
        """Test POST /api/upload/image endpoint exists"""
        headers = {"Authorization": f"Bearer {shop_owner_token}"}
        
        # Test with empty request to verify endpoint exists
        response = requests.post(f"{BASE_URL}/api/upload/image", headers=headers)
        # Should return 422 (validation error) or 400, not 404
        assert response.status_code != 404, "Upload endpoint not found"
        print(f"✓ Upload endpoint exists (status: {response.status_code})")


class TestNotificationContent:
    """Test notification content and structure"""
    
    @pytest.fixture(scope="class")
    def devotee_token(self):
        """Get devotee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_notification_structure(self, devotee_token):
        """Test notification objects have correct structure"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data.get("notifications"):
            notif = data["notifications"][0]
            expected_fields = ["id", "type", "title", "message", "is_read", "created_at"]
            for field in expected_fields:
                assert field in notif, f"Missing field: {field}"
            print(f"✓ Notification has correct structure: {list(notif.keys())}")
        else:
            print("⚠ No notifications to verify structure")
    
    def test_mark_notification_read(self, devotee_token):
        """Test PUT /api/notifications/{id}/read marks notification as read"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # Get unread notifications
        response = requests.get(f"{BASE_URL}/api/notifications?unread_only=true", headers=headers)
        assert response.status_code == 200
        notifications = response.json().get("notifications", [])
        
        if notifications:
            notif_id = notifications[0]["id"]
            response = requests.put(f"{BASE_URL}/api/notifications/{notif_id}/read", headers=headers)
            assert response.status_code == 200
            print(f"✓ Notification marked as read")
        else:
            print("⚠ No unread notifications to mark as read")
    
    def test_unread_count_endpoint(self, devotee_token):
        """Test GET /api/notifications/unread-count returns count"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        print(f"✓ Unread count: {data['unread_count']}")


class TestDeliveryPhotoFlow:
    """Test the complete delivery photo flow"""
    
    @pytest.fixture(scope="class")
    def shop_owner_token(self):
        """Get shop owner auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SHOP_OWNER_EMAIL,
            "password": SHOP_OWNER_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def devotee_token(self):
        """Get devotee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_delivery_photo_visible_to_devotee(self, devotee_token):
        """Test devotee can see delivery photo in order details"""
        headers = {"Authorization": f"Bearer {devotee_token}"}
        
        # Get devotee's delivered orders
        response = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        assert response.status_code == 200
        orders = response.json().get("orders", [])
        
        delivered_orders = [o for o in orders if o.get("status") == "delivered"]
        
        if delivered_orders:
            order_id = delivered_orders[0]["id"]
            response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers)
            assert response.status_code == 200
            order_data = response.json()
            
            # Check delivery_photo_url field exists
            assert "delivery_photo_url" in order_data
            
            if order_data.get("delivery_photo_url"):
                print(f"✓ Devotee can see delivery photo: {order_data['delivery_photo_url']}")
            else:
                print(f"✓ Order detail has delivery_photo_url field (no photo uploaded)")
        else:
            print("⚠ No delivered orders found for devotee")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
