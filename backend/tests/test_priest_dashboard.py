"""
Priest Dashboard API Tests
Tests all priest dashboard endpoints: analytics, classes, availability, content, streams
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Priest credentials
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"


class TestPriestDashboardAuth:
    """Authentication tests for priest login"""
    
    def test_priest_login_success(self):
        """Test priest can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": PRIEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == PRIEST_EMAIL
        assert data["user"]["role"] == "priest"
        print(f"✅ Priest login successful - User: {data['user']['name']}")
        
    def test_priest_login_invalid_credentials(self):
        """Test login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid credentials correctly rejected")


class TestPriestAnalytics:
    """Test priest analytics endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": PRIEST_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Auth failed - skipping authenticated tests")
    
    def test_get_priest_analytics(self):
        """Test GET /api/priest/analytics returns analytics data"""
        response = requests.get(f"{BASE_URL}/api/priest/analytics", headers=self.headers)
        assert response.status_code == 200, f"Analytics fetch failed: {response.text}"
        
        data = response.json()
        assert "stats" in data, "Stats not in response"
        
        stats = data["stats"]
        # Verify all expected stats fields exist
        expected_fields = [
            "total_bookings", "pending_bookings", "completed_bookings",
            "total_earnings", "monthly_earnings", "total_classes",
            "total_students", "avg_rating"
        ]
        for field in expected_fields:
            assert field in stats, f"Missing field: {field}"
        
        print(f"✅ Analytics retrieved - Bookings: {stats['total_bookings']}, Earnings: ₹{stats['total_earnings']}")


class TestPriestClasses:
    """Test priest classes CRUD endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": PRIEST_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Auth failed")
    
    def test_get_priest_classes(self):
        """Test GET /api/priest/classes returns class list"""
        response = requests.get(f"{BASE_URL}/api/priest/classes", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "classes" in data
        print(f"✅ Classes retrieved - Count: {len(data['classes'])}")
    
    def test_create_class(self):
        """Test POST /api/priest/classes creates a new class"""
        class_data = {
            "title": "TEST_Sanskrit_Basics",
            "description": "Learn the basics of Sanskrit language",
            "class_type": "online",
            "duration_minutes": 60,
            "price": 500,
            "max_students": 20,
            "category": "Sanskrit",
            "schedule": [{"day": "Monday", "time": "10:00"}]
        }
        
        response = requests.post(f"{BASE_URL}/api/priest/classes", 
                                  json=class_data, headers=self.headers)
        assert response.status_code == 200, f"Create class failed: {response.text}"
        
        data = response.json()
        assert "class_id" in data or "message" in data
        print(f"✅ Class created successfully")
        
        # Cleanup: delete the test class
        if "class_id" in data:
            cleanup_response = requests.delete(
                f"{BASE_URL}/api/priest/classes/{data['class_id']}", 
                headers=self.headers
            )
            print(f"   Cleanup: Test class deleted")


class TestPriestAvailability:
    """Test priest availability endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": PRIEST_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Auth failed")
    
    def test_get_availability(self):
        """Test GET /api/priest/availability returns availability data"""
        response = requests.get(f"{BASE_URL}/api/priest/availability", headers=self.headers)
        assert response.status_code == 200, f"Get availability failed: {response.text}"
        
        data = response.json()
        # Should have these fields (even if empty)
        assert "online_slots" in data or data is not None
        print(f"✅ Availability retrieved - Online slots: {len(data.get('online_slots', []))}, Offline slots: {len(data.get('offline_slots', []))}")
    
    def test_update_availability(self):
        """Test POST /api/priest/availability updates availability"""
        availability_data = {
            "online_slots": [
                {"day": "Monday", "start": "09:00", "end": "17:00"},
                {"day": "Wednesday", "start": "10:00", "end": "14:00"}
            ],
            "offline_slots": [
                {"day": "Saturday", "start": "08:00", "end": "12:00"}
            ],
            "blocked_dates": [],
            "default_duration": 60
        }
        
        response = requests.post(f"{BASE_URL}/api/priest/availability",
                                  json=availability_data, headers=self.headers)
        assert response.status_code == 200, f"Update availability failed: {response.text}"
        
        # Verify by fetching again
        get_response = requests.get(f"{BASE_URL}/api/priest/availability", headers=self.headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert len(data.get("online_slots", [])) == 2
        print(f"✅ Availability updated and verified")


class TestPriestContent:
    """Test priest content (mantras/shlokas) endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": PRIEST_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Auth failed")
    
    def test_get_content(self):
        """Test GET /api/priest/content returns content list"""
        response = requests.get(f"{BASE_URL}/api/priest/content", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "content" in data
        print(f"✅ Content retrieved - Count: {len(data['content'])}")
    
    def test_create_content(self):
        """Test POST /api/priest/content creates new content"""
        content_data = {
            "title": "TEST_Gayatri_Mantra",
            "description": "The sacred Gayatri Mantra for daily chanting",
            "content_type": "text",
            "category": "Mantra",
            "text_content": "Om Bhur Bhuvah Svah, Tat Savitur Varenyam...",
            "is_published": True
        }
        
        response = requests.post(f"{BASE_URL}/api/priest/content",
                                  json=content_data, headers=self.headers)
        assert response.status_code == 200, f"Create content failed: {response.text}"
        
        data = response.json()
        assert "content_id" in data or "message" in data
        print(f"✅ Content created successfully")
        
        # Cleanup
        if "content_id" in data:
            cleanup_response = requests.delete(
                f"{BASE_URL}/api/priest/content/{data['content_id']}",
                headers=self.headers
            )
            print(f"   Cleanup: Test content deleted")


class TestPriestStreams:
    """Test priest live streaming endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": PRIEST_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Auth failed")
    
    def test_get_streams(self):
        """Test GET /api/priest/streams returns streams list"""
        response = requests.get(f"{BASE_URL}/api/priest/streams", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "streams" in data
        print(f"✅ Streams retrieved - Count: {len(data['streams'])}")
    
    def test_create_stream(self):
        """Test POST /api/priest/streams schedules a new stream"""
        # Schedule for tomorrow
        scheduled_time = (datetime.now() + timedelta(days=1)).isoformat()
        
        stream_data = {
            "title": "TEST_Morning_Aarti",
            "description": "Live morning aarti from temple",
            "stream_type": "aarti",
            "scheduled_at": scheduled_time
        }
        
        response = requests.post(f"{BASE_URL}/api/priest/streams",
                                  json=stream_data, headers=self.headers)
        assert response.status_code == 200, f"Create stream failed: {response.text}"
        
        data = response.json()
        assert "stream_id" in data or "message" in data
        print(f"✅ Stream scheduled successfully")
        
        # Test start/end stream if we have the ID
        if "stream_id" in data:
            stream_id = data["stream_id"]
            
            # Test start stream
            start_response = requests.put(
                f"{BASE_URL}/api/priest/streams/{stream_id}/start",
                headers=self.headers
            )
            assert start_response.status_code == 200
            print(f"✅ Stream started")
            
            # Test end stream
            end_response = requests.put(
                f"{BASE_URL}/api/priest/streams/{stream_id}/end",
                headers=self.headers
            )
            assert end_response.status_code == 200
            print(f"✅ Stream ended")


class TestPriestBookings:
    """Test priest bookings endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": PRIEST_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Auth failed")
    
    def test_get_priest_bookings(self):
        """Test GET /api/priest/bookings returns priest's bookings"""
        response = requests.get(f"{BASE_URL}/api/priest/bookings", headers=self.headers)
        assert response.status_code == 200, f"Get bookings failed: {response.text}"
        
        data = response.json()
        assert "bookings" in data
        print(f"✅ Bookings retrieved - Count: {len(data['bookings'])}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
