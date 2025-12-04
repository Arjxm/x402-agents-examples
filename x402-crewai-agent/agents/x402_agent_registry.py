"""
CrewAI Agent with x402 Payment Integration using Tool Registry
Dynamically generates tools from the registry - similar to Vercel AI implementation
"""

import json
import sys
import os
from typing import Optional, Dict, Any, List
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.tools_registry import (
    get_all_apis,
    get_api_by_name,
    get_paid_apis,
    get_free_apis,
    APIConfig,
    HTTPMethod
)
from utils.x402_client import X402Client, get_default_client


class RegistryBasedTool(BaseTool):
    """
    Dynamic tool that uses the API registry
    One tool handles all APIs with automatic payment handling
    """

    name: str = "api_registry_tool"
    description: str = """Access any available API (both paid and free) using this tool.

Available APIs:
PAID APIs (automatically handles x402 payments):
- weather: Get current weather for a city ($0.10)
- stock_data: Get stock market data for a symbol ($0.25)
- news: Get latest news articles on any topic ($0.15)
- translation: Translate text to target language ($0.20)
- data_analysis: Perform comprehensive data analysis ($0.50)

FREE APIs:
- search_web: Search the web using DuckDuckGo (free)
- free_joke: Get a random joke (free)

Specify the 'api_name' and provide required parameters."""

    client: Optional[X402Client] = None

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **data):
        super().__init__(**data)
        self.client = get_default_client()

    def _run(self, api_name: str, **params) -> str:
        """
        Execute an API call from the registry

        Args:
            api_name: Name of the API to call (from registry)
            **params: Parameters required by the API
        """
        try:
            # Get API configuration
            api_config = get_api_by_name(api_name)

            if not api_config:
                available_apis = [api.name for api in get_all_apis()]
                return f"Error: API '{api_name}' not found. Available APIs: {', '.join(available_apis)}"

            # Log the API call
            print(f"\n{'='*60}")
            print(f"🔧 Calling API: {api_config.name}")
            print(f"💵 Cost: ${api_config.cost} USD")
            print(f"📝 Description: {api_config.description}")
            print(f"{'='*60}\n")

            # Execute based on whether it's paid or free
            if api_config.cost > 0:
                return self._execute_paid_api(api_config, params)
            else:
                return self._execute_free_api(api_config, params)

        except Exception as e:
            return f"Error executing API: {str(e)}"

    def _execute_paid_api(self, api_config: APIConfig, params: Dict[str, Any]) -> str:
        """Execute a paid API call with x402 payment handling"""
        print(f"🔐 Executing PAID API: {api_config.name}")

        try:
            # Build URL if needed
            if api_config.build_url:
                url = api_config.build_url(params)
            else:
                url = api_config.endpoint

            # Transform parameters if needed
            if api_config.transform:
                data = api_config.transform(params)
            else:
                data = params

            # Make request with x402 client
            success, result = self.client.fetch(
                url=url,
                method=api_config.method.value,
                headers=api_config.headers,
                data=data if api_config.method != HTTPMethod.GET else None
            )

            if success:
                # Get transaction info if available
                tx_info = self.client.get_last_transaction()

                # Format result
                result_str = json.dumps(result, indent=2)

                if tx_info.get("hash"):
                    result_str += f"\n\n💳 Transaction Details:\n"
                    result_str += f"   Hash: {tx_info['hash']}\n"
                    result_str += f"   Network: {tx_info['network']}\n"
                    result_str += f"   Explorer: {tx_info['explorer_url']}"

                return result_str
            else:
                return f"Error: {json.dumps(result, indent=2)}"

        except Exception as e:
            print(f"❌ Paid API call failed: {str(e)}")
            return f"Error: {str(e)}"

    def _execute_free_api(self, api_config: APIConfig, params: Dict[str, Any]) -> str:
        """Execute a free API call"""
        print(f"🆓 Executing FREE API: {api_config.name}")

        try:
            import requests

            # Build URL if needed
            if api_config.build_url:
                url = api_config.build_url(params)
            else:
                url = api_config.endpoint

            # Make request
            if api_config.method == HTTPMethod.GET:
                response = requests.get(url, headers=api_config.headers)
            else:
                data = api_config.transform(params) if api_config.transform else params
                response = requests.post(url, json=data, headers=api_config.headers)

            if response.status_code == 200:
                try:
                    result = response.json()
                    return json.dumps(result, indent=2)
                except:
                    return response.text
            else:
                return f"Error: HTTP {response.status_code} - {response.text}"

        except Exception as e:
            print(f"❌ Free API call failed: {str(e)}")
            return f"Error: {str(e)}"


def create_dynamic_tools_from_registry() -> List[BaseTool]:
    """
    Create dynamic tools from the registry
    This is similar to how Vercel AI SDK creates tools from the registry
    """
    tools = []

    # Option 1: One universal tool that handles all APIs
    universal_tool = RegistryBasedTool()
    tools.append(universal_tool)

    # Option 2: You could also create individual tools for each API
    # for api_config in get_all_apis():
    #     tool = create_tool_for_api(api_config)
    #     tools.append(tool)

    return tools


def create_x402_agent() -> Agent:
    """
    Create a CrewAI agent with x402 payment capabilities using tool registry
    """

    # Get tools from registry
    tools = create_dynamic_tools_from_registry()

    # Get API summary for backstory
    paid_apis = get_paid_apis()
    free_apis = get_free_apis()

    paid_apis_desc = ", ".join([f"{api.name} (${api.cost})" for api in paid_apis[:5]])
    free_apis_desc = ", ".join([api.name for api in free_apis])

    # Create the agent
    agent = Agent(
        role="Information Assistant with x402 Payment Registry",
        goal="Help users get information by accessing APIs from the tool registry and handling x402 payments automatically",
        backstory=f"""You are an intelligent assistant with access to a dynamic tool registry.

You can access {len(paid_apis)} paid APIs and {len(free_apis)} free APIs:
- Paid APIs: {paid_apis_desc}...
- Free APIs: {free_apis_desc}

When users ask for information:
1. Determine which API from the registry to use
2. The payment process is handled automatically via x402 protocol
3. Present the information clearly
4. Mention the cost of paid services

The tool registry makes it easy to add new APIs - they're automatically available to you!""",
        tools=tools,
        verbose=True,
        allow_delegation=False
    )

    return agent


def process_user_request(user_query: str) -> str:
    """Process a user request using the x402 agent with tool registry"""

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
        2. Select the appropriate API from the registry
        3. Call the API using the api_registry_tool with correct parameters
        4. Present the information to the user in a friendly way
        5. Mention the cost if it was a paid service

        Remember to use the api_registry_tool with:
        - api_name: The name of the API to call
        - Additional parameters required by that specific API
        """,
        agent=agent,
        expected_output="A clear, friendly response with the requested information and cost details (if paid)"
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


def show_available_apis():
    """Display all available APIs from the registry"""
    print("\n" + "="*70)
    print("📚 AVAILABLE APIs IN REGISTRY")
    print("="*70)

    paid_apis = get_paid_apis()
    free_apis = get_free_apis()

    print(f"\n💰 PAID APIs ({len(paid_apis)}):")
    print("-" * 70)
    for api in paid_apis:
        print(f"  • {api.name:30} ${api.cost:5.2f}  {api.description}")

    print(f"\n🆓 FREE APIs ({len(free_apis)}):")
    print("-" * 70)
    for api in free_apis:
        print(f"  • {api.name:30}  FREE   {api.description}")

    print("\n" + "="*70)
    print(f"Total: {len(paid_apis + free_apis)} APIs available")
    print("="*70 + "\n")


if __name__ == "__main__":
    # Show available APIs
    show_available_apis()

    # Test the agent
    test_queries = [
        "What's the weather in New York?",
        "Get me stock data for AAPL",
        "Tell me a joke"
    ]

    print("🧪 Testing agent with sample queries...\n")

    for query in test_queries:
        result = process_user_request(query)
        print(f"\n📊 Result:\n{result}\n")
        print(f"{'='*60}\n")
