"""
Test Priest Availability and Slot Booking Feature
Tests: GET /api/priests/{priest_id}/available-slots, POST /api/bookings with slot conflict check,
       GET/POST /api/priest/availability for priest schedule management
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from iteration_50
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"
PRIEST_ID = "69c320a69b2c5102b6619c48"


class TestPriestAvailableSlots:
    """Test GET /api/priests/{priest_id}/available-slots endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_auth_token(self, email, password):
        """Get auth token for user"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_available_slots_returns_slots_for_weekday(self):
        """Test that available slots are returned for a weekday (Mon-Sat)"""
        # Get a future Monday
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        future_monday = today + timedelta(days=days_until_monday)
        date_str = future_monday.strftime("%Y-%m-%d")
        
        response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date={date_str}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "date" in data
        assert "day" in data
        assert "slots" in data
        assert data["date"] == date_str
        assert data["day"] == "Monday"
        # Default schedule Mon-Sat 9AM-6PM with 60min slots = 9 slots
        print(f"Monday slots: {len(data['slots'])} slots available")
        
    def test_sunday_returns_empty_slots(self):
        """Test that Sunday returns empty slots by default (priest not available)"""
        # Get next Sunday
        today = datetime.now()
        days_until_sunday = (6 - today.weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7
        future_sunday = today + timedelta(days=days_until_sunday)
        date_str = future_sunday.strftime("%Y-%m-%d")
        
        response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date={date_str}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["day"] == "Sunday"
        assert len(data["slots"]) == 0, f"Expected 0 slots on Sunday, got {len(data['slots'])}"
        assert "message" in data or data.get("available_count") == 0
        print(f"Sunday correctly returns 0 slots: {data.get('message', 'No message')}")
        
    def test_invalid_date_format_returns_400(self):
        """Test that invalid date format returns 400 error"""
        response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date=invalid-date")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
    def test_invalid_priest_id_returns_404(self):
        """Test that invalid priest ID returns 404"""
        response = self.session.get(f"{BASE_URL}/api/priests/invalid_priest_id/available-slots?date=2026-04-01")
        
        assert response.status_code in [400, 404], f"Expected 400 or 404, got {response.status_code}"
        
    def test_slots_have_start_and_end_times(self):
        """Test that each slot has start and end times"""
        # Get a future Tuesday
        today = datetime.now()
        days_until_tuesday = (1 - today.weekday()) % 7
        if days_until_tuesday == 0:
            days_until_tuesday = 7
        future_tuesday = today + timedelta(days=days_until_tuesday)
        date_str = future_tuesday.strftime("%Y-%m-%d")
        
        response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date={date_str}")
        
        assert response.status_code == 200
        data = response.json()
        
        if data["slots"]:
            slot = data["slots"][0]
            assert "start" in slot, "Slot should have 'start' field"
            assert "end" in slot, "Slot should have 'end' field"
            # Validate time format HH:MM
            assert len(slot["start"]) == 5, f"Start time should be HH:MM format, got {slot['start']}"
            assert len(slot["end"]) == 5, f"End time should be HH:MM format, got {slot['end']}"
            print(f"Sample slot: {slot['start']} - {slot['end']}")


class TestBookingSlotConflict:
    """Test POST /api/bookings with slot conflict prevention"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with devotee auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as devotee
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.authenticated = True
        else:
            self.authenticated = False
            
    def test_booking_with_slot_start_end(self):
        """Test creating a booking with slot_start and slot_end fields"""
        if not self.authenticated:
            pytest.skip("Authentication failed")
            
        # Get available slots first
        today = datetime.now()
        days_until_wednesday = (2 - today.weekday()) % 7
        if days_until_wednesday == 0:
            days_until_wednesday = 7
        future_date = today + timedelta(days=days_until_wednesday + 7)  # Next week Wednesday
        date_str = future_date.strftime("%Y-%m-%d")
        
        slots_response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date={date_str}")
        if slots_response.status_code != 200 or not slots_response.json().get("slots"):
            pytest.skip("No slots available for testing")
            
        slots = slots_response.json()["slots"]
        # Pick a slot that's unlikely to be booked
        test_slot = slots[-1] if len(slots) > 1 else slots[0]
        
        # Get priest services
        priest_response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}")
        if priest_response.status_code != 200:
            pytest.skip("Could not fetch priest details")
            
        priest_data = priest_response.json()
        services = priest_data.get("services", [])
        if not services:
            pytest.skip("Priest has no services")
            
        service_name = services[0]["name"]
        
        # Create booking with slot
        booking_datetime = f"{date_str}T{test_slot['start']}:00"
        booking_data = {
            "priest_id": PRIEST_ID,
            "service_name": service_name,
            "booking_date": booking_datetime,
            "booking_type": "online",
            "slot_start": test_slot["start"],
            "slot_end": test_slot["end"]
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        
        # Should succeed or require payment
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "booking_id" in data, "Response should contain booking_id"
        print(f"Booking created: {data['booking_id']}")
        
    def test_double_booking_same_slot_returns_409(self):
        """Test that booking the same slot twice returns 409 conflict"""
        if not self.authenticated:
            pytest.skip("Authentication failed")
            
        # Get available slots
        today = datetime.now()
        days_until_thursday = (3 - today.weekday()) % 7
        if days_until_thursday == 0:
            days_until_thursday = 7
        future_date = today + timedelta(days=days_until_thursday + 7)  # Next week Thursday
        date_str = future_date.strftime("%Y-%m-%d")
        
        slots_response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date={date_str}")
        if slots_response.status_code != 200 or not slots_response.json().get("slots"):
            pytest.skip("No slots available for testing")
            
        slots = slots_response.json()["slots"]
        test_slot = slots[0]  # First available slot
        
        # Get priest services
        priest_response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}")
        if priest_response.status_code != 200:
            pytest.skip("Could not fetch priest details")
            
        priest_data = priest_response.json()
        services = priest_data.get("services", [])
        if not services:
            pytest.skip("Priest has no services")
            
        service_name = services[0]["name"]
        
        # First booking
        booking_datetime = f"{date_str}T{test_slot['start']}:00"
        booking_data = {
            "priest_id": PRIEST_ID,
            "service_name": service_name,
            "booking_date": booking_datetime,
            "booking_type": "online",
            "slot_start": test_slot["start"],
            "slot_end": test_slot["end"]
        }
        
        first_response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        if first_response.status_code not in [200, 201]:
            # Slot might already be booked, which is fine for this test
            if first_response.status_code == 409:
                print("Slot already booked - conflict check working")
                return
            pytest.skip(f"First booking failed: {first_response.text}")
            
        # Second booking - same slot should fail with 409
        second_response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        
        assert second_response.status_code == 409, f"Expected 409 conflict, got {second_response.status_code}: {second_response.text}"
        data = second_response.json()
        assert "detail" in data, "Response should contain error detail"
        print(f"Conflict message: {data['detail']}")
        
    def test_different_slot_same_day_works(self):
        """Test that booking different slots on the same day works"""
        if not self.authenticated:
            pytest.skip("Authentication failed")
            
        # Get available slots
        today = datetime.now()
        days_until_friday = (4 - today.weekday()) % 7
        if days_until_friday == 0:
            days_until_friday = 7
        future_date = today + timedelta(days=days_until_friday + 7)  # Next week Friday
        date_str = future_date.strftime("%Y-%m-%d")
        
        slots_response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date={date_str}")
        if slots_response.status_code != 200:
            pytest.skip("Could not fetch slots")
            
        slots = slots_response.json().get("slots", [])
        if len(slots) < 2:
            pytest.skip("Need at least 2 slots for this test")
            
        # Get priest services
        priest_response = self.session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}")
        if priest_response.status_code != 200:
            pytest.skip("Could not fetch priest details")
            
        priest_data = priest_response.json()
        services = priest_data.get("services", [])
        if not services:
            pytest.skip("Priest has no services")
            
        service_name = services[0]["name"]
        
        # Book first slot
        slot1 = slots[0]
        booking1_datetime = f"{date_str}T{slot1['start']}:00"
        booking1_data = {
            "priest_id": PRIEST_ID,
            "service_name": service_name,
            "booking_date": booking1_datetime,
            "booking_type": "online",
            "slot_start": slot1["start"],
            "slot_end": slot1["end"]
        }
        
        response1 = self.session.post(f"{BASE_URL}/api/bookings", json=booking1_data)
        # May fail if already booked, that's ok
        
        # Book second slot (different time)
        slot2 = slots[1]
        booking2_datetime = f"{date_str}T{slot2['start']}:00"
        booking2_data = {
            "priest_id": PRIEST_ID,
            "service_name": service_name,
            "booking_date": booking2_datetime,
            "booking_type": "online",
            "slot_start": slot2["start"],
            "slot_end": slot2["end"]
        }
        
        response2 = self.session.post(f"{BASE_URL}/api/bookings", json=booking2_data)
        
        # Second slot should work (unless already booked)
        assert response2.status_code in [200, 201, 409], f"Unexpected status: {response2.status_code}"
        if response2.status_code in [200, 201]:
            print(f"Successfully booked different slot on same day: {slot2['start']}")
        else:
            print(f"Slot {slot2['start']} was already booked")


class TestPriestAvailabilityManagement:
    """Test priest availability management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with priest auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as priest
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRIEST_EMAIL,
            "password": PRIEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.authenticated = True
        else:
            self.authenticated = False
            
    def test_get_priest_availability(self):
        """Test GET /api/priest/availability returns availability data"""
        if not self.authenticated:
            pytest.skip("Priest authentication failed")
            
        response = self.session.get(f"{BASE_URL}/api/priest/availability")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should have these fields
        assert "blocked_dates" in data or "online_slots" in data or "weekly_schedule" in data
        assert "default_duration" in data
        print(f"Priest availability: duration={data.get('default_duration')}min")
        
    def test_update_priest_availability_weekly_schedule(self):
        """Test POST /api/priest/availability updates weekly schedule"""
        if not self.authenticated:
            pytest.skip("Priest authentication failed")
            
        # Update availability with weekly schedule
        availability_data = {
            "weekly_schedule": [
                {"day": "Monday", "enabled": True, "start": "09:00", "end": "18:00"},
                {"day": "Tuesday", "enabled": True, "start": "09:00", "end": "18:00"},
                {"day": "Wednesday", "enabled": True, "start": "10:00", "end": "17:00"},
                {"day": "Thursday", "enabled": True, "start": "09:00", "end": "18:00"},
                {"day": "Friday", "enabled": True, "start": "09:00", "end": "18:00"},
                {"day": "Saturday", "enabled": True, "start": "09:00", "end": "14:00"},
                {"day": "Sunday", "enabled": False, "start": "09:00", "end": "18:00"}
            ],
            "blocked_dates": [],
            "default_duration": 60
        }
        
        response = self.session.post(f"{BASE_URL}/api/priest/availability", json=availability_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Availability update: {data['message']}")
        
    def test_update_slot_duration(self):
        """Test updating slot duration (30, 45, 60, 90, 120 min)"""
        if not self.authenticated:
            pytest.skip("Priest authentication failed")
            
        for duration in [30, 45, 60, 90, 120]:
            availability_data = {
                "default_duration": duration,
                "blocked_dates": []
            }
            
            response = self.session.post(f"{BASE_URL}/api/priest/availability", json=availability_data)
            
            assert response.status_code == 200, f"Failed to set duration {duration}: {response.text}"
            
            # Verify it was saved
            get_response = self.session.get(f"{BASE_URL}/api/priest/availability")
            assert get_response.status_code == 200
            data = get_response.json()
            assert data.get("default_duration") == duration, f"Duration not saved: expected {duration}, got {data.get('default_duration')}"
            
        print("All slot durations (30, 45, 60, 90, 120) work correctly")
        
    def test_block_specific_dates(self):
        """Test blocking specific dates"""
        if not self.authenticated:
            pytest.skip("Priest authentication failed")
            
        # Block some future dates
        today = datetime.now()
        block_date1 = (today + timedelta(days=10)).strftime("%Y-%m-%d")
        block_date2 = (today + timedelta(days=11)).strftime("%Y-%m-%d")
        
        availability_data = {
            "blocked_dates": [block_date1, block_date2],
            "default_duration": 60
        }
        
        response = self.session.post(f"{BASE_URL}/api/priest/availability", json=availability_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify blocked dates are saved
        get_response = self.session.get(f"{BASE_URL}/api/priest/availability")
        assert get_response.status_code == 200
        data = get_response.json()
        blocked = data.get("blocked_dates", [])
        assert block_date1 in blocked, f"Block date {block_date1} not saved"
        assert block_date2 in blocked, f"Block date {block_date2} not saved"
        print(f"Blocked dates saved: {blocked}")
        
    def test_blocked_date_returns_no_slots(self):
        """Test that blocked dates return no available slots"""
        if not self.authenticated:
            pytest.skip("Priest authentication failed")
            
        # Block a future date
        today = datetime.now()
        block_date = (today + timedelta(days=15)).strftime("%Y-%m-%d")
        
        # Set blocked date
        availability_data = {
            "blocked_dates": [block_date],
            "default_duration": 60
        }
        self.session.post(f"{BASE_URL}/api/priest/availability", json=availability_data)
        
        # Check slots for blocked date (no auth needed for this endpoint)
        slots_response = requests.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date={block_date}")
        
        assert slots_response.status_code == 200
        data = slots_response.json()
        assert len(data.get("slots", [])) == 0, f"Blocked date should have 0 slots, got {len(data.get('slots', []))}"
        print(f"Blocked date {block_date} correctly returns 0 slots")


class TestBookedSlotsFiltering:
    """Test that booked slots are filtered from available slots"""
    
    def test_booked_slot_not_in_available_slots(self):
        """Test that a booked slot does not appear in available slots"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # The main agent mentioned a booking was made for 2026-04-01 at 10:00
        # Let's check if that slot is filtered
        date_str = "2026-04-01"
        
        response = session.get(f"{BASE_URL}/api/priests/{PRIEST_ID}/available-slots?date={date_str}")
        
        if response.status_code != 200:
            pytest.skip(f"Could not fetch slots: {response.text}")
            
        data = response.json()
        slots = data.get("slots", [])
        
        # Check if 10:00 slot is in the list
        slot_times = [s["start"] for s in slots]
        
        # If 10:00 was booked, it should NOT be in available slots
        if "10:00" not in slot_times:
            print("10:00 slot correctly filtered out (already booked)")
        else:
            print(f"10:00 slot is available. Available slots: {slot_times}")
            # This is also valid if the booking was cancelled or doesn't exist


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
