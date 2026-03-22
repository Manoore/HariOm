"""
Test Devotional and Panchang/Festival Routes - Phase 4 Backend Refactoring
Tests the newly created modular route files:
- /app/backend/routes/devotional.py - Devotional Content routes (deities, mantras, stotras, scriptures)
- /app/backend/routes/panchang.py - Panchang/Festival routes (panchang, festivals, temples)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoint:
    """Health check endpoint test"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy", f"Unexpected status: {data}"
        print(f"✓ Health endpoint working: {data}")


class TestDevotionalDeities:
    """Devotional Deities endpoint tests"""
    
    def test_get_deities(self):
        """Test /api/devotional/deities returns deities list"""
        response = requests.get(f"{BASE_URL}/api/devotional/deities")
        assert response.status_code == 200, f"Get deities failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "data" in data, "Response missing 'data' field"
        assert isinstance(data["data"], list), "Data should be a list"
        print(f"✓ Deities endpoint working: {len(data['data'])} deities returned")


class TestDevotionalMantras:
    """Devotional Mantras endpoint tests"""
    
    def test_get_mantras(self):
        """Test /api/devotional/mantras returns mantras list"""
        response = requests.get(f"{BASE_URL}/api/devotional/mantras")
        assert response.status_code == 200, f"Get mantras failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "data" in data, "Response missing 'data' field"
        assert isinstance(data["data"], list), "Data should be a list"
        assert "count" in data, "Response missing 'count' field"
        print(f"✓ Mantras endpoint working: {data['count']} mantras returned")
    
    def test_get_mantras_with_filters(self):
        """Test /api/devotional/mantras with query filters"""
        response = requests.get(f"{BASE_URL}/api/devotional/mantras?tier=free")
        assert response.status_code == 200, f"Get mantras with filter failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        print(f"✓ Mantras with filter working: {data.get('count', 0)} mantras returned")
    
    def test_get_all_mantras(self):
        """Test /api/devotional/mantras/all returns paginated mantras"""
        response = requests.get(f"{BASE_URL}/api/devotional/mantras/all?limit=10")
        assert response.status_code == 200, f"Get all mantras failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "data" in data, "Response missing 'data' field"
        assert "total" in data, "Response missing 'total' field"
        assert "has_more" in data, "Response missing 'has_more' field"
        print(f"✓ All mantras endpoint working: {data.get('total', 0)} total mantras")
    
    def test_get_mantra_categories(self):
        """Test /api/devotional/mantras/categories returns categories"""
        response = requests.get(f"{BASE_URL}/api/devotional/mantras/categories")
        assert response.status_code == 200, f"Get mantra categories failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "data" in data, "Response missing 'data' field"
        print(f"✓ Mantra categories endpoint working: {len(data.get('data', []))} categories")


class TestDevotionalToday:
    """Today's devotional endpoint tests"""
    
    def test_get_today_devotional(self):
        """Test /api/devotional/today returns today's devotional info"""
        response = requests.get(f"{BASE_URL}/api/devotional/today")
        assert response.status_code == 200, f"Get today devotional failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "data" in data, "Response missing 'data' field"
        # Data can be None if no schedule exists for today
        if data["data"]:
            assert "day" in data["data"], "Response missing 'day' field"
            print(f"✓ Today devotional endpoint working: {data['data'].get('day')}")
        else:
            print("✓ Today devotional endpoint working: No schedule for today")


class TestScriptures:
    """Scriptures endpoint tests"""
    
    def test_get_scriptures(self):
        """Test /api/scriptures returns scripture list"""
        response = requests.get(f"{BASE_URL}/api/scriptures")
        assert response.status_code == 200, f"Get scriptures failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "data" in data, "Response missing 'data' field"
        assert isinstance(data["data"], list), "Data should be a list"
        assert "count" in data, "Response missing 'count' field"
        print(f"✓ Scriptures endpoint working: {data['count']} scriptures returned")


class TestPanchangToday:
    """Panchang today endpoint tests"""
    
    def test_get_panchang_today(self):
        """Test /api/panchang/today returns panchang data"""
        response = requests.get(f"{BASE_URL}/api/panchang/today")
        assert response.status_code == 200, f"Get panchang today failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        # Verify panchang fields
        assert "date" in data, "Response missing 'date' field"
        assert "tithi" in data, "Response missing 'tithi' field"
        assert "nakshatra" in data, "Response missing 'nakshatra' field"
        assert "yoga" in data, "Response missing 'yoga' field"
        assert "karana" in data, "Response missing 'karana' field"
        assert "hindu_month" in data, "Response missing 'hindu_month' field"
        print(f"✓ Panchang today endpoint working: {data.get('date')}, Tithi: {data['tithi'].get('name')}")
    
    def test_get_panchang_today_with_location(self):
        """Test /api/panchang/today with custom coordinates"""
        response = requests.get(f"{BASE_URL}/api/panchang/today?lat=19.0760&lon=72.8777")
        assert response.status_code == 200, f"Get panchang with location failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "location" in data, "Response missing 'location' field"
        print(f"✓ Panchang with location working: {data.get('location')}")


class TestFestivalsUpcoming:
    """Festivals upcoming endpoint tests"""
    
    def test_get_upcoming_festivals(self):
        """Test /api/festivals/upcoming returns upcoming festivals"""
        response = requests.get(f"{BASE_URL}/api/festivals/upcoming")
        assert response.status_code == 200, f"Get upcoming festivals failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "festivals" in data, "Response missing 'festivals' field"
        assert isinstance(data["festivals"], list), "Festivals should be a list"
        assert "count" in data, "Response missing 'count' field"
        if data["festivals"]:
            festival = data["festivals"][0]
            assert "name" in festival, "Festival missing 'name' field"
            assert "date" in festival, "Festival missing 'date' field"
            print(f"✓ Upcoming festivals endpoint working: {data['count']} festivals, next: {festival['name']}")
        else:
            print("✓ Upcoming festivals endpoint working: No upcoming festivals")
    
    def test_get_upcoming_festivals_with_limit(self):
        """Test /api/festivals/upcoming with limit parameter"""
        response = requests.get(f"{BASE_URL}/api/festivals/upcoming?limit=5")
        assert response.status_code == 200, f"Get festivals with limit failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert len(data.get("festivals", [])) <= 5, "Should return at most 5 festivals"
        print(f"✓ Festivals with limit working: {len(data.get('festivals', []))} festivals returned")


class TestTemples:
    """Temples endpoint tests"""
    
    def test_get_temples(self):
        """Test /api/temples returns temples list"""
        response = requests.get(f"{BASE_URL}/api/temples")
        assert response.status_code == 200, f"Get temples failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "temples" in data, "Response missing 'temples' field"
        assert isinstance(data["temples"], list), "Temples should be a list"
        assert "count" in data, "Response missing 'count' field"
        if data["temples"]:
            temple = data["temples"][0]
            assert "name" in temple, "Temple missing 'name' field"
            print(f"✓ Temples endpoint working: {data['count']} temples, first: {temple['name']}")
        else:
            print("✓ Temples endpoint working: No temples in database")


class TestAdditionalDevotionalEndpoints:
    """Additional devotional endpoint tests"""
    
    def test_get_stotras(self):
        """Test /api/devotional/stotras returns stotras list"""
        response = requests.get(f"{BASE_URL}/api/devotional/stotras")
        assert response.status_code == 200, f"Get stotras failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "data" in data, "Response missing 'data' field"
        print(f"✓ Stotras endpoint working: {data.get('count', 0)} stotras returned")
    
    def test_get_daily_schedule(self):
        """Test /api/devotional/daily-schedule returns schedule"""
        response = requests.get(f"{BASE_URL}/api/devotional/daily-schedule")
        assert response.status_code == 200, f"Get daily schedule failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "data" in data, "Response missing 'data' field"
        print(f"✓ Daily schedule endpoint working: {len(data.get('data', []))} days")


class TestAdditionalPanchangEndpoints:
    """Additional panchang endpoint tests"""
    
    def test_get_month_panchang(self):
        """Test /api/panchang/month returns month panchang"""
        response = requests.get(f"{BASE_URL}/api/panchang/month")
        assert response.status_code == 200, f"Get month panchang failed: {response.text}"
        data = response.json()
        # Note: This endpoint returns data directly without "status" wrapper (from panchang.py router)
        assert "days" in data, "Response missing 'days' field"
        assert "year" in data, "Response missing 'year' field"
        assert "month" in data, "Response missing 'month' field"
        assert isinstance(data["days"], list), "Days should be a list"
        assert len(data["days"]) > 0, "Days list should not be empty"
        print(f"✓ Month panchang endpoint working: {data.get('hindu_month')} {data.get('year')}, {len(data.get('days', []))} days")
    
    def test_get_all_festivals(self):
        """Test /api/festivals returns all festivals from database"""
        response = requests.get(f"{BASE_URL}/api/festivals")
        assert response.status_code == 200, f"Get all festivals failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "festivals" in data, "Response missing 'festivals' field"
        print(f"✓ All festivals endpoint working: {data.get('count', 0)} festivals")
    
    def test_get_year_festivals(self):
        """Test /api/festivals/year/{year} returns festivals for a year"""
        response = requests.get(f"{BASE_URL}/api/festivals/year/2026")
        assert response.status_code == 200, f"Get year festivals failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected status: {data}"
        assert "festivals" in data, "Response missing 'festivals' field"
        assert data.get("year") == 2026, "Year should be 2026"
        print(f"✓ Year festivals endpoint working: {data.get('count', 0)} festivals for 2026")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
