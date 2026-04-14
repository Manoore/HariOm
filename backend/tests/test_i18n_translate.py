"""
Test Multi-Language Translation API
Tests the POST /api/translate endpoint for all 10 Indian languages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTranslateAPI:
    """Translation endpoint tests for 10 Indian languages"""
    
    def test_translate_to_hindi(self):
        """Test translation to Hindi"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Welcome to Divine App",
            "target_lang": "hi"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "translated" in data
        assert data["target_lang"] == "hi"
        print(f"Hindi translation: {data['translated']}")
    
    def test_translate_to_bengali(self):
        """Test translation to Bengali"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Book a priest for puja",
            "target_lang": "bn"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "translated" in data
        print(f"Bengali translation: {data['translated']}")
    
    def test_translate_to_tamil(self):
        """Test translation to Tamil"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Astrology services",
            "target_lang": "ta"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"Tamil translation: {data['translated']}")
    
    def test_translate_to_telugu(self):
        """Test translation to Telugu"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Pooja Store",
            "target_lang": "te"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"Telugu translation: {data['translated']}")
    
    def test_translate_to_kannada(self):
        """Test translation to Kannada"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Hindu Festivals",
            "target_lang": "kn"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"Kannada translation: {data['translated']}")
    
    def test_translate_to_malayalam(self):
        """Test translation to Malayalam"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Sacred Temples",
            "target_lang": "ml"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"Malayalam translation: {data['translated']}")
    
    def test_translate_to_marathi(self):
        """Test translation to Marathi"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Daily Horoscope",
            "target_lang": "mr"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"Marathi translation: {data['translated']}")
    
    def test_translate_to_gujarati(self):
        """Test translation to Gujarati"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Birth Chart",
            "target_lang": "gu"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"Gujarati translation: {data['translated']}")
    
    def test_translate_to_sanskrit(self):
        """Test translation to Sanskrit"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Divine blessings",
            "target_lang": "sa"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"Sanskrit translation: {data['translated']}")
    
    def test_translate_empty_text(self):
        """Test translation with empty text returns error"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "",
            "target_lang": "hi"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
    
    def test_translate_long_text(self):
        """Test translation of longer text (priest bio simulation)"""
        long_text = "Pandit Ramesh Sharma is a highly experienced Vedic priest with over 15 years of experience in performing various Hindu rituals and ceremonies. He specializes in Ganesh Puja, Satyanarayan Katha, and Griha Pravesh ceremonies."
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": long_text,
            "target_lang": "hi"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert len(data["translated"]) > 0
        print(f"Long text Hindi translation: {data['translated'][:100]}...")
    
    def test_translate_alias_target_language(self):
        """Test that target_language alias works"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Hello",
            "target_language": "hi"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
