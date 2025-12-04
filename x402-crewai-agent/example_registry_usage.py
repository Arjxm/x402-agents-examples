"""
Example: Using the Tool Registry Pattern with x402 Agent

This demonstrates the registry-based approach similar to the Vercel AI implementation.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.x402_agent_registry import (
    create_x402_agent,
    process_user_request,
    show_available_apis
)
from utils.tools_registry import (
    get_all_apis,
    get_api_by_name,
    calculate_cost,
    get_api_summary,
    PAID_APIS,
    FREE_APIS
)
from utils.x402_client import X402Client


def example_1_show_registry():
    """Example 1: Display all available APIs from the registry"""
    print("\n" + "="*70)
    print("EXAMPLE 1: Show Available APIs from Registry")
    print("="*70)

    show_available_apis()

    # Get API summary
    summary = get_api_summary()
    print(f"\n📊 Summary:")
    print(f"   Total APIs: {summary['total_apis']}")
    print(f"   Paid APIs: {summary['paid_apis']}")
    print(f"   Free APIs: {summary['free_apis']}")
    print(f"   Total if all paid APIs used: ${summary['total_paid_cost']:.2f}")


def example_2_add_new_api():
    """Example 2: How to add a new API to the registry"""
    print("\n" + "="*70)
    print("EXAMPLE 2: Adding a New API to Registry")
    print("="*70)

    print("""
To add a new API, simply add it to PAID_APIS or FREE_APIS in utils/tools_registry.py:

```python
from utils.tools_registry import APIConfig, APIParameter, HTTPMethod

# Add to PAID_APIS list:
APIConfig(
    name="your_new_api",
    description="Your API description (costs $X.XX USD)",
    endpoint="https://api.example.com/endpoint",
    method=HTTPMethod.POST,
    cost=0.30,
    parameters=[
        APIParameter(
            name="param1",
            type="string",
            description="Parameter description",
            required=True
        )
    ],
    transform=lambda params: {
        "param1": params.get("param1")
    }
)
```

That's it! The agent will automatically:
1. Discover the new API
2. Handle x402 payments
3. Make it available to users
    """)


def example_3_direct_api_call():
    """Example 3: Direct API call using the registry"""
    print("\n" + "="*70)
    print("EXAMPLE 3: Direct API Call Using Registry")
    print("="*70)

    # Get weather API config
    api_config = get_api_by_name("weather")

    if api_config:
        print(f"\n📋 API Configuration:")
        print(f"   Name: {api_config.name}")
        print(f"   Endpoint: {api_config.endpoint}")
        print(f"   Method: {api_config.method}")
        print(f"   Cost: ${api_config.cost}")
        print(f"   Parameters: {[p.name for p in api_config.parameters]}")

        # Make direct call (without running full agent)
        print("\n🔧 Making direct API call...")
        from utils.x402_client import get_default_client

        client = get_default_client()

        # Build URL
        url = api_config.build_url({"city": "San Francisco"})

        # Make request
        success, result = client.fetch(url, method=api_config.method.value)

        if success:
            print(f"✅ Success!")
            print(f"   Result: {result}")
        else:
            print(f"❌ Failed: {result}")


def example_4_calculate_costs():
    """Example 4: Calculate costs for multiple API calls"""
    print("\n" + "="*70)
    print("EXAMPLE 4: Calculate Total Cost for Multiple APIs")
    print("="*70)

    api_calls = ["weather", "stock_data", "news"]

    print(f"\n📊 Calculating cost for: {', '.join(api_calls)}")

    total_cost = calculate_cost(api_calls)

    print(f"\n💵 Cost Breakdown:")
    for api_name in api_calls:
        api = get_api_by_name(api_name)
        if api:
            print(f"   {api.name:20} ${api.cost:.2f}")

    print(f"   {'-'*25}")
    print(f"   {'TOTAL':20} ${total_cost:.2f}")


def example_5_agent_with_registry():
    """Example 5: Use the agent with registry (interactive)"""
    print("\n" + "="*70)
    print("EXAMPLE 5: Interactive Agent with Tool Registry")
    print("="*70)

    print("\n💬 The agent has access to all APIs in the registry.")
    print("   Example queries:")
    print("   - 'What's the weather in Tokyo?'")
    print("   - 'Get stock data for TSLA'")
    print("   - 'Tell me a joke'")
    print("   - 'Show me news about cryptocurrency'")

    # Uncomment to run interactively:
    # query = input("\n🎤 Your query: ")
    # result = process_user_request(query)
    # print(f"\n📊 Result:\n{result}")


def example_6_registry_pattern_benefits():
    """Example 6: Benefits of the Registry Pattern"""
    print("\n" + "="*70)
    print("EXAMPLE 6: Benefits of Registry Pattern")
    print("="*70)

    print("""
🎯 Why Use the Registry Pattern?

1. EASY TO ADD NEW APIs
   - Just add one entry to PAID_APIS or FREE_APIS
   - No need to create new tool classes
   - Agent automatically discovers new APIs

2. CENTRALIZED CONFIGURATION
   - All API configs in one place (tools_registry.py)
   - Easy to see all available APIs
   - Simple cost management

3. AUTOMATIC x402 PAYMENT HANDLING
   - Payment flow handled by x402_client.py
   - Works for any API in the registry
   - Supports both EIP-712 signatures and token-based payments

4. DYNAMIC TOOL GENERATION
   - Tools created from registry at runtime
   - One RegistryBasedTool handles all APIs
   - Scales easily to hundreds of APIs

5. SIMILAR TO VERCEL AI PATTERN
   - Same structure as reference implementation
   - Familiar to developers using Vercel AI SDK
   - Easy to port between frameworks

6. TYPE-SAFE & VALIDATED
   - Pydantic models for API configs
   - Parameter validation
   - Clear error messages

📁 File Structure:
   utils/tools_registry.py   - API definitions (PAID_APIS, FREE_APIS)
   utils/x402_client.py      - x402 payment client
   agents/x402_agent_registry.py - CrewAI agent using registry

🔄 Comparison with Old Approach:

OLD (Hard-coded tools):
   - Create WeatherTool class
   - Create StockTool class
   - Create NewsTool class
   - Update agent to add each tool
   - Repeat for every new API ❌

NEW (Registry pattern):
   - Add API config to registry
   - Done! ✅

Adding 10 new APIs:
   OLD: Create 10 new classes (100+ lines each)
   NEW: Add 10 entries to array (10-15 lines each)
    """)


def main():
    """Run all examples"""
    print("\n" + "="*70)
    print("🚀 x402 CrewAI Agent - Tool Registry Examples")
    print("="*70)

    examples = [
        example_1_show_registry,
        example_2_add_new_api,
        example_4_calculate_costs,
        example_5_agent_with_registry,
        example_6_registry_pattern_benefits
    ]

    for i, example_func in enumerate(examples, 1):
        try:
            example_func()
            input(f"\n⏸️  Press Enter to continue to next example...")
        except KeyboardInterrupt:
            print("\n\n👋 Exiting examples...")
            break
        except Exception as e:
            print(f"\n❌ Error in example {i}: {str(e)}")

    print("\n" + "="*70)
    print("✅ Examples completed!")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
