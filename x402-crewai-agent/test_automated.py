"""
Automated test for x402 payment flow
"""
import requests
import json
import sys


def test_x402_payment():
    """Test the complete x402 payment flow"""

    BASE_URL = "http://localhost:8000"

    print("\n" + "="*70)
    print("🧪 x402 PROTOCOL - AUTOMATED TEST")
    print("="*70 + "\n")

    try:
        # Test 1: Get API info
        print("📍 Test 1: Get API Information")
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            print("✅ API server is running")
            print(f"   Available endpoints: {len(response.json()['available_endpoints'])}")
        else:
            print(f"❌ Failed to get API info: {response.status_code}")
            return False

        # Test 2: Request weather without token (should get 402)
        print("\n📍 Test 2: Request Weather API without payment")
        response = requests.get(f"{BASE_URL}/api/weather", params={"city": "London"})

        if response.status_code == 402:
            print("✅ Received 402 Payment Required (Expected)")
            response_data = response.json()
            # Handle FastAPI HTTPException format
            challenge = response_data.get('detail', response_data)
            print(f"   Challenge ID: {challenge['challenge_id'][:16]}...")
            print(f"   Cost: ${challenge['cost']} {challenge['currency']}")

            # Test 3: Process payment
            print("\n📍 Test 3: Process Payment")
            payment_data = {
                "challenge_id": challenge["challenge_id"],
                "payment_token": "test_token_123"
            }
            payment_response = requests.post(f"{BASE_URL}/payment", json=payment_data)

            if payment_response.status_code == 200:
                result = payment_response.json()
                if result.get("success"):
                    print("✅ Payment Successful!")
                    access_token = result["access_token"]
                    print(f"   Access Token: {access_token[:20]}...")

                    # Test 4: Access API with token
                    print("\n📍 Test 4: Access Weather API with token")
                    headers = {"X-Access-Token": access_token}
                    api_response = requests.get(
                        f"{BASE_URL}/api/weather",
                        params={"city": "London"},
                        headers=headers
                    )

                    if api_response.status_code == 200:
                        print("✅ Access Granted!")
                        weather = api_response.json()
                        print(f"\n   🌤️  Weather Data:")
                        print(f"      City: {weather['city']}")
                        print(f"      Temperature: {weather['temperature']}°C")
                        print(f"      Condition: {weather['condition']}")
                        print(f"      Cost: ${weather['cost']}")

                        print("\n" + "="*70)
                        print("✨ ALL TESTS PASSED!")
                        print("="*70 + "\n")
                        return True
                    else:
                        print(f"❌ Failed to access API: {api_response.status_code}")
                        return False
                else:
                    print(f"❌ Payment failed: {result.get('error')}")
                    return False
            else:
                print(f"❌ Payment request failed: {payment_response.status_code}")
                return False
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server")
        print("   Make sure the server is running: python apis/paid_apis.py")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    success = test_x402_payment()
    sys.exit(0 if success else 1)
