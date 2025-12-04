# x402 AI Agent - Architecture Documentation

## System Overview

This project implements an intelligent AI agent using the CrewAI framework that automatically handles payments using the x402 protocol (HTTP 402 Payment Required) to access paid APIs.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Interactive CLI                            │
│                    (main.py)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   CrewAI Agent                               │
│              (agents/x402_agent.py)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Weather Tool │  │  Stock Tool  │  │   News Tool  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │         Paid API Tool (x402 Handler)           │        │
│  └────────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              x402 Payment Handler                            │
│            (utils/x402_handler.py)                           │
│                                                              │
│  • Generate payment challenges                              │
│  • Process payments                                         │
│  • Validate access tokens                                   │
│  • Manage payment records                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Paid API Server                             │
│               (apis/paid_apis.py)                            │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Endpoints:                                       │      │
│  │  • GET  /api/weather        ($0.10)             │      │
│  │  • GET  /api/stock_data     ($0.25)             │      │
│  │  • GET  /api/news           ($0.15)             │      │
│  │  • POST /api/translation    ($0.20)             │      │
│  │  • POST /api/data_analysis  ($0.50)             │      │
│  │  • POST /payment                                 │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Interactive CLI (`main.py`)

**Purpose**: User interface for interacting with the AI agent

**Features**:
- Welcome banner with service pricing
- Continuous conversation loop
- Error handling and recovery
- User-friendly prompts

**Flow**:
```
User Input → Process Request → Agent Response → Display to User
```

### 2. CrewAI Agent (`agents/x402_agent.py`)

**Purpose**: Intelligent agent that understands user requests and routes them to appropriate services

**Key Classes**:

#### `PaidAPITool`
- Base tool for accessing paid APIs
- Handles x402 payment flow automatically
- Makes HTTP requests with token management

#### Specialized Tools
- `WeatherTool`: Handles weather queries
- `StockTool`: Handles stock market data queries
- `NewsTool`: Handles news queries

**Agent Configuration**:
```python
role: "Information Assistant with Payment Handling"
goal: "Help users get information by accessing paid APIs"
tools: [weather_tool, stock_tool, news_tool, paid_api_tool]
process: Sequential
```

### 3. x402 Payment Handler (`utils/x402_handler.py`)

**Purpose**: Implements the x402 protocol for payment-gated API access

**Core Methods**:

#### `generate_payment_challenge(resource, cost)`
- Creates unique challenge ID
- Sets expiration time (5 minutes)
- Returns challenge details with pricing

#### `process_payment(challenge_id, payment_token)`
- Validates challenge ID
- Processes payment (simulated)
- Generates access token
- Caches token with expiry (1 hour)

#### `validate_access_token(access_token, resource)`
- Checks token existence
- Validates expiration
- Verifies resource match

**Data Structures**:
```python
payment_records = {
    "challenge_id": {
        "challenge": {...},
        "paid": bool,
        "created_at": datetime,
        "access_token": str
    }
}

access_tokens = {
    "token": {
        "challenge_id": str,
        "resource": str,
        "expires_at": datetime
    }
}
```

### 4. Paid API Server (`apis/paid_apis.py`)

**Purpose**: FastAPI server providing payment-gated services

**Request Flow**:

```
1. Client Request (no token)
   ↓
2. Server: 402 Payment Required
   Returns: Challenge ID, Cost, Payment Methods
   ↓
3. Client: POST /payment
   Body: {challenge_id, payment_token}
   ↓
4. Server: Access Token
   Returns: {access_token, expires_at}
   ↓
5. Client: Retry Request (with token)
   Header: X-Access-Token: <token>
   ↓
6. Server: 200 OK
   Returns: Requested Data
```

**Endpoint Implementation**:
```python
@app.get("/api/weather")
async def get_weather(
    city: str,
    access_token: Optional[str] = Header(None, alias="X-Access-Token")
):
    require_payment("weather", access_token)
    # Return weather data
```

## x402 Protocol Specification

### HTTP Status Code 402

The HTTP 402 Payment Required status code is reserved for future use in payment systems. This implementation demonstrates a practical application.

### Payment Challenge Format

```json
{
  "status": 402,
  "message": "Payment Required",
  "challenge_id": "abc123...",
  "resource": "weather",
  "cost": 0.10,
  "currency": "USD",
  "payment_methods": ["credit_card", "crypto", "test_token"],
  "expires_at": "2024-01-15T10:30:00Z"
}
```

### Payment Request Format

```json
{
  "challenge_id": "abc123...",
  "payment_token": "test_token_123"
}
```

### Payment Response Format

```json
{
  "success": true,
  "access_token": "xyz789...",
  "expires_at": "2024-01-15T11:30:00Z",
  "resource": "weather"
}
```

### Access Headers

```
X-Access-Token: xyz789...
```

## Security Considerations

### Current Implementation (Development/Testing)

- In-memory storage
- Test tokens
- Simulated payment processing
- No encryption
- No rate limiting

### Production Requirements

1. **Database Storage**: Use persistent database for payment records
2. **Real Payment Gateway**: Integrate Stripe, PayPal, or similar
3. **Token Encryption**: Encrypt access tokens
4. **HTTPS Only**: All communications over TLS
5. **Rate Limiting**: Prevent abuse
6. **Fraud Detection**: Monitor suspicious patterns
7. **Logging**: Comprehensive audit logs
8. **Token Rotation**: Implement token refresh mechanism
9. **Payment Confirmation**: Two-factor authentication for payments
10. **PCI Compliance**: If handling credit cards directly

## Scalability Considerations

### Current Limitations

- Single server instance
- In-memory storage
- No caching layer
- Synchronous processing

### Scaling Strategy

1. **Horizontal Scaling**:
   - Load balancer in front of multiple API servers
   - Shared Redis for payment records and tokens
   - Database for persistent storage

2. **Caching**:
   - Redis for access tokens
   - CDN for static content
   - API response caching where appropriate

3. **Async Processing**:
   - Background jobs for payment verification
   - Queue system for high-traffic scenarios

4. **Monitoring**:
   - Application metrics (requests, payments, errors)
   - Performance monitoring
   - Payment success rates

## Extension Points

### Adding New Services

1. Define pricing in `API_PRICING`
2. Create FastAPI endpoint with `require_payment()`
3. Create specialized tool in agent
4. Add tool to agent's tool list

### Custom Payment Methods

1. Extend `X402PaymentHandler.process_payment()`
2. Add payment method to challenge
3. Implement gateway integration

### Enhanced Agent Capabilities

1. Add new CrewAI agents for specialized tasks
2. Implement multi-agent collaboration
3. Add memory for conversation context
4. Integrate with external knowledge bases

## Testing Strategy

### Unit Tests
- Payment handler logic
- Token validation
- Challenge generation

### Integration Tests
- End-to-end payment flow
- API endpoint access
- Agent tool execution

### Load Tests
- Concurrent requests
- Payment processing under load
- Token cache performance

### Security Tests
- Invalid token attempts
- Expired token handling
- Challenge replay attacks

## Future Enhancements

1. **Multi-Currency Support**: Accept payments in multiple currencies
2. **Subscription Model**: Monthly/yearly subscriptions
3. **Usage Analytics**: Track API usage per user
4. **Webhook Support**: Notify external systems of payments
5. **Refund System**: Handle payment refunds
6. **Credit System**: Pre-purchase credits
7. **Tiered Pricing**: Volume discounts
8. **Partner APIs**: Integrate real external APIs
9. **Mobile SDK**: Client libraries for mobile apps
10. **GraphQL Support**: Alternative to REST APIs

## Dependencies

### Core
- **CrewAI**: Agent orchestration
- **FastAPI**: API server
- **Uvicorn**: ASGI server

### Supporting
- **Pydantic**: Data validation
- **Requests**: HTTP client
- **OpenAI**: LLM for agents
- **LangChain**: LLM tooling

## Performance Metrics

### Target Metrics (Production)

- Payment processing: < 500ms
- API response time: < 200ms
- Token validation: < 50ms
- Agent response time: < 5s
- Uptime: 99.9%
- Payment success rate: > 98%

## Monitoring & Observability

### Key Metrics to Track

1. **Business Metrics**:
   - Payments processed
   - Revenue generated
   - Failed payments
   - Active access tokens

2. **Technical Metrics**:
   - Request latency
   - Error rates
   - Token cache hit rate
   - API endpoint usage

3. **Security Metrics**:
   - Failed authentication attempts
   - Expired token usage
   - Suspicious payment patterns

## Compliance

### Data Privacy
- GDPR compliance for EU users
- Data retention policies
- User consent management

### Financial Regulations
- PCI DSS if handling cards
- AML/KYC requirements
- Transaction reporting

---

**Version**: 1.0.0
**Last Updated**: 2024
**Maintained By**: Development Team
