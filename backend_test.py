import requests
import sys
import json
from datetime import datetime

class DivineAppAPITester:
    def __init__(self, base_url="https://temple-gateway.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = {}

    def log_result(self, test_name, status, response_code, details=""):
        """Log test result"""
        self.test_results[test_name] = {
            "status": status,
            "response_code": response_code,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                except:
                    response_data = {"raw": response.text}
                self.log_result(name, "PASS", response.status_code, str(response_data)[:200])
                return True, response_data
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                self.log_result(name, "FAIL", response.status_code, response.text[:200])
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.log_result(name, "ERROR", 0, str(e))
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_register(self, email, password, name, phone="", role="DEVOTEE"):
        """Test user registration"""
        data = {
            "email": email,
            "password": password,
            "name": name,
            "phone": phone,
            "role": role
        }
        success, response = self.run_test("User Registration", "POST", "api/auth/register", 200, data)
        if success and 'token' in response:
            return True, response['token']
        return False, None

    def test_login(self, email, password):
        """Test user login"""
        data = {"email": email, "password": password}
        success, response = self.run_test("User Login", "POST", "api/auth/login", 200, data)
        if success and 'token' in response:
            self.token = response['token']
            return True, response['token']
        return False, None

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "api/auth/me", 200)

    def test_get_priests(self):
        """Test get priests list"""
        return self.run_test("Get Priests List", "GET", "api/priests", 200)

    def test_get_priest_detail(self, priest_id):
        """Test get priest details"""
        return self.run_test("Get Priest Details", "GET", f"api/priests/{priest_id}", 200)

    def test_get_products(self):
        """Test get products list"""
        return self.run_test("Get Products List", "GET", "api/products", 200)

    def test_get_zodiac_signs(self):
        """Test get zodiac signs"""
        return self.run_test("Get Zodiac Signs", "GET", "api/horoscope/zodiac-signs", 200)

    def test_get_daily_horoscope(self, sign="aries"):
        """Test get daily horoscope"""
        return self.run_test("Get Daily Horoscope", "GET", f"api/horoscope/daily/{sign}", 200)

    def test_get_festivals(self):
        """Test get festivals"""
        return self.run_test("Get Festivals", "GET", "api/festivals", 200)

    def test_get_temples(self):
        """Test get temples"""
        return self.run_test("Get Temples", "GET", "api/temples", 200)

    def test_get_product_categories(self):
        """Test get product categories"""
        return self.run_test("Get Product Categories", "GET", "api/product-categories", 200)

    def test_cart_operations(self):
        """Test cart operations"""
        # Get empty cart
        success1, _ = self.run_test("Get Empty Cart", "GET", "api/cart", 200)
        
        # Get products first to add to cart
        success2, products_data = self.run_test("Get Products for Cart", "GET", "api/products?limit=1", 200)
        
        if success2 and products_data.get('products'):
            product_id = products_data['products'][0]['id']
            add_data = {"product_id": product_id, "quantity": 2}
            success3, _ = self.run_test("Add to Cart", "POST", "api/cart/add", 200, add_data)
            
            # Get cart with items
            success4, _ = self.run_test("Get Cart with Items", "GET", "api/cart", 200)
            
            # Clear cart
            success5, _ = self.run_test("Clear Cart", "DELETE", "api/cart/clear", 200)
            
            return all([success1, success2, success3, success4, success5])
        
        return success1 and success2

def main():
    # Setup
    tester = DivineAppAPITester()
    timestamp = datetime.now().strftime('%H%M%S')
    test_email = f"test_{timestamp}@divine.com"
    demo_admin_email = "admin@divineapp.com"
    demo_priest_email = "pandit.sharma@divineapp.com"

    print("🚀 Starting Divine App API Tests...\n")

    # Test 1: Health Check
    health_ok, _ = tester.test_health_check()

    # Test 2: User Registration (new user)
    print("\n" + "="*50)
    print("TESTING USER REGISTRATION")
    print("="*50)
    reg_ok, reg_token = tester.test_register(test_email, "testpass123", "Test User", "+91 9999999999")

    # Test 3: User Login with demo credentials
    print("\n" + "="*50)
    print("TESTING USER AUTHENTICATION")
    print("="*50)
    
    # Test admin login
    admin_login_ok, admin_token = tester.test_login(demo_admin_email, "admin123")
    
    # Test priest login
    priest_login_ok, priest_token = tester.test_login(demo_priest_email, "priest123")
    
    # Use admin token for remaining tests
    if admin_login_ok:
        tester.token = admin_token

    # Test 4: Get current user
    me_ok, _ = tester.test_get_me()

    # Test 5: Get Priests
    print("\n" + "="*50)
    print("TESTING PRIEST ENDPOINTS")
    print("="*50)
    priests_ok, priests_data = tester.test_get_priests()
    
    priest_detail_ok = False
    if priests_ok and priests_data.get('priests'):
        # Test priest detail with first priest ID
        first_priest_id = priests_data['priests'][0]['id']
        priest_detail_ok, _ = tester.test_get_priest_detail(first_priest_id)

    # Test 6: Products
    print("\n" + "="*50)
    print("TESTING MARKETPLACE ENDPOINTS")
    print("="*50)
    products_ok, _ = tester.test_get_products()
    categories_ok, _ = tester.test_get_product_categories()

    # Test 7: Cart operations (only if logged in)
    cart_ok = False
    if tester.token:
        cart_ok = tester.test_cart_operations()

    # Test 8: Horoscope
    print("\n" + "="*50)
    print("TESTING HOROSCOPE ENDPOINTS")
    print("="*50)
    zodiac_ok, _ = tester.test_get_zodiac_signs()
    horoscope_ok, _ = tester.test_get_daily_horoscope("aries")

    # Test 9: Content endpoints
    print("\n" + "="*50)
    print("TESTING CONTENT ENDPOINTS")
    print("="*50)
    festivals_ok, _ = tester.test_get_festivals()
    temples_ok, _ = tester.test_get_temples()

    # Print summary
    print("\n" + "="*60)
    print("🎯 FINAL TEST RESULTS")
    print("="*60)
    print(f"📊 Tests Passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📈 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")

    # Critical test summary
    critical_tests = {
        "Health Check": health_ok,
        "User Registration": reg_ok,
        "Admin Login": admin_login_ok,
        "Priest Login": priest_login_ok,
        "Get Priests": priests_ok,
        "Get Products": products_ok,
        "Get Zodiac Signs": zodiac_ok,
        "Get Daily Horoscope": horoscope_ok,
        "Get Festivals": festivals_ok,
        "Get Temples": temples_ok
    }

    print("\n📋 Critical Features Status:")
    for test_name, result in critical_tests.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")

    # Detailed results
    print(f"\n📄 Detailed Results:")
    for test_name, result in tester.test_results.items():
        print(f"   {test_name}: {result['status']} (HTTP {result['response_code']})")

    # Save results to file
    results_file = f"/app/test_reports/backend_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump({
            "summary": {
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "critical_tests": critical_tests,
            "detailed_results": tester.test_results
        }, f, indent=2)

    print(f"\n💾 Results saved to: {results_file}")

    # Return exit code
    return 0 if tester.tests_passed >= (tester.tests_run * 0.8) else 1

if __name__ == "__main__":
    sys.exit(main())