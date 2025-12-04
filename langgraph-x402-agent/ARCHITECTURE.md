# Architecture Guide

This document explains the architecture and design decisions of the LangGraph x402 Agent.

## Overview

The LangGraph x402 Agent is designed to be:
- **Modular**: Easy to add new tools and APIs
- **Extensible**: Support for paid and free operations
- **Type-Safe**: Full TypeScript with Zod validation
- **Transparent**: Complete transaction tracking
- **Production-Ready**: Built with battle-tested libraries

## Core Components

### 1. x402 Client (`src/x402/client.ts`)

The x402 client handles all payment-related operations:

```typescript
export class X402Client {
  // Creates EIP-712 signed payment authorizations
  private async createPaymentAuthorization(method: X402PaymentMethod): Promise<PaymentResult>

  // Fetches with automatic payment handling
  async fetch(url: string, options: RequestInit): Promise<Response>
}
```

**Flow**:
1. Attempt API call without payment
2. If 402 status received, extract payment requirements
3. Create EIP-712 signed authorization
4. Submit to facilitator for settlement
5. Retry API call with payment proof
6. Return results with transaction details

**Key Features**:
- EIP-712 typed data signing
- Multi-network support (Base, Ethereum, etc.)
- Transaction tracking
- Block explorer URL generation

### 2. Tool Registry (`src/tools/registry.ts`)

Manages all available tools and provides a unified interface:

```typescript
class ToolRegistry {
  // Register a new tool
  registerTool(config: ToolConfig)

  // Execute a tool with automatic payment handling
  async executeTool(name: string, params: any): Promise<any>

  // Convert to LangChain tools
  toLangChainTools(): DynamicStructuredTool[]
}
```

**Features**:
- Singleton pattern for global tool registry
- Automatic x402 payment handling for paid tools
- Zod schema validation
- Type-safe tool execution
- LangChain integration

**Tool Types**:
1. **Paid API Tools**: HTTP APIs that require payment
2. **Free API Tools**: Public APIs with no cost
3. **Custom Tools**: Local functions or complex logic

### 3. LangGraph Agent (`src/agent/graph.ts`)

The core agent using LangGraph for state management:

```typescript
export class X402Agent {
  private buildGraph() {
    // Creates a state graph with:
    // - Agent node (decides actions)
    // - Tool node (executes tools)
    // - Conditional edges (continue or end)
  }

  async run(userMessage: string): Promise<string>
  async *stream(userMessage: string)
}
```

**State Graph**:
```
┌─────────┐
│  START  │
└────┬────┘
     │
     v
┌─────────┐     ┌──────────┐
│  Agent  │────>│  Tools   │
│  (LLM)  │<────│(Execute) │
└────┬────┘     └──────────┘
     │
     v
┌─────────┐
│   END   │
└─────────┘
```

**Agent Node**: Uses GPT-4 to:
- Understand user intent
- Select appropriate tools
- Generate final responses

**Tool Node**: Executes selected tools with:
- Parameter validation
- Payment handling
- Error management

### 4. Predefined Tools (`src/tools/predefined.ts`)

Collection of ready-to-use tools:

```typescript
export function initializePredefinedTools() {
  // Paid tools
  registerPaidAPI({ name: 'generate_image', cost: 0.50, ... })
  registerPaidAPI({ name: 'sentiment_analysis', cost: 0.10, ... })

  // Free tools
  registerFreeAPI({ name: 'get_weather', ... })
  registerFreeAPI({ name: 'search_web', ... })

  // Custom tools
  registerCustomTool({ name: 'calculator', ... })
}
```

## Data Flow

### 1. User Request Flow

```
User Input
    ↓
[Index.ts] CLI/Interface
    ↓
[Agent.ts] X402Agent.run()
    ↓
[Graph.ts] LangGraph State Machine
    ↓
[Agent Node] GPT-4 decides: Which tool to use?
    ↓
[Tool Node] Execute tool
    ↓
[Registry.ts] ToolRegistry.executeTool()
    ↓
Is tool paid?
    ├─ Yes → [Client.ts] X402Client.fetch()
    │           ↓
    │       Create EIP-712 signature
    │           ↓
    │       Submit to Facilitator
    │           ↓
    │       Get transaction hash
    │           ↓
    │       Make API call with proof
    │
    └─ No → Direct API call or local execution
                ↓
            Return results
                ↓
[Agent Node] Generate response
    ↓
User sees response + transaction details
```

### 2. Payment Flow (x402 Protocol)

```
┌──────────────┐
│ Agent needs  │
│ paid service │
└──────┬───────┘
       │
       v
┌──────────────────────┐
│ Create authorization │
│ - EIP-712 signature  │
│ - from/to/value      │
│ - validAfter/Before  │
│ - nonce              │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Submit to Facilitator│
│ POST to x402 endpoint│
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Facilitator settles  │
│ - Verifies signature │
│ - Executes transfer  │
│ - Returns tx hash    │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ Call API with proof  │
│ X-PAYMENT header     │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ API returns results  │
└──────────────────────┘
```

## Extension Points

### Adding a New Paid API

The system is designed for easy extension:

```typescript
// 1. Register the tool
registerPaidAPI({
  name: 'my_new_api',
  description: 'Description for the LLM',
  endpoint: 'https://api.example.com/endpoint',
  schema: z.object({
    // Define parameters
  }),
  cost: 0.25, // $0.25 USDC
  method: 'POST'
});

// 2. That's it! The agent can now use it
```

The system handles:
- Tool registration
- LLM tool selection
- Payment creation and submission
- API calling
- Response handling
- Error management

### Adding a Custom Tool

For tools requiring custom logic:

```typescript
registerCustomTool({
  name: 'my_tool',
  description: 'What it does',
  schema: z.object({ /* params */ }),
  isPaid: true,
  cost: 0.10,
  execute: async (params, x402Client) => {
    // Your custom logic here
    // Access x402Client for paid operations
    return results;
  }
});
```

## Design Patterns

### 1. Singleton Registry

The tool registry uses a singleton pattern to ensure all parts of the application share the same tool collection:

```typescript
export const toolRegistry = new ToolRegistry();
```

Benefits:
- Single source of truth
- Easy to access from anywhere
- No prop drilling

### 2. Strategy Pattern

Different tool types (paid API, free API, custom) use the same interface but different execution strategies:

```typescript
interface ToolConfig {
  execute: (params: any, x402Client?: X402Client) => Promise<any>;
}
```

### 3. Decorator Pattern

The x402 client "decorates" the standard fetch API with payment capabilities:

```typescript
// Normal fetch
const response = await fetch(url, options);

// x402-enabled fetch (same interface!)
const response = await x402Client.fetch(url, options);
```

### 4. Factory Pattern

Helper functions act as factories for creating tools:

```typescript
registerPaidAPI(config);   // Factory for paid APIs
registerFreeAPI(config);   // Factory for free APIs
registerCustomTool(config); // Factory for custom tools
```

## Security Considerations

### 1. Private Key Management

- Never hardcode private keys
- Use environment variables
- Never commit `.env` to version control

### 2. Payment Authorization

- EIP-712 provides cryptographic proof
- Time-bound authorizations (validAfter/validBefore)
- Nonces prevent replay attacks

### 3. Input Validation

- Zod schemas validate all inputs
- Type safety prevents injection attacks
- Parameters are sanitized before API calls

### 4. Error Handling

```typescript
try {
  const result = await executeTool(name, params);
  return result;
} catch (error) {
  // Handle gracefully
  return { error: error.message };
}
```

## Performance Optimizations

### 1. Lazy Graph Building

The LangGraph is only built when first needed:

```typescript
async run(userMessage: string) {
  if (!this.graph) {
    this.graph = this.buildGraph();
  }
  // ...
}
```

### 2. Transaction Caching

The x402 client caches the last transaction to avoid repeated queries:

```typescript
public lastTransaction: PaymentResult | null = null;
```

### 3. Tool Registry Lookup

Tools are stored in a Map for O(1) lookup:

```typescript
private tools: Map<string, ToolConfig> = new Map();
```

## Testing Strategy

### Unit Tests

Test individual components:
- x402 client (mock facilitator)
- Tool registry (mock tools)
- Helper functions

### Integration Tests

Test component interactions:
- Agent + Registry
- Registry + x402 Client
- Full end-to-end flows

### E2E Tests

Test real scenarios:
- Image generation
- Multiple tool usage
- Error handling
- Payment failures

## Deployment Considerations

### Environment Variables

Required:
- `OPENAI_API_KEY`: For LLM
- `AGENT_WALLET_PRIVATE_KEY`: For payments

Optional:
- `X402_FACILITATOR`: Custom facilitator URL
- `X402_NETWORK`: Network to use

### Wallet Funding

Ensure the agent wallet has sufficient USDC:
- Testnet: Use faucets
- Mainnet: Fund with real USDC

### Error Monitoring

Log important events:
- Payment attempts
- API failures
- Transaction hashes
- Error messages

### Scaling

For high-volume applications:
- Use connection pooling
- Implement request queuing
- Add retry logic with exponential backoff
- Monitor facilitator health

## Future Enhancements

1. **Multi-wallet support**: Rotate between wallets
2. **Cost tracking**: Database for user spending
3. **Tool marketplace**: Discover and add tools dynamically
4. **Caching**: Cache API responses
5. **Rate limiting**: Prevent abuse
6. **Analytics**: Track tool usage
7. **UI Dashboard**: Visual tool management

## Conclusion

The LangGraph x402 Agent architecture prioritizes:
- **Simplicity**: Easy to understand and extend
- **Safety**: Type-safe with proper validation
- **Transparency**: Full transaction visibility
- **Performance**: Optimized for production use
- **Flexibility**: Support for any API or tool

The modular design allows developers to add new capabilities without modifying core code, making it ideal for building AI applications that require micropayments.
