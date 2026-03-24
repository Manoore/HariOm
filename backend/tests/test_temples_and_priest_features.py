"""
Test file for Temple APIs and Priest Dashboard features
Tests: Temple list, filters, search, states, deities, stats, detail
Tests: Priest analytics, Math/Mutt dropdown
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def priest_token(api_client):
    """Get priest authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": PRIEST_EMAIL,
        "password": PRIEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Priest authentication failed")


@pytest.fixture(scope="module")
def devotee_token(api_client):
    """Get devotee authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": DEVOTEE_EMAIL,
        "password": DEVOTEE_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Devotee authentication failed")


class TestTempleListAPI:
    """Tests for GET /api/temples/list endpoint"""
    
    def test_temples_list_returns_paginated_data(self, api_client):
        """Test that temples list returns paginated data with total, page, pages"""
        response = api_client.get(f"{BASE_URL}/api/temples/list")
        assert response.status_code == 200
        
        data = response.json()
        assert "temples" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        assert isinstance(data["temples"], list)
        assert data["total"] >= 268  # 268 temples seeded
        assert data["page"] == 1
        assert data["pages"] >= 1
        
    def test_temples_list_default_pagination(self, api_client):
        """Test default pagination returns 20 items"""
        response = api_client.get(f"{BASE_URL}/api/temples/list")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["temples"]) <= 20  # Default limit is 20
        
    def test_temples_list_custom_pagination(self, api_client):
        """Test custom pagination with page and limit"""
        response = api_client.get(f"{BASE_URL}/api/temples/list?page=2&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["page"] == 2
        assert len(data["temples"]) <= 10
        
    def test_temples_list_temple_structure(self, api_client):
        """Test that each temple has required fields"""
        response = api_client.get(f"{BASE_URL}/api/temples/list")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["temples"]) > 0
        
        temple = data["temples"][0]
        assert "id" in temple
        assert "name" in temple
        assert "state" in temple
        assert "deity" in temple
        assert "info" in temple


class TestTempleFilters:
    """Tests for temple filtering by state and deity"""
    
    def test_filter_by_state(self, api_client):
        """Test filtering temples by state"""
        response = api_client.get(f"{BASE_URL}/api/temples/list?state=Tamil+Nadu")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1
        # All returned temples should be from Tamil Nadu
        for temple in data["temples"]:
            assert temple["state"] == "Tamil Nadu"
            
    def test_filter_by_deity(self, api_client):
        """Test filtering temples by deity"""
        response = api_client.get(f"{BASE_URL}/api/temples/list?deity=Shiva")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1
        # All returned temples should have Shiva as deity
        for temple in data["temples"]:
            assert temple["deity"] == "Shiva"
            
    def test_filter_by_state_and_deity(self, api_client):
        """Test filtering by both state and deity"""
        response = api_client.get(f"{BASE_URL}/api/temples/list?state=Tamil+Nadu&deity=Shiva")
        assert response.status_code == 200
        
        data = response.json()
        for temple in data["temples"]:
            assert temple["state"] == "Tamil Nadu"
            assert temple["deity"] == "Shiva"


class TestTempleSearch:
    """Tests for temple text search"""
    
    def test_search_temples(self, api_client):
        """Test text search for temples"""
        response = api_client.get(f"{BASE_URL}/api/temples/list?search=kashi")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1
        # At least one temple should have "kashi" in name
        found_kashi = any("kashi" in t["name"].lower() for t in data["temples"])
        assert found_kashi, "Search should return temples with 'kashi' in name"
        
    def test_search_no_results(self, api_client):
        """Test search with no matching results"""
        response = api_client.get(f"{BASE_URL}/api/temples/list?search=xyznonexistent123")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] == 0
        assert len(data["temples"]) == 0


class TestTempleStatesAPI:
    """Tests for GET /api/temples/states endpoint"""
    
    def test_states_list(self, api_client):
        """Test that states endpoint returns list of states with counts"""
        response = api_client.get(f"{BASE_URL}/api/temples/states")
        assert response.status_code == 200
        
        data = response.json()
        assert "states" in data
        assert isinstance(data["states"], list)
        assert len(data["states"]) >= 33  # 33 states seeded
        
    def test_states_structure(self, api_client):
        """Test that each state has name and count"""
        response = api_client.get(f"{BASE_URL}/api/temples/states")
        assert response.status_code == 200
        
        data = response.json()
        for state in data["states"]:
            assert "name" in state
            assert "count" in state
            assert isinstance(state["count"], int)
            assert state["count"] > 0


class TestTempleDeitiesAPI:
    """Tests for GET /api/temples/deities endpoint"""
    
    def test_deities_list(self, api_client):
        """Test that deities endpoint returns list of deities with counts"""
        response = api_client.get(f"{BASE_URL}/api/temples/deities")
        assert response.status_code == 200
        
        data = response.json()
        assert "deities" in data
        assert isinstance(data["deities"], list)
        assert len(data["deities"]) >= 10  # 10 deity categories seeded
        
    def test_deities_structure(self, api_client):
        """Test that each deity has name and count"""
        response = api_client.get(f"{BASE_URL}/api/temples/deities")
        assert response.status_code == 200
        
        data = response.json()
        for deity in data["deities"]:
            assert "name" in deity
            assert "count" in deity
            assert isinstance(deity["count"], int)
            assert deity["count"] > 0
            
    def test_deities_sorted_by_count(self, api_client):
        """Test that deities are sorted by count descending"""
        response = api_client.get(f"{BASE_URL}/api/temples/deities")
        assert response.status_code == 200
        
        data = response.json()
        counts = [d["count"] for d in data["deities"]]
        assert counts == sorted(counts, reverse=True), "Deities should be sorted by count descending"


class TestTempleStatsAPI:
    """Tests for GET /api/temples/stats endpoint"""
    
    def test_stats_returns_totals(self, api_client):
        """Test that stats endpoint returns total_temples, total_states, total_deities"""
        response = api_client.get(f"{BASE_URL}/api/temples/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_temples" in data
        assert "total_states" in data
        assert "total_deities" in data
        
    def test_stats_values(self, api_client):
        """Test that stats values match expected seeded data"""
        response = api_client.get(f"{BASE_URL}/api/temples/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_temples"] == 268
        assert data["total_states"] == 33
        assert data["total_deities"] == 10


class TestTempleDetailAPI:
    """Tests for GET /api/temples/{id} endpoint"""
    
    def test_get_temple_detail(self, api_client):
        """Test getting individual temple detail"""
        # First get a temple ID from the list
        list_response = api_client.get(f"{BASE_URL}/api/temples/list?limit=1")
        assert list_response.status_code == 200
        
        temple_id = list_response.json()["temples"][0]["id"]
        
        # Get temple detail
        response = api_client.get(f"{BASE_URL}/api/temples/{temple_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "temple" in data
        temple = data["temple"]
        assert temple["id"] == temple_id
        assert "name" in temple
        assert "state" in temple
        assert "deity" in temple
        assert "info" in temple
        
    def test_temple_detail_has_all_fields(self, api_client):
        """Test that temple detail includes all content fields"""
        list_response = api_client.get(f"{BASE_URL}/api/temples/list?limit=1")
        temple_id = list_response.json()["temples"][0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/temples/{temple_id}")
        assert response.status_code == 200
        
        temple = response.json()["temple"]
        # Check all expected fields exist (may be empty strings)
        expected_fields = ["id", "name", "state", "deity", "info", "story", 
                          "visiting_guide", "architecture", "mention_in_scripture"]
        for field in expected_fields:
            assert field in temple, f"Temple should have '{field}' field"


class TestPriestAnalyticsAPI:
    """Tests for GET /api/priest/analytics endpoint"""
    
    def test_analytics_requires_auth(self, api_client):
        """Test that analytics endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/priest/analytics")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden
        
    def test_analytics_returns_stats(self, api_client, priest_token):
        """Test that analytics returns stats object"""
        response = api_client.get(
            f"{BASE_URL}/api/priest/analytics",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "stats" in data
        assert "recent_bookings" in data
        
    def test_analytics_stats_structure(self, api_client, priest_token):
        """Test that analytics stats has all required fields"""
        response = api_client.get(
            f"{BASE_URL}/api/priest/analytics",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200
        
        stats = response.json()["stats"]
        expected_fields = [
            "total_bookings", "pending_bookings", "confirmed_bookings",
            "completed_bookings", "cancelled_bookings", "total_earnings",
            "monthly_earnings", "total_classes", "total_students",
            "content_count", "avg_rating", "total_reviews"
        ]
        for field in expected_fields:
            assert field in stats, f"Stats should have '{field}' field"
            
    def test_analytics_no_500_error(self, api_client, priest_token):
        """Test that analytics endpoint does not return 500 error (datetime fix)"""
        response = api_client.get(
            f"{BASE_URL}/api/priest/analytics",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        # Should not be 500 - the datetime fix should prevent this
        assert response.status_code != 500
        assert response.status_code == 200


class TestMathMuttAPI:
    """Tests for GET /api/math-mutt endpoint"""
    
    def test_math_mutt_returns_data(self, api_client):
        """Test that math-mutt endpoint returns data"""
        response = api_client.get(f"{BASE_URL}/api/math-mutt")
        assert response.status_code == 200
        
        data = response.json()
        assert "math_mutts" in data
        assert "categories" in data
        
    def test_math_mutt_list_not_empty(self, api_client):
        """Test that math_mutts list is not empty"""
        response = api_client.get(f"{BASE_URL}/api/math-mutt")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["math_mutts"]) > 0
        
    def test_math_mutt_categories_structure(self, api_client):
        """Test that categories contain string items (not objects)"""
        response = api_client.get(f"{BASE_URL}/api/math-mutt")
        assert response.status_code == 200
        
        data = response.json()
        categories = data["categories"]
        
        # Each category should have a list of string names
        for category_name, items in categories.items():
            assert isinstance(items, list), f"Category '{category_name}' should be a list"
            for item in items:
                assert isinstance(item, str), f"Items in '{category_name}' should be strings, got {type(item)}"
                
    def test_math_mutt_has_expected_categories(self, api_client):
        """Test that expected categories exist"""
        response = api_client.get(f"{BASE_URL}/api/math-mutt")
        assert response.status_code == 200
        
        categories = response.json()["categories"]
        # Check for some expected categories
        expected_categories = ["Advaita", "Dvaita", "Sri Vaishnavism"]
        for cat in expected_categories:
            assert cat in categories, f"Expected category '{cat}' not found"


class TestPriestProfileMathMutt:
    """Tests for priest profile Math/Mutt field"""
    
    def test_priest_profile_has_math_mutt_field(self, api_client, priest_token):
        """Test that priest profile includes math_mutt field"""
        response = api_client.get(
            f"{BASE_URL}/api/priest/profile",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "math_mutt" in data, "Priest profile should have math_mutt field"
        
    def test_priest_profile_update_math_mutt(self, api_client, priest_token):
        """Test updating priest profile with math_mutt"""
        # Update math_mutt
        update_response = api_client.put(
            f"{BASE_URL}/api/priest/profile",
            headers={"Authorization": f"Bearer {priest_token}"},
            json={"math_mutt": "Sringeri Sharada Peetham"}
        )
        assert update_response.status_code == 200
        
        # Verify update
        profile_response = api_client.get(
            f"{BASE_URL}/api/priest/profile",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert profile_response.status_code == 200
        assert profile_response.json()["math_mutt"] == "Sringeri Sharada Peetham"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
