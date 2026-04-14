"""
Test Samagri PDF/Image Upload Feature
Tests for:
- POST /api/upload/document (PDF upload)
- POST /api/upload/image (Image upload)
- GET /api/uploads/{filename} (File retrieval)
- POST /api/priest/services with samagri_pdf_url, samagri_image_url
- GET /api/priest/services returns samagri_pdf_url, samagri_image_url
- GET /api/priests/{priest_id} returns services with samagri fields
- GET /api/priests/{priest_id}/services returns samagri fields
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PRIEST_EMAIL = "pandit.sharma@divineapp.com"
PRIEST_PASSWORD = "priest123"
DEVOTEE_EMAIL = "devotee@divineapp.com"
DEVOTEE_PASSWORD = "devotee123"

# Global state for tests
_state = {
    "priest_token": None,
    "devotee_token": None,
    "priest_id": None,
    "test_service_id": None,
    "uploaded_pdf_url": None,
    "uploaded_image_url": None
}


@pytest.fixture(scope="module", autouse=True)
def setup_module():
    """Setup - login as priest and devotee once for all tests"""
    # Login as priest
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": PRIEST_EMAIL,
        "password": PRIEST_PASSWORD
    })
    assert res.status_code == 200, f"Priest login failed: {res.text}"
    _state["priest_token"] = res.json().get("token") or res.json().get("access_token")
    
    # Login as devotee
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": DEVOTEE_EMAIL,
        "password": DEVOTEE_PASSWORD
    })
    assert res.status_code == 200, f"Devotee login failed: {res.text}"
    _state["devotee_token"] = res.json().get("token") or res.json().get("access_token")
    
    # Get priest_id from priests list
    res = requests.get(f"{BASE_URL}/api/priests")
    assert res.status_code == 200
    priests = res.json().get("priests", [])
    for p in priests:
        if "Sharma" in p.get("user_name", "") or "Pandit" in p.get("user_name", ""):
            _state["priest_id"] = p["id"]
            break
    
    assert _state["priest_id"], "Could not find priest with name containing Sharma or Pandit"
    print(f"\n✓ Setup complete. Priest ID: {_state['priest_id']}")
    
    yield
    
    # Cleanup test service if created
    if _state["test_service_id"]:
        try:
            requests.delete(
                f"{BASE_URL}/api/priest/services/{_state['test_service_id']}",
                headers={"Authorization": f"Bearer {_state['priest_token']}"}
            )
            print("✓ Test service cleaned up")
        except:
            pass


def get_priest_headers():
    return {"Authorization": f"Bearer {_state['priest_token']}"}


def get_devotee_headers():
    return {"Authorization": f"Bearer {_state['devotee_token']}"}


# ==================== UPLOAD TESTS ====================

def test_01_upload_pdf_document():
    """Test POST /api/upload/document - PDF upload"""
    # Create a simple PDF-like file (just for testing content type)
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
    files = {"file": ("test_samagri.pdf", io.BytesIO(pdf_content), "application/pdf")}
    
    res = requests.post(
        f"{BASE_URL}/api/upload/document",
        files=files,
        headers=get_priest_headers()
    )
    
    assert res.status_code == 200, f"PDF upload failed: {res.text}"
    data = res.json()
    assert "url" in data, "Response should contain 'url'"
    assert "filename" in data, "Response should contain 'filename'"
    assert data["url"].endswith(".pdf"), "URL should end with .pdf"
    
    _state["uploaded_pdf_url"] = data["url"]
    print(f"✓ PDF uploaded successfully: {data['url']}")


def test_02_upload_image():
    """Test POST /api/upload/image - Image upload"""
    # Create a minimal valid PNG image (1x1 pixel)
    png_content = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
        0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
        0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  # IEND chunk
        0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    files = {"file": ("test_samagri.png", io.BytesIO(png_content), "image/png")}
    
    res = requests.post(
        f"{BASE_URL}/api/upload/image",
        files=files,
        headers=get_priest_headers()
    )
    
    assert res.status_code == 200, f"Image upload failed: {res.text}"
    data = res.json()
    assert "url" in data, "Response should contain 'url'"
    assert "filename" in data, "Response should contain 'filename'"
    
    _state["uploaded_image_url"] = data["url"]
    print(f"✓ Image uploaded successfully: {data['url']}")


def test_03_upload_invalid_file_type():
    """Test POST /api/upload/document - Invalid file type rejected"""
    files = {"file": ("test.exe", io.BytesIO(b"fake exe content"), "application/x-msdownload")}
    
    res = requests.post(
        f"{BASE_URL}/api/upload/document",
        files=files,
        headers=get_priest_headers()
    )
    
    assert res.status_code == 400, f"Should reject invalid file type, got {res.status_code}"
    print("✓ Invalid file type correctly rejected")


def test_04_upload_requires_auth():
    """Test POST /api/upload/document - Requires authentication"""
    pdf_content = b"%PDF-1.4\ntest"
    files = {"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
    
    res = requests.post(f"{BASE_URL}/api/upload/document", files=files)
    
    assert res.status_code in [401, 403], f"Should require auth, got {res.status_code}"
    print("✓ Upload correctly requires authentication")


def test_05_get_uploaded_file():
    """Test GET /api/uploads/{filename} - File retrieval"""
    if not _state["uploaded_pdf_url"]:
        pytest.skip("No uploaded PDF URL available")
    
    # Extract filename from URL
    filename = _state["uploaded_pdf_url"].split("/")[-1]
    
    res = requests.get(f"{BASE_URL}/api/uploads/{filename}")
    
    assert res.status_code == 200, f"File retrieval failed: {res.status_code}"
    assert len(res.content) > 0, "File content should not be empty"
    print(f"✓ File retrieved successfully: {filename}")


def test_06_get_nonexistent_file():
    """Test GET /api/uploads/{filename} - 404 for nonexistent file"""
    res = requests.get(f"{BASE_URL}/api/uploads/nonexistent_file_12345.pdf")
    
    assert res.status_code == 404, f"Should return 404, got {res.status_code}"
    print("✓ Nonexistent file correctly returns 404")


# ==================== SERVICE CRUD WITH SAMAGRI URLS ====================

def test_07_create_service_with_samagri_urls():
    """Test POST /api/priest/services - Create service with samagri_pdf_url and samagri_image_url"""
    service_data = {
        "name": "TEST_Samagri_Upload_Puja",
        "description": "Test service with samagri PDF and image",
        "price": 2100,
        "duration_minutes": 90,
        "category": "Pooja",
        "location_type": "online",
        "samagri_list": [
            {"name": "Coconut", "quantity": "2", "optional": False},
            {"name": "Flowers", "quantity": "1 bunch", "optional": True}
        ],
        "samagri_pdf_url": _state["uploaded_pdf_url"] or "https://example.com/test.pdf",
        "samagri_image_url": _state["uploaded_image_url"] or "https://example.com/test.png"
    }
    
    res = requests.post(
        f"{BASE_URL}/api/priest/services",
        json=service_data,
        headers=get_priest_headers()
    )
    
    assert res.status_code == 200, f"Service creation failed: {res.text}"
    data = res.json()
    assert "service_id" in data, "Response should contain service_id"
    
    _state["test_service_id"] = data["service_id"]
    print(f"✓ Service created with samagri URLs: {data['service_id']}")


def test_08_get_priest_services_returns_samagri_urls():
    """Test GET /api/priest/services - Returns samagri_pdf_url and samagri_image_url"""
    res = requests.get(
        f"{BASE_URL}/api/priest/services",
        headers=get_priest_headers()
    )
    
    assert res.status_code == 200, f"Get services failed: {res.text}"
    services = res.json().get("services", [])
    
    # Find our test service
    test_service = None
    for svc in services:
        if svc.get("name") == "TEST_Samagri_Upload_Puja":
            test_service = svc
            break
    
    assert test_service is not None, "Test service not found"
    assert "samagri_pdf_url" in test_service, "Service should have samagri_pdf_url field"
    assert "samagri_image_url" in test_service, "Service should have samagri_image_url field"
    assert "samagri_list" in test_service, "Service should have samagri_list field"
    assert "duration_minutes" in test_service, "Service should have duration_minutes field"
    
    print(f"✓ GET /api/priest/services returns samagri_pdf_url: {test_service.get('samagri_pdf_url')}")
    print(f"✓ GET /api/priest/services returns samagri_image_url: {test_service.get('samagri_image_url')}")
    print(f"✓ GET /api/priest/services returns duration_minutes: {test_service.get('duration_minutes')}")


def test_09_update_service_samagri_urls():
    """Test PUT /api/priest/services/{id} - Update samagri URLs"""
    if not _state["test_service_id"]:
        pytest.skip("No test service ID available")
    
    update_data = {
        "samagri_pdf_url": "https://example.com/updated.pdf",
        "samagri_image_url": "https://example.com/updated.png",
        "samagri_list": [
            {"name": "Updated Item", "quantity": "5", "optional": False}
        ]
    }
    
    res = requests.put(
        f"{BASE_URL}/api/priest/services/{_state['test_service_id']}",
        json=update_data,
        headers=get_priest_headers()
    )
    
    assert res.status_code == 200, f"Service update failed: {res.text}"
    print("✓ Service samagri URLs updated successfully")


# ==================== PUBLIC API TESTS ====================

def test_10_public_priest_detail_returns_samagri_urls():
    """Test GET /api/priests/{priest_id} - Returns services with samagri_pdf_url and samagri_image_url"""
    res = requests.get(f"{BASE_URL}/api/priests/{_state['priest_id']}")
    
    assert res.status_code == 200, f"Get priest detail failed: {res.text}"
    data = res.json()
    
    assert "services" in data, "Response should contain services"
    services = data["services"]
    
    # Check that services have samagri fields
    for svc in services:
        assert "samagri_pdf_url" in svc, f"Service {svc.get('name')} missing samagri_pdf_url"
        assert "samagri_image_url" in svc, f"Service {svc.get('name')} missing samagri_image_url"
        assert "samagri_list" in svc, f"Service {svc.get('name')} missing samagri_list"
        assert "duration_minutes" in svc, f"Service {svc.get('name')} missing duration_minutes"
    
    print(f"✓ GET /api/priests/{_state['priest_id']} returns {len(services)} services with samagri fields")


def test_11_public_priest_services_returns_samagri_urls():
    """Test GET /api/priests/{priest_id}/services - Returns samagri_pdf_url and samagri_image_url"""
    res = requests.get(f"{BASE_URL}/api/priests/{_state['priest_id']}/services")
    
    assert res.status_code == 200, f"Get priest services failed: {res.text}"
    data = res.json()
    
    assert "services" in data, "Response should contain services"
    services = data["services"]
    
    # Check that services have samagri fields
    for svc in services:
        assert "samagri_pdf_url" in svc, f"Service {svc.get('name')} missing samagri_pdf_url"
        assert "samagri_image_url" in svc, f"Service {svc.get('name')} missing samagri_image_url"
        assert "samagri_list" in svc, f"Service {svc.get('name')} missing samagri_list"
        assert "duration_minutes" in svc, f"Service {svc.get('name')} missing duration_minutes"
    
    print(f"✓ GET /api/priests/{_state['priest_id']}/services returns {len(services)} services with samagri fields")


def test_12_public_priests_list_returns_samagri_urls():
    """Test GET /api/priests - Returns services with samagri fields"""
    res = requests.get(f"{BASE_URL}/api/priests")
    
    assert res.status_code == 200, f"Get priests list failed: {res.text}"
    priests = res.json().get("priests", [])
    
    # Find our priest
    our_priest = None
    for p in priests:
        if p["id"] == _state["priest_id"]:
            our_priest = p
            break
    
    assert our_priest is not None, "Our priest not found in list"
    
    # Check services have samagri fields
    for svc in our_priest.get("services", []):
        assert "samagri_pdf_url" in svc, f"Service {svc.get('name')} missing samagri_pdf_url"
        assert "samagri_image_url" in svc, f"Service {svc.get('name')} missing samagri_image_url"
        assert "samagri_list" in svc, f"Service {svc.get('name')} missing samagri_list"
    
    print(f"✓ GET /api/priests returns services with samagri fields")


def test_13_existing_ganesh_puja_has_samagri():
    """Test that existing Ganesh Puja service has samagri items"""
    res = requests.get(f"{BASE_URL}/api/priests/{_state['priest_id']}/services")
    
    assert res.status_code == 200
    services = res.json().get("services", [])
    
    ganesh_puja = None
    for svc in services:
        if "Ganesh" in svc.get("name", ""):
            ganesh_puja = svc
            break
    
    if ganesh_puja:
        samagri_count = len(ganesh_puja.get("samagri_list", []))
        print(f"✓ Ganesh Puja has {samagri_count} samagri items")
        assert samagri_count > 0, "Ganesh Puja should have samagri items"
    else:
        print("⚠ Ganesh Puja service not found (may have been deleted)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
