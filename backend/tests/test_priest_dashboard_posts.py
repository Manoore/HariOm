"""
Priest Dashboard Enhancement Tests
Tests for Posts, Classes with Schedule Frequency, Profile Photo, and Mobile Responsive Features

Test Categories:
1. Posts API - GET, POST, DELETE /api/priest/posts
2. Public Feed API - GET /api/posts/feed  
3. Classes API - Create with frequency/schedule_day/schedule_time fields
4. Profile API - GET /api/priest/profile
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "pandit.sharma@divineapp.com"
TEST_PASSWORD = "priest123"


class TestPriestAuthentication:
    """Authentication tests for priest login"""
    
    def test_priest_login(self):
        """Test priest can login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "priest"
        print(f"✅ Priest login successful - User: {data['user']['name']}")


class TestPriestPostsAPI:
    """Tests for priest posts (daily updates) API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_priest_posts(self):
        """Test GET /api/priest/posts returns posts list"""
        response = requests.get(
            f"{BASE_URL}/api/priest/posts",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert isinstance(data["posts"], list)
        print(f"✅ GET /api/priest/posts - Found {len(data['posts'])} posts")
    
    def test_create_post(self):
        """Test POST /api/priest/posts creates new post"""
        post_data = {
            "content": "TEST_Spiritual message for testing - Om Namah Shivaya",
            "image_url": ""
        }
        response = requests.post(
            f"{BASE_URL}/api/priest/posts",
            headers=self.headers,
            json=post_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "post_id" in data
        assert data["message"] == "Post created"
        print(f"✅ POST /api/priest/posts - Created post ID: {data['post_id']}")
        
        # Cleanup - delete the test post
        delete_response = requests.delete(
            f"{BASE_URL}/api/priest/posts/{data['post_id']}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"✅ Cleanup - Test post deleted")
    
    def test_create_post_with_content_required(self):
        """Test POST /api/priest/posts requires content"""
        response = requests.post(
            f"{BASE_URL}/api/priest/posts",
            headers=self.headers,
            json={"content": "", "image_url": ""}
        )
        assert response.status_code == 400
        print("✅ POST /api/priest/posts - Correctly rejects empty content")


class TestPublicPostsFeed:
    """Tests for public posts feed API"""
    
    def test_get_posts_feed(self):
        """Test GET /api/posts/feed returns public posts"""
        response = requests.get(f"{BASE_URL}/api/posts/feed")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert isinstance(data["posts"], list)
        print(f"✅ GET /api/posts/feed - Found {data['total']} public posts")
        
        # Check post structure if posts exist
        if data["posts"]:
            post = data["posts"][0]
            assert "id" in post
            assert "content" in post
            assert "priest_name" in post
            assert "likes" in post
            print(f"✅ Post structure validated")


class TestPriestClassesWithFrequency:
    """Tests for priest classes with schedule frequency options"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_classes(self):
        """Test GET /api/priest/classes returns classes with frequency fields"""
        response = requests.get(
            f"{BASE_URL}/api/priest/classes",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "classes" in data
        print(f"✅ GET /api/priest/classes - Found {len(data['classes'])} classes")
        
        # Check that classes have frequency fields
        if data["classes"]:
            cls = data["classes"][0]
            assert "frequency" in cls
            assert "schedule_day" in cls
            assert "schedule_time" in cls
            print(f"✅ Class has frequency fields: frequency={cls['frequency']}")
    
    def test_create_class_with_daily_frequency(self):
        """Test creating class with daily frequency"""
        class_data = {
            "title": "TEST_Daily Meditation",
            "description": "Daily morning meditation class",
            "class_type": "online",
            "duration_minutes": 30,
            "price": 200,
            "max_students": 50,
            "category": "Meditation",
            "frequency": "daily",
            "schedule_day": "",
            "schedule_time": "06:00"
        }
        response = requests.post(
            f"{BASE_URL}/api/priest/classes",
            headers=self.headers,
            json=class_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "class_id" in data
        print(f"✅ Created class with daily frequency - ID: {data['class_id']}")
        
        # Verify the class has correct frequency
        get_response = requests.get(
            f"{BASE_URL}/api/priest/classes",
            headers=self.headers
        )
        classes = get_response.json()["classes"]
        created_class = next((c for c in classes if c["id"] == data["class_id"]), None)
        assert created_class is not None
        assert created_class["frequency"] == "daily"
        print(f"✅ Verified class frequency is 'daily'")
        
        # Cleanup
        delete_response = requests.delete(
            f"{BASE_URL}/api/priest/classes/{data['class_id']}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"✅ Cleanup - Test class deleted")
    
    def test_create_class_with_biweekly_frequency(self):
        """Test creating class with bi-weekly frequency"""
        class_data = {
            "title": "TEST_Bi-Weekly Vedic Chanting",
            "description": "Vedic chanting every two weeks",
            "class_type": "online",
            "duration_minutes": 60,
            "price": 500,
            "max_students": 20,
            "category": "Vedic Chanting",
            "frequency": "biweekly",
            "schedule_day": "Saturday",
            "schedule_time": "10:00"
        }
        response = requests.post(
            f"{BASE_URL}/api/priest/classes",
            headers=self.headers,
            json=class_data
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Created class with biweekly frequency - ID: {data['class_id']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/priest/classes/{data['class_id']}",
            headers=self.headers
        )


class TestPriestProfile:
    """Tests for priest profile API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_profile(self):
        """Test GET /api/priest/profile returns priest profile"""
        response = requests.get(
            f"{BASE_URL}/api/priest/profile",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check profile structure
        assert "specializations" in data
        assert "languages" in data
        assert "experience_years" in data
        assert "bio" in data
        assert "profile_photo" in data  # Profile photo field exists
        print(f"✅ GET /api/priest/profile - Profile loaded")
        print(f"   Specializations: {len(data['specializations'])} items")
        print(f"   Languages: {data['languages']}")
        print(f"   Experience: {data['experience_years']} years")


class TestHomeTabData:
    """Tests for home tab data (panchang, festivals, analytics)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_panchang(self):
        """Test GET /api/panchang/today returns today's panchang"""
        response = requests.get(f"{BASE_URL}/api/panchang/today")
        assert response.status_code == 200
        data = response.json()
        assert "tithi" in data
        assert "nakshatra" in data
        assert "sunrise" in data
        assert "sunset" in data
        print(f"✅ GET /api/panchang/today - Tithi: {data['tithi']}")
    
    def test_get_festivals(self):
        """Test GET /api/festivals/upcoming returns upcoming festivals"""
        response = requests.get(f"{BASE_URL}/api/festivals/upcoming")
        assert response.status_code == 200
        data = response.json()
        assert "festivals" in data
        assert isinstance(data["festivals"], list)
        print(f"✅ GET /api/festivals/upcoming - Found {len(data['festivals'])} festivals")
    
    def test_get_analytics(self):
        """Test GET /api/priest/analytics returns priest analytics"""
        response = requests.get(
            f"{BASE_URL}/api/priest/analytics",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        print(f"✅ GET /api/priest/analytics - Stats loaded")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
