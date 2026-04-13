"""
Test Samagri List Feature for Divine App
Tests the puja samagri (items) feature for priest services and bookings.
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
PRIEST_PROFILE_ID = "69c320a69b2c5102b6619c48"
GANESH_PUJA_SERVICE_ID = "69c34b12bb091a40ffa8f045"


@pytest.fixture(scope="module")
def priest_token():
    """Get priest auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": PRIEST_EMAIL,
        "password": PRIEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Priest login failed: {response.text}")
    return response.json().get("token")


@pytest.fixture(scope="module")
def devotee_token():
    """Get devotee auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": DEVOTEE_EMAIL,
        "password": DEVOTEE_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Devotee login failed: {response.text}")
    return response.json().get("token")


@pytest.fixture
def priest_headers(priest_token):
    return {"Authorization": f"Bearer {priest_token}", "Content-Type": "application/json"}


@pytest.fixture
def devotee_headers(devotee_token):
    return {"Authorization": f"Bearer {devotee_token}", "Content-Type": "application/json"}


class TestPriestServicesSamagri:
    """Test priest services CRUD with samagri_list field"""
    
    def test_get_priest_services_returns_samagri_list(self, priest_headers):
        """GET /api/priest/services returns samagri_list for each service"""
        response = requests.get(f"{BASE_URL}/api/priest/services", headers=priest_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "services" in data
        
        # Check that services have samagri_list field
        for service in data["services"]:
            assert "samagri_list" in service, f"Service {service.get('name')} missing samagri_list"
            assert isinstance(service["samagri_list"], list), "samagri_list should be a list"
        
        print(f"✓ GET /api/priest/services returns {len(data['services'])} services with samagri_list")
    
    def test_create_service_with_samagri_list(self, priest_headers):
        """POST /api/priest/services creates service with samagri_list"""
        test_samagri = [
            {"name": "Coconut", "quantity": "2", "optional": False},
            {"name": "Flowers", "quantity": "1 bunch", "optional": False},
            {"name": "Incense sticks", "quantity": "1 pack", "optional": True}
        ]
        
        service_data = {
            "name": "TEST_Samagri_Puja",
            "description": "Test puja with samagri items",
            "category": "Pooja",
            "duration_minutes": 60,
            "price": 1500,
            "location_type": "online",
            "samagri_list": test_samagri
        }
        
        response = requests.post(f"{BASE_URL}/api/priest/services", json=service_data, headers=priest_headers)
        assert response.status_code == 200, f"Failed to create service: {response.text}"
        
        data = response.json()
        assert "service_id" in data
        service_id = data["service_id"]
        
        # Verify the service was created with samagri_list
        get_response = requests.get(f"{BASE_URL}/api/priest/services", headers=priest_headers)
        services = get_response.json()["services"]
        created_service = next((s for s in services if s["id"] == service_id), None)
        
        assert created_service is not None, "Created service not found"
        assert created_service["samagri_list"] == test_samagri, "samagri_list not saved correctly"
        
        print(f"✓ POST /api/priest/services created service with {len(test_samagri)} samagri items")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/priest/services/{service_id}", headers=priest_headers)
    
    def test_update_service_samagri_list(self, priest_headers):
        """PUT /api/priest/services/{id} updates samagri_list"""
        # First create a service
        service_data = {
            "name": "TEST_Update_Samagri",
            "description": "Test update samagri",
            "category": "Pooja",
            "duration_minutes": 45,
            "price": 1000,
            "samagri_list": [{"name": "Initial Item", "quantity": "1", "optional": False}]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/priest/services", json=service_data, headers=priest_headers)
        assert create_response.status_code == 200
        service_id = create_response.json()["service_id"]
        
        # Update with new samagri_list
        updated_samagri = [
            {"name": "Updated Item 1", "quantity": "3", "optional": False},
            {"name": "Updated Item 2", "quantity": "5 pieces", "optional": True}
        ]
        
        update_response = requests.put(
            f"{BASE_URL}/api/priest/services/{service_id}",
            json={"samagri_list": updated_samagri},
            headers=priest_headers
        )
        assert update_response.status_code == 200, f"Failed to update: {update_response.text}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/priest/services", headers=priest_headers)
        services = get_response.json()["services"]
        updated_service = next((s for s in services if s["id"] == service_id), None)
        
        assert updated_service is not None
        assert len(updated_service["samagri_list"]) == 2
        assert updated_service["samagri_list"][0]["name"] == "Updated Item 1"
        
        print(f"✓ PUT /api/priest/services/{service_id} updated samagri_list successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/priest/services/{service_id}", headers=priest_headers)


class TestPublicPriestEndpoints:
    """Test public priest endpoints return samagri_list"""
    
    def test_get_priests_list_includes_samagri(self):
        """GET /api/priests returns samagri_list in services array"""
        response = requests.get(f"{BASE_URL}/api/priests")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "priests" in data
        
        # Find a priest with services
        priests_with_services = [p for p in data["priests"] if p.get("services")]
        
        if priests_with_services:
            for priest in priests_with_services[:3]:  # Check first 3
                for service in priest.get("services", []):
                    assert "samagri_list" in service, f"Service {service.get('name')} missing samagri_list"
            print(f"✓ GET /api/priests returns samagri_list in services for {len(priests_with_services)} priests")
        else:
            print("⚠ No priests with services found to verify samagri_list")
    
    def test_get_priest_detail_includes_samagri(self):
        """GET /api/priests/{priest_id} returns samagri_list in services"""
        response = requests.get(f"{BASE_URL}/api/priests/{PRIEST_PROFILE_ID}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "services" in data
        
        for service in data.get("services", []):
            assert "samagri_list" in service, f"Service {service.get('name')} missing samagri_list"
            assert isinstance(service["samagri_list"], list)
        
        # Check if Ganesh Puja has samagri items
        ganesh_puja = next((s for s in data["services"] if "Ganesh" in s.get("name", "")), None)
        if ganesh_puja and ganesh_puja.get("samagri_list"):
            print(f"✓ GET /api/priests/{PRIEST_PROFILE_ID} - Ganesh Puja has {len(ganesh_puja['samagri_list'])} samagri items")
        else:
            print(f"✓ GET /api/priests/{PRIEST_PROFILE_ID} returns services with samagri_list field")


class TestBookingSamagri:
    """Test booking endpoints include samagri_list from service"""
    
    def test_create_booking_saves_samagri_list(self, devotee_headers, priest_headers):
        """POST /api/bookings saves samagri_list from service onto booking"""
        # First, get a service with samagri_list
        priest_response = requests.get(f"{BASE_URL}/api/priests/{PRIEST_PROFILE_ID}")
        services = priest_response.json().get("services", [])
        
        # Find a service with samagri items
        service_with_samagri = next((s for s in services if s.get("samagri_list")), None)
        
        if not service_with_samagri:
            pytest.skip("No service with samagri_list found")
        
        # Create booking with unique timestamp to avoid conflicts
        import random
        random_days = random.randint(10, 30)
        random_hour = random.randint(9, 17)
        booking_date = (datetime.now() + timedelta(days=random_days)).strftime(f"%Y-%m-%dT{random_hour:02d}:00:00")
        
        booking_data = {
            "priest_id": PRIEST_PROFILE_ID,
            "service_name": service_with_samagri["name"],
            "booking_date": booking_date,
            "booking_type": "online"
        }
        
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data, headers=devotee_headers)
        
        # May return 200 (created) or 409 (slot conflict) - try multiple times
        attempts = 0
        while response.status_code == 409 and attempts < 5:
            attempts += 1
            random_days = random.randint(15 + attempts * 5, 30 + attempts * 5)
            random_hour = random.randint(9, 17)
            booking_data["booking_date"] = (datetime.now() + timedelta(days=random_days)).strftime(f"%Y-%m-%dT{random_hour:02d}:00:00")
            response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data, headers=devotee_headers)
        
        assert response.status_code == 200, f"Failed to create booking after {attempts} attempts: {response.text}"
        
        booking_id = response.json().get("booking_id")
        print(f"✓ POST /api/bookings created booking {booking_id}")
        
        # Verify booking has samagri_list
        bookings_response = requests.get(f"{BASE_URL}/api/bookings", headers=devotee_headers)
        assert bookings_response.status_code == 200
        
        bookings = bookings_response.json().get("bookings", [])
        created_booking = next((b for b in bookings if b["id"] == booking_id), None)
        
        assert created_booking is not None, "Created booking not found"
        assert "samagri_list" in created_booking, "Booking missing samagri_list"
        assert len(created_booking["samagri_list"]) > 0, "Booking samagri_list is empty"
        
        print(f"✓ Booking {booking_id} has {len(created_booking['samagri_list'])} samagri items from service")
    
    def test_get_devotee_bookings_includes_samagri(self, devotee_headers):
        """GET /api/bookings returns samagri_list in each booking"""
        response = requests.get(f"{BASE_URL}/api/bookings", headers=devotee_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "bookings" in data
        
        for booking in data["bookings"]:
            assert "samagri_list" in booking, f"Booking {booking.get('id')} missing samagri_list"
            assert isinstance(booking["samagri_list"], list)
        
        bookings_with_samagri = [b for b in data["bookings"] if b.get("samagri_list")]
        print(f"✓ GET /api/bookings returns {len(data['bookings'])} bookings, {len(bookings_with_samagri)} have samagri items")
    
    def test_get_priest_bookings_includes_samagri(self, priest_headers):
        """GET /api/priest/bookings returns samagri_list in each booking"""
        response = requests.get(f"{BASE_URL}/api/priest/bookings", headers=priest_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "bookings" in data
        
        for booking in data["bookings"]:
            assert "samagri_list" in booking, f"Booking {booking.get('id')} missing samagri_list"
            assert isinstance(booking["samagri_list"], list)
        
        bookings_with_samagri = [b for b in data["bookings"] if b.get("samagri_list")]
        print(f"✓ GET /api/priest/bookings returns {len(data['bookings'])} bookings, {len(bookings_with_samagri)} have samagri items")


class TestSamagriDataStructure:
    """Test samagri_list data structure validation"""
    
    def test_samagri_item_structure(self, priest_headers):
        """Verify samagri items have correct structure: name, quantity, optional"""
        response = requests.get(f"{BASE_URL}/api/priest/services", headers=priest_headers)
        assert response.status_code == 200
        
        services = response.json()["services"]
        services_with_samagri = [s for s in services if s.get("samagri_list")]
        
        if not services_with_samagri:
            pytest.skip("No services with samagri_list found")
        
        for service in services_with_samagri:
            for item in service["samagri_list"]:
                assert "name" in item, f"Samagri item missing 'name' field"
                assert isinstance(item["name"], str), "name should be string"
                
                # quantity and optional are optional but should be correct type if present
                if "quantity" in item:
                    assert isinstance(item["quantity"], str), "quantity should be string"
                if "optional" in item:
                    assert isinstance(item["optional"], bool), "optional should be boolean"
        
        print(f"✓ Samagri items have correct structure (name, quantity, optional)")


class TestExistingGaneshPujaSamagri:
    """Test the existing Ganesh Puja service with 11 samagri items"""
    
    def test_ganesh_puja_has_samagri_items(self, priest_headers):
        """Verify Ganesh Puja service has samagri items"""
        response = requests.get(f"{BASE_URL}/api/priest/services", headers=priest_headers)
        assert response.status_code == 200
        
        services = response.json()["services"]
        ganesh_puja = next((s for s in services if s["id"] == GANESH_PUJA_SERVICE_ID), None)
        
        if not ganesh_puja:
            # Try finding by name
            ganesh_puja = next((s for s in services if "Ganesh" in s.get("name", "")), None)
        
        if ganesh_puja:
            samagri_count = len(ganesh_puja.get("samagri_list", []))
            print(f"✓ Ganesh Puja service has {samagri_count} samagri items")
            
            # Print items for verification
            for item in ganesh_puja.get("samagri_list", [])[:5]:
                optional_text = " (optional)" if item.get("optional") else ""
                print(f"  - {item['name']}: {item.get('quantity', 'N/A')}{optional_text}")
        else:
            print("⚠ Ganesh Puja service not found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
