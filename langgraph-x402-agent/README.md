# LangGraph x402 Agent

A powerful, extensible AI agent built with **LangGraph** that integrates the **x402 protocol** for seamless micropayments. Pay for AI services like image generation, sentiment analysis, and more using crypto payments.

## Features

- **LangGraph Integration**: Stateful agent with advanced workflow management
- **x402 Protocol**: Automatic micropayments for paid APIs using USDC
- **Extensible Tool System**: Easy to add any API or custom tool
- **Facilitator Support**: Uses https://x402.treasure.lol/facilitator for payment settlement
- **Multiple Networks**: Support for Base, Base Sepolia, Ethereum, and more
- **Transaction Tracking**: Full transparency of payment transactions
- **Predefined Tools**: Ready-to-use tools for common operations

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────┐
│   LangGraph Agent                   │
│   - State Management                │
│   - Tool Orchestration              │
│   - Response Generation             │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│   Tool Registry                     │
│   - Paid APIs                       │
│   - Free APIs                       │
│   - Custom Tools                    │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│   x402 Client                       │
│   - Payment Authorization           │
│   - EIP-712 Signing                 │
│   - Facilitator Communication       │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│   x402 Facilitator                  │
│   https://x402.treasure.lol/...     │
│   - Payment Settlement              │
│   - Transaction Verification        │
└─────────────────────────────────────┘
```

## Installation

```bash
cd langgraph-x402-agent
npm install
```

## Setup

1. Create `.env` file:

```bash
cp .env.example .env
```

2. Configure environment variables:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Agent wallet private key (for x402 payments)
AGENT_WALLET_PRIVATE_KEY=your_wallet_private_key_here

# Receiver wallet address (where payments go) - IMPORTANT!
RECEIVER_WALLET_ADDRESS=0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6

# x402 Facilitator endpoint
X402_FACILITATOR=https://x402.treasure.lol/facilitator

# Network (optional)
X402_NETWORK=base-sepolia
```

**Important**: The `RECEIVER_WALLET_ADDRESS` is where all payments for paid APIs will be sent. This is YOUR wallet that receives the USDC payments.

## Usage

### Interactive CLI

```bash
npm run dev
```

This starts an interactive CLI where you can chat with the agent:

```
You: Generate an image of a sunset over the ocean
🤖 Agent: [Generates image using x402 payment]

You: Analyze the sentiment: "I love this product!"
🤖 Agent: [Performs sentiment analysis]
```

### Run Examples

```bash
# Image generation example
npm run example

# Custom tool example
npm run dev examples/custom-tool.ts
```

### Programmatic Usage

```typescript
import { X402Agent } from './src/agent/graph.js';
import { initializePredefinedTools } from './src/tools/predefined.js';

// Initialize tools
initializePredefinedTools();

// Create agent
const agent = new X402Agent(
  process.env.OPENAI_API_KEY,
  process.env.AGENT_WALLET_PRIVATE_KEY
);

// Run agent
const response = await agent.run('Generate an image of a cat');
console.log(response);
```

## Predefined Tools

### Paid Tools (using x402)

- **`generate_image`** ($0.50): Generate AI images using DALL-E
- **`sentiment_analysis`** ($0.10): Advanced sentiment analysis
- **`enrich_company_data`** ($0.25): Business intelligence data enrichment
- **`translate_text`** ($0.15): Professional translation service
- **`code_review`** ($0.20): AI-powered code review

### Free Tools

- **`get_weather`**: Current weather information
- **`search_web`**: Web search via DuckDuckGo
- **`get_crypto_price`**: Cryptocurrency prices
- **`geolocate_ip`**: IP geolocation
- **`calculator`**: Mathematical calculations
- **`convert_timestamp`**: Timestamp conversions

## Adding Custom Tools

### Method 1: Paid API Tool

```typescript
import { registerPaidAPI } from './src/tools/registry.js';
import { z } from 'zod';

registerPaidAPI({
  name: 'my_paid_api',
  description: 'Description of what this API does',
  endpoint: 'https://api.example.com/endpoint',
  schema: z.object({
    param1: z.string().describe('Parameter description'),
    param2: z.number().optional()
  }),
  cost: 0.25, // $0.25 USDC
  method: 'POST',
  transformParams: (params) => ({
    // Transform parameters if needed
    customField: params.param1
  })
});
```

### Method 2: Free API Tool

```typescript
import { registerFreeAPI } from './src/tools/registry.js';
import { z } from 'zod';

registerFreeAPI({
  name: 'my_free_api',
  description: 'Free API description',
  endpoint: 'https://api.example.com/endpoint',
  schema: z.object({
    query: z.string().describe('Search query')
  }),
  method: 'GET',
  buildUrl: (params) => `https://api.example.com?q=${params.query}`
});
```

### Method 3: Custom Tool with Logic

```typescript
import { registerCustomTool } from './src/tools/registry.js';
import { z } from 'zod';

registerCustomTool({
  name: 'my_custom_tool',
  description: 'Custom tool with business logic',
  schema: z.object({
    input: z.string()
  }),
  isPaid: false,
  execute: async (params) => {
    // Your custom logic here
    return {
      result: params.input.toUpperCase()
    };
  }
});
```

### Method 4: Custom Paid Tool

```typescript
import { registerCustomTool } from './src/tools/registry.js';
import { z } from 'zod';

registerCustomTool({
  name: 'advanced_processing',
  description: 'Advanced data processing (costs $0.50)',
  schema: z.object({
    data: z.array(z.number())
  }),
  isPaid: true,
  cost: 0.50,
  execute: async (params, x402Client) => {
    // Use x402Client to make paid API calls
    const response = await x402Client.fetch('https://api.example.com/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    return await response.json();
  }
});
```

## How x402 Protocol Works

1. **User Request**: Agent receives a request that requires a paid tool
2. **Tool Selection**: LangGraph determines which tool to use
3. **Payment Authorization**: x402 client creates EIP-712 signed payment
4. **Facilitator Submission**: Payment sent to facilitator for settlement
5. **API Call**: Agent makes API call with payment proof
6. **Transaction Tracking**: User receives transaction hash and explorer link

## Example Conversation

```
You: I need an image of a futuristic city

🤖 Agent thinking...
💰 Payment required:
   Amount: $0.50 USDC
   Description: Generate AI image
   Network: base-sepolia
📤 Submitting payment to facilitator...
✅ Payment successful, API call completed

🤖 Agent: I've generated an image of a futuristic city. The image shows...

💳 Payment Transaction:
   Hash: 0x1234...5678
   Network: base-sepolia
   Explorer: https://sepolia.basescan.org/tx/0x1234...5678
```

## Project Structure

```
langgraph-x402-agent/
├── src/
│   ├── agent/
│   │   └── graph.ts          # LangGraph agent implementation
│   ├── x402/
│   │   └── client.ts         # x402 protocol client
│   ├── tools/
│   │   ├── registry.ts       # Tool registration system
│   │   └── predefined.ts     # Predefined tools
│   └── index.ts              # Main entry point
├── examples/
│   ├── image-agent.ts        # Image generation example
│   └── custom-tool.ts        # Custom tool example
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Key Benefits

1. **Easy Integration**: Add any API in just a few lines of code
2. **Automatic Payments**: x402 handles all payment logic automatically
3. **Transparent**: Full transaction tracking and explorer links
4. **Extensible**: Register paid, free, or custom tools
5. **Type-Safe**: Full TypeScript support with Zod schemas
6. **Stateful**: LangGraph provides advanced state management
7. **Production-Ready**: Built on battle-tested libraries

## Use Cases

- **AI Image Generation**: Pay-per-use image creation
- **Data Enrichment**: Premium business data APIs
- **Language Services**: Translation, sentiment analysis
- **Research Tools**: Access to paid research databases
- **Developer Tools**: Code review, security scanning
- **Web3 Services**: Blockchain analytics, NFT metadata

## Payment Networks

Supported networks:
- Base (mainnet)
- Base Sepolia (testnet)
- Ethereum
- Polygon
- Arbitrum
- Optimism

## Security

- **Private Keys**: Never commit private keys to git
- **Environment Variables**: Use `.env` for sensitive data
- **EIP-712 Signing**: Secure typed data signing
- **Facilitator**: Trusted settlement layer

## Contributing

1. Fork the repository
2. Add your custom tools
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Report a bug]
- Documentation: See `/examples` folder
- x402 Protocol: https://x402.treasure.lol

---

Built with ❤️ using LangGraph and x402 Protocol
