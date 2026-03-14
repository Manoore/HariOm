#!/usr/bin/env python3
"""
Comprehensive Divine App Backend API Testing
Tests all endpoints using localhost since external URL is not working
"""

import requests
import json
import sys
from datetime import datetime

class ComprehensiveBackendTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.admin_token = None
        self.priest_token = None
        self.devotee_token = None
        self.test_results = []
        self.priests_data = []
        self.products_data = []
        
    def log_test(self, test_name, success, details="", response_code=None):
        """Log test result"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_code": response_code,
            "timestamp": datetime.now().isoformat()
        })
        status = "✅ PASS" if success else "❌ FAIL" 
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test API health check"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Status: {data.get('status')}"
            else:
                details = f"HTTP {response.status_code}"
            self.log_test("Health Check API", success, details, response.status_code)
            return success
        except Exception as e:
            self.log_test("Health Check API", False, f"Error: {str(e)}")
            return False
    
    def test_authentication(self):
        """Test user authentication with all demo accounts"""
        print("\n🔐 TESTING AUTHENTICATION")
        print("=" * 40)
        
        # Test admin login
        try:
            data = {"email": "admin@divineapp.com", "password": "admin123"}
            response = requests.post(f"{self.base_url}/api/auth/login", json=data, timeout=5)
            success = response.status_code == 200
            if success:
                token_data = response.json()
                self.admin_token = token_data.get('token')
                user_details = token_data.get('user', {})
                details = f"Role: {user_details.get('role')}, Name: {user_details.get('name')}"
                self.log_test("Admin Login", True, details)
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("Admin Login", False, f"Error: {str(e)}")
            
        # Test priest login
        try:
            data = {"email": "pandit.sharma@divineapp.com", "password": "priest123"}
            response = requests.post(f"{self.base_url}/api/auth/login", json=data, timeout=5)
            success = response.status_code == 200
            if success:
                token_data = response.json()
                self.priest_token = token_data.get('token')
                user_details = token_data.get('user', {})
                details = f"Role: {user_details.get('role')}, Name: {user_details.get('name')}"
                self.log_test("Priest Login", True, details)
            else:
                self.log_test("Priest Login", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Priest Login", False, f"Error: {str(e)}")
        
        # Test user registration for devotee
        try:
            timestamp = datetime.now().strftime('%H%M%S')
            reg_data = {
                "email": f"devotee_{timestamp}@divine.com",
                "password": "testpass123",
                "name": "Test Devotee",
                "phone": "+91 9999999999",
                "role": "devotee"
            }
            response = requests.post(f"{self.base_url}/api/auth/register", json=reg_data, timeout=5)
            success = response.status_code == 200
            if success:
                token_data = response.json()
                self.devotee_token = token_data.get('token')
                self.log_test("Devotee Registration", True, f"Email: {reg_data['email']}")
            else:
                self.log_test("Devotee Registration", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Devotee Registration", False, f"Error: {str(e)}")
        
        # Test get current user with admin token
        if self.admin_token:
            try:
                headers = {'Authorization': f'Bearer {self.admin_token}'}
                response = requests.get(f"{self.base_url}/api/auth/me", headers=headers, timeout=5)
                success = response.status_code == 200
                if success:
                    user_data = response.json()
                    details = f"Name: {user_data.get('name')}, Role: {user_data.get('role')}"
                    self.log_test("Get Current User", True, details)
                else:
                    self.log_test("Get Current User", False, f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test("Get Current User", False, f"Error: {str(e)}")
    
    def test_priests_api(self):
        """Test priests endpoints"""
        print("\n🙏 TESTING PRIESTS API")
        print("=" * 40)
        
        # Get all priests
        try:
            response = requests.get(f"{self.base_url}/api/priests", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.priests_data = data.get('priests', [])
                details = f"Found {len(self.priests_data)} priests"
                self.log_test("Get Priests List", True, details)
                
                # Test priest detail for first priest
                if self.priests_data:
                    priest_id = self.priests_data[0]['id']
                    detail_response = requests.get(f"{self.base_url}/api/priests/{priest_id}", timeout=5)
                    detail_success = detail_response.status_code == 200
                    if detail_success:
                        priest_detail = detail_response.json()
                        services_count = len(priest_detail.get('services', []))
                        details = f"Services: {services_count}, Rating: {priest_detail.get('rating')}"
                        self.log_test("Get Priest Detail", True, details)
                    else:
                        self.log_test("Get Priest Detail", False, f"HTTP {detail_response.status_code}")
            else:
                self.log_test("Get Priests List", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Priests List", False, f"Error: {str(e)}")
    
    def test_products_api(self):
        """Test products/marketplace endpoints"""
        print("\n🛒 TESTING PRODUCTS API")
        print("=" * 40)
        
        # Get all products
        try:
            response = requests.get(f"{self.base_url}/api/products", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.products_data = data.get('products', [])
                details = f"Found {len(self.products_data)} products"
                self.log_test("Get Products List", True, details)
                
                # Test product categories
                cat_response = requests.get(f"{self.base_url}/api/product-categories", timeout=5)
                if cat_response.status_code == 200:
                    categories = cat_response.json().get('categories', [])
                    self.log_test("Get Product Categories", True, f"Categories: {len(categories)}")
                else:
                    self.log_test("Get Product Categories", False, f"HTTP {cat_response.status_code}")
                    
                # Test individual product detail
                if self.products_data:
                    product_id = self.products_data[0]['id']
                    detail_response = requests.get(f"{self.base_url}/api/products/{product_id}", timeout=5)
                    detail_success = detail_response.status_code == 200
                    if detail_success:
                        product = detail_response.json()
                        details = f"Price: ₹{product.get('price')}, Stock: {product.get('stock')}"
                        self.log_test("Get Product Detail", True, details)
                    else:
                        self.log_test("Get Product Detail", False, f"HTTP {detail_response.status_code}")
            else:
                self.log_test("Get Products List", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Products List", False, f"Error: {str(e)}")
    
    def test_horoscope_api(self):
        """Test horoscope endpoints"""
        print("\n⭐ TESTING HOROSCOPE API")
        print("=" * 40)
        
        # Test zodiac signs
        try:
            response = requests.get(f"{self.base_url}/api/horoscope/zodiac-signs", timeout=5)
            success = response.status_code == 200
            if success:
                data = response.json()
                signs = data.get('signs', [])
                self.log_test("Get Zodiac Signs", True, f"Signs: {len(signs)}")
            else:
                self.log_test("Get Zodiac Signs", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Get Zodiac Signs", False, f"Error: {str(e)}")
        
        # Test daily horoscope for different signs
        signs_to_test = ['aries', 'cancer', 'libra']
        for sign in signs_to_test:
            try:
                response = requests.get(f"{self.base_url}/api/horoscope/daily/{sign}", timeout=5)
                success = response.status_code == 200
                if success:
                    data = response.json()
                    prediction = data.get('daily_prediction', '')
                    details = f"Prediction length: {len(prediction)} chars"
                    self.log_test(f"Daily Horoscope ({sign})", True, details)
                else:
                    self.log_test(f"Daily Horoscope ({sign})", False, f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"Daily Horoscope ({sign})", False, f"Error: {str(e)}")
    
    def test_content_apis(self):
        """Test festivals and temples endpoints"""
        print("\n📅 TESTING CONTENT APIs")
        print("=" * 40)
        
        # Test festivals
        try:
            response = requests.get(f"{self.base_url}/api/festivals", timeout=5)
            success = response.status_code == 200
            if success:
                data = response.json()
                festivals = data.get('festivals', [])
                self.log_test("Get Festivals", True, f"Festivals: {len(festivals)}")
            else:
                self.log_test("Get Festivals", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Get Festivals", False, f"Error: {str(e)}")
            
        # Test temples
        try:
            response = requests.get(f"{self.base_url}/api/temples", timeout=5)
            success = response.status_code == 200
            if success:
                data = response.json()
                temples = data.get('temples', [])
                self.log_test("Get Temples", True, f"Temples: {len(temples)}")
            else:
                self.log_test("Get Temples", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Get Temples", False, f"Error: {str(e)}")
    
    def test_cart_and_booking_flows(self):
        """Test cart and booking functionality with authentication"""
        print("\n🛍️ TESTING AUTHENTICATED FLOWS")
        print("=" * 40)
        
        if not self.devotee_token:
            self.log_test("Cart/Booking Tests", False, "No devotee token available")
            return
            
        headers = {'Authorization': f'Bearer {self.devotee_token}'}
        
        # Test empty cart
        try:
            response = requests.get(f"{self.base_url}/api/cart", headers=headers, timeout=5)
            success = response.status_code == 200
            if success:
                cart_data = response.json()
                items_count = len(cart_data.get('items', []))
                self.log_test("Get Empty Cart", True, f"Items: {items_count}")
                
                # Add product to cart if we have products
                if self.products_data:
                    product_id = self.products_data[0]['id']
                    add_data = {"product_id": product_id, "quantity": 2}
                    add_response = requests.post(f"{self.base_url}/api/cart/add", 
                                               json=add_data, headers=headers, timeout=5)
                    if add_response.status_code == 200:
                        self.log_test("Add to Cart", True, f"Added product {product_id}")
                        
                        # Get cart with items
                        cart_response = requests.get(f"{self.base_url}/api/cart", headers=headers, timeout=5)
                        if cart_response.status_code == 200:
                            cart_with_items = cart_response.json()
                            total = cart_with_items.get('total', 0)
                            self.log_test("Get Cart with Items", True, f"Total: ₹{total}")
                        
                        # Clear cart
                        clear_response = requests.delete(f"{self.base_url}/api/cart/clear", 
                                                       headers=headers, timeout=5)
                        if clear_response.status_code == 200:
                            self.log_test("Clear Cart", True, "Cart cleared successfully")
                    else:
                        self.log_test("Add to Cart", False, f"HTTP {add_response.status_code}")
            else:
                self.log_test("Get Empty Cart", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Cart Operations", False, f"Error: {str(e)}")
        
        # Test booking creation if we have priests
        if self.priests_data:
            try:
                priest = self.priests_data[0]
                priest_id = priest['id']
                service = priest.get('services', [{}])[0] if priest.get('services') else {}
                service_name = service.get('name', 'Test Service')
                
                booking_data = {
                    "priest_id": priest_id,
                    "service_name": service_name,
                    "booking_date": "2026-03-20T10:00:00",
                    "booking_type": "online"
                }
                response = requests.post(f"{self.base_url}/api/bookings", 
                                       json=booking_data, headers=headers, timeout=5)
                success = response.status_code == 200
                if success:
                    booking_result = response.json()
                    price = booking_result.get('price', 0)
                    self.log_test("Create Booking", True, f"Service: {service_name}, Price: ₹{price}")
                    
                    # Get user bookings
                    bookings_response = requests.get(f"{self.base_url}/api/bookings", 
                                                   headers=headers, timeout=5)
                    if bookings_response.status_code == 200:
                        bookings = bookings_response.json().get('bookings', [])
                        self.log_test("Get User Bookings", True, f"Total bookings: {len(bookings)}")
                else:
                    self.log_test("Create Booking", False, f"HTTP {response.status_code}: {response.text[:100]}")
            except Exception as e:
                self.log_test("Booking Operations", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 STARTING COMPREHENSIVE DIVINE APP BACKEND TESTS")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run all test categories
        self.test_health_check()
        self.test_authentication()
        self.test_priests_api()
        self.test_products_api()
        self.test_horoscope_api()
        self.test_content_apis()
        self.test_cart_and_booking_flows()
        
        # Generate summary
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n🎯 COMPREHENSIVE TEST RESULTS")
        print("=" * 60)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {total_tests - passed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': total_tests - passed_tests,
            'success_rate': success_rate,
            'results': self.test_results,
            'failed_tests': failed_tests
        }

def main():
    tester = ComprehensiveBackendTester()
    results = tester.run_all_tests()
    
    # Save detailed results
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    results_file = f"/app/test_reports/comprehensive_backend_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: {results_file}")
    
    # Return appropriate exit code
    return 0 if results['success_rate'] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())