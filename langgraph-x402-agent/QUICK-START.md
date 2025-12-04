# Quick Start Guide

Get up and running with the LangGraph x402 Agent in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Wallet with some USDC (for paid operations)
- Wallet private key

## Step 1: Installation

```bash
cd langgraph-x402-agent
npm install
```

## Step 2: Environment Setup

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
OPENAI_API_KEY=sk-...your-key...
AGENT_WALLET_PRIVATE_KEY=0x...your-private-key...
RECEIVER_WALLET_ADDRESS=0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
X402_FACILITATOR=https://x402.treasure.lol/facilitator
X402_NETWORK=base-sepolia
```

**Important Notes**:
- Never commit your `.env` file!
- `RECEIVER_WALLET_ADDRESS` is where you'll receive payments for your paid APIs
- `AGENT_WALLET_PRIVATE_KEY` is the wallet that pays for services (needs USDC)

## Step 3: Run the Agent

```bash
npm run dev
```

You should see:

```
🔧 Initializing tools...
✅ Predefined tools initialized
🚀 Creating agent...

🤖 X402 Agent initialized
💼 Wallet address: 0x...
🔧 Available tools: 10

================================================================================
🤖 LangGraph x402 Agent - Interactive Mode
================================================================================

Type your request (or "exit" to quit)
```

## Step 4: Try Some Commands

### Free Operations

```
You: What's 15 * 24 + 100?

You: Get weather for latitude 40.7128, longitude -74.0060

You: What's the current price of bitcoin?
```

### Paid Operations

```
You: Generate an image of a sunset over mountains

You: Analyze sentiment: "This product is amazing!"
```

The agent will automatically:
1. Detect it's a paid operation
2. Create an x402 payment
3. Submit to the facilitator
4. Complete the transaction
5. Call the API
6. Return results with transaction details

## Step 5: Add Your Own Tool

Create a file `my-tool.ts`:

```typescript
import 'dotenv/config';
import { z } from 'zod';
import { X402Agent } from './src/agent/graph.js';
import { registerPaidAPI } from './src/tools/registry.js';
import { initializePredefinedTools } from './src/tools/predefined.js';

// Initialize existing tools
initializePredefinedTools();

// Add your custom paid API
registerPaidAPI({
  name: 'my_api',
  description: 'My custom paid API',
  endpoint: 'https://api.myservice.com/endpoint',
  schema: z.object({
    text: z.string().describe('Input text')
  }),
  cost: 0.10, // $0.10 USDC
  method: 'POST'
});

// Create and run agent
const agent = new X402Agent(
  process.env.OPENAI_API_KEY!,
  process.env.AGENT_WALLET_PRIVATE_KEY!
);

await agent.run('Use my_api to process: Hello World');
```

Run it:

```bash
npx tsx my-tool.ts
```

## Common Issues

### Error: OPENAI_API_KEY not found

Make sure you created the `.env` file and added your OpenAI API key.

### Error: Insufficient funds

Make sure your wallet has USDC on the network you're using (Base Sepolia for testing).

### Error: Connection timeout

Check your internet connection and the facilitator URL.

## Next Steps

1. **Explore Examples**: Check the `/examples` folder
2. **Read Full Docs**: See `README.md` for detailed documentation
3. **Add Custom Tools**: Refer to the "Adding Custom Tools" section
4. **Build Your App**: Integrate the agent into your application

## Architecture Overview

```
User Input
    ↓
LangGraph Agent (decides which tool to use)
    ↓
Tool Registry (manages all tools)
    ↓
x402 Client (handles payments)
    ↓
Facilitator (settles transactions)
    ↓
API Endpoint (returns results)
```

## Example Output

```
You: Generate an image of a cat wearing a hat

💬 User: Generate an image of a cat wearing a hat
🤔 Agent thinking...

💰 Payment required:
   Amount: $0.50 USDC
   Description: Generate AI image
   Network: base-sepolia
📤 Submitting payment to facilitator: https://x402.treasure.lol/facilitator
✅ Payment successful, API call completed

🤖 Agent: I've generated an image of a cat wearing a hat. The image has been created successfully!

💳 Payment Transaction:
   Hash: 0xabc123...def456
   Network: base-sepolia
   Explorer: https://sepolia.basescan.org/tx/0xabc123...def456
```

## Tips

1. **Start with Free Tools**: Test with calculator, weather, etc. first
2. **Check Wallet Balance**: Ensure you have USDC before using paid tools
3. **Use Testnet**: Start with Base Sepolia for testing
4. **Monitor Transactions**: Check block explorer links
5. **Read Tool Descriptions**: The agent shows cost before executing

## Need Help?

- Check `README.md` for full documentation
- Look at `/examples` for more code samples
- Review `src/tools/predefined.ts` to see how tools are defined
- Check the x402 protocol docs at https://x402.treasure.lol

---

Happy building! 🚀
