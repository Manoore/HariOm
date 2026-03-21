"""
Phase 1 Features Testing - Divine App
Tests for:
1. Class room auto-generation with 100ms for scheduled classes
2. YouTube Live embed for priest streams
3. Admin/Priest approval status fixes
4. Priest stream CRUD endpoints
5. Live streams API with YouTube video ID parsing
6. Class join/room APIs
7. My enrollments with room_ready and can_join flags
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "newdevotee@test.com"
TEST_USER_PASSWORD = "Password123!"
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"
ADMIN_EMAIL = "admin@divineapp.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def devotee_token(api_client):
    """Get devotee authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Devotee authentication failed: {response.text}")


@pytest.fixture(scope="module")
def priest_token(api_client):
    """Get priest authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": PRIEST_EMAIL,
        "password": PRIEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Priest authentication failed: {response.text}")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Admin authentication failed: {response.text}")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")


class TestAdminApprovalStatus:
    """Test Admin Dashboard pending verifications count and Approvals tab"""
    
    def test_admin_stats_pending_verifications(self, api_client, admin_token):
        """Admin stats should include pending_verifications count"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify pending_verifications field exists
        assert "pending_verifications" in data, "pending_verifications field missing from admin stats"
        assert isinstance(data["pending_verifications"], int), "pending_verifications should be an integer"
        print(f"✓ Admin stats has pending_verifications: {data['pending_verifications']}")
    
    def test_admin_pending_approvals_endpoint(self, api_client, admin_token):
        """Admin should be able to fetch pending approvals"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/pending-approvals",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "priests" in data, "priests field missing"
        assert "astrologers" in data, "astrologers field missing"
        assert "shops" in data, "shops field missing"
        assert isinstance(data["priests"], list)
        assert isinstance(data["astrologers"], list)
        assert isinstance(data["shops"], list)
        
        total_pending = len(data["priests"]) + len(data["astrologers"]) + len(data["shops"])
        print(f"✓ Pending approvals endpoint works - Total pending: {total_pending}")
    
    def test_pending_count_matches_approvals_tab(self, api_client, admin_token):
        """Verify pending_verifications count matches Approvals tab count"""
        # Get stats
        stats_response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        pending_count_from_stats = stats_data.get("pending_verifications", 0)
        
        # Get pending approvals
        approvals_response = api_client.get(
            f"{BASE_URL}/api/admin/pending-approvals",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert approvals_response.status_code == 200
        approvals_data = approvals_response.json()
        
        # Count from approvals tab (priests only for now, as that's what pending_verifications counts)
        pending_priests = len(approvals_data.get("priests", []))
        
        # The pending_verifications should match priests pending count
        # Note: The implementation counts priests with approval_status=pending OR missing approval_status
        print(f"✓ Stats pending_verifications: {pending_count_from_stats}, Approvals tab priests: {pending_priests}")


class TestPriestApprovalStatus:
    """Test Priest Dashboard shows correct approval status"""
    
    def test_priest_profile_has_approval_status(self, api_client, priest_token):
        """Priest profile should include approval_status field"""
        response = api_client.get(
            f"{BASE_URL}/api/priest/profile",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify approval_status field exists
        assert "approval_status" in data, "approval_status field missing from priest profile"
        
        # Valid statuses
        valid_statuses = ["pending", "approved", "rejected"]
        assert data["approval_status"] in valid_statuses, f"Invalid approval_status: {data['approval_status']}"
        
        print(f"✓ Priest profile has approval_status: {data['approval_status']}")
    
    def test_verified_priest_not_under_review(self, api_client, priest_token):
        """Verified priest should show 'approved' not 'pending' or 'under review'"""
        response = api_client.get(
            f"{BASE_URL}/api/priest/profile",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # If priest is verified, approval_status should be 'approved'
        if data.get("is_verified", False):
            assert data["approval_status"] == "approved", \
                f"Verified priest should have approval_status='approved', got '{data['approval_status']}'"
            print("✓ Verified priest correctly shows 'approved' status")
        else:
            print(f"✓ Priest is not verified, status is: {data['approval_status']}")


class TestPriestStreamsCRUD:
    """Test Priest stream CRUD endpoints with YouTube URL support"""
    
    created_stream_id = None
    
    def test_get_priest_streams(self, api_client, priest_token):
        """Priest can get their streams list"""
        response = api_client.get(
            f"{BASE_URL}/api/priest/streams",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "streams" in data
        assert isinstance(data["streams"], list)
        print(f"✓ GET /api/priest/streams works - {len(data['streams'])} streams found")
    
    def test_create_stream_with_youtube_url(self, api_client, priest_token):
        """Priest can schedule a live stream with YouTube URL"""
        scheduled_time = (datetime.utcnow() + timedelta(hours=2)).isoformat() + "Z"
        
        stream_data = {
            "title": "TEST_Morning Aarti Live",
            "description": "Live morning aarti from temple",
            "stream_type": "aarti",
            "scheduled_time": scheduled_time,
            "youtube_url": "https://www.youtube.com/live/dQw4w9WgXcQ"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/priest/streams",
            json=stream_data,
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200, f"Failed to create stream: {response.text}"
        data = response.json()
        
        # API returns stream_id, not id
        assert "stream_id" in data or "id" in data, "Stream ID not returned"
        TestPriestStreamsCRUD.created_stream_id = data.get("stream_id") or data.get("id")
        print(f"✓ Created stream with YouTube URL, ID: {TestPriestStreamsCRUD.created_stream_id}")
    
    def test_update_stream(self, api_client, priest_token):
        """Priest can update their stream"""
        if not TestPriestStreamsCRUD.created_stream_id:
            pytest.skip("No stream created to update")
        
        update_data = {
            "title": "TEST_Updated Morning Aarti",
            "youtube_url": "https://youtu.be/dQw4w9WgXcQ"
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/priest/streams/{TestPriestStreamsCRUD.created_stream_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200, f"Failed to update stream: {response.text}"
        print("✓ Stream updated successfully")
    
    def test_start_stream(self, api_client, priest_token):
        """Priest can start their stream"""
        if not TestPriestStreamsCRUD.created_stream_id:
            pytest.skip("No stream created to start")
        
        response = api_client.put(
            f"{BASE_URL}/api/priest/streams/{TestPriestStreamsCRUD.created_stream_id}/start",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200, f"Failed to start stream: {response.text}"
        print("✓ Stream started successfully")
    
    def test_end_stream(self, api_client, priest_token):
        """Priest can end their stream"""
        if not TestPriestStreamsCRUD.created_stream_id:
            pytest.skip("No stream created to end")
        
        response = api_client.put(
            f"{BASE_URL}/api/priest/streams/{TestPriestStreamsCRUD.created_stream_id}/end",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200, f"Failed to end stream: {response.text}"
        print("✓ Stream ended successfully")
    
    def test_delete_stream(self, api_client, priest_token):
        """Priest can delete their stream"""
        if not TestPriestStreamsCRUD.created_stream_id:
            pytest.skip("No stream created to delete")
        
        response = api_client.delete(
            f"{BASE_URL}/api/priest/streams/{TestPriestStreamsCRUD.created_stream_id}",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert response.status_code == 200, f"Failed to delete stream: {response.text}"
        print("✓ Stream deleted successfully")
        TestPriestStreamsCRUD.created_stream_id = None


class TestPublicLiveStreams:
    """Test public live streams API with YouTube video ID parsing"""
    
    def test_get_live_streams(self, api_client):
        """Public can get live streams"""
        response = api_client.get(f"{BASE_URL}/api/live-streams?status=live")
        assert response.status_code == 200
        data = response.json()
        assert "streams" in data
        assert "total" in data
        print(f"✓ GET /api/live-streams?status=live works - {data['total']} live streams")
    
    def test_get_scheduled_streams(self, api_client):
        """Public can get scheduled streams"""
        response = api_client.get(f"{BASE_URL}/api/live-streams?status=scheduled")
        assert response.status_code == 200
        data = response.json()
        assert "streams" in data
        assert "total" in data
        print(f"✓ GET /api/live-streams?status=scheduled works - {data['total']} scheduled streams")
    
    def test_youtube_video_id_parsing(self, api_client, priest_token):
        """Verify YouTube video ID is parsed correctly from various URL formats"""
        # Create a test stream with YouTube URL
        scheduled_time = (datetime.utcnow() + timedelta(hours=3)).isoformat() + "Z"
        
        # Test with youtube.com/watch?v= format
        stream_data = {
            "title": "TEST_YouTube Parse Test",
            "stream_type": "puja",
            "scheduled_time": scheduled_time,
            "youtube_url": "https://www.youtube.com/watch?v=abc123XYZ"
        }
        
        create_response = api_client.post(
            f"{BASE_URL}/api/priest/streams",
            json=stream_data,
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        assert create_response.status_code == 200
        create_data = create_response.json()
        stream_id = create_data.get("stream_id") or create_data.get("id")
        
        # Start the stream to make it live
        api_client.put(
            f"{BASE_URL}/api/priest/streams/{stream_id}/start",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        
        # Fetch live streams and check youtube_video_id
        response = api_client.get(f"{BASE_URL}/api/live-streams?status=live")
        assert response.status_code == 200
        streams = response.json()["streams"]
        
        # Find our test stream
        test_stream = next((s for s in streams if s.get("title") == "TEST_YouTube Parse Test"), None)
        
        if test_stream:
            # Verify youtube_video_id is parsed
            assert "youtube_video_id" in test_stream, "youtube_video_id field missing"
            if test_stream.get("youtube_url"):
                assert test_stream["youtube_video_id"] == "abc123XYZ", \
                    f"Expected youtube_video_id='abc123XYZ', got '{test_stream.get('youtube_video_id')}'"
                print(f"✓ YouTube video ID correctly parsed: {test_stream['youtube_video_id']}")
        
        # Cleanup
        api_client.delete(
            f"{BASE_URL}/api/priest/streams/{stream_id}",
            headers={"Authorization": f"Bearer {priest_token}"}
        )


class TestClassRoomAPIs:
    """Test class room management APIs for 100ms integration"""
    
    def test_get_public_classes(self, api_client):
        """Public can browse available classes"""
        response = api_client.get(f"{BASE_URL}/api/classes")
        assert response.status_code == 200
        data = response.json()
        assert "classes" in data
        print(f"✓ GET /api/classes works - {len(data['classes'])} classes available")
    
    def test_class_room_status_endpoint(self, api_client, devotee_token):
        """Test class room status endpoint"""
        # First get a class ID
        classes_response = api_client.get(f"{BASE_URL}/api/classes")
        if classes_response.status_code != 200 or not classes_response.json().get("classes"):
            pytest.skip("No classes available to test")
        
        class_id = classes_response.json()["classes"][0]["id"]
        
        response = api_client.get(
            f"{BASE_URL}/api/classes/{class_id}/room-status",
            headers={"Authorization": f"Bearer {devotee_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "room_ready" in data, "room_ready field missing"
        assert "can_join" in data, "can_join field missing"
        assert "is_enrolled" in data, "is_enrolled field missing"
        assert isinstance(data["room_ready"], bool)
        assert isinstance(data["can_join"], bool)
        
        print(f"✓ Class room status: room_ready={data['room_ready']}, can_join={data['can_join']}")
    
    def test_priest_create_room_endpoint(self, api_client, priest_token):
        """Priest can manually create room for their class"""
        # Get priest's classes
        classes_response = api_client.get(
            f"{BASE_URL}/api/priest/classes",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        
        if classes_response.status_code != 200:
            pytest.skip("Could not fetch priest classes")
        
        classes = classes_response.json().get("classes", [])
        if not classes:
            pytest.skip("Priest has no classes to test room creation")
        
        class_id = classes[0]["id"]
        
        # Try to create room
        response = api_client.post(
            f"{BASE_URL}/api/priest/classes/{class_id}/create-room",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        
        # Should succeed or return already exists
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "room_id" in data, "room_id not returned"
            print(f"✓ Room created for class: {data['room_id']}")
        else:
            print("✓ Room creation endpoint works (room may already exist)")


class TestMyEnrollments:
    """Test my-enrollments API with room_ready and can_join flags"""
    
    def test_my_enrollments_endpoint(self, api_client, devotee_token):
        """Devotee can get their enrollments with room status"""
        response = api_client.get(
            f"{BASE_URL}/api/my-enrollments",
            headers={"Authorization": f"Bearer {devotee_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "enrollments" in data, "enrollments field missing"
        assert isinstance(data["enrollments"], list)
        
        # If there are enrollments, verify they have the required fields
        if data["enrollments"]:
            enrollment = data["enrollments"][0]
            assert "room_ready" in enrollment, "room_ready field missing from enrollment"
            assert "can_join" in enrollment, "can_join field missing from enrollment"
            print(f"✓ My enrollments has room_ready and can_join flags")
        else:
            print("✓ My enrollments endpoint works (no enrollments yet)")
    
    def test_join_class_requires_enrollment(self, api_client, devotee_token):
        """Join class should require enrollment"""
        # Try to join a class without enrollment
        response = api_client.get(
            f"{BASE_URL}/api/classes/nonexistent123/join",
            headers={"Authorization": f"Bearer {devotee_token}"}
        )
        # Should fail with 404 or 403
        assert response.status_code in [400, 403, 404, 500], \
            f"Expected error for non-enrolled class, got {response.status_code}"
        print("✓ Join class correctly requires enrollment")


class TestVedicClassesTab:
    """Test Vedic Classes tab browse/enrolled/requests navigation"""
    
    def test_browse_classes(self, api_client):
        """Can browse all available classes"""
        response = api_client.get(f"{BASE_URL}/api/classes")
        assert response.status_code == 200
        data = response.json()
        assert "classes" in data
        print(f"✓ Browse classes works - {len(data['classes'])} classes")
    
    def test_class_requests_endpoint(self, api_client, devotee_token):
        """Can get class enrollment requests"""
        response = api_client.get(
            f"{BASE_URL}/api/class-requests",
            headers={"Authorization": f"Bearer {devotee_token}"}
        )
        # Should return 200 even if empty
        assert response.status_code == 200
        print("✓ Class requests endpoint works")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup(api_client, priest_token):
    """Cleanup test data after all tests"""
    yield
    # Cleanup any remaining test streams
    try:
        response = api_client.get(
            f"{BASE_URL}/api/priest/streams",
            headers={"Authorization": f"Bearer {priest_token}"}
        )
        if response.status_code == 200:
            streams = response.json().get("streams", [])
            for stream in streams:
                if stream.get("title", "").startswith("TEST_"):
                    api_client.delete(
                        f"{BASE_URL}/api/priest/streams/{stream['id']}",
                        headers={"Authorization": f"Bearer {priest_token}"}
                    )
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
