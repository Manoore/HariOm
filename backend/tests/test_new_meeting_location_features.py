"""
Test Suite for New Meeting Type, Location Type, and Temple Affiliation Features

Features tested:
1. Devotee class request - meeting_type field (one_on_one/group)
2. Priest services - location_type and temple_name fields
3. Priest classes - location_type and temple_name fields  
4. Priest profile - temple_affiliation field
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pooja-marketplace-1.preview.emergentagent.com')

# Test accounts
TEST_PRIEST_EMAIL = "pandit.sharma@divineapp.com"
TEST_PRIEST_PASSWORD = "priest123"
TEST_ADMIN_EMAIL = "admin@divineapp.com"
TEST_ADMIN_PASSWORD = "admin123"


def get_token(email, password, session):
    """Helper to get auth token"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    return None


def create_test_devotee(session):
    """Register a test devotee and return token"""
    test_email = f"TEST_devotee_{uuid.uuid4().hex[:8]}@test.com"
    response = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": test_email,
        "password": "testpass123",
        "name": "Test Devotee"
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token"), test_email
    return None, None


# ==================== CLASS REQUESTS - MEETING TYPE ====================

class TestClassRequestsMeetingType:
    """Test meeting_type field in class requests (devotee feature)"""
    
    def test_create_class_request_with_one_on_one(self, api_client):
        """Test creating class request with meeting_type = one_on_one"""
        devotee_token, email = create_test_devotee(api_client)
        if not devotee_token:
            pytest.skip("Could not create test devotee")
        
        api_client.headers.update({"Authorization": f"Bearer {devotee_token}"})
        
        response = api_client.post(f"{BASE_URL}/api/class-requests", json={
            "topic": "TEST Vedic Astrology Basics",
            "description": "I want to learn the fundamentals of Vedic astrology one-on-one",
            "preferred_schedule": "Weekends, 10 AM",
            "meeting_type": "one_on_one"
        })
        
        print(f"Create one_on_one request: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 200, f"Failed to create class request: {response.text}"
        data = response.json()
        assert "request_id" in data or "id" in data, "Response should contain request ID"
        print(f"✅ Created class request with meeting_type=one_on_one")
    
    def test_create_class_request_with_group(self, api_client):
        """Test creating class request with meeting_type = group"""
        devotee_token, email = create_test_devotee(api_client)
        if not devotee_token:
            pytest.skip("Could not create test devotee")
        
        api_client.headers.update({"Authorization": f"Bearer {devotee_token}"})
        
        response = api_client.post(f"{BASE_URL}/api/class-requests", json={
            "topic": "TEST Group Meditation Session",
            "description": "I want to join a group meditation class",
            "preferred_schedule": "Daily, 6 AM",
            "meeting_type": "group"
        })
        
        print(f"Create group request: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to create group request: {response.text}"
        print(f"✅ Created class request with meeting_type=group")
    
    def test_get_my_class_requests_returns_meeting_type(self, api_client):
        """Test GET /api/class-requests returns meeting_type field"""
        devotee_token, email = create_test_devotee(api_client)
        if not devotee_token:
            pytest.skip("Could not create test devotee")
        
        api_client.headers.update({"Authorization": f"Bearer {devotee_token}"})
        
        # First create a request
        api_client.post(f"{BASE_URL}/api/class-requests", json={
            "topic": "TEST Get Meeting Type",
            "description": "Test",
            "preferred_schedule": "Anytime",
            "meeting_type": "group"
        })
        
        # Now fetch
        response = api_client.get(f"{BASE_URL}/api/class-requests")
        
        print(f"Get my class requests: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to get class requests: {response.text}"
        data = response.json()
        
        requests_list = data.get("requests", [])
        assert len(requests_list) > 0, "Should have at least one class request"
        
        # Verify meeting_type is present
        for req in requests_list:
            assert "meeting_type" in req, f"meeting_type field missing in request"
            assert req["meeting_type"] in ["one_on_one", "group"], f"Invalid meeting_type: {req['meeting_type']}"
            print(f"  Request '{req.get('topic', 'N/A')}': meeting_type={req['meeting_type']}")
        
        print(f"✅ GET /api/class-requests returns meeting_type correctly")
    
    def test_priest_can_see_meeting_type_in_all_requests(self, api_client):
        """Test GET /api/class-requests/all returns meeting_type for priests"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.get(f"{BASE_URL}/api/class-requests/all")
        
        print(f"Priest get all class requests: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to get all class requests: {response.text}"
        data = response.json()
        
        requests_list = data.get("requests", [])
        
        if len(requests_list) > 0:
            for req in requests_list[:3]:  # Check first 3
                assert "meeting_type" in req, "meeting_type missing in priest view"
                print(f"  Request '{req.get('topic', 'N/A')}': meeting_type={req['meeting_type']}")
        
        print(f"✅ Priest can see meeting_type in /api/class-requests/all")


# ==================== PRIEST SERVICES - LOCATION TYPE ====================

class TestPriestServicesLocationFields:
    """Test location_type and temple_name fields in priest services"""
    
    def test_create_service_online(self, api_client):
        """Test creating service with location_type = online"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.post(f"{BASE_URL}/api/priest/services", json={
            "name": f"TEST Online Meditation {uuid.uuid4().hex[:4]}",
            "description": "Virtual meditation session",
            "category": "Meditation",
            "duration_minutes": 45,
            "price": 500,
            "location_type": "online"
        })
        
        print(f"Create online service: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 200, f"Failed to create service: {response.text}"
        print(f"✅ Created service with location_type=online")
    
    def test_create_service_home_visit(self, api_client):
        """Test creating service with location_type = home_visit"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.post(f"{BASE_URL}/api/priest/services", json={
            "name": f"TEST Home Visit Pooja {uuid.uuid4().hex[:4]}",
            "description": "I will visit your home",
            "category": "Pooja",
            "duration_minutes": 120,
            "price": 2100,
            "location_type": "home_visit"
        })
        
        print(f"Create home_visit service: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to create home_visit service: {response.text}"
        print(f"✅ Created service with location_type=home_visit")
    
    def test_create_service_temple_with_name(self, api_client):
        """Test creating service with location_type = temple and temple_name"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.post(f"{BASE_URL}/api/priest/services", json={
            "name": f"TEST Temple Pooja {uuid.uuid4().hex[:4]}",
            "description": "Pooja at the temple",
            "category": "Pooja",
            "duration_minutes": 90,
            "price": 1500,
            "location_type": "temple",
            "temple_name": "Sri Venkateswara Temple, Tirupati"
        })
        
        print(f"Create temple service: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to create temple service: {response.text}"
        print(f"✅ Created service with location_type=temple and temple_name")
    
    def test_get_services_returns_location_fields(self, api_client):
        """Test GET /api/priest/services returns location_type and temple_name"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.get(f"{BASE_URL}/api/priest/services")
        
        print(f"Get services: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to get services: {response.text}"
        data = response.json()
        
        services = data.get("services", [])
        
        found_location_type = False
        for service in services:
            if "location_type" in service:
                found_location_type = True
                assert service["location_type"] in ["online", "home_visit", "temple"], \
                    f"Invalid location_type: {service['location_type']}"
                
                if service["location_type"] == "temple" and "temple_name" in service:
                    print(f"  Service '{service['name']}': temple - {service['temple_name']}")
                else:
                    print(f"  Service '{service['name']}': {service['location_type']}")
        
        assert found_location_type, "No services found with location_type field"
        print(f"✅ GET /api/priest/services returns location_type correctly")


# ==================== PRIEST CLASSES - LOCATION TYPE ====================

class TestPriestClassesLocationFields:
    """Test location_type and temple_name fields in priest classes"""
    
    def test_create_class_online(self, api_client):
        """Test creating class with location_type = online"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.post(f"{BASE_URL}/api/priest/classes", json={
            "title": f"TEST Online Yoga {uuid.uuid4().hex[:4]}",
            "description": "Virtual yoga session",
            "category": "Yoga",
            "level": "Beginner",
            "duration_minutes": 60,
            "price": 300,
            "schedule_type": "weekly",
            "scheduled_time": "10:00",
            "days_of_week": ["Monday", "Wednesday"],
            "max_students": 20,
            "location_type": "online"
        })
        
        print(f"Create online class: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 200, f"Failed to create class: {response.text}"
        print(f"✅ Created class with location_type=online")
    
    def test_create_class_temple_with_name(self, api_client):
        """Test creating class with location_type = temple and temple_name"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.post(f"{BASE_URL}/api/priest/classes", json={
            "title": f"TEST Temple Sanskrit {uuid.uuid4().hex[:4]}",
            "description": "Sanskrit class at the temple",
            "category": "Language",
            "level": "Intermediate",
            "duration_minutes": 90,
            "price": 500,
            "schedule_type": "weekly",
            "scheduled_time": "09:00",
            "days_of_week": ["Saturday"],
            "max_students": 15,
            "location_type": "temple",
            "temple_name": "ISKCON Temple, Mumbai"
        })
        
        print(f"Create temple class: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to create temple class: {response.text}"
        print(f"✅ Created class with location_type=temple and temple_name")
    
    def test_get_classes_returns_location_fields(self, api_client):
        """Test GET /api/priest/classes returns location_type and temple_name"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.get(f"{BASE_URL}/api/priest/classes")
        
        print(f"Get classes: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to get classes: {response.text}"
        data = response.json()
        
        classes = data.get("classes", [])
        
        found_location_type = False
        for cls in classes:
            if "location_type" in cls:
                found_location_type = True
                assert cls["location_type"] in ["online", "home_visit", "temple"], \
                    f"Invalid location_type: {cls['location_type']}"
                
                if cls["location_type"] == "temple" and "temple_name" in cls:
                    print(f"  Class '{cls['title']}': temple - {cls['temple_name']}")
                else:
                    print(f"  Class '{cls['title']}': {cls['location_type']}")
        
        assert found_location_type, "No classes found with location_type field"
        print(f"✅ GET /api/priest/classes returns location_type correctly")


# ==================== PRIEST PROFILE - TEMPLE AFFILIATION ====================

class TestPriestProfileTempleAffiliation:
    """Test temple_affiliation field in priest profile"""
    
    def test_get_profile_has_temple_affiliation(self, api_client):
        """Test GET /api/priest/profile returns temple_affiliation field"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.get(f"{BASE_URL}/api/priest/profile")
        
        print(f"Get priest profile: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to get profile: {response.text}"
        data = response.json()
        
        assert "temple_affiliation" in data, "temple_affiliation field missing from priest profile"
        print(f"✅ Priest profile has temple_affiliation: '{data['temple_affiliation']}'")
    
    def test_update_profile_temple_affiliation(self, api_client):
        """Test PUT /api/priest/profile can update temple_affiliation"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        test_temple = f"TEST Siddhivinayak Temple {uuid.uuid4().hex[:4]}"
        
        response = api_client.put(f"{BASE_URL}/api/priest/profile", json={
            "temple_affiliation": test_temple
        })
        
        print(f"Update temple_affiliation: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to update profile: {response.text}"
        
        # Verify the update
        get_response = api_client.get(f"{BASE_URL}/api/priest/profile")
        assert get_response.status_code == 200
        
        profile = get_response.json()
        assert profile.get("temple_affiliation") == test_temple, \
            f"temple_affiliation not updated correctly"
        
        print(f"✅ Successfully updated temple_affiliation to: {test_temple}")
    
    def test_clear_temple_affiliation(self, api_client):
        """Test clearing temple_affiliation"""
        priest_token = get_token(TEST_PRIEST_EMAIL, TEST_PRIEST_PASSWORD, api_client)
        if not priest_token:
            pytest.skip("Could not get priest token")
        
        api_client.headers.update({"Authorization": f"Bearer {priest_token}"})
        
        response = api_client.put(f"{BASE_URL}/api/priest/profile", json={
            "temple_affiliation": ""
        })
        
        print(f"Clear temple_affiliation: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to clear: {response.text}"
        
        get_response = api_client.get(f"{BASE_URL}/api/priest/profile")
        profile = get_response.json()
        assert profile.get("temple_affiliation") == "", "temple_affiliation should be empty"
        
        print(f"✅ Successfully cleared temple_affiliation")


# ==================== FIXTURES ====================

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
