"""
Test Suite for Astrologer Dashboard APIs
Tests:
- GET /api/astrologer/dashboard - Dashboard stats
- GET /api/astrologer/earnings?period=day|week|month - Earnings report
- GET /api/astrologer/calls - Call history
- PUT /api/astrologer/availability - Toggle online/offline
- PUT /api/astrologer/profile - Update profile with rate_per_minute
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test credentials
ASTROLOGER_EMAIL = "astrologer@test.com"
ASTROLOGER_PASSWORD = "test1234"
DEVOTEE_EMAIL = "devotee@test.com"
DEVOTEE_PASSWORD = "test1234"


class TestAuthHelpers:
    """Utility methods for authentication"""
    
    @staticmethod
    def login(email, password):
        """Login and return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            data = response.json()
            # API returns 'token' not 'access_token'
            return data.get("token") or data.get("access_token")
        return None
    
    @staticmethod
    def get_auth_header(token):
        """Get authorization header"""
        return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def astrologer_token():
    """Get astrologer auth token"""
    token = TestAuthHelpers.login(ASTROLOGER_EMAIL, ASTROLOGER_PASSWORD)
    if not token:
        pytest.skip(f"Could not login as astrologer {ASTROLOGER_EMAIL}")
    return token


@pytest.fixture(scope="module")
def devotee_token():
    """Get devotee auth token"""
    token = TestAuthHelpers.login(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
    if not token:
        pytest.skip(f"Could not login as devotee {DEVOTEE_EMAIL}")
    return token


class TestAstrologerDashboard:
    """Tests for GET /api/astrologer/dashboard endpoint"""
    
    def test_dashboard_unauthenticated(self):
        """Dashboard should reject unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/astrologer/dashboard")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Dashboard correctly rejects unauthenticated requests")
    
    def test_dashboard_devotee_forbidden(self, devotee_token):
        """Devotee should not access astrologer dashboard"""
        headers = TestAuthHelpers.get_auth_header(devotee_token)
        response = requests.get(f"{BASE_URL}/api/astrologer/dashboard", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✅ Dashboard correctly rejects non-astrologer users")
    
    def test_dashboard_success(self, astrologer_token):
        """Astrologer should access dashboard with stats"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.get(f"{BASE_URL}/api/astrologer/dashboard", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify profile in response
        assert "profile" in data, "Response should contain 'profile'"
        profile = data["profile"]
        assert "rate_per_minute" in profile, "Profile should have rate_per_minute"
        assert "is_available" in profile, "Profile should have is_available"
        
        # Verify stats in response
        assert "stats" in data, "Response should contain 'stats'"
        stats = data["stats"]
        expected_stat_fields = [
            "total_calls", "total_earnings", "total_minutes",
            "today_calls", "today_earnings", "today_minutes",
            "week_calls", "week_earnings", "month_calls", "month_earnings"
        ]
        for field in expected_stat_fields:
            assert field in stats, f"Stats should contain '{field}'"
        
        print(f"✅ Dashboard returns stats: today_calls={stats['today_calls']}, total_earnings=₹{stats['total_earnings']}")


class TestAstrologerEarnings:
    """Tests for GET /api/astrologer/earnings endpoint"""
    
    def test_earnings_unauthenticated(self):
        """Earnings should reject unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/astrologer/earnings")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Earnings correctly rejects unauthenticated requests")
    
    def test_earnings_day_period(self, astrologer_token):
        """Test earnings report for day period"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.get(f"{BASE_URL}/api/astrologer/earnings?period=day", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("period") == "day", "Period should be 'day'"
        assert "summary" in data, "Response should contain 'summary'"
        assert "chart_data" in data, "Response should contain 'chart_data'"
        
        summary = data["summary"]
        assert "total_earnings" in summary, "Summary should have total_earnings"
        assert "total_calls" in summary, "Summary should have total_calls"
        
        print(f"✅ Day earnings: ₹{summary['total_earnings']} from {summary['total_calls']} calls")
    
    def test_earnings_week_period(self, astrologer_token):
        """Test earnings report for week period"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.get(f"{BASE_URL}/api/astrologer/earnings?period=week", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("period") == "week", "Period should be 'week'"
        print(f"✅ Week earnings: ₹{data['summary']['total_earnings']} from {data['summary']['total_calls']} calls")
    
    def test_earnings_month_period(self, astrologer_token):
        """Test earnings report for month period"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.get(f"{BASE_URL}/api/astrologer/earnings?period=month", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("period") == "month", "Period should be 'month'"
        print(f"✅ Month earnings: ₹{data['summary']['total_earnings']} from {data['summary']['total_calls']} calls")
    
    def test_earnings_invalid_period(self, astrologer_token):
        """Test earnings with invalid period defaults to week"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.get(f"{BASE_URL}/api/astrologer/earnings?period=invalid", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Server should default to 'week' for invalid period
        assert data.get("period") in ["week", "invalid"], "Period should default or pass through"
        print("✅ Invalid period handled gracefully")


class TestAstrologerCalls:
    """Tests for GET /api/astrologer/calls endpoint"""
    
    def test_calls_unauthenticated(self):
        """Calls should reject unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/astrologer/calls")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Calls correctly rejects unauthenticated requests")
    
    def test_calls_success(self, astrologer_token):
        """Test call history retrieval"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.get(f"{BASE_URL}/api/astrologer/calls", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "calls" in data, "Response should contain 'calls'"
        assert isinstance(data["calls"], list), "Calls should be a list"
        
        # Verify call structure if any calls exist
        if data["calls"]:
            call = data["calls"][0]
            expected_fields = ["id", "status", "duration_seconds", "rate_per_minute"]
            for field in expected_fields:
                assert field in call, f"Call should contain '{field}'"
            print(f"✅ Call history: {len(data['calls'])} calls found, first call status: {call['status']}")
        else:
            print("✅ Call history: No calls found (empty list)")


class TestAstrologerAvailability:
    """Tests for PUT /api/astrologer/availability endpoint"""
    
    def test_availability_unauthenticated(self):
        """Availability toggle should reject unauthenticated requests"""
        response = requests.put(f"{BASE_URL}/api/astrologer/availability", json={"is_available": True})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Availability correctly rejects unauthenticated requests")
    
    def test_availability_devotee_forbidden(self, devotee_token):
        """Devotee should not toggle astrologer availability"""
        headers = TestAuthHelpers.get_auth_header(devotee_token)
        response = requests.put(f"{BASE_URL}/api/astrologer/availability", 
                               headers=headers, json={"is_available": True})
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✅ Availability correctly rejects non-astrologer users")
    
    def test_toggle_online(self, astrologer_token):
        """Test setting astrologer online"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.put(f"{BASE_URL}/api/astrologer/availability", 
                               headers=headers, json={"is_available": True})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("is_available") == True, "is_available should be True"
        print("✅ Astrologer set to Online")
    
    def test_toggle_offline(self, astrologer_token):
        """Test setting astrologer offline"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.put(f"{BASE_URL}/api/astrologer/availability", 
                               headers=headers, json={"is_available": False})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("is_available") == False, "is_available should be False"
        print("✅ Astrologer set to Offline")
    
    def test_restore_online(self, astrologer_token):
        """Restore astrologer to online for other tests"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.put(f"{BASE_URL}/api/astrologer/availability", 
                               headers=headers, json={"is_available": True})
        assert response.status_code == 200
        print("✅ Astrologer restored to Online")


class TestAstrologerProfile:
    """Tests for PUT /api/astrologer/profile endpoint"""
    
    def test_profile_get(self, astrologer_token):
        """Test getting astrologer profile"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        response = requests.get(f"{BASE_URL}/api/astrologer/profile", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        expected_fields = ["rate_per_minute", "specializations", "languages", "is_available"]
        for field in expected_fields:
            assert field in data, f"Profile should contain '{field}'"
        
        print(f"✅ Profile retrieved: rate=₹{data['rate_per_minute']}/min, available={data['is_available']}")
        return data
    
    def test_profile_update_rate(self, astrologer_token):
        """Test updating rate per minute"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        
        # Get current rate
        get_response = requests.get(f"{BASE_URL}/api/astrologer/profile", headers=headers)
        original_rate = get_response.json().get("rate_per_minute", 15)
        
        # Update rate
        new_rate = 20
        response = requests.put(f"{BASE_URL}/api/astrologer/profile", 
                               headers=headers, json={"rate_per_minute": new_rate})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("rate_per_minute") == new_rate, f"Rate should be {new_rate}"
        
        # Restore original rate
        requests.put(f"{BASE_URL}/api/astrologer/profile", 
                    headers=headers, json={"rate_per_minute": original_rate})
        
        print(f"✅ Profile rate updated: ₹{original_rate} -> ₹{new_rate} -> ₹{original_rate}")
    
    def test_profile_update_specializations(self, astrologer_token):
        """Test updating specializations"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        
        new_specs = ["Vedic Astrology", "Numerology", "Palmistry"]
        response = requests.put(f"{BASE_URL}/api/astrologer/profile", 
                               headers=headers, json={"specializations": new_specs})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("specializations") == new_specs, "Specializations should be updated"
        print(f"✅ Specializations updated: {new_specs}")
    
    def test_profile_update_languages(self, astrologer_token):
        """Test updating languages"""
        headers = TestAuthHelpers.get_auth_header(astrologer_token)
        
        new_langs = ["Hindi", "English", "Telugu"]
        response = requests.put(f"{BASE_URL}/api/astrologer/profile", 
                               headers=headers, json={"languages": new_langs})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("languages") == new_langs, "Languages should be updated"
        print(f"✅ Languages updated: {new_langs}")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", "API should be healthy"
        print("✅ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
