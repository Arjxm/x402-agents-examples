"""
CrewAI Agent with x402 Payment Integration
Handles user requests and manages payments for paid APIs
"""
import requests
import json
from typing import Optional, Dict, Any, Type
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class PaidAPITool(BaseTool):
    """Tool for interacting with paid APIs using x402 protocol"""

    name: str = "paid_api_tool"
    description: str = "Access paid APIs (weather, stock data, news, translation, data analysis) using x402 payment protocol"
    api_base_url: str = "http://localhost:8000"
    payment_token: str = "test_token_123"

    def _run(self, endpoint: str, params: Dict[str, Any]) -> str:
        """Execute API call with x402 payment handling"""
        try:
            # Try to make request without token first
            response = self._make_api_request(endpoint, params, access_token=None)

            if response.status_code == 402:
                # Payment required, handle payment
                print(f"\n💳 Payment required for {endpoint}")
                response_data = response.json()
                # Handle FastAPI HTTPException format
                challenge = response_data.get('detail', response_data)
                print(f"   Cost: ${challenge['cost']} {challenge['currency']}")

                # Process payment
                payment_response = self._process_payment(challenge)

                if payment_response.get("success"):
                    access_token = payment_response["access_token"]
                    print(f"✅ Payment successful! Access token obtained.")

                    # Retry request with access token
                    response = self._make_api_request(endpoint, params, access_token)

                    if response.status_code == 200:
                        return json.dumps(response.json(), indent=2)
                    else:
                        return f"Error: {response.status_code} - {response.text}"
                else:
                    return f"Payment failed: {payment_response.get('error')}"

            elif response.status_code == 200:
                return json.dumps(response.json(), indent=2)
            else:
                return f"Error: {response.status_code} - {response.text}"

        except Exception as e:
            return f"Error: {str(e)}"

    def _make_api_request(self, endpoint: str, params: Dict[str, Any], access_token: Optional[str] = None) -> requests.Response:
        """Make API request with optional access token"""
        url = f"{self.api_base_url}/api/{endpoint}"
        headers = {}

        if access_token:
            headers["X-Access-Token"] = access_token

        # Determine request method based on endpoint
        if endpoint in ["translation", "data_analysis"]:
            response = requests.post(url, json=params, headers=headers)
        else:
            response = requests.get(url, params=params, headers=headers)

        return response

    def _process_payment(self, challenge: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment for a challenge"""
        payment_url = f"{self.api_base_url}/payment"
        payment_data = {
            "challenge_id": challenge["challenge_id"],
            "payment_token": self.payment_token
        }

        response = requests.post(payment_url, json=payment_data)
        return response.json()


class WeatherTool(BaseTool):
    """Specialized tool for weather queries"""

    name: str = "weather_tool"
    description: str = "Get weather information for any city. Use this when user asks about weather."
    api_tool: Optional[PaidAPITool] = None

    def _run(self, city: str) -> str:
        """Get weather for a city"""
        if not self.api_tool:
            self.api_tool = PaidAPITool()

        return self.api_tool._run("weather", {"city": city})


class StockTool(BaseTool):
    """Specialized tool for stock data queries"""

    name: str = "stock_tool"
    description: str = "Get stock market data for any symbol. Use this when user asks about stocks or market data."
    api_tool: Optional[PaidAPITool] = None

    def _run(self, symbol: str) -> str:
        """Get stock data for a symbol"""
        if not self.api_tool:
            self.api_tool = PaidAPITool()

        return self.api_tool._run("stock_data", {"symbol": symbol})


class NewsTool(BaseTool):
    """Specialized tool for news queries"""

    name: str = "news_tool"
    description: str = "Get latest news articles on any topic. Use this when user asks about news or current events."
    api_tool: Optional[PaidAPITool] = None

    def _run(self, topic: str) -> str:
        """Get news for a topic"""
        if not self.api_tool:
            self.api_tool = PaidAPITool()

        return self.api_tool._run("news", {"topic": topic})


def create_x402_agent():
    """Create a CrewAI agent with x402 payment capabilities"""

    # Initialize tools
    weather_tool = WeatherTool()
    stock_tool = StockTool()
    news_tool = NewsTool()
    paid_api_tool = PaidAPITool()

    # Create the agent
    agent = Agent(
        role="Information Assistant with Payment Handling",
        goal="Help users get information by accessing paid APIs and handling x402 payments automatically",
        backstory="""You are an intelligent assistant that can access various paid information services.
        When users ask for information, you automatically handle the payment process using the x402 protocol.
        You explain what services cost and confirm successful payments before delivering the information.""",
        tools=[weather_tool, stock_tool, news_tool, paid_api_tool],
        verbose=True,
        allow_delegation=False
    )

    return agent


def process_user_request(user_query: str) -> str:
    """Process a user request using the x402 agent"""

    print(f"\n{'='*60}")
    print(f"🤖 Processing request: {user_query}")
    print(f"{'='*60}\n")

    # Create agent
    agent = create_x402_agent()

    # Create task
    task = Task(
        description=f"""
        User request: {user_query}

        Your task:
        1. Understand what information the user needs
        2. Determine which paid API to use
        3. Access the API (payment will be handled automatically)
        4. Present the information to the user in a friendly way
        5. Mention the cost of the service used
        """,
        agent=agent,
        expected_output="A clear, friendly response with the requested information and cost details"
    )

    # Create crew and execute
    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True
    )

    result = crew.kickoff()

    return str(result)


if __name__ == "__main__":
    # Test the agent
    test_queries = [
        "What's the weather in New York?",
        "Get me stock data for AAPL",
        "Show me news about AI"
    ]

    for query in test_queries:
        result = process_user_request(query)
        print(f"\n📊 Result:\n{result}\n")
        print(f"{'='*60}\n")
