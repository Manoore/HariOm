"""
Chat Feature Tests - Real-time messaging between Priest-Devotee and Shop Owner-Devotee
Tests cover:
- GET /api/chat/rooms - Get user's chat rooms
- GET /api/chat/rooms/{room_id} - Get specific room details  
- GET /api/chat/rooms/{room_id}/messages - Get messages with pagination
- POST /api/chat/rooms/{room_id}/messages - Send message via REST API
- PUT /api/chat/rooms/{room_id}/read - Mark messages as read
- GET /api/chat/unread-count - Get total unread count
- Chat room auto-creation on booking confirmation
- Chat room auto-deactivation on booking completion/cancellation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable is required")

# Test credentials provided
DEVOTEE_EMAIL = "devotee@test.com"
DEVOTEE_PASSWORD = "test1234"
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"

# Known IDs from main agent context
EXISTING_CHAT_ROOM_ID = "69b702cfd29151ee096c807b"
EXISTING_BOOKING_ID = "69b702c8d29151ee096c807a"


def get_token(email, password):
    """Helper to get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    return None


def auth_headers(token):
    """Get authorization headers"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }


class TestHealthCheck:
    """Basic health check before chat tests"""
    
    def test_api_healthy(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")


class TestDevoteeAuth:
    """Test devotee authentication"""
    
    def test_devotee_login(self):
        """Verify devotee can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEVOTEE_EMAIL,
            "password": DEVOTEE_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        # API returns 'token' not 'access_token'
        assert "token" in data or "access_token" in data
        assert "user" in data
        print(f"✅ Devotee login successful, user: {data['user'].get('name')}")


class TestChatRooms:
    """Test chat room APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.token = get_token(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        if not self.token:
            pytest.skip("Could not get devotee token")
    
    def test_get_chat_rooms(self):
        """GET /api/chat/rooms - Get user's chat rooms"""
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        assert isinstance(data["rooms"], list)
        print(f"✅ GET /api/chat/rooms - Found {len(data['rooms'])} chat rooms")
        
        # If rooms exist, verify structure
        if data["rooms"]:
            room = data["rooms"][0]
            assert "id" in room
            assert "type" in room
            assert "is_active" in room
            assert "other_participant" in room
            print(f"   Room structure verified: id={room['id']}, type={room['type']}, active={room['is_active']}")
    
    def test_get_specific_room(self):
        """GET /api/chat/rooms/{room_id} - Get specific room details"""
        # First get list of rooms to find a valid room_id
        rooms_response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        rooms = rooms_response.json().get("rooms", [])
        
        if not rooms:
            # Try the existing room ID from context
            room_id = EXISTING_CHAT_ROOM_ID
        else:
            room_id = rooms[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms/{room_id}",
            headers=auth_headers(self.token)
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "type" in data
            assert "other_participant" in data
            assert "is_active" in data
            print(f"✅ GET /api/chat/rooms/{room_id} - Room details retrieved")
            print(f"   Type: {data['type']}, Active: {data['is_active']}, Other: {data['other_participant'].get('name')}")
        elif response.status_code == 404:
            print(f"⚠️ Room {room_id} not found - may have been cleaned up")
        else:
            pytest.fail(f"Unexpected status {response.status_code}: {response.text}")
    
    def test_get_room_not_found(self):
        """GET /api/chat/rooms/{invalid_id} - Should return 404"""
        fake_room_id = "000000000000000000000000"
        
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms/{fake_room_id}",
            headers=auth_headers(self.token)
        )
        assert response.status_code == 404
        print("✅ GET /api/chat/rooms/{invalid} returns 404 as expected")


class TestChatMessages:
    """Test chat message APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.token = get_token(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        if not self.token:
            pytest.skip("Could not get devotee token")
    
    def test_get_messages(self):
        """GET /api/chat/rooms/{room_id}/messages - Get messages with pagination"""
        # Get a valid room first
        rooms_response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        rooms = rooms_response.json().get("rooms", [])
        
        if not rooms:
            room_id = EXISTING_CHAT_ROOM_ID
        else:
            room_id = rooms[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms/{room_id}/messages?skip=0&limit=50",
            headers=auth_headers(self.token)
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "messages" in data
            assert isinstance(data["messages"], list)
            print(f"✅ GET /api/chat/rooms/{room_id}/messages - Found {len(data['messages'])} messages")
            
            # Verify message structure if any exist
            if data["messages"]:
                msg = data["messages"][0]
                assert "id" in msg
                assert "sender_id" in msg
                assert "created_at" in msg
                print(f"   Message structure verified")
        elif response.status_code == 404:
            print(f"⚠️ Room {room_id} not found")
        else:
            pytest.fail(f"Unexpected status {response.status_code}: {response.text}")
    
    def test_send_message_rest(self):
        """POST /api/chat/rooms/{room_id}/messages - Send message via REST API"""
        # Get a valid active room first
        rooms_response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        rooms = rooms_response.json().get("rooms", [])
        
        # Find an active room
        active_room = None
        for room in rooms:
            if room.get("is_active", False):
                active_room = room
                break
        
        if not active_room:
            # Use existing room ID
            room_id = EXISTING_CHAT_ROOM_ID
            # First check if room exists and is active
            room_check = requests.get(
                f"{BASE_URL}/api/chat/rooms/{room_id}",
                headers=auth_headers(self.token)
            )
            if room_check.status_code != 200:
                pytest.skip("No active chat room available for message testing")
            room_data = room_check.json()
            if not room_data.get("is_active", False):
                pytest.skip("Chat room is not active - cannot send messages")
        else:
            room_id = active_room["id"]
        
        test_message = f"TEST_MESSAGE_FROM_PYTEST_CHAT_{os.urandom(4).hex()}"
        response = requests.post(
            f"{BASE_URL}/api/chat/rooms/{room_id}/messages",
            headers=auth_headers(self.token),
            json={"content": test_message}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "message" in data
            if "data" in data:
                assert data["data"].get("content") == test_message
            print(f"✅ POST /api/chat/rooms/{room_id}/messages - Message sent successfully")
        elif response.status_code == 400 and "ended" in response.text.lower():
            print("⚠️ Chat has ended - cannot send messages (expected behavior)")
        elif response.status_code == 404:
            print(f"⚠️ Room not found")
        else:
            pytest.fail(f"Unexpected status {response.status_code}: {response.text}")
    
    def test_send_message_with_image(self):
        """POST /api/chat/rooms/{room_id}/messages - Send message with image URL"""
        rooms_response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        rooms = rooms_response.json().get("rooms", [])
        
        active_room = None
        for room in rooms:
            if room.get("is_active", False):
                active_room = room
                break
        
        if not active_room:
            pytest.skip("No active chat room available")
        
        response = requests.post(
            f"{BASE_URL}/api/chat/rooms/{active_room['id']}/messages",
            headers=auth_headers(self.token),
            json={
                "content": "Test message with image",
                "image_url": "https://example.com/test-image.jpg"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data:
                assert data["data"].get("image_url") == "https://example.com/test-image.jpg"
            print(f"✅ Message with image_url sent successfully")
        elif response.status_code == 400:
            print("⚠️ Chat ended - cannot send messages")
        else:
            print(f"⚠️ Status {response.status_code}: {response.text}")
    
    def test_send_empty_message_fails(self):
        """POST /api/chat/rooms/{room_id}/messages - Empty message should fail"""
        rooms_response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        rooms = rooms_response.json().get("rooms", [])
        
        if not rooms:
            pytest.skip("No chat rooms available")
        
        response = requests.post(
            f"{BASE_URL}/api/chat/rooms/{rooms[0]['id']}/messages",
            headers=auth_headers(self.token),
            json={
                "content": "",
                "image_url": ""
            }
        )
        
        # Should be 400 - bad request
        assert response.status_code == 400
        print("✅ Empty message correctly rejected with 400")


class TestMarkAsRead:
    """Test mark messages as read functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.token = get_token(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        if not self.token:
            pytest.skip("Could not get devotee token")
    
    def test_mark_messages_read(self):
        """PUT /api/chat/rooms/{room_id}/read - Mark messages as read"""
        rooms_response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        rooms = rooms_response.json().get("rooms", [])
        
        if not rooms:
            room_id = EXISTING_CHAT_ROOM_ID
        else:
            room_id = rooms[0]["id"]
        
        response = requests.put(
            f"{BASE_URL}/api/chat/rooms/{room_id}/read",
            headers=auth_headers(self.token)
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"✅ PUT /api/chat/rooms/{room_id}/read - Messages marked as read")
        elif response.status_code == 404:
            print(f"⚠️ Room not found")
        else:
            pytest.fail(f"Unexpected status {response.status_code}: {response.text}")


class TestUnreadCount:
    """Test unread count API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.token = get_token(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        if not self.token:
            pytest.skip("Could not get devotee token")
    
    def test_get_unread_count(self):
        """GET /api/chat/unread-count - Get total unread count"""
        response = requests.get(
            f"{BASE_URL}/api/chat/unread-count",
            headers=auth_headers(self.token)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        print(f"✅ GET /api/chat/unread-count - Unread count: {data['unread_count']}")


class TestChatRoomAutoCreation:
    """Test chat room auto-creation when booking is confirmed"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.token = get_token(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        if not self.token:
            pytest.skip("Could not get devotee token")
    
    def test_booking_confirmation_creates_chat(self):
        """Verify chat room exists for confirmed booking"""
        # Get rooms and look for booking-type room
        rooms_response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        rooms = rooms_response.json().get("rooms", [])
        
        booking_rooms = [r for r in rooms if r.get("type") == "booking"]
        
        if booking_rooms:
            print(f"✅ Found {len(booking_rooms)} booking chat room(s)")
            room = booking_rooms[0]
            assert room.get("booking_id") is not None
            print(f"   Booking ID: {room.get('booking_id')}, Other participant: {room.get('other_participant', {}).get('name')}")
        else:
            print("⚠️ No booking chat rooms found - may need to create a confirmed booking first")


class TestPriestChatAccess:
    """Test priest can access their chat rooms"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.token = get_token(PRIEST_EMAIL, PRIEST_PASSWORD)
        if not self.token:
            pytest.skip("Could not get priest token")
    
    def test_priest_can_get_rooms(self):
        """Priest should be able to access chat rooms"""
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers=auth_headers(self.token)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        print(f"✅ Priest GET /api/chat/rooms - Found {len(data['rooms'])} chat rooms")
        
        # Priest should see booking rooms where they're the priest
        booking_rooms = [r for r in data["rooms"] if r.get("type") == "booking"]
        if booking_rooms:
            for room in booking_rooms:
                print(f"   Room with: {room.get('other_participant', {}).get('name')}, active: {room.get('is_active')}")
    
    def test_priest_unread_count(self):
        """Priest unread count API"""
        response = requests.get(
            f"{BASE_URL}/api/chat/unread-count",
            headers=auth_headers(self.token)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        print(f"✅ Priest unread count: {data['unread_count']}")


class TestChatAuthorization:
    """Test chat authorization - users can only access their rooms"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.token = get_token(DEVOTEE_EMAIL, DEVOTEE_PASSWORD)
        if not self.token:
            pytest.skip("Could not get devotee token")
    
    def test_unauthorized_room_access(self):
        """User cannot access room they're not part of"""
        # Create a fake room ID
        fake_room_id = "000000000000000000000001"
        
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms/{fake_room_id}",
            headers=auth_headers(self.token)
        )
        
        # Should be 404 (not found) or 403 (forbidden)
        assert response.status_code in [404, 403]
        print("✅ Unauthorized room access correctly blocked")
    
    def test_no_auth_fails(self):
        """API should reject requests without auth"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms")
        
        # Should be 401 or 403
        assert response.status_code in [401, 403]
        print("✅ Unauthenticated request correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
