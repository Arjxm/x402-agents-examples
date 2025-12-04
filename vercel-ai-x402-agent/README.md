# AI Agent with Vercel AI SDK + x402

A simple, flexible AI agent that can call both free and paid APIs using the x402 payment protocol. Built with Vercel AI SDK and Next.js.

## Features

✅ **Easy to add paid APIs** - Just add entry to tools registry
✅ **Automatic x402 payment** - Agent handles payments autonomously
✅ **Cost transparency** - Agent asks before spending money
✅ **Free + Paid tools** - Mix of free and paid APIs
✅ **Streaming responses** - Real-time chat interface
✅ **Type-safe** - Full TypeScript support

---

## Quick Start

### 1. Install Dependencies

```bash
cd vercel-ai-x402-agent
npm install
```

### 2. Set Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Get from OpenAI
OPENAI_API_KEY=sk-...

# Generate a new wallet or use existing
AGENT_WALLET_PRIVATE_KEY=0x...

# Facilitator (use Coinbase's for free)
X402_FACILITATOR_URL=https://x402.org/facilitator

# Use base-sepolia for testing
X402_NETWORK=base-sepolia
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Your wallet to receive deposits (if building deposit feature)
YOUR_WALLET_ADDRESS=0x...
```

### 3. Fund Agent Wallet

Your agent needs USDC to pay for APIs:

**Option A: Testnet (Recommended for development)**
- Get Base Sepolia testnet USDC: https://faucet.circle.com/
- Send to your `AGENT_WALLET_PRIVATE_KEY` address

**Option B: Mainnet**
- Buy USDC on Coinbase/exchange
- Send to agent wallet address
- Change `X402_NETWORK=base` in `.env`

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## How to Add Your Own Paid APIs

### Step 1: Add API to Registry

Edit `lib/tools-registry.ts`:

```typescript
export const PAID_APIS = [
  // ... existing APIs ...

  // Add your new API here
  {
    name: 'my_custom_api',
    description: 'What your API does (costs $X.XX USDC)',
    endpoint: 'https://your-api.com/endpoint',
    method: 'POST' as const,
    cost: 0.50, // Cost in USD
    schema: z.object({
      // Define parameters
      input: z.string().describe('Input parameter'),
      option: z.string().optional().describe('Optional parameter')
    }),
    transform: (params: any) => ({
      // Transform params to match your API's format
      query: params.input,
      options: { setting: params.option }
    })
  }
];
```

### Step 2: That's It!

The agent will automatically:
- ✅ Know about your new API
- ✅ Decide when to use it
- ✅ Ask user for confirmation (it costs money!)
- ✅ Pay using x402
- ✅ Return the result

### Example: Adding Weather API

```typescript
{
  name: 'premium_weather_forecast',
  description: 'Get 14-day weather forecast with hourly details (costs $0.05 USDC)',
  endpoint: 'https://api.premium-weather.com/forecast',
  method: 'POST' as const,
  cost: 0.05,
  schema: z.object({
    location: z.string().describe('City name or coordinates'),
    days: z.number().default(7).describe('Number of days to forecast (1-14)')
  }),
  transform: (params: any) => ({
    location: params.location,
    days: params.days,
    units: 'metric'
  })
}
```

Now users can ask:
> "What's the 7-day weather forecast for New York?"

Agent will:
1. "I can get a detailed 7-day forecast using our premium weather API, which costs $0.05. Should I proceed?"
2. User: "Yes"
3. Agent calls API and pays $0.05
4. Returns forecast

---

## Adding Free APIs

Edit `lib/tools-registry.ts`:

```typescript
export const FREE_APIS = [
  // ... existing free APIs ...

  {
    name: 'my_free_api',
    description: 'What your free API does',
    endpoint: 'https://your-api.com/endpoint',
    method: 'POST' as const,
    cost: 0, // Free!
    schema: z.object({
      query: z.string()
    }),
    transform: (params: any) => params
  }
];
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  User Chat UI (app/page.tsx)                       │
│  - Sends messages via Vercel AI SDK                │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Agent API (app/api/chat/route.ts)                 │
│  - GPT-4 with tools                                 │
│  - Decides which API to call                        │
│  - Asks user before spending money                  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Tools Registry (lib/tools-registry.ts)            │
│  - Defines all available APIs                       │
│  - Paid APIs use x402ServerClient                   │
│  - Free APIs call directly                          │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  x402 Client (lib/x402-server.ts)                  │
│  - Signs payment with agent wallet                  │
│  - Handles 402 Payment Required                     │
│  - Automatically retries with payment               │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Paid API Endpoint                                  │
│  - Returns 402 with payment requirements            │
│  - Verifies x402 payment                            │
│  - Returns data                                     │
└─────────────────────────────────────────────────────┘
```

---

## Payment Flow

### How Agent Pays for APIs

1. **User asks question**: "Analyze sentiment of 'I love this!'"

2. **Agent decides**: Needs `premium_sentiment_analysis` tool

3. **Agent asks user**: "I'll use premium sentiment API, costs $0.10. Proceed?"

4. **User confirms**: "Yes"

5. **Agent calls API**:
   ```typescript
   const response = await x402Client.fetch('https://api.com/analyze', {
     method: 'POST',
     body: JSON.stringify({ text: 'I love this!' })
   });
   ```

6. **API returns 402**: Payment required
   ```json
   {
     "x402Version": 1,
     "methods": [{
       "scheme": "exact",
       "network": "base-sepolia",
       "maximumAmount": "100000",
       "asset": "0x036Cbd...",
       "recipient": "0xApiOwner..."
     }]
   }
   ```

7. **x402 client signs payment**: Using agent's private key

8. **Retry with payment header**: `X-PAYMENT: <base64-encoded-signature>`

9. **API verifies & settles**: Gets paid via facilitator

10. **API returns data**: Agent shows result to user

---

## Who Pays?

### Current Setup: Agent Pays (You Reimburse Later)

```
Agent Wallet → Pays API → You track costs → Bill user
```

**For Production:**

Add prepaid balance system:

```typescript
// In tools-registry.ts, uncomment these lines:

// Before API call:
const user = await db.users.findOne({ id: userId });
if (user.balance < apiConfig.cost) {
  throw new Error('Insufficient balance');
}

// After API call:
await db.users.updateOne(
  { id: userId },
  { $inc: { balance: -apiConfig.cost } }
);
```

Then users deposit first:
1. User deposits $10 to YOUR service
2. You track their balance
3. Agent uses YOUR wallet to call APIs
4. You deduct from user's balance

---

## Example Conversations

### Free API

**User**: What's the weather in San Francisco?

**Agent**: I'll check the weather using our free weather API.

[Calls free_weather]

**Agent**: Current weather in San Francisco: 68°F, partly cloudy, wind speed 12 mph.

---

### Paid API (with confirmation)

**User**: Analyze the sentiment of "This product is terrible"

**Agent**: I can analyze the sentiment using our premium sentiment analysis API, which provides detailed analysis including confidence scores and emotional tone. This costs $0.10. Should I proceed?

**User**: Yes

**Agent**: [Calling premium_sentiment_analysis...]

The sentiment analysis is complete:
- Sentiment: Negative
- Confidence: 94%
- Emotional tone: Disappointed, frustrated

Cost: $0.10

---

## Testing

### Test with Mock APIs

Create a test API endpoint that returns 402:

```typescript
// test-api/route.ts
export async function POST(req: Request) {
  const xPayment = req.headers.get('X-PAYMENT');

  if (!xPayment) {
    return Response.json({
      x402Version: 1,
      methods: [{
        scheme: 'exact',
        network: 'base-sepolia',
        maximumAmount: '100000', // $0.10
        asset: process.env.USDC_ADDRESS,
        recipient: process.env.YOUR_WALLET_ADDRESS,
        description: 'Test API call'
      }]
    }, { status: 402 });
  }

  // Payment received - return result
  return Response.json({
    result: 'Test successful!',
    timestamp: Date.now()
  });
}
```

---

## Advanced Features

### 1. Add Budget Limits

```typescript
// In app/api/chat/route.ts
const MAX_COST_PER_SESSION = 5.00;
let sessionCost = 0;

// Before executing paid API:
if (sessionCost + api.cost > MAX_COST_PER_SESSION) {
  throw new Error('Budget exceeded for this session');
}

sessionCost += api.cost;
```

### 2. Add Rate Limiting

```typescript
// Track API calls per user
const callCounts = new Map<string, number>();

function checkRateLimit(userId: string): boolean {
  const count = callCounts.get(userId) || 0;
  if (count > 10) { // Max 10 calls per hour
    return false;
  }
  callCounts.set(userId, count + 1);
  return true;
}
```

### 3. Add Logging

```typescript
// In executePaidAPI:
console.log({
  timestamp: new Date(),
  userId,
  api: apiConfig.name,
  cost: apiConfig.cost,
  success: true
});
```

---

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# https://vercel.com/your-project/settings/environment-variables
```

### Deploy to Other Platforms

Works on any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- Google Cloud Run

---

## Troubleshooting

### "Agent wallet has insufficient funds"

**Solution**: Fund your agent wallet with USDC on Base Sepolia:
1. Get testnet USDC: https://faucet.circle.com/
2. Send to agent wallet address

### "Payment verification failed"

**Solution**: Check:
- Correct USDC address for network
- Correct facilitator URL
- Agent wallet has enough USDC
- API endpoint is returning proper 402 response

### "Tool not found"

**Solution**:
- Check tool name in `tools-registry.ts` matches
- Restart dev server after adding new tools

---

## Production Checklist

- [ ] Switch to mainnet (`X402_NETWORK=base`)
- [ ] Use mainnet USDC address
- [ ] Fund agent wallet with real USDC
- [ ] Add prepaid balance system
- [ ] Add database for user balances
- [ ] Add authentication
- [ ] Add rate limiting
- [ ] Add logging/monitoring
- [ ] Add error handling
- [ ] Set up deposit endpoint for users
- [ ] Test all paid APIs thoroughly

---

## Examples of APIs You Can Add

### Data APIs
- Company data enrichment (Clearbit, Apollo)
- Contact information lookup
- Email validation
- Phone number verification

### AI/ML APIs
- Image generation (Midjourney, DALL-E)
- Video analysis
- OCR (text extraction)
- Speech-to-text

### Financial APIs
- Stock data (Alpha Vantage)
- Crypto prices (CoinGecko Pro)
- News sentiment

### Productivity APIs
- Document conversion
- PDF generation
- Calendar management
- Email sending (SendGrid)

---

## Support

For questions about:
- **x402 protocol**: https://x402.org
- **Vercel AI SDK**: https://sdk.vercel.ai
- **This project**: Open an issue

---

## License

MIT

---

**Built with ❤️ using Vercel AI SDK and x402**
