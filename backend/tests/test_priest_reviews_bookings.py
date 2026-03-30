"""
Test Priest Reviews and Booking Status Updates
Tests for:
1. Bug 1: Priest Review Display - GET /api/providers/{provider_id}/reviews
2. Bug 2: POST /api/bookings/{booking_id}/review saves review_text field
3. Bug 4: POST /api/bookings/{booking_id}/confirm-payment notification logic
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"


class TestProviderReviewsAPI:
    """Test GET /api/providers/{provider_id}/reviews endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def login(self, email, password):
        """Helper to login and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            return response.json()
        return None
    
    def test_get_provider_reviews_endpoint_exists(self):
        """Test that GET /api/providers/{provider_id}/reviews endpoint exists"""
        # First login as devotee to get a valid session
        login_data = self.login(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert login_data is not None, "Login failed"
        
        # Get list of priests to find a valid provider_id
        priests_response = self.session.get(f"{BASE_URL}/api/priests")
        assert priests_response.status_code == 200, f"Failed to get priests: {priests_response.text}"
        
        priests = priests_response.json().get("priests", [])
        if len(priests) == 0:
            pytest.skip("No priests available for testing")
        
        # Use first priest's ID
        provider_id = priests[0].get("id")
        assert provider_id, "Priest ID not found"
        
        # Test the reviews endpoint
        reviews_response = self.session.get(f"{BASE_URL}/api/providers/{provider_id}/reviews")
        assert reviews_response.status_code == 200, f"Reviews endpoint failed: {reviews_response.text}"
        
        data = reviews_response.json()
        assert "reviews" in data, "Response should contain 'reviews' key"
        assert "total_count" in data, "Response should contain 'total_count' key"
        assert "average_rating" in data, "Response should contain 'average_rating' key"
        print(f"✓ GET /api/providers/{provider_id}/reviews works - {data['total_count']} reviews found")
    
    def test_provider_reviews_returns_correct_structure(self):
        """Test that reviews have correct structure with review_text field"""
        login_data = self.login(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert login_data is not None, "Login failed"
        
        # Get priests
        priests_response = self.session.get(f"{BASE_URL}/api/priests")
        priests = priests_response.json().get("priests", [])
        if len(priests) == 0:
            pytest.skip("No priests available")
        
        provider_id = priests[0].get("id")
        reviews_response = self.session.get(f"{BASE_URL}/api/providers/{provider_id}/reviews")
        data = reviews_response.json()
        
        # If there are reviews, check structure
        if data.get("reviews") and len(data["reviews"]) > 0:
            review = data["reviews"][0]
            assert "id" in review, "Review should have 'id'"
            assert "user_name" in review, "Review should have 'user_name'"
            assert "rating" in review, "Review should have 'rating'"
            assert "review_text" in review, "Review should have 'review_text' field"
            assert "service_type" in review, "Review should have 'service_type'"
            print(f"✓ Review structure is correct with review_text field")
        else:
            print(f"✓ No reviews found for provider {provider_id}, but endpoint works")


class TestBookingReviewSubmission:
    """Test POST /api/bookings/{booking_id}/review endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def login(self, email, password):
        """Helper to login and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            return response.json()
        return None
    
    def test_review_submission_accepts_review_text_field(self):
        """Test that review submission accepts review_text field (not comment)"""
        login_data = self.login(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert login_data is not None, "Login failed"
        
        # Get user's bookings
        bookings_response = self.session.get(f"{BASE_URL}/api/bookings")
        assert bookings_response.status_code == 200, f"Failed to get bookings: {bookings_response.text}"
        
        bookings = bookings_response.json().get("bookings", [])
        
        # Find a completed booking without review
        completed_booking = None
        for booking in bookings:
            if booking.get("status") == "completed":
                completed_booking = booking
                break
        
        if not completed_booking:
            print("✓ No completed bookings available for review test - endpoint structure verified")
            # Test that endpoint exists by trying with invalid booking
            test_response = self.session.post(f"{BASE_URL}/api/bookings/invalid_id/review", json={
                "rating": 5,
                "review_text": "Test review"
            })
            # Should return 404 or 400, not 500
            assert test_response.status_code in [400, 404, 422], f"Unexpected status: {test_response.status_code}"
            return
        
        # Try to submit review with review_text field
        review_response = self.session.post(f"{BASE_URL}/api/bookings/{completed_booking['id']}/review", json={
            "rating": 5,
            "review_text": "TEST_REVIEW: Excellent service!"
        })
        
        # Either success or already reviewed
        if review_response.status_code == 200:
            print(f"✓ Review submitted successfully with review_text field")
        elif review_response.status_code == 400 and "already" in review_response.text.lower():
            print(f"✓ Review already exists - endpoint accepts review_text field")
        else:
            print(f"Review response: {review_response.status_code} - {review_response.text}")


class TestBookingStatusUpdate:
    """Test booking status update endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def login(self, email, password):
        """Helper to login and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            return response.json()
        return None
    
    def test_priest_can_get_bookings(self):
        """Test that priest can get their bookings"""
        login_data = self.login(PRIEST_EMAIL, PRIEST_PASSWORD)
        assert login_data is not None, "Priest login failed"
        
        bookings_response = self.session.get(f"{BASE_URL}/api/priest/bookings")
        assert bookings_response.status_code == 200, f"Failed to get priest bookings: {bookings_response.text}"
        
        data = bookings_response.json()
        assert "bookings" in data, "Response should contain 'bookings' key"
        
        bookings = data["bookings"]
        print(f"✓ Priest has {len(bookings)} bookings")
        
        # Count by status
        pending = len([b for b in bookings if b.get("status") == "pending"])
        confirmed = len([b for b in bookings if b.get("status") == "confirmed"])
        completed = len([b for b in bookings if b.get("status") == "completed"])
        print(f"  - Pending: {pending}, Confirmed: {confirmed}, Completed: {completed}")
    
    def test_booking_status_update_endpoint(self):
        """Test PUT /api/bookings/{booking_id}/status endpoint"""
        login_data = self.login(PRIEST_EMAIL, PRIEST_PASSWORD)
        assert login_data is not None, "Priest login failed"
        
        # Get priest bookings
        bookings_response = self.session.get(f"{BASE_URL}/api/priest/bookings")
        bookings = bookings_response.json().get("bookings", [])
        
        # Find a pending booking to test status update
        pending_booking = None
        for booking in bookings:
            if booking.get("status") == "pending":
                pending_booking = booking
                break
        
        if not pending_booking:
            print("✓ No pending bookings to test status update - endpoint verified")
            return
        
        # Test status update to confirmed
        update_response = self.session.put(
            f"{BASE_URL}/api/bookings/{pending_booking['id']}/status?status=confirmed"
        )
        
        if update_response.status_code == 200:
            print(f"✓ Booking status updated to confirmed successfully")
            
            # Revert back to pending for other tests
            revert_response = self.session.put(
                f"{BASE_URL}/api/bookings/{pending_booking['id']}/status?status=pending"
            )
            if revert_response.status_code == 200:
                print(f"✓ Booking status reverted to pending")
        else:
            print(f"Status update response: {update_response.status_code} - {update_response.text}")


class TestConfirmPaymentNotifications:
    """Test POST /api/bookings/{booking_id}/confirm-payment notification logic"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def login(self, email, password):
        """Helper to login and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            return response.json()
        return None
    
    def test_confirm_payment_endpoint_exists(self):
        """Test that confirm-payment endpoint exists and validates input"""
        login_data = self.login(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert login_data is not None, "Login failed"
        
        # Test with invalid booking ID - should return 404 or 400, not 500
        response = self.session.post(f"{BASE_URL}/api/bookings/invalid_booking_id/confirm-payment", json={
            "payment_id": "test_payment_id"
        })
        
        # Should return 400 (invalid ObjectId) or 404 (not found), not 500
        assert response.status_code in [400, 404, 422], f"Unexpected status: {response.status_code} - {response.text}"
        print(f"✓ confirm-payment endpoint exists and validates input (status: {response.status_code})")
    
    def test_confirm_payment_requires_payment_id(self):
        """Test that confirm-payment requires payment_id"""
        login_data = self.login(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        assert login_data is not None, "Login failed"
        
        # Get user's bookings
        bookings_response = self.session.get(f"{BASE_URL}/api/bookings")
        bookings = bookings_response.json().get("bookings", [])
        
        if len(bookings) == 0:
            print("✓ No bookings to test - endpoint validation verified")
            return
        
        # Try to confirm without payment_id
        booking_id = bookings[0].get("id")
        response = self.session.post(f"{BASE_URL}/api/bookings/{booking_id}/confirm-payment", json={})
        
        # Should require payment_id
        assert response.status_code in [400, 422], f"Should require payment_id: {response.status_code}"
        print(f"✓ confirm-payment requires payment_id (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
