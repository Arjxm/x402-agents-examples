# LangGraph x402 Agent - Project Summary

## What Was Built

A complete **LangGraph-based AI agent** with **x402 protocol integration** that enables micropayments for AI services using USDC.

## Key Features

### 1. x402 Protocol Integration
- ✅ Full EIP-712 signing for payment authorization
- ✅ Facilitator integration (https://x402.treasure.lol/facilitator)
- ✅ Multi-network support (Base, Ethereum, etc.)
- ✅ Transaction tracking with block explorer links
- ✅ Automatic payment handling

### 2. Extensible Tool System
- ✅ Easy registration of paid APIs
- ✅ Easy registration of free APIs
- ✅ Custom tool support with business logic
- ✅ Type-safe with Zod validation
- ✅ Automatic cost tracking

### 3. LangGraph Agent
- ✅ Stateful agent with GPT-4
- ✅ Automatic tool selection
- ✅ Multi-step reasoning
- ✅ Streaming support
- ✅ Error handling

### 4. Predefined Tools

**Paid Tools** (using x402):
- `generate_image` - DALL-E image generation ($0.50)
- `sentiment_analysis` - Advanced sentiment analysis ($0.10)
- `enrich_company_data` - Business intelligence ($0.25)
- `translate_text` - Professional translation ($0.15)
- `code_review` - AI code review ($0.20)

**Free Tools**:
- `get_weather` - Weather information
- `search_web` - Web search
- `get_crypto_price` - Crypto prices
- `geolocate_ip` - IP geolocation
- `calculator` - Math operations
- `convert_timestamp` - Time conversions

## Project Structure

```
langgraph-x402-agent/
├── src/
│   ├── agent/
│   │   └── graph.ts              # LangGraph agent implementation
│   ├── x402/
│   │   └── client.ts             # x402 protocol client
│   ├── tools/
│   │   ├── registry.ts           # Tool registration system
│   │   └── predefined.ts         # Predefined tools
│   └── index.ts                  # Main CLI entry point
├── examples/
│   ├── image-agent.ts            # Image generation example
│   └── custom-tool.ts            # Custom tool example
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md                     # Full documentation
├── QUICK-START.md                # Quick start guide
├── ARCHITECTURE.md               # Architecture details
└── PROJECT-SUMMARY.md            # This file
```

## How It Works

### Architecture Flow

```
User Input
    ↓
LangGraph Agent
    ├─> Agent Node (GPT-4 decides which tool)
    │       ↓
    └─> Tool Node (Execute tool)
            ↓
        Tool Registry
            ↓
        Is paid? ──[Yes]──> x402 Client
            │                   ↓
            │               EIP-712 Sign
            │                   ↓
            │               Facilitator
            │                   ↓
            │               API Call
            │                   ↓
            └──[No]─────> Direct Call
                            ↓
                        Results + TX Hash
```

### Payment Flow

1. User requests paid operation (e.g., "Generate an image")
2. Agent selects the appropriate paid tool
3. x402 client creates EIP-712 signed authorization
4. Authorization submitted to facilitator
5. Facilitator settles the transaction
6. Agent receives transaction hash
7. Agent makes API call with payment proof
8. Results returned to user with transaction details

## Adding Custom Tools

### Paid API Example

```typescript
import { registerPaidAPI } from './src/tools/registry.js';
import { z } from 'zod';

registerPaidAPI({
  name: 'my_paid_api',
  description: 'What this API does',
  endpoint: 'https://api.example.com/endpoint',
  schema: z.object({
    text: z.string().describe('Input text')
  }),
  cost: 0.25,
  method: 'POST'
});
```

### Free API Example

```typescript
import { registerFreeAPI } from './src/tools/registry.js';

registerFreeAPI({
  name: 'my_free_api',
  description: 'Free API description',
  endpoint: 'https://api.example.com/data',
  schema: z.object({
    query: z.string()
  }),
  method: 'GET',
  buildUrl: (params) => `https://api.example.com?q=${params.query}`
});
```

### Custom Tool Example

```typescript
import { registerCustomTool } from './src/tools/registry.js';

registerCustomTool({
  name: 'my_tool',
  description: 'Custom logic',
  schema: z.object({
    input: z.string()
  }),
  isPaid: false,
  execute: async (params) => {
    // Your custom logic here
    return { result: params.input.toUpperCase() };
  }
});
```

## Usage

### Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your keys

# Run interactive CLI
npm run dev

# Run examples
npm run example
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

// Run
const response = await agent.run('Generate an image of a sunset');
console.log(response);
```

## Environment Variables

```env
OPENAI_API_KEY=sk-...                                    # Required - For GPT-4
AGENT_WALLET_PRIVATE_KEY=0x...                           # Required - Pays for services
RECEIVER_WALLET_ADDRESS=0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6  # Required - Receives payments
X402_FACILITATOR=https://x402.treasure.lol/facilitator   # Optional - Payment facilitator
X402_NETWORK=base-sepolia                                # Optional - Network
```

**Key Wallets**:
- **Agent Wallet** (private key): The wallet that pays for API services (needs USDC)
- **Receiver Wallet** (address): YOUR wallet that receives payments for your paid APIs

## Example Output

```
You: Generate an image of a futuristic city

💬 User: Generate an image of a futuristic city
🤔 Agent thinking...

💰 Payment required:
   Amount: $0.50 USDC
   Description: Generate AI image
   Network: base-sepolia
📤 Submitting payment to facilitator: https://x402.treasure.lol/facilitator
✅ Payment successful, API call completed

🤖 Agent: I've generated an image of a futuristic city with flying cars,
neon lights, and towering skyscrapers. The image has been created successfully!

💳 Payment Transaction:
   Hash: 0xabc123...def456
   Network: base-sepolia
   Explorer: https://sepolia.basescan.org/tx/0xabc123...def456
```

## Key Benefits

1. **Modular**: Add any API in minutes
2. **Automatic Payments**: x402 handles everything
3. **Transparent**: Full transaction visibility
4. **Type-Safe**: TypeScript + Zod validation
5. **Production-Ready**: Built with proven libraries
6. **Extensible**: Support for any tool type
7. **Stateful**: LangGraph provides advanced state management

## Use Cases

- AI Image Generation (DALL-E, Midjourney, etc.)
- Premium Data APIs (business intelligence, enrichment)
- Language Services (translation, sentiment analysis)
- Research Tools (academic databases, reports)
- Developer Tools (code review, security scanning)
- Web3 Services (blockchain analytics, NFT data)

## Next Steps

1. **Read Documentation**
   - `README.md` - Full documentation
   - `QUICK-START.md` - Get started in 5 minutes
   - `ARCHITECTURE.md` - Understand the design

2. **Run Examples**
   - `npm run dev` - Interactive CLI
   - `npm run example` - Image generation example
   - `npx tsx examples/custom-tool.ts` - Custom tool example

3. **Add Your Tools**
   - See `src/tools/predefined.ts` for examples
   - Use helper functions: `registerPaidAPI`, `registerFreeAPI`, `registerCustomTool`
   - Test with the interactive CLI

4. **Deploy**
   - Fund your agent wallet with USDC
   - Set up environment variables
   - Run in production

## Technical Stack

- **LangGraph**: State management and agent orchestration
- **LangChain**: LLM integration and tool framework
- **OpenAI GPT-4**: Language model
- **Ethers.js**: Ethereum wallet and signing
- **Zod**: Schema validation
- **TypeScript**: Type safety
- **x402 Protocol**: Micropayment protocol

## Security

- Private keys managed via environment variables
- EIP-712 typed data signing
- Time-bound payment authorizations
- Nonces prevent replay attacks
- Input validation with Zod
- Error handling throughout

## Performance

- Lazy graph initialization
- Transaction caching
- O(1) tool lookup
- Streaming support
- Minimal dependencies

## Contributing

1. Fork the repository
2. Add your custom tools to `src/tools/predefined.ts`
3. Test with `npm run dev`
4. Submit pull request

## License

MIT

## Support

- Documentation: See `/examples` and markdown files
- x402 Protocol: https://x402.treasure.lol
- Issues: GitHub Issues

---

Built with ❤️ using LangGraph and x402 Protocol

**Ready to use! Just add your API keys and start building.**
