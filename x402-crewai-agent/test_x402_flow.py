"""
Test x402 Payment Flow
Demonstrates how the x402 protocol works with paid APIs
"""
import requests
import json


def print_section(title):
    """Print a section divider"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def test_x402_payment_flow():
    """Test the complete x402 payment flow"""

    BASE_URL = "http://localhost:8000"

    print_section("x402 PROTOCOL TEST - PAYMENT FLOW DEMONSTRATION")

    # Step 1: Try to access a paid API without token
    print("📍 Step 1: Attempting to access Weather API without payment...")
    print("   Request: GET /api/weather?city=London")

    response = requests.get(f"{BASE_URL}/api/weather", params={"city": "London"})

    if response.status_code == 402:
        print("   ✅ Status: 402 Payment Required (Expected)")
        challenge = response.json()
        print(f"\n   💳 Payment Challenge Received:")
        print(f"      Challenge ID: {challenge['challenge_id']}")
        print(f"      Resource: {challenge['resource']}")
        print(f"      Cost: ${challenge['cost']} {challenge['currency']}")
        print(f"      Payment Methods: {', '.join(challenge['payment_methods'])}")

        # Step 2: Process payment
        print_section("Step 2: Processing Payment")
        print(f"   Submitting payment for challenge: {challenge['challenge_id']}")

        payment_data = {
            "challenge_id": challenge["challenge_id"],
            "payment_token": "test_token_123"
        }

        payment_response = requests.post(f"{BASE_URL}/payment", json=payment_data)

        if payment_response.status_code == 200:
            payment_result = payment_response.json()
            print("   ✅ Payment Successful!")
            print(f"      Access Token: {payment_result['access_token'][:20]}...")
            print(f"      Expires At: {payment_result['expires_at']}")

            access_token = payment_result["access_token"]

            # Step 3: Access API with token
            print_section("Step 3: Accessing API with Access Token")
            print("   Request: GET /api/weather?city=London")
            print(f"   Header: X-Access-Token: {access_token[:20]}...")

            headers = {"X-Access-Token": access_token}
            api_response = requests.get(
                f"{BASE_URL}/api/weather",
                params={"city": "London"},
                headers=headers
            )

            if api_response.status_code == 200:
                print("   ✅ Access Granted!")
                weather_data = api_response.json()
                print(f"\n   🌤️  Weather Data for {weather_data['city']}:")
                print(f"      Temperature: {weather_data['temperature']}°C")
                print(f"      Condition: {weather_data['condition']}")
                print(f"      Humidity: {weather_data['humidity']}%")
                print(f"      Wind Speed: {weather_data['wind_speed']} km/h")
                print(f"      Cost: ${weather_data['cost']}")

                print_section("✨ Test Completed Successfully!")
                print("The x402 payment protocol is working correctly!")
                return True
            else:
                print(f"   ❌ Error: {api_response.status_code}")
                return False
        else:
            print(f"   ❌ Payment Failed: {payment_response.json()}")
            return False
    else:
        print(f"   ❌ Unexpected status code: {response.status_code}")
        return False


def test_all_endpoints():
    """Test all available paid endpoints"""

    print_section("TESTING ALL PAID ENDPOINTS")

    BASE_URL = "http://localhost:8000"

    endpoints_to_test = [
        {"endpoint": "weather", "params": {"city": "Paris"}, "method": "GET"},
        {"endpoint": "stock_data", "params": {"symbol": "GOOGL"}, "method": "GET"},
        {"endpoint": "news", "params": {"topic": "technology"}, "method": "GET"},
    ]

    # Get access tokens for all endpoints
    for test in endpoints_to_test:
        endpoint = test["endpoint"]
        print(f"\n📝 Testing: {endpoint}")

        # Request without token (get challenge)
        if test["method"] == "GET":
            response = requests.get(f"{BASE_URL}/api/{endpoint}", params=test["params"])
        else:
            response = requests.post(f"{BASE_URL}/api/{endpoint}", json=test["params"])

        if response.status_code == 402:
            challenge = response.json()
            print(f"   💳 Cost: ${challenge['cost']}")

            # Process payment
            payment_data = {
                "challenge_id": challenge["challenge_id"],
                "payment_token": "test_token_123"
            }
            payment_response = requests.post(f"{BASE_URL}/payment", json=payment_data)

            if payment_response.status_code == 200:
                access_token = payment_response.json()["access_token"]

                # Access with token
                headers = {"X-Access-Token": access_token}
                if test["method"] == "GET":
                    final_response = requests.get(
                        f"{BASE_URL}/api/{endpoint}",
                        params=test["params"],
                        headers=headers
                    )
                else:
                    final_response = requests.post(
                        f"{BASE_URL}/api/{endpoint}",
                        json=test["params"],
                        headers=headers
                    )

                if final_response.status_code == 200:
                    print(f"   ✅ Success! Data received.")
                    data = final_response.json()
                    print(f"   📊 Sample data: {json.dumps(data, indent=6)[:200]}...")
                else:
                    print(f"   ❌ Failed: {final_response.status_code}")
            else:
                print(f"   ❌ Payment failed")

    print_section("All Endpoint Tests Completed")


if __name__ == "__main__":
    print("\n🧪 x402 Protocol Test Suite\n")
    print("⚠️  Make sure the API server is running on http://localhost:8000")
    print("   Run: python apis/paid_apis.py\n")

    input("Press Enter to start testing...")

    # Run basic flow test
    success = test_x402_payment_flow()

    if success:
        print("\n" + "─" * 70)
        input("\nPress Enter to test all endpoints...")
        test_all_endpoints()

    print("\n✨ Testing complete!\n")
