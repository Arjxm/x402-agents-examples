"""
X402 Client Library Example
Shows how to integrate with x402 payment-gated APIs
"""
import requests
from typing import Optional, Dict, Any
import json


class X402Client:
    """Client library for accessing x402 payment-gated APIs"""

    def __init__(self, base_url: str = "http://localhost:8000", payment_token: str = "test_token_123"):
        self.base_url = base_url
        self.payment_token = payment_token
        self.access_tokens: Dict[str, str] = {}  # Cache access tokens by resource

    def _handle_payment(self, challenge: Dict[str, Any]) -> Optional[str]:
        """Handle payment challenge and return access token"""
        print(f"💳 Payment required: ${challenge['cost']} for {challenge['resource']}")

        payment_data = {
            "challenge_id": challenge["challenge_id"],
            "payment_token": self.payment_token
        }

        response = requests.post(f"{self.base_url}/payment", json=payment_data)

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                access_token = result["access_token"]
                # Cache the token
                self.access_tokens[challenge["resource"]] = access_token
                print(f"✅ Payment successful!")
                return access_token

        print(f"❌ Payment failed: {response.json()}")
        return None

    def _make_request(self, method: str, endpoint: str, params: Optional[Dict] = None, data: Optional[Dict] = None) -> Any:
        """Make a request with automatic payment handling"""
        resource = endpoint.replace("/api/", "")
        url = f"{self.base_url}{endpoint}"

        # Try with cached token first
        access_token = self.access_tokens.get(resource)

        headers = {}
        if access_token:
            headers["X-Access-Token"] = access_token

        # Make request
        if method == "GET":
            response = requests.get(url, params=params, headers=headers)
        else:
            response = requests.post(url, json=data, headers=headers)

        # Handle 402 Payment Required
        if response.status_code == 402:
            response_data = response.json()
            # Handle FastAPI HTTPException format
            challenge = response_data.get('detail', response_data)
            access_token = self._handle_payment(challenge)

            if access_token:
                # Retry with new token
                headers["X-Access-Token"] = access_token
                if method == "GET":
                    response = requests.get(url, params=params, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Request failed: {response.status_code} - {response.text}")

    def get_weather(self, city: str) -> Dict[str, Any]:
        """Get weather information for a city"""
        return self._make_request("GET", "/api/weather", params={"city": city})

    def get_stock_data(self, symbol: str) -> Dict[str, Any]:
        """Get stock market data for a symbol"""
        return self._make_request("GET", "/api/stock_data", params={"symbol": symbol})

    def get_news(self, topic: str) -> Dict[str, Any]:
        """Get news articles for a topic"""
        return self._make_request("GET", "/api/news", params={"topic": topic})

    def translate_text(self, text: str, target_language: str) -> Dict[str, Any]:
        """Translate text to target language"""
        return self._make_request(
            "POST",
            "/api/translation",
            data={"text": text, "target_language": target_language}
        )

    def analyze_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform data analysis"""
        return self._make_request("POST", "/api/data_analysis", data=data)


def example_usage():
    """Example usage of the X402 client"""
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║           X402 Client Library - Example Usage             ║")
    print("╚═══════════════════════════════════════════════════════════╝\n")

    # Initialize client
    client = X402Client()

    try:
        # Example 1: Get weather
        print("\n📍 Example 1: Getting weather for London")
        print("─" * 60)
        weather = client.get_weather("London")
        print(f"✨ Result:")
        print(json.dumps(weather, indent=2))

        # Example 2: Get stock data
        print("\n📍 Example 2: Getting stock data for AAPL")
        print("─" * 60)
        stock = client.get_stock_data("AAPL")
        print(f"✨ Result:")
        print(json.dumps(stock, indent=2))

        # Example 3: Get news
        print("\n📍 Example 3: Getting news about AI")
        print("─" * 60)
        news = client.get_news("AI")
        print(f"✨ Result:")
        print(json.dumps(news, indent=2))

        # Example 4: Using cached token (no payment needed)
        print("\n📍 Example 4: Getting weather for Paris (using cached token)")
        print("─" * 60)
        weather2 = client.get_weather("Paris")
        print(f"✨ Result:")
        print(json.dumps(weather2, indent=2))

        print("\n╔═══════════════════════════════════════════════════════════╗")
        print("║                  Examples Completed!                      ║")
        print("╚═══════════════════════════════════════════════════════════╝\n")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\n⚠️  Make sure the API server is running:")
        print("   python apis/paid_apis.py\n")


if __name__ == "__main__":
    example_usage()
