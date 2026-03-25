"""
Test Subcaste Management Feature
- GET /api/subcastes - returns 126 subcastes sorted alphabetically
- POST /api/subcastes with admin auth - adds new subcaste
- DELETE /api/subcastes/{name} with admin auth - deletes subcaste
- GET /api/priests includes subcaste, math_mutt, temple_affiliation, work_locations fields
- GET /api/priests?subcaste=Chitpavan filters by subcaste
- GET /api/priests?math_mutt=Uttaradi filters by math_mutt
- GET /api/priests/{id} includes subcaste, math_mutt, temple_affiliation, work_locations
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://otp-blank-screen.preview.emergentagent.com').rstrip('/')


class TestSubcasteAPI:
    """Test subcaste CRUD operations"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@divine.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    def test_get_subcastes_returns_126_sorted(self):
        """GET /api/subcastes returns 126 subcastes sorted alphabetically"""
        response = requests.get(f"{BASE_URL}/api/subcastes")
        assert response.status_code == 200
        
        data = response.json()
        assert "subcastes" in data
        assert "total" in data
        assert data["total"] == 126, f"Expected 126 subcastes, got {data['total']}"
        
        # Verify sorted alphabetically
        subcastes = data["subcastes"]
        assert len(subcastes) == 126
        assert subcastes == sorted(subcastes), "Subcastes should be sorted alphabetically"
        
        # Verify some known subcastes exist
        assert "Chitpavan / Konkanastha" in subcastes
        assert "Gouda Saraswat" in subcastes
        assert "Kashmiri Saraswat / Kashmiri Pandit" in subcastes
    
    def test_post_subcaste_requires_admin(self):
        """POST /api/subcastes without auth returns 401 or 403"""
        response = requests.post(f"{BASE_URL}/api/subcastes", json={"name": "Test"})
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
    
    def test_post_subcaste_with_admin(self, admin_token):
        """POST /api/subcastes with admin auth adds new subcaste"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Add test subcaste
        response = requests.post(
            f"{BASE_URL}/api/subcastes",
            json={"name": "TEST_Subcaste_Pytest"},
            headers=headers
        )
        assert response.status_code == 200
        assert "added" in response.json()["message"]
        
        # Verify it exists
        get_response = requests.get(f"{BASE_URL}/api/subcastes")
        assert "TEST_Subcaste_Pytest" in get_response.json()["subcastes"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/subcastes/TEST_Subcaste_Pytest", headers=headers)
    
    def test_post_subcaste_duplicate_fails(self, admin_token):
        """POST /api/subcastes with duplicate name returns 400"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to add existing subcaste
        response = requests.post(
            f"{BASE_URL}/api/subcastes",
            json={"name": "Chitpavan / Konkanastha"},
            headers=headers
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_delete_subcaste_requires_admin(self):
        """DELETE /api/subcastes/{name} without auth returns 401 or 403"""
        response = requests.delete(f"{BASE_URL}/api/subcastes/SomeSubcaste")
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
    
    def test_delete_subcaste_with_admin(self, admin_token):
        """DELETE /api/subcastes/{name} with admin auth deletes subcaste"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First add a test subcaste
        requests.post(
            f"{BASE_URL}/api/subcastes",
            json={"name": "TEST_Delete_Subcaste"},
            headers=headers
        )
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/api/subcastes/TEST_Delete_Subcaste",
            headers=headers
        )
        assert response.status_code == 200
        assert "Deleted" in response.json()["message"]
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/subcastes")
        assert "TEST_Delete_Subcaste" not in get_response.json()["subcastes"]
    
    def test_delete_nonexistent_subcaste_returns_404(self, admin_token):
        """DELETE /api/subcastes/{name} for non-existent returns 404"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/subcastes/NonExistentSubcaste12345",
            headers=headers
        )
        assert response.status_code == 404


class TestPriestAPIWithSubcaste:
    """Test priest API includes subcaste, math_mutt, temple_affiliation, work_locations"""
    
    def test_get_priests_includes_new_fields(self):
        """GET /api/priests includes subcaste, math_mutt, temple_affiliation, work_locations"""
        response = requests.get(f"{BASE_URL}/api/priests")
        assert response.status_code == 200
        
        data = response.json()
        assert "priests" in data
        
        # Check first priest has all required fields
        if data["priests"]:
            priest = data["priests"][0]
            assert "subcaste" in priest, "Priest should have subcaste field"
            assert "math_mutt" in priest, "Priest should have math_mutt field"
            assert "temple_affiliation" in priest, "Priest should have temple_affiliation field"
            assert "work_locations" in priest, "Priest should have work_locations field"
            assert isinstance(priest["work_locations"], list), "work_locations should be a list"
    
    def test_get_priests_filter_by_math_mutt(self):
        """GET /api/priests?math_mutt=Uttaradi filters correctly"""
        response = requests.get(f"{BASE_URL}/api/priests?math_mutt=Uttaradi")
        assert response.status_code == 200
        
        data = response.json()
        # Should find priest with math_mutt containing "Uttaradi"
        if data["priests"]:
            for priest in data["priests"]:
                assert "Uttaradi" in priest.get("math_mutt", ""), \
                    f"Filtered priest should have Uttaradi in math_mutt, got: {priest.get('math_mutt')}"
    
    def test_get_priests_filter_by_subcaste(self):
        """GET /api/priests?subcaste=Chitpavan filters correctly"""
        response = requests.get(f"{BASE_URL}/api/priests?subcaste=Chitpavan")
        assert response.status_code == 200
        
        data = response.json()
        # May return empty if no priests have this subcaste
        assert "priests" in data
        assert "total" in data
        
        # If results exist, verify filter worked
        for priest in data["priests"]:
            assert "Chitpavan" in priest.get("subcaste", ""), \
                f"Filtered priest should have Chitpavan in subcaste"
    
    def test_get_priest_detail_includes_new_fields(self):
        """GET /api/priests/{id} includes subcaste, math_mutt, temple_affiliation, work_locations"""
        # First get a priest ID
        list_response = requests.get(f"{BASE_URL}/api/priests")
        assert list_response.status_code == 200
        
        priests = list_response.json()["priests"]
        if not priests:
            pytest.skip("No priests available for testing")
        
        priest_id = priests[0]["id"]
        
        # Get priest detail
        response = requests.get(f"{BASE_URL}/api/priests/{priest_id}")
        assert response.status_code == 200
        
        priest = response.json()
        assert "subcaste" in priest, "Priest detail should have subcaste field"
        assert "math_mutt" in priest, "Priest detail should have math_mutt field"
        assert "temple_affiliation" in priest, "Priest detail should have temple_affiliation field"
        assert "work_locations" in priest, "Priest detail should have work_locations field"
    
    def test_get_priest_nandakishore_has_math_mutt(self):
        """Verify test priest Nandakishore Manoore has math_mutt set to Uttaradi Mutt"""
        response = requests.get(f"{BASE_URL}/api/priests?math_mutt=Uttaradi")
        assert response.status_code == 200
        
        data = response.json()
        # Find Nandakishore Manoore
        nanda = None
        for priest in data["priests"]:
            if "Nandakishore" in priest.get("user_name", ""):
                nanda = priest
                break
        
        if nanda:
            assert nanda["math_mutt"] == "Uttaradi Mutt", \
                f"Nandakishore should have math_mutt='Uttaradi Mutt', got: {nanda['math_mutt']}"


class TestMathMuttAPI:
    """Test Math/Mutt API returns correct format"""
    
    def test_get_math_mutt_returns_categories(self):
        """GET /api/math-mutt returns math_mutts list and categories"""
        response = requests.get(f"{BASE_URL}/api/math-mutt")
        assert response.status_code == 200
        
        data = response.json()
        assert "math_mutts" in data
        assert "categories" in data
        
        # Verify categories structure
        categories = data["categories"]
        assert isinstance(categories, dict)
        
        # Check known categories exist
        assert "Advaita" in categories or "Dvaita" in categories or "Sri Vaishnavism" in categories
        
        # Verify items in categories are strings (not objects)
        for category, items in categories.items():
            assert isinstance(items, list)
            for item in items:
                assert isinstance(item, str), f"Math/Mutt items should be strings, got: {type(item)}"
    
    def test_math_mutt_includes_uttaradi(self):
        """Verify Uttaradi Mutt is in the list"""
        response = requests.get(f"{BASE_URL}/api/math-mutt")
        assert response.status_code == 200
        
        data = response.json()
        assert "Uttaradi Mutt" in data["math_mutts"]


class TestDevoteeCredentials:
    """Test devotee login and access"""
    
    def test_devotee_login(self):
        """Devotee can login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "devotee@divineapp.com",
            "password": "devotee123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "devotee"


class TestPriestCredentials:
    """Test priest login and access"""
    
    def test_priest_login(self):
        """Priest can login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "pandit.sharma@divineapp.com",
            "password": "priest123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "priest"
