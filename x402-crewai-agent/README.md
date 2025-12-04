# x402 AI Agent with CrewAI Framework

An intelligent AI agent built with CrewAI that automatically handles payments using the x402 protocol (HTTP 402 Payment Required) to access paid APIs.

## Features

- **CrewAI Integration**: Intelligent agent that understands user requests and routes them to appropriate paid services
- **x402 Protocol**: Automatic payment handling using HTTP 402 Payment Required standard
- **Multiple Paid APIs**: Weather, Stock Data, News, Translation, and Data Analysis
- **Automatic Payment Flow**: Agent handles payment challenges and access tokens transparently
- **Test Mode**: Use test tokens for development and testing
- **🎯 Tool Registry Pattern**: Centralized API registry similar to Vercel AI SDK - add new APIs with just a few lines!

## 🆕 Tool Registry Pattern (Recommended)

This project now includes a **registry-based approach** similar to the Vercel AI x402 agent implementation!

### Why Use the Registry Pattern?

✅ **Add APIs in seconds**: Just add one entry to `PAID_APIS` or `FREE_APIS` array
✅ **No new classes needed**: One dynamic tool handles all APIs
✅ **Centralized config**: All APIs defined in `utils/tools_registry.py`
✅ **Automatic x402 handling**: Payment flow works for any API
✅ **Easy to scale**: Add 1 API or 100 APIs with the same effort

### Quick Example

**Add a new API** in `utils/tools_registry.py`:
```python
PAID_APIS = [
    APIConfig(
        name="your_new_api",
        description="Your API description (costs $0.30 USD)",
        endpoint="https://api.example.com/endpoint",
        method=HTTPMethod.POST,
        cost=0.30,
        parameters=[
            APIParameter(name="text", type="string", description="Text input", required=True)
        ]
    )
]
```

That's it! The agent automatically discovers and uses it.

### Files

- **`utils/tools_registry.py`** - Define all APIs here (PAID_APIS, FREE_APIS)
- **`utils/x402_client.py`** - x402 payment client (like x402-server.ts)
- **`agents/x402_agent_registry.py`** - CrewAI agent using registry
- **`example_registry_usage.py`** - Usage examples
- **`REGISTRY-PATTERN.md`** - Complete documentation

### Get Started

```bash
# Show all available APIs
python agents/x402_agent_registry.py

# Run examples
python example_registry_usage.py

# Use in your code
from agents.x402_agent_registry import process_user_request
result = process_user_request("What's the weather in Tokyo?")
```

📖 **[Read the full Registry Pattern documentation →](REGISTRY-PATTERN.md)**

## Project Structure

```
x402-crewai-agent/
├── agents/
│   ├── x402_agent.py          # Original agent (reference)
│   └── x402_agent_registry.py # 🆕 Registry-based agent (recommended)
├── apis/
│   └── paid_apis.py            # FastAPI server with paid endpoints
├── utils/
│   ├── x402_handler.py         # Server-side x402 payment handler
│   ├── x402_client.py          # 🆕 Client-side x402 payment client
│   └── tools_registry.py       # 🆕 Centralized API registry (PAID_APIS, FREE_APIS)
├── config/
├── main.py                     # Interactive CLI for the agent
├── test_x402_flow.py          # Test script for x402 payment flow
├── example_registry_usage.py   # 🆕 Registry pattern examples
├── REGISTRY-PATTERN.md         # 🆕 Registry pattern documentation
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## How x402 Protocol Works

The x402 protocol implements payment-gated API access:

1. **Initial Request**: Client requests a paid resource without access token
2. **Payment Challenge**: Server responds with HTTP 402 and payment challenge details
3. **Payment Processing**: Client submits payment with challenge ID
4. **Access Token**: Server returns access token upon successful payment
5. **Resource Access**: Client uses access token to access the paid resource

## API Pricing

| Endpoint | Cost | Description |
|----------|------|-------------|
| `/api/weather` | $0.10 | Get weather information for any city |
| `/api/stock_data` | $0.25 | Get stock market data for any symbol |
| `/api/news` | $0.15 | Get latest news articles on any topic |
| `/api/translation` | $0.20 | Translate text to target language |
| `/api/data_analysis` | $0.50 | Perform comprehensive data analysis |

## Installation

### Prerequisites

- Python 3.8 or higher
- OpenAI API key (for CrewAI agents)

### Setup Steps

1. **Clone or navigate to the project directory**:
   ```bash
   cd x402-crewai-agent
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-openai-key-here
   ```

## Usage

### 1. Start the API Server

In one terminal, start the paid APIs server:

```bash
python apis/paid_apis.py
```

The server will start on `http://localhost:8000`

You can visit `http://localhost:8000` in your browser to see the API documentation.

### 2. Test the x402 Payment Flow

In another terminal, test the payment flow:

```bash
python test_x402_flow.py
```

This will demonstrate:
- Making a request without payment (402 response)
- Processing payment with challenge ID
- Accessing the API with access token
- Testing all available endpoints

### 3. Run the Interactive Agent

Start the CrewAI agent with interactive CLI:

```bash
python main.py
```

Then ask questions like:
- "What's the weather in London?"
- "Get me stock data for AAPL"
- "Show me news about AI"
- "What's the weather in Tokyo?"

The agent will automatically:
1. Understand your request
2. Select the appropriate paid API
3. Handle the payment process
4. Return the information to you
5. Report the cost

### Example Interaction

```
💬 Your request: What's the weather in New York?

💳 Payment required for weather
   Cost: $0.10 USD
✅ Payment successful! Access token obtained.

✨ Agent Response:
─────────────────────────────────────────────────────────────
The current weather in New York is:
- Temperature: 22°C
- Condition: Partly Cloudy
- Humidity: 65%
- Wind Speed: 15 km/h

This service cost $0.10
```

## Manual API Testing with cURL

### Step 1: Request without payment (get challenge)

```bash
curl -i http://localhost:8000/api/weather?city=London
```

Response: HTTP 402 with payment challenge

### Step 2: Process payment

```bash
curl -X POST http://localhost:8000/payment \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "YOUR_CHALLENGE_ID_HERE",
    "payment_token": "test_token_123"
  }'
```

Response: Access token

### Step 3: Access API with token

```bash
curl http://localhost:8000/api/weather?city=London \
  -H "X-Access-Token: YOUR_ACCESS_TOKEN_HERE"
```

Response: Weather data

## Development

### Adding New Paid APIs

1. Add pricing in `apis/paid_apis.py`:
   ```python
   API_PRICING["your_service"] = 0.30
   ```

2. Create endpoint:
   ```python
   @app.get("/api/your_service")
   async def your_service(
       param: str,
       access_token: Optional[str] = Header(None, alias="X-Access-Token")
   ):
       require_payment("your_service", access_token)
       # Your service logic here
       return {"data": "your result"}
   ```

3. Create specialized tool in `agents/x402_agent.py`:
   ```python
   class YourServiceTool(BaseTool):
       name: str = "your_service_tool"
       description: str = "Description for the agent"
       api_tool: Optional[PaidAPITool] = None

       def _run(self, param: str) -> str:
           if not self.api_tool:
               self.api_tool = PaidAPITool()
           return self.api_tool._run("your_service", {"param": param})
   ```

### Testing Without OpenAI API

If you want to test the x402 payment flow without using the CrewAI agent (which requires OpenAI API key):

```bash
python test_x402_flow.py
```

This script tests the payment protocol independently of the AI agent.

## Architecture

### Components

1. **Payment Handler** (`utils/x402_handler.py`):
   - Generates payment challenges
   - Processes payments
   - Validates access tokens
   - Manages payment records

2. **Paid APIs** (`apis/paid_apis.py`):
   - FastAPI server with multiple paid endpoints
   - x402 protocol enforcement
   - Mock data generation for testing

3. **CrewAI Agent** (`agents/x402_agent.py`):
   - Intelligent request routing
   - Automatic payment handling
   - Natural language interaction
   - Multiple specialized tools

4. **Interactive CLI** (`main.py`):
   - User-friendly interface
   - Continuous conversation loop
   - Error handling and recovery

## Security Notes

This is a demonstration project with simplified payment processing:

- **Test Mode**: Uses test tokens (`test_token_123`)
- **In-Memory Storage**: Payment records stored in memory
- **No Real Payments**: Simulated payment processing

### For Production:

1. Integrate with real payment gateway (Stripe, PayPal, etc.)
2. Use database for payment records
3. Implement proper authentication and authorization
4. Add rate limiting and fraud detection
5. Use HTTPS for all communications
6. Implement proper token encryption
7. Add comprehensive logging and monitoring

## Troubleshooting

### API Server Not Running

Error: `Connection refused`

Solution: Make sure the API server is running:
```bash
python apis/paid_apis.py
```

### OpenAI API Key Error

Error: `openai.error.AuthenticationError`

Solution: Set your OpenAI API key in `.env`:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

### Port Already in Use

Error: `Address already in use`

Solution: Change the port in `apis/paid_apis.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

## License

MIT License - Feel free to use this project for learning and development.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For questions or issues, please open an issue on the project repository.

---

**Built with ❤️ using CrewAI Framework and FastAPI**
