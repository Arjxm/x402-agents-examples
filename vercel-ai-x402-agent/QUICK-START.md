# Quick Start Guide

Get your AI agent with x402 running in 5 minutes!

## 1. Install

```bash
cd vercel-ai-x402-agent
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
AGENT_WALLET_PRIVATE_KEY=0x-your-wallet-private-key
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_NETWORK=base-sepolia
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
YOUR_WALLET_ADDRESS=0x-your-wallet-address
```

## 3. Fund Agent Wallet

Get testnet USDC for your agent:
1. Go to https://faucet.circle.com/
2. Enter your agent wallet address (from `AGENT_WALLET_PRIVATE_KEY`)
3. Request testnet USDC
4. Wait ~30 seconds

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000

## 5. Test

Try these prompts:

**Free API:**
```
What's the weather in San Francisco?
```

**Paid API:**
```
Analyze the sentiment of "I love this product!"
```

The agent will:
1. Tell you it costs $0.10
2. Ask for confirmation
3. Pay using x402
4. Show you the result

---

## Add Your Own Paid API

Edit `lib/tools-registry.ts`:

```typescript
export const PAID_APIS = [
  {
    name: 'your_api_name',
    description: 'What it does (costs $X.XX USDC)',
    endpoint: 'https://your-api.com/endpoint',
    method: 'POST' as const,
    cost: 0.50,
    schema: z.object({
      input: z.string()
    }),
    transform: (params: any) => params
  }
];
```

That's it! Your API is now available to the agent.

---

## Troubleshooting

**"Insufficient funds"**
→ Fund your agent wallet with testnet USDC

**"OpenAI API error"**
→ Check your `OPENAI_API_KEY` is valid

**"Cannot connect to wallet"**
→ Check `AGENT_WALLET_PRIVATE_KEY` format (must start with 0x)

---

## What's Next?

- Read full README.md for advanced features
- See EXAMPLE-PAID-API.md to create your own paid endpoints
- Deploy to Vercel: `vercel deploy`

Happy building! 🚀
