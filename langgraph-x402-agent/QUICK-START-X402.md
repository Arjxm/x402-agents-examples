# Quick Start: x402 Payment System

## TL;DR - Get Started in 3 Steps

### Option A: Two Terminal Windows (Recommended)

**Terminal 1 - Start x402 API:**
```bash
cd x402-api
./start-api.sh
```

**Terminal 2 - Start Agent:**
```bash
npm run dev
```

Then ask: `Analyze the sentiment of this text: I love this product!`

### Option B: One Command (Requires tmux)

```bash
./start-x402-system.sh
```

## What You Built

### 1. x402-Protected API (`x402-api/`)
- Returns `402 Payment Required` for unpaid requests
- Validates payments via facilitator
- Serves sentiment analysis after payment
- Prevents payment replay attacks

### 2. Updated Agent Tool (`src/tools/predefined.ts`)
- `sentiment_analysis` now calls your local x402 API
- Automatically handles payment flow
- Shows transaction details

## Test the Flow

```
User: Analyze the sentiment of this text: I love this product!
          ↓
Agent calls http://localhost:3001/sentiment
          ↓
API returns 402 Payment Required
          ↓
Agent creates EIP-712 signature
          ↓
Agent submits to x402 facilitator
          ↓
Facilitator processes payment → Transaction Hash
          ↓
Agent retries with X-PAYMENT header
          ↓
API validates payment
          ↓
API returns sentiment analysis
          ↓
Agent shows result + transaction link
```

## Expected Output

### x402 API Terminal
```
💳 402 Payment Required - No payment header found
🔍 Validating payment: 0xabc123...
✅ Payment validated successfully
🤖 Analyzing sentiment for: "I love this product!..."
📊 Sentiment analysis complete
```

### Agent Terminal
```
💬 User: "Analyze the sentiment of this text: I love this product!"

💰 Executing paid tool: sentiment_analysis (cost: $0.1)

🤖 Agent: The sentiment is **positive** with confidence 0.95

💳 Payment Transaction:
   Hash: 0xabc123def456...
   Network: base-sepolia
   Explorer: https://sepolia.basescan.org/tx/0xabc123def456...
```

## Verify the Transaction

Click the explorer link to see:
- ✅ Status: Success
- From: Your agent wallet
- To: USDC contract
- Value: 0.10 USDC transferred

## Files Changed

### Created
- `x402-api/` - Complete x402 API server
  - `src/index.ts` - Main server with 402 logic
  - `src/payment-validator.ts` - Payment validation
  - `src/sentiment-service.ts` - OpenAI integration
  - `.env` - Configuration
  - `package.json` - Dependencies

### Modified
- `src/tools/predefined.ts` - sentiment_analysis now uses x402Client.fetch()
- `.env` - Added X402_SENTIMENT_API_URL=http://localhost:3001/sentiment

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "I can't see any tx" | ✅ Fixed! Tool now uses x402Client.fetch() |
| API not starting | Check port 3001 is free: `lsof -ti:3001` |
| 402 not appearing | Verify API is running: `curl http://localhost:3001/health` |
| Payment validation fails | Check agent wallet has USDC on Base Sepolia |
| OpenAI error | Verify OPENAI_API_KEY in `x402-api/.env` |

## Key Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Test 402 Response
```bash
curl -X POST http://localhost:3001/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}'
```

Expected: `402 Payment Required`

## Cost Per Request

- USDC Payment: $0.10 (goes to receiver wallet)
- Gas Fee: ~$0.01 (Base Sepolia)
- **Total: ~$0.11**

## Next Steps

1. ✅ Test with sentiment analysis
2. Add more protected endpoints (translate, summarize, etc.)
3. Deploy x402 API to production
4. Switch from base-sepolia to base mainnet
5. Add monitoring and logging

## Documentation

- Full Guide: `X402-COMPLETE-GUIDE.md`
- API Docs: `x402-api/README.md`
- Architecture: `ARCHITECTURE.md`

## Support

If you see the transaction hash in the agent output, **it's working perfectly!** 🎉

The x402 payment protocol is now fully operational.
