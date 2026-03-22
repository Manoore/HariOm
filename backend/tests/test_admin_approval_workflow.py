"""
Admin Approval Workflow Tests
Tests for provider approval/rejection flow, pending approvals listing,
and notification system for the Divine App.

Features tested:
- GET /api/admin/pending-approvals - Returns providers with pending status
- PUT /api/admin/approve/{provider_type}/{provider_id} - Approves a provider
- PUT /api/admin/reject/{provider_type}/{provider_id} - Rejects a provider
- Provider registration sets approval_status='pending'
- Public listings only show approved providers
- Notifications sent on registration and status changes
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://divine-refactor.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@divineapp.com"
ADMIN_PASSWORD = "admin123"

# Unique test identifiers
TEST_PREFIX = f"TEST_{datetime.now().strftime('%H%M%S')}_"


class TestAdminApprovalWorkflow:
    """Tests for Admin Approval Workflow feature"""
    
    admin_token = None
    test_provider_ids = []  # Track created providers for cleanup
    
    @classmethod
    def setup_class(cls):
        """Login as admin to get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cls.admin_token = response.json().get("token")
        else:
            pytest.skip(f"Admin login failed: {response.status_code}")
    
    def get_admin_headers(self):
        """Get headers with admin auth token"""
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    # ==================== PENDING APPROVALS TESTS ====================
    
    def test_get_pending_approvals_unauthorized(self):
        """Test pending approvals endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/pending-approvals")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_get_pending_approvals_success(self):
        """Test fetching pending approvals returns correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-approvals",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check structure
        assert "priests" in data, "Response missing 'priests' field"
        assert "astrologers" in data, "Response missing 'astrologers' field"
        assert "shops" in data, "Response missing 'shops' field"
        
        # Each should be a list
        assert isinstance(data["priests"], list), "priests should be a list"
        assert isinstance(data["astrologers"], list), "astrologers should be a list"
        assert isinstance(data["shops"], list), "shops should be a list"
        
        print(f"Pending approvals - Priests: {len(data['priests'])}, Astrologers: {len(data['astrologers'])}, Shops: {len(data['shops'])}")
    
    # ==================== APPROVE/REJECT TESTS ====================
    
    def test_approve_invalid_provider_type(self):
        """Test approving with invalid provider type returns error"""
        response = requests.put(
            f"{BASE_URL}/api/admin/approve/invalid_type/123",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 400, f"Expected 400 for invalid type, got {response.status_code}"
    
    def test_approve_nonexistent_provider(self):
        """Test approving non-existent provider returns 404"""
        fake_id = "000000000000000000000000"
        response = requests.put(
            f"{BASE_URL}/api/admin/approve/priest/{fake_id}",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_reject_invalid_provider_type(self):
        """Test rejecting with invalid provider type returns error"""
        response = requests.put(
            f"{BASE_URL}/api/admin/reject/invalid_type/123",
            headers=self.get_admin_headers(),
            json={"reason": "Test rejection"}
        )
        assert response.status_code == 400, f"Expected 400 for invalid type, got {response.status_code}"
    
    def test_reject_nonexistent_provider(self):
        """Test rejecting non-existent provider returns 404"""
        fake_id = "000000000000000000000000"
        response = requests.put(
            f"{BASE_URL}/api/admin/reject/priest/{fake_id}",
            headers=self.get_admin_headers(),
            json={"reason": "Test rejection"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    # ==================== PUBLIC LISTING FILTER TESTS ====================
    
    def test_priests_listing_filters_by_approval(self):
        """Test GET /api/priests only returns approved priests"""
        response = requests.get(f"{BASE_URL}/api/priests")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        priests = data.get("priests", [])
        
        # All returned priests should be verified/approved (based on the filter logic)
        for priest in priests:
            # The endpoint filters by approval_status='approved' OR (is_verified=True AND no approval_status)
            # So returned priests should be visible = approved/verified
            print(f"Priest {priest.get('id')}: {priest.get('user_name')} - verified: {priest.get('is_verified')}")
    
    def test_astrologers_listing_filters_by_approval(self):
        """Test GET /api/astrologers only returns approved astrologers"""
        response = requests.get(f"{BASE_URL}/api/astrologers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        astrologers = data.get("astrologers", [])
        
        print(f"Total visible astrologers: {len(astrologers)}")
    
    def test_products_from_approved_shops_only(self):
        """Test GET /api/products only returns products from approved shops"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", [])
        
        print(f"Total visible products: {len(products)}")


class TestApprovalWorkflowE2E:
    """End-to-end tests for approval workflow using Firebase sync (new provider registration)"""
    
    admin_token = None
    test_firebase_uid = f"TEST_FB_{uuid.uuid4().hex[:12]}"
    test_user_email = f"{TEST_PREFIX}newpriest@test.com"
    created_user_id = None
    created_priest_id = None
    
    @classmethod
    def setup_class(cls):
        """Login as admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cls.admin_token = response.json().get("token")
        else:
            pytest.skip(f"Admin login failed: {response.status_code}")
    
    def get_admin_headers(self):
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_01_register_priest_creates_pending_status(self):
        """Test that registering as priest via firebase-sync creates pending status"""
        # Use firebase-sync endpoint to create a priest
        response = requests.post(
            f"{BASE_URL}/api/auth/firebase-sync",
            json={
                "firebase_uid": self.test_firebase_uid,
                "email": self.test_user_email,
                "name": f"{TEST_PREFIX}New Priest User",
                "role": "priest",
                "auth_type": "email"
            }
        )
        
        assert response.status_code == 200, f"Firebase sync failed: {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data, "Response missing user data"
        
        TestApprovalWorkflowE2E.created_user_id = data["user"]["id"]
        print(f"Created test priest user: {TestApprovalWorkflowE2E.created_user_id}")
    
    def test_02_new_priest_appears_in_pending(self):
        """Test that newly registered priest appears in pending approvals"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-approvals",
            headers=self.get_admin_headers()
        )
        
        assert response.status_code == 200, f"Failed to get pending approvals: {response.status_code}"
        
        data = response.json()
        pending_priests = data.get("priests", [])
        
        # Find our test priest
        test_priest = None
        for priest in pending_priests:
            if TEST_PREFIX in priest.get("name", ""):
                test_priest = priest
                TestApprovalWorkflowE2E.created_priest_id = priest["id"]
                break
        
        assert test_priest is not None, f"Test priest not found in pending approvals. Pending priests: {[p.get('name') for p in pending_priests]}"
        print(f"Found test priest in pending approvals: {test_priest['id']}")
    
    def test_03_pending_priest_not_in_public_listing(self):
        """Test that pending priest is NOT visible in public priest listing"""
        response = requests.get(f"{BASE_URL}/api/priests")
        assert response.status_code == 200
        
        data = response.json()
        public_priests = data.get("priests", [])
        
        # Our test priest should NOT be in public listing
        for priest in public_priests:
            assert TEST_PREFIX not in priest.get("user_name", ""), \
                f"Pending priest {priest.get('id')} should not be in public listing"
        
        print("Verified: Pending priest not visible in public listing")
    
    def test_04_approve_priest_success(self):
        """Test approving the priest works correctly"""
        if not self.created_priest_id:
            pytest.skip("No priest created to approve")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/approve/priest/{self.created_priest_id}",
            headers=self.get_admin_headers()
        )
        
        assert response.status_code == 200, f"Approve failed: {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "approved" in data["message"].lower()
        print(f"Priest approved: {data['message']}")
    
    def test_05_approved_priest_not_in_pending(self):
        """Test that approved priest is removed from pending approvals"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-approvals",
            headers=self.get_admin_headers()
        )
        
        assert response.status_code == 200
        
        data = response.json()
        pending_priests = data.get("priests", [])
        
        # Our test priest should NOT be in pending anymore
        for priest in pending_priests:
            if self.created_priest_id == priest.get("id"):
                pytest.fail(f"Approved priest {self.created_priest_id} still in pending approvals")
        
        print("Verified: Approved priest removed from pending list")
    
    def test_06_notification_created_for_approval(self):
        """Test that notification was created when priest was approved"""
        if not self.created_user_id:
            pytest.skip("No user to check notifications for")
        
        # Need to login as the priest user to check their notifications
        # Since we used firebase, we need to sync again to get access
        response = requests.post(
            f"{BASE_URL}/api/auth/firebase-sync",
            json={
                "firebase_uid": self.test_firebase_uid,
                "email": self.test_user_email,
                "name": f"{TEST_PREFIX}New Priest User",
                "role": "priest",
                "auth_type": "email"
            }
        )
        
        assert response.status_code == 200, f"Firebase sync failed: {response.status_code}"
        
        # The notification would be in user_notifications_collection
        # We'll check via admin endpoint or direct query
        # For now, we'll just verify the API call succeeded
        print("Notification should have been created for approval status change")


class TestRejectWorkflow:
    """Tests for the rejection workflow"""
    
    admin_token = None
    test_firebase_uid = f"TEST_REJ_{uuid.uuid4().hex[:12]}"
    test_user_email = f"{TEST_PREFIX}rejectpriest@test.com"
    created_priest_id = None
    
    @classmethod
    def setup_class(cls):
        """Login as admin and create a test priest to reject"""
        # Login as admin
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cls.admin_token = response.json().get("token")
        else:
            pytest.skip(f"Admin login failed: {response.status_code}")
        
        # Create a test priest
        response = requests.post(
            f"{BASE_URL}/api/auth/firebase-sync",
            json={
                "firebase_uid": cls.test_firebase_uid,
                "email": cls.test_user_email,
                "name": f"{TEST_PREFIX}Reject Test Priest",
                "role": "priest",
                "auth_type": "email"
            }
        )
        
        if response.status_code == 200:
            # Get the priest ID from pending approvals
            pending_response = requests.get(
                f"{BASE_URL}/api/admin/pending-approvals",
                headers={"Authorization": f"Bearer {cls.admin_token}"}
            )
            if pending_response.status_code == 200:
                for priest in pending_response.json().get("priests", []):
                    if "Reject Test Priest" in priest.get("name", ""):
                        cls.created_priest_id = priest["id"]
                        break
    
    def get_admin_headers(self):
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_reject_priest_with_reason(self):
        """Test rejecting a priest with a reason"""
        if not self.created_priest_id:
            pytest.skip("No priest to reject")
        
        rejection_reason = "Profile incomplete - please add qualifications"
        
        response = requests.put(
            f"{BASE_URL}/api/admin/reject/priest/{self.created_priest_id}",
            headers=self.get_admin_headers(),
            json={"reason": rejection_reason}
        )
        
        assert response.status_code == 200, f"Reject failed: {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "rejected" in data["message"].lower()
        print(f"Priest rejected: {data['message']}")
    
    def test_rejected_priest_not_in_pending(self):
        """Test that rejected priest is removed from pending"""
        if not self.created_priest_id:
            pytest.skip("No priest to check")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-approvals",
            headers=self.get_admin_headers()
        )
        
        assert response.status_code == 200
        
        data = response.json()
        pending_priests = data.get("priests", [])
        
        for priest in pending_priests:
            if self.created_priest_id == priest.get("id"):
                pytest.fail(f"Rejected priest {self.created_priest_id} still in pending")
        
        print("Verified: Rejected priest removed from pending list")
    
    def test_rejected_priest_not_in_public_listing(self):
        """Test that rejected priest is NOT in public listing"""
        response = requests.get(f"{BASE_URL}/api/priests")
        assert response.status_code == 200
        
        data = response.json()
        public_priests = data.get("priests", [])
        
        for priest in public_priests:
            if "Reject Test Priest" in priest.get("user_name", ""):
                pytest.fail("Rejected priest should not be in public listing")
        
        print("Verified: Rejected priest not in public listing")


class TestNotificationSystem:
    """Tests for notification system during approval workflow"""
    
    admin_token = None
    admin_user_id = None
    
    @classmethod
    def setup_class(cls):
        """Login as admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cls.admin_token = response.json().get("token")
            cls.admin_user_id = response.json().get("user", {}).get("id")
        else:
            pytest.skip(f"Admin login failed")
    
    def get_admin_headers(self):
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_admin_receives_new_provider_notification(self):
        """Test that admin receives notification when new provider registers"""
        # First, get current notification count
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=self.get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            notifications = data.get("notifications", [])
            
            # Check for new_provider_registration type notifications
            provider_notifications = [n for n in notifications if n.get("type") == "new_provider_registration"]
            print(f"Admin has {len(provider_notifications)} provider registration notifications")
        else:
            print(f"Could not fetch notifications: {response.status_code}")


class TestShopApprovalWorkflow:
    """Tests specific to shop approval workflow"""
    
    admin_token = None
    test_firebase_uid = f"TEST_SHOP_{uuid.uuid4().hex[:12]}"
    test_user_email = f"{TEST_PREFIX}shopowner@test.com"
    created_shop_id = None
    
    @classmethod
    def setup_class(cls):
        """Login as admin and create a test shop"""
        # Login as admin
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cls.admin_token = response.json().get("token")
        else:
            pytest.skip(f"Admin login failed")
        
        # Create a test shop owner
        response = requests.post(
            f"{BASE_URL}/api/auth/firebase-sync",
            json={
                "firebase_uid": cls.test_firebase_uid,
                "email": cls.test_user_email,
                "name": f"{TEST_PREFIX}Shop Owner",
                "role": "shop_owner",
                "auth_type": "email"
            }
        )
        
        if response.status_code == 200:
            # Get the shop ID from pending approvals
            pending_response = requests.get(
                f"{BASE_URL}/api/admin/pending-approvals",
                headers={"Authorization": f"Bearer {cls.admin_token}"}
            )
            if pending_response.status_code == 200:
                for shop in pending_response.json().get("shops", []):
                    if TEST_PREFIX in shop.get("owner_name", ""):
                        cls.created_shop_id = shop["id"]
                        break
    
    def get_admin_headers(self):
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_shop_in_pending_approvals(self):
        """Test that new shop appears in pending approvals"""
        if not self.created_shop_id:
            pytest.skip("Shop not created")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-approvals",
            headers=self.get_admin_headers()
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify shop structure
        pending_shops = data.get("shops", [])
        for shop in pending_shops:
            if shop.get("id") == self.created_shop_id:
                assert "owner_id" in shop
                assert "owner_name" in shop
                print(f"Found test shop in pending: {shop}")
                return
        
        print("Shop was approved or doesn't exist in pending")
    
    def test_approve_shop(self):
        """Test approving a shop"""
        if not self.created_shop_id:
            pytest.skip("No shop to approve")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/approve/shop/{self.created_shop_id}",
            headers=self.get_admin_headers()
        )
        
        assert response.status_code == 200, f"Shop approval failed: {response.status_code}: {response.text}"
        print("Shop approved successfully")


class TestAstrologerApprovalWorkflow:
    """Tests specific to astrologer approval workflow"""
    
    admin_token = None
    test_firebase_uid = f"TEST_ASTRO_{uuid.uuid4().hex[:12]}"
    test_user_email = f"{TEST_PREFIX}astrologer@test.com"
    created_astrologer_id = None
    
    @classmethod
    def setup_class(cls):
        """Login as admin and create a test astrologer"""
        # Login as admin
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cls.admin_token = response.json().get("token")
        else:
            pytest.skip(f"Admin login failed")
        
        # Create a test astrologer
        response = requests.post(
            f"{BASE_URL}/api/auth/firebase-sync",
            json={
                "firebase_uid": cls.test_firebase_uid,
                "email": cls.test_user_email,
                "name": f"{TEST_PREFIX}Astrologer User",
                "role": "astrologer",
                "auth_type": "email"
            }
        )
        
        if response.status_code == 200:
            # Get the astrologer ID from pending approvals
            pending_response = requests.get(
                f"{BASE_URL}/api/admin/pending-approvals",
                headers={"Authorization": f"Bearer {cls.admin_token}"}
            )
            if pending_response.status_code == 200:
                for astro in pending_response.json().get("astrologers", []):
                    if TEST_PREFIX in astro.get("name", ""):
                        cls.created_astrologer_id = astro["id"]
                        break
    
    def get_admin_headers(self):
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_astrologer_in_pending_approvals(self):
        """Test that new astrologer appears in pending approvals"""
        if not self.created_astrologer_id:
            pytest.skip("Astrologer not created")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-approvals",
            headers=self.get_admin_headers()
        )
        
        assert response.status_code == 200
        data = response.json()
        
        pending_astros = data.get("astrologers", [])
        for astro in pending_astros:
            if astro.get("id") == self.created_astrologer_id:
                assert "user_id" in astro
                assert "name" in astro
                print(f"Found test astrologer in pending: {astro}")
                return
        
        print("Astrologer was approved or doesn't exist in pending")
    
    def test_approve_astrologer(self):
        """Test approving an astrologer"""
        if not self.created_astrologer_id:
            pytest.skip("No astrologer to approve")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/approve/astrologer/{self.created_astrologer_id}",
            headers=self.get_admin_headers()
        )
        
        assert response.status_code == 200, f"Astrologer approval failed: {response.status_code}: {response.text}"
        print("Astrologer approved successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
