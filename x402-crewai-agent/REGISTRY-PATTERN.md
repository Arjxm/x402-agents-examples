# Tool Registry Pattern for x402 CrewAI Agent

This implementation follows the same registry pattern as the Vercel AI x402 agent, making it easy to add new paid and free APIs.

## Overview

The registry pattern provides a centralized, declarative way to define APIs that agents can access. Instead of creating individual tool classes for each API, you define all APIs in a single registry file.

### Key Files

```
x402-crewai-agent/
├── utils/
│   ├── tools_registry.py      # 🎯 Define all APIs here (PAID_APIS, FREE_APIS)
│   ├── x402_client.py         # x402 payment client (similar to x402-server.ts)
│   └── x402_handler.py        # Server-side payment handler
├── agents/
│   ├── x402_agent_registry.py # CrewAI agent using registry
│   └── x402_agent.py          # Old approach (for reference)
└── example_registry_usage.py  # Usage examples
```

## Comparison with Vercel AI Implementation

### Vercel AI (TypeScript) - Reference Implementation

**File: `lib/tools-registry.ts`**
```typescript
export const PAID_APIS = [
  {
    name: 'weather',
    description: 'Get weather (costs $0.10 USDC)',
    endpoint: 'https://api.example.com/weather',
    method: 'GET' as const,
    cost: 0.10,
    schema: z.object({
      city: z.string().describe('City name')
    }),
    transform: (params: any) => params,
    buildUrl: (params: any) => `https://api.example.com/weather?city=${params.city}`
  }
];

export async function executePaidAPI(apiConfig, params, userId) {
  const response = await x402Client.fetch(url, {
    method: apiConfig.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}
```

### CrewAI (Python) - This Implementation

**File: `utils/tools_registry.py`**
```python
PAID_APIS = [
    APIConfig(
        name="weather",
        description="Get weather (costs $0.10 USD)",
        endpoint="http://localhost:8000/api/weather",
        method=HTTPMethod.GET,
        cost=0.10,
        parameters=[
            APIParameter(
                name="city",
                type="string",
                description="City name",
                required=True
            )
        ],
        build_url=lambda params: f"http://localhost:8000/api/weather?city={params.get('city')}"
    )
]

def execute_paid_api(api_config, params):
    client = get_default_client()
    url = api_config.build_url(params) if api_config.build_url else api_config.endpoint
    success, result = client.fetch(url, method=api_config.method.value)
    return result
```

### Key Similarities

| Feature | Vercel AI | CrewAI (This) |
|---------|-----------|---------------|
| **Registry Arrays** | `PAID_APIS`, `FREE_APIS` | `PAID_APIS`, `FREE_APIS` ✅ |
| **API Config** | Plain objects | `APIConfig` Pydantic model ✅ |
| **Schema Definition** | Zod schemas | `APIParameter` list ✅ |
| **Transform Function** | `transform: (params) => ...` | `transform=lambda params: ...` ✅ |
| **URL Builder** | `buildUrl: (params) => ...` | `build_url=lambda params: ...` ✅ |
| **x402 Client** | `X402ServerClient` | `X402Client` ✅ |
| **Payment Handling** | `executePaidAPI()` | `_execute_paid_api()` ✅ |
| **Free APIs** | `executeFreeAPI()` | `_execute_free_api()` ✅ |

## How to Add a New API

### Step 1: Add to Registry

**In `utils/tools_registry.py`:**

```python
PAID_APIS = [
    # ... existing APIs ...

    # Add your new API here
    APIConfig(
        name="your_new_service",
        description="Your service description (costs $0.30 USD)",
        endpoint="https://api.example.com/service",
        method=HTTPMethod.POST,
        cost=0.30,
        parameters=[
            APIParameter(
                name="input_text",
                type="string",
                description="Text to process",
                required=True
            ),
            APIParameter(
                name="options",
                type="object",
                description="Additional options",
                required=False,
                default={}
            )
        ],
        transform=lambda params: {
            "text": params.get("input_text"),
            "opts": params.get("options", {})
        },
        headers={"Authorization": "Bearer YOUR_API_KEY"}
    )
]
```

### Step 2: That's It!

The agent will automatically:
- ✅ Discover the new API
- ✅ Handle x402 payment flow
- ✅ Make it available to users
- ✅ Validate parameters
- ✅ Transform data as needed

## Architecture

### 1. Tool Registry (`utils/tools_registry.py`)

**Purpose:** Central definition of all APIs

```python
# Define APIs
PAID_APIS = [...]
FREE_APIS = [...]

# Helper functions
get_all_apis()          # Get all APIs
get_api_by_name(name)   # Find specific API
calculate_cost(names)   # Calculate total cost
get_api_summary()       # Get registry summary
```

### 2. x402 Client (`utils/x402_client.py`)

**Purpose:** Handle HTTP 402 Payment Required protocol

```python
class X402Client:
    def fetch(url, method, headers, data):
        # 1. Try request without payment
        response = requests.get(url)

        # 2. If 402, process payment
        if response.status_code == 402:
            payment_header = self._create_payment_authorization(challenge)
            response = requests.get(url, headers={"X-PAYMENT": payment_header})

        return response.json()

    def _create_payment_authorization(challenge):
        # Sign with EIP-712 or use token
        return payment_header
```

**Supports:**
- ✅ EIP-712 signatures (with wallet)
- ✅ Token-based payment (test mode)
- ✅ Multiple networks (Base, Ethereum, etc.)
- ✅ Transaction tracking

### 3. Registry-Based Agent (`agents/x402_agent_registry.py`)

**Purpose:** CrewAI agent that uses the registry

```python
class RegistryBasedTool(BaseTool):
    """One tool handles ALL APIs from registry"""

    def _run(self, api_name: str, **params):
        # Get API config from registry
        api_config = get_api_by_name(api_name)

        # Execute with automatic payment handling
        if api_config.cost > 0:
            return self._execute_paid_api(api_config, params)
        else:
            return self._execute_free_api(api_config, params)
```

## Usage Examples

### Example 1: Use the Agent

```python
from agents.x402_agent_registry import process_user_request

result = process_user_request("What's the weather in Tokyo?")
print(result)
```

### Example 2: Direct API Call

```python
from utils.tools_registry import get_api_by_name
from utils.x402_client import get_default_client

# Get API config
api = get_api_by_name("weather")

# Make call
client = get_default_client()
success, result = client.fetch(
    url=api.build_url({"city": "Tokyo"}),
    method=api.method.value
)

if success:
    print(result)
```

### Example 3: Calculate Costs

```python
from utils.tools_registry import calculate_cost

apis_to_call = ["weather", "stock_data", "news"]
total_cost = calculate_cost(apis_to_call)

print(f"Total cost: ${total_cost}")
# Output: Total cost: $0.50
```

### Example 4: List All APIs

```python
from agents.x402_agent_registry import show_available_apis

show_available_apis()
```

## Benefits

### 1. Easy to Scale
- Add 1 API or 100 APIs - same process
- No new classes needed
- Centralized configuration

### 2. Maintainable
- All APIs defined in one file
- Easy to see what's available
- Simple to update costs or endpoints

### 3. Type-Safe
- Pydantic models for validation
- Clear parameter definitions
- IDE autocomplete support

### 4. Automatic Payment Handling
- x402 protocol handled automatically
- Support for EIP-712 signatures
- Transaction tracking included

### 5. Framework-Agnostic Pattern
- Same pattern as Vercel AI SDK
- Can be adapted to other frameworks
- Easy to understand and port

## Configuration

### Environment Variables

Create a `.env` file:

```bash
# OpenAI API Key (for CrewAI)
OPENAI_API_KEY=sk-your-openai-key

# Optional: Agent wallet for blockchain payments
AGENT_WALLET_PRIVATE_KEY=0x...

# Optional: Payment token for test mode
PAYMENT_TOKEN=test_token_123
```

### Payment Modes

1. **Test Mode** (default):
   - Uses `PAYMENT_TOKEN` for local APIs
   - No blockchain required
   - Fast for development

2. **Blockchain Mode**:
   - Set `AGENT_WALLET_PRIVATE_KEY`
   - Uses EIP-712 signatures
   - Real x402 protocol
   - Supports Base, Ethereum, etc.

## Testing

### 1. Start Local API Server

```bash
python apis/paid_apis.py
```

Server runs on `http://localhost:8000`

### 2. Run Examples

```bash
python example_registry_usage.py
```

### 3. Test Direct API Calls

```bash
python -c "
from utils.tools_registry import get_api_by_name
from utils.x402_client import get_default_client

api = get_api_by_name('weather')
client = get_default_client()
success, result = client.fetch(
    api.build_url({'city': 'London'}),
    method=api.method.value
)
print(result)
"
```

### 4. Test Agent

```bash
python agents/x402_agent_registry.py
```

## Advanced: Custom API Configurations

### GET Request with Query Parameters

```python
APIConfig(
    name="search",
    endpoint="https://api.example.com/search",
    method=HTTPMethod.GET,
    parameters=[...],
    build_url=lambda p: f"https://api.example.com/search?q={p['query']}&limit={p.get('limit', 10)}"
)
```

### POST Request with Data Transformation

```python
APIConfig(
    name="analyze",
    endpoint="https://api.example.com/analyze",
    method=HTTPMethod.POST,
    parameters=[...],
    transform=lambda p: {
        "input": p["text"],
        "options": {
            "language": p.get("lang", "en"),
            "detailed": p.get("detailed", False)
        }
    }
)
```

### Custom Headers (API Keys)

```python
APIConfig(
    name="premium_service",
    endpoint="https://api.example.com/service",
    parameters=[...],
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "X-Custom-Header": "value"
    }
)
```

## Migration from Old Approach

### Before (Old Approach)

```python
# agents/x402_agent.py
class WeatherTool(BaseTool):
    name = "weather_tool"
    description = "Get weather..."
    def _run(self, city: str):
        # 20+ lines of code...

class StockTool(BaseTool):
    name = "stock_tool"
    description = "Get stock..."
    def _run(self, symbol: str):
        # 20+ lines of code...

# Create agent with individual tools
agent = Agent(tools=[WeatherTool(), StockTool(), ...])
```

### After (Registry Pattern)

```python
# utils/tools_registry.py
PAID_APIS = [
    APIConfig(name="weather", ...),  # 10 lines
    APIConfig(name="stock_data", ...),  # 10 lines
]

# agents/x402_agent_registry.py
tools = create_dynamic_tools_from_registry()
agent = Agent(tools=tools)
```

**Result:**
- 📉 Less code (50%+ reduction)
- 📈 More maintainable
- 🚀 Easier to scale
- ✅ Same functionality

## Troubleshooting

### API Not Found

```
Error: API 'xyz' not found
```

**Solution:** Check API name in registry matches exactly

### Payment Failed

```
Payment failed: Invalid challenge ID
```

**Solution:**
1. Make sure API server is running
2. Check `.env` has `PAYMENT_TOKEN`
3. Verify API endpoint is correct

### Import Errors

```
ModuleNotFoundError: No module named 'eth_account'
```

**Solution:**
```bash
pip install -r requirements.txt
```

## Next Steps

1. ✅ Add your own APIs to the registry
2. ✅ Configure payment methods
3. ✅ Test with the agent
4. ✅ Deploy to production

## Resources

- [Original Vercel AI Implementation](../vercel-ai-x402-agent/)
- [x402 Protocol Spec](https://github.com/ethereum/EIPs/issues/402)
- [CrewAI Documentation](https://docs.crewai.com/)
- [EIP-712 Spec](https://eips.ethereum.org/EIPS/eip-712)

---

**Built with ❤️ using CrewAI Framework**
