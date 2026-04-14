"""
Multi-Language Support Tests
Tests for i18n translation API endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTranslateEndpoint:
    """Tests for POST /api/translate endpoint"""
    
    def test_translate_to_hindi(self):
        """Test translation to Hindi (hi)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Hello, welcome to Divine App", "target_lang": "hi"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "hi"
        assert "translated" in data
        assert len(data["translated"]) > 0
        print(f"Hindi translation: {data['translated']}")
    
    def test_translate_to_bengali(self):
        """Test translation to Bengali (bn)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Book a priest for puja", "target_lang": "bn"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "bn"
        assert "translated" in data
        print(f"Bengali translation: {data['translated']}")
    
    def test_translate_to_tamil(self):
        """Test translation to Tamil (ta)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Daily horoscope", "target_lang": "ta"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "ta"
        print(f"Tamil translation: {data['translated']}")
    
    def test_translate_to_telugu(self):
        """Test translation to Telugu (te)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Spiritual services", "target_lang": "te"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "te"
        print(f"Telugu translation: {data['translated']}")
    
    def test_translate_to_kannada(self):
        """Test translation to Kannada (kn)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Temple visit", "target_lang": "kn"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "kn"
        print(f"Kannada translation: {data['translated']}")
    
    def test_translate_to_malayalam(self):
        """Test translation to Malayalam (ml)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Vedic classes", "target_lang": "ml"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "ml"
        print(f"Malayalam translation: {data['translated']}")
    
    def test_translate_to_marathi(self):
        """Test translation to Marathi (mr)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Puja store", "target_lang": "mr"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "mr"
        print(f"Marathi translation: {data['translated']}")
    
    def test_translate_to_gujarati(self):
        """Test translation to Gujarati (gu)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Astrology consultation", "target_lang": "gu"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "gu"
        print(f"Gujarati translation: {data['translated']}")
    
    def test_translate_to_sanskrit(self):
        """Test translation to Sanskrit (sa)"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Sacred scriptures", "target_lang": "sa"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "sa"
        print(f"Sanskrit translation: {data['translated']}")
    
    def test_translate_empty_text(self):
        """Test translation with empty text returns error"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "", "target_lang": "hi"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "No text provided" in data.get("message", "")
    
    def test_translate_with_target_language_alias(self):
        """Test translation with target_language instead of target_lang"""
        response = requests.post(
            f"{BASE_URL}/api/translate",
            json={"text": "Test message", "target_language": "hi"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["target_lang"] == "hi"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
