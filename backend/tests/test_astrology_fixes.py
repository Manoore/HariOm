"""
Tests for Astrology Tab bug fixes:
1. Location search dropdown appears and populates lat/lng correctly
2. Horoscope translation works for Telugu (te) language
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://astro-connect-31.preview.emergentagent.com').rstrip('/')


class TestLocationSearch:
    """Tests for location search functionality"""
    
    def test_places_autocomplete_returns_results(self):
        """Test that places autocomplete returns results for a valid query"""
        response = requests.get(f"{BASE_URL}/api/places/autocomplete?query=Hyderabad")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "ok"
        assert "results" in data
        assert len(data["results"]) > 0
        
        # Check first result has required fields
        first_result = data["results"][0]
        assert "place_id" in first_result
        assert "description" in first_result
        print(f"✓ Autocomplete returns {len(data['results'])} results for 'Hyderabad'")
    
    def test_places_autocomplete_returns_empty_for_short_query(self):
        """Test that places autocomplete handles short queries"""
        response = requests.get(f"{BASE_URL}/api/places/autocomplete?query=H")
        # Should return empty results for 1-character query (min_length=2)
        assert response.status_code in [200, 422]  # May return validation error
        print("✓ Short query handled correctly")
    
    def test_place_details_returns_coordinates(self):
        """Test that place details returns latitude and longitude correctly"""
        # First get a place_id
        autocomplete_response = requests.get(f"{BASE_URL}/api/places/autocomplete?query=Hyderabad")
        autocomplete_data = autocomplete_response.json()
        
        assert len(autocomplete_data.get("results", [])) > 0
        place_id = autocomplete_data["results"][0]["place_id"]
        
        # Get place details
        response = requests.get(f"{BASE_URL}/api/places/details/{place_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "ok"
        assert "data" in data
        
        # Verify lat/lng are present in data.data structure (this is the fix)
        place_data = data["data"]
        assert "latitude" in place_data, "latitude should be in data.data"
        assert "longitude" in place_data, "longitude should be in data.data"
        assert place_data["latitude"] is not None
        assert place_data["longitude"] is not None
        assert isinstance(place_data["latitude"], (int, float))
        assert isinstance(place_data["longitude"], (int, float))
        
        print(f"✓ Place details returns coordinates: lat={place_data['latitude']}, lng={place_data['longitude']}")
    
    def test_place_details_returns_formatted_address(self):
        """Test that place details returns formatted address"""
        autocomplete_response = requests.get(f"{BASE_URL}/api/places/autocomplete?query=Mumbai")
        autocomplete_data = autocomplete_response.json()
        
        place_id = autocomplete_data["results"][0]["place_id"]
        response = requests.get(f"{BASE_URL}/api/places/details/{place_id}")
        data = response.json()
        
        place_data = data["data"]
        assert "formatted_address" in place_data
        assert len(place_data["formatted_address"]) > 0
        print(f"✓ Formatted address: {place_data['formatted_address']}")


class TestHoroscopeTranslation:
    """Tests for horoscope translation (multi-language support)"""
    
    def test_horoscope_english_default(self):
        """Test horoscope returns English by default"""
        response = requests.get(f"{BASE_URL}/api/horoscope/daily/aries")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        prediction = data["data"]["daily_prediction"]
        
        # English prediction should contain common English words
        assert prediction["prediction"] is not None
        assert isinstance(prediction["prediction"], str)
        assert len(prediction["prediction"]) > 20
        
        # Lucky color should be in English
        assert prediction.get("lucky_color") == "Red"
        print(f"✓ English horoscope: '{prediction['prediction'][:50]}...'")
        print(f"✓ Lucky color (English): {prediction.get('lucky_color')}")
    
    def test_horoscope_telugu_translation(self):
        """Test horoscope returns Telugu text when lang=te"""
        response = requests.get(f"{BASE_URL}/api/horoscope/daily/aries?lang=te")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        prediction = data["data"]["daily_prediction"]
        
        # Telugu prediction should contain Telugu characters (Unicode range)
        prediction_text = prediction["prediction"]
        assert prediction_text is not None
        assert len(prediction_text) > 20
        
        # Check for Telugu characters (Unicode range: 0C00-0C7F)
        telugu_chars = [c for c in prediction_text if '\u0C00' <= c <= '\u0C7F']
        assert len(telugu_chars) > 0, "Prediction should contain Telugu characters"
        
        # Lucky color should also be translated to Telugu
        lucky_color = prediction.get("lucky_color")
        assert lucky_color is not None
        # Telugu for "Red" is "ఎరుపు"
        assert lucky_color == "ఎరుపు", f"Expected Telugu color 'ఎరుపు', got '{lucky_color}'"
        
        print(f"✓ Telugu horoscope: '{prediction_text[:50]}...'")
        print(f"✓ Lucky color (Telugu): {lucky_color}")
    
    def test_horoscope_hindi_translation(self):
        """Test horoscope returns Hindi text when lang=hi"""
        response = requests.get(f"{BASE_URL}/api/horoscope/daily/taurus?lang=hi")
        assert response.status_code == 200
        
        data = response.json()
        prediction = data["data"]["daily_prediction"]
        
        # Hindi prediction should contain Devanagari characters (Unicode range)
        prediction_text = prediction["prediction"]
        hindi_chars = [c for c in prediction_text if '\u0900' <= c <= '\u097F']
        assert len(hindi_chars) > 0, "Prediction should contain Hindi characters"
        
        # Lucky color in Hindi for Taurus (Green) should be "हरा"
        lucky_color = prediction.get("lucky_color")
        assert lucky_color == "हरा", f"Expected Hindi color 'हरा', got '{lucky_color}'"
        
        print(f"✓ Hindi horoscope: '{prediction_text[:50]}...'")
        print(f"✓ Lucky color (Hindi): {lucky_color}")
    
    def test_horoscope_sign_name_localized(self):
        """Test that sign name is localized based on language"""
        # Test Telugu localization
        response = requests.get(f"{BASE_URL}/api/horoscope/daily/aries?lang=te")
        data = response.json()
        
        sign_localized = data.get("sign_name_localized")
        assert sign_localized == "మేషం", f"Expected Telugu sign name 'మేషం', got '{sign_localized}'"
        print(f"✓ Sign name localized (Telugu): {sign_localized}")
        
        # Test Hindi localization
        response = requests.get(f"{BASE_URL}/api/horoscope/daily/aries?lang=hi")
        data = response.json()
        
        sign_localized = data.get("sign_name_localized")
        assert sign_localized == "मेष", f"Expected Hindi sign name 'मेष', got '{sign_localized}'"
        print(f"✓ Sign name localized (Hindi): {sign_localized}")
    
    def test_all_zodiac_signs_translate(self):
        """Test that all 12 zodiac signs return translated content"""
        zodiac_signs = [
            "aries", "taurus", "gemini", "cancer", "leo", "virgo",
            "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
        ]
        
        for sign in zodiac_signs:
            response = requests.get(f"{BASE_URL}/api/horoscope/daily/{sign}?lang=te")
            assert response.status_code == 200, f"Failed for sign: {sign}"
            
            data = response.json()
            prediction = data["data"]["daily_prediction"]
            
            # Verify Telugu text exists
            telugu_chars = [c for c in prediction["prediction"] if '\u0C00' <= c <= '\u0C7F']
            assert len(telugu_chars) > 0, f"No Telugu chars for {sign}"
            
            # Verify lucky color is translated
            assert prediction.get("lucky_color") is not None, f"Missing lucky_color for {sign}"
        
        print(f"✓ All {len(zodiac_signs)} zodiac signs return translated Telugu content")


class TestGenerateKundaliPrerequisites:
    """Tests for prerequisites of Generate Kundali button"""
    
    def test_kundali_endpoint_exists(self):
        """Test that birth-kundali endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/astrology/birth-kundali",
            json={
                "datetime": "2000-01-15T10:30:00Z",
                "latitude": 17.406498,
                "longitude": 78.47724389999999
            }
        )
        # May need auth or return error, but endpoint should exist
        assert response.status_code in [200, 401, 422, 500]
        print(f"✓ Kundali endpoint exists (status: {response.status_code})")
    
    def test_multiple_cities_for_location_search(self):
        """Test location search works for multiple Indian cities"""
        cities = ["Delhi", "Chennai", "Bangalore", "Kolkata", "Pune"]
        
        for city in cities:
            response = requests.get(f"{BASE_URL}/api/places/autocomplete?query={city}")
            data = response.json()
            
            assert data.get("status") == "ok"
            assert len(data.get("results", [])) > 0, f"No results for {city}"
        
        print(f"✓ Location search works for all {len(cities)} major cities")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
