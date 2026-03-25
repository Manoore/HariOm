"""
Backend Refactoring Verification Tests
Tests all major API endpoints after server.py refactoring from 4650 to 541 lines
Verifies modular routers are correctly serving endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shop-flow-staging.preview.emergentagent.com').rstrip('/')


class TestHealthCheck:
    """Health check endpoint test"""
    
    def test_health_endpoint(self):
        """Test GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy", f"Expected healthy status, got: {data}"
        assert "timestamp" in data, "Missing timestamp in health response"
        print(f"✓ Health check passed: {data}")


class TestClassesAPI:
    """Classes API tests - routes/classes.py"""
    
    def test_get_classes_list(self):
        """Test GET /api/classes - list all classes"""
        response = requests.get(f"{BASE_URL}/api/classes")
        assert response.status_code == 200, f"Classes list failed: {response.text}"
        data = response.json()
        assert "classes" in data, "Missing 'classes' key in response"
        assert "total" in data, "Missing 'total' key in response"
        assert isinstance(data["classes"], list), "Classes should be a list"
        print(f"✓ Classes list: {data['total']} classes found")
    
    def test_get_class_details_invalid_id(self):
        """Test GET /api/classes/{class_id} with invalid ID returns 404 or 500"""
        response = requests.get(f"{BASE_URL}/api/classes/invalid_id_12345")
        # Invalid ObjectId should return error
        assert response.status_code in [400, 404, 500], f"Expected error for invalid ID, got: {response.status_code}"
        print(f"✓ Invalid class ID handled correctly: {response.status_code}")


class TestProductsAPI:
    """Products API tests - routes/shop.py (marketplace_router)"""
    
    def test_get_products_list(self):
        """Test GET /api/products - list all products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Products list failed: {response.text}"
        data = response.json()
        assert "products" in data, "Missing 'products' key in response"
        assert "total" in data, "Missing 'total' key in response"
        assert isinstance(data["products"], list), "Products should be a list"
        print(f"✓ Products list: {data['total']} products found")
        
        # Verify product structure if products exist
        if data["products"]:
            product = data["products"][0]
            assert "id" in product, "Product missing 'id'"
            assert "name" in product, "Product missing 'name'"
            assert "price" in product, "Product missing 'price'"
            print(f"✓ Product structure verified: {product['name']}")
    
    def test_get_product_details_invalid_id(self):
        """Test GET /api/products/{product_id} with invalid ID"""
        response = requests.get(f"{BASE_URL}/api/products/invalid_id_12345")
        assert response.status_code in [400, 404, 500], f"Expected error for invalid ID, got: {response.status_code}"
        print(f"✓ Invalid product ID handled correctly: {response.status_code}")
    
    def test_get_product_categories(self):
        """Test GET /api/product-categories"""
        response = requests.get(f"{BASE_URL}/api/product-categories")
        assert response.status_code == 200, f"Product categories failed: {response.text}"
        data = response.json()
        assert "categories" in data, "Missing 'categories' key"
        print(f"✓ Product categories: {data['categories']}")


class TestPanchangAPI:
    """Panchang API tests - routes/panchang.py"""
    
    def test_get_today_panchang(self):
        """Test GET /api/panchang/today - today's Hindu calendar"""
        response = requests.get(f"{BASE_URL}/api/panchang/today")
        assert response.status_code == 200, f"Panchang today failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "date" in data, "Missing 'date' in panchang"
        assert "tithi" in data, "Missing 'tithi' in panchang"
        assert "nakshatra" in data, "Missing 'nakshatra' in panchang"
        assert "hindu_month" in data, "Missing 'hindu_month' in panchang"
        assert "vara" in data, "Missing 'vara' in panchang"
        print(f"✓ Panchang today: {data['date']}, Tithi: {data['tithi']['name']}, Nakshatra: {data['nakshatra']['name']}")
    
    def test_get_month_panchang(self):
        """Test GET /api/panchang/month - month calendar"""
        response = requests.get(f"{BASE_URL}/api/panchang/month")
        assert response.status_code == 200, f"Panchang month failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "days" in data, "Missing 'days' in month panchang"
        assert isinstance(data["days"], list), "Days should be a list"
        print(f"✓ Month panchang: {len(data['days'])} days for {data.get('month_name', 'current month')}")


class TestFestivalsAPI:
    """Festivals API tests - routes/panchang.py and routes/consultation.py"""
    
    def test_get_upcoming_festivals(self):
        """Test GET /api/festivals/upcoming - upcoming festivals"""
        response = requests.get(f"{BASE_URL}/api/festivals/upcoming")
        assert response.status_code == 200, f"Upcoming festivals failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "festivals" in data, "Missing 'festivals' key"
        assert isinstance(data["festivals"], list), "Festivals should be a list"
        print(f"✓ Upcoming festivals: {data.get('count', len(data['festivals']))} festivals")
        
        # Verify festival structure if festivals exist
        if data["festivals"]:
            festival = data["festivals"][0]
            assert "name" in festival, "Festival missing 'name'"
            assert "date" in festival, "Festival missing 'date'"
            print(f"✓ Next festival: {festival['name']} on {festival['date']}")
    
    def test_get_festivals_list(self):
        """Test GET /api/festivals - list festivals from database"""
        response = requests.get(f"{BASE_URL}/api/festivals")
        assert response.status_code == 200, f"Festivals list failed: {response.text}"
        data = response.json()
        # Can return either format depending on which router handles it
        assert "festivals" in data or "status" in data, f"Unexpected response format: {data}"
        print(f"✓ Festivals list endpoint working")
    
    def test_get_year_festivals(self):
        """Test GET /api/festivals/year/2026 - festivals for specific year"""
        response = requests.get(f"{BASE_URL}/api/festivals/year/2026")
        assert response.status_code == 200, f"Year festivals failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "festivals" in data, "Missing 'festivals' key"
        assert data.get("year") == 2026, f"Expected year 2026, got: {data.get('year')}"
        print(f"✓ 2026 festivals: {data.get('count', len(data['festivals']))} festivals")


class TestDevotionalAPI:
    """Devotional API tests - routes/devotional.py"""
    
    def test_get_deities(self):
        """Test GET /api/devotional/deities - list deities"""
        response = requests.get(f"{BASE_URL}/api/devotional/deities")
        assert response.status_code == 200, f"Deities list failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "data" in data, "Missing 'data' key"
        print(f"✓ Deities: {len(data['data'])} deities found")
    
    def test_get_mantras(self):
        """Test GET /api/devotional/mantras - list mantras"""
        response = requests.get(f"{BASE_URL}/api/devotional/mantras")
        assert response.status_code == 200, f"Mantras list failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "data" in data, "Missing 'data' key"
        print(f"✓ Mantras: {data.get('count', len(data['data']))} mantras found")
    
    def test_get_stotras(self):
        """Test GET /api/devotional/stotras - list stotras"""
        response = requests.get(f"{BASE_URL}/api/devotional/stotras")
        assert response.status_code == 200, f"Stotras list failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "data" in data, "Missing 'data' key"
        print(f"✓ Stotras: {data.get('count', len(data['data']))} stotras found")
    
    def test_get_daily_schedule(self):
        """Test GET /api/devotional/daily-schedule - daily worship schedule"""
        response = requests.get(f"{BASE_URL}/api/devotional/daily-schedule")
        assert response.status_code == 200, f"Daily schedule failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "data" in data, "Missing 'data' key"
        print(f"✓ Daily schedule: {len(data['data'])} days configured")
    
    def test_get_today_devotional(self):
        """Test GET /api/devotional/today - today's deity and mantras"""
        response = requests.get(f"{BASE_URL}/api/devotional/today")
        assert response.status_code == 200, f"Today devotional failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        print(f"✓ Today's devotional: {data.get('data', {}).get('day', 'N/A')}")


class TestScripturesAPI:
    """Scriptures API tests - routes/devotional.py"""
    
    def test_get_scriptures_list(self):
        """Test GET /api/scriptures - list scriptures"""
        response = requests.get(f"{BASE_URL}/api/scriptures")
        assert response.status_code == 200, f"Scriptures list failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "data" in data, "Missing 'data' key"
        print(f"✓ Scriptures: {data.get('count', len(data['data']))} scriptures found")
    
    def test_get_random_verse(self):
        """Test GET /api/scriptures/verse/random - random verse"""
        response = requests.get(f"{BASE_URL}/api/scriptures/verse/random")
        assert response.status_code == 200, f"Random verse failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        print(f"✓ Random verse endpoint working")


class TestTestimonialsAPI:
    """Testimonials API tests - routes/feedback.py"""
    
    def test_get_testimonials(self):
        """Test GET /api/testimonials - public testimonials"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200, f"Testimonials failed: {response.text}"
        data = response.json()
        assert "testimonials" in data, "Missing 'testimonials' key"
        assert isinstance(data["testimonials"], list), "Testimonials should be a list"
        print(f"✓ Testimonials: {len(data['testimonials'])} testimonials found")


class TestContactInfoAPI:
    """Contact Info API tests - routes/feedback.py"""
    
    def test_get_contact_info(self):
        """Test GET /api/contact-info - contact info"""
        response = requests.get(f"{BASE_URL}/api/contact-info")
        assert response.status_code == 200, f"Contact info failed: {response.text}"
        data = response.json()
        assert "email" in data, "Missing 'email' in contact info"
        assert "phone" in data, "Missing 'phone' in contact info"
        print(f"✓ Contact info: {data.get('email')}, {data.get('phone')}")


class TestArchiveAPI:
    """Archive API tests - routes/archive.py"""
    
    def test_get_vedic_library(self):
        """Test GET /api/archive/library - Vedic audio library"""
        response = requests.get(f"{BASE_URL}/api/archive/library")
        assert response.status_code == 200, f"Archive library failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "data" in data, "Missing 'data' key"
        assert isinstance(data["data"], dict), "Library data should be a dict"
        categories = list(data["data"].keys())
        print(f"✓ Vedic library: {len(categories)} categories - {categories[:3]}...")


class TestVideoLibraryAPI:
    """Video Library API tests - routes/video_library.py"""
    
    def test_get_video_library(self):
        """Test GET /api/video-library - devotional videos"""
        response = requests.get(f"{BASE_URL}/api/video-library")
        assert response.status_code == 200, f"Video library failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "data" in data, "Missing 'data' key"
        assert isinstance(data["data"], dict), "Video library data should be a dict"
        categories = list(data["data"].keys())
        print(f"✓ Video library: {len(categories)} categories - {categories}")
    
    def test_get_video_categories(self):
        """Test GET /api/video-library/categories - video categories"""
        response = requests.get(f"{BASE_URL}/api/video-library/categories")
        assert response.status_code == 200, f"Video categories failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected ok status, got: {data}"
        assert "data" in data, "Missing 'data' key"
        print(f"✓ Video categories: {len(data['data'])} categories")


class TestAstrologersAPI:
    """Astrologers API tests - routes/consultation.py"""
    
    def test_get_astrologers_list(self):
        """Test GET /api/astrologers - list astrologers"""
        response = requests.get(f"{BASE_URL}/api/astrologers")
        assert response.status_code == 200, f"Astrologers list failed: {response.text}"
        data = response.json()
        assert "astrologers" in data, "Missing 'astrologers' key"
        assert isinstance(data["astrologers"], list), "Astrologers should be a list"
        print(f"✓ Astrologers: {len(data['astrologers'])} astrologers found")
        
        # Verify astrologer structure if astrologers exist
        if data["astrologers"]:
            astro = data["astrologers"][0]
            assert "id" in astro, "Astrologer missing 'id'"
            assert "user_name" in astro, "Astrologer missing 'user_name'"
            print(f"✓ Astrologer structure verified: {astro['user_name']}")


class TestTemplesAPI:
    """Temples API tests - routes/panchang.py and routes/consultation.py"""
    
    def test_get_temples_list(self):
        """Test GET /api/temples - list temples"""
        response = requests.get(f"{BASE_URL}/api/temples")
        assert response.status_code == 200, f"Temples list failed: {response.text}"
        data = response.json()
        # Can return either format depending on which router handles it
        assert "temples" in data or "status" in data, f"Unexpected response format: {data}"
        if "temples" in data:
            print(f"✓ Temples: {data.get('count', len(data['temples']))} temples found")
        else:
            print(f"✓ Temples endpoint working")


class TestLiveStreamsAPI:
    """Live Streams API tests - routes/classes.py"""
    
    def test_get_live_streams(self):
        """Test GET /api/live-streams - list live streams"""
        response = requests.get(f"{BASE_URL}/api/live-streams")
        assert response.status_code == 200, f"Live streams failed: {response.text}"
        data = response.json()
        assert "streams" in data, "Missing 'streams' key"
        assert "total" in data, "Missing 'total' key"
        print(f"✓ Live streams: {data['total']} streams found")


class TestAppStatusAPI:
    """App Status API tests - routes/consultation.py"""
    
    def test_get_app_status(self):
        """Test GET /api/app/status - app maintenance status"""
        response = requests.get(f"{BASE_URL}/api/app/status")
        assert response.status_code == 200, f"App status failed: {response.text}"
        data = response.json()
        assert "maintenance" in data, "Missing 'maintenance' key"
        print(f"✓ App status: maintenance={data['maintenance']}")
    
    def test_get_app_branding(self):
        """Test GET /api/app/branding - app branding info"""
        response = requests.get(f"{BASE_URL}/api/app/branding")
        assert response.status_code == 200, f"App branding failed: {response.text}"
        data = response.json()
        print(f"✓ App branding: {data.get('app_name', 'N/A')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
