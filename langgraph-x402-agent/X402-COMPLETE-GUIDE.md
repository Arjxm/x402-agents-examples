# Complete x402 Setup Guide

This guide shows you how to run the complete x402 payment flow with your LangGraph agent and custom x402-protected API.

## Architecture Overview

```
┌──────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│  LangGraph Agent │────────▶│  x402 Protected API │────────▶│  x402 Facilitator│
│  (Your Agent)    │         │  (localhost:3001)   │         │  (treasure.lol)  │
└──────────────────┘         └─────────────────────┘         └──────────────────┘
        │                              │                              │
        │ 1. Call /sentiment          │ 1. Returns 402               │
        │──────────────────────────────▶                              │
        │                              │                              │
        │ 2. Create EIP-712 signature │                              │
        │ 3. Submit to facilitator    │                              │
        │────────────────────────────────────────────────────────────▶│
        │                              │                              │
        │                              │                 4. Process   │
        │                              │                    payment   │
        │◀────────────────────────────────────────────────────────────│
        │ 5. Get tx hash              │                              │
        │                              │                              │
        │ 6. Retry with X-PAYMENT     │                              │
        │──────────────────────────────▶│                             │
        │                              │ 7. Validate payment          │
        │                              │──────────────────────────────▶│
        │                              │                              │
        │                              │◀─────────────────────────────│
        │                              │ 8. Payment confirmed         │
        │                              │                              │
        │◀──────────────────────────────│ 9. Return result            │
        │ 10. Show transaction        │                              │
```

## Quick Start

### Step 1: Install Dependencies for x402 API

```bash
cd x402-api
npm install
cd ..
```

### Step 2: Start the x402-Protected API Server

Open a **new terminal window** and run:

```bash
cd x402-api
./start-api.sh
```

You should see:
```
🚀 x402-Protected Sentiment API Server
📡 Server running on http://localhost:3001
💳 Payment: 100000 USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
💰 Receiver: 0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
🌐 Network: base-sepolia
🔗 Facilitator: https://x402.treasure.lol/facilitator

✅ Ready to accept x402 payments!
```

### Step 3: Test the API Directly (Optional)

Test that the 402 response works:

```bash
curl -X POST http://localhost:3001/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this product!"}'
```

Expected response (402 Payment Required):
```json
{
  "error": "Payment Required",
  "paymentRequired": true,
  "amount": "100000",
  "currency": "USDC",
  "token": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "recipient": "0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6",
  "network": "base-sepolia",
  "facilitator": "https://x402.treasure.lol/facilitator",
  "message": "This endpoint requires payment of 0.10 USDC to access"
}
```

✅ Perfect! The API is correctly returning 402.

### Step 4: Start the LangGraph Agent

In your **original terminal window**, run:

```bash
npm run dev
```

### Step 5: Test the Complete x402 Flow

When the agent prompt appears, type:

```
Analyze the sentiment of this text: I love this product!
```

## What You Should See

### Terminal 1 (x402 API Server)

```
💳 402 Payment Required - No payment header found
🔍 Validating payment: 0xabc123...
✅ Payment validated successfully
🤖 Analyzing sentiment for: "I love this product!..."
📊 Sentiment analysis complete
```

### Terminal 2 (LangGraph Agent)

```
💬 User: "Analyze the sentiment of this text: I love this product!"
🤔 Agent thinking...

💰 Executing paid tool: sentiment_analysis (cost: $0.1)
💳 Payment required for this API
🔐 Creating payment authorization...
✅ Payment authorized

🤖 Agent: The sentiment of the text "I love this product!" is **positive**
with a confidence of 0.95. The text expresses strong enthusiasm and
satisfaction with the product.

💳 Payment Transaction:
   Hash: 0xabc123def456...
   Network: base-sepolia
   Explorer: https://sepolia.basescan.org/tx/0xabc123def456...
```

## Verifying the Transaction

### Option 1: Block Explorer

Click the explorer link shown in the agent output:
```
https://sepolia.basescan.org/tx/0x[your-tx-hash]
```

You should see:
- ✅ Transaction successful
- From: Your agent wallet
- To: USDC contract (calling transferWithAuthorization)
- Value: 0.10 USDC

### Option 2: Check Receiver Wallet

Visit:
```
https://sepolia.basescan.org/address/0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
```

You should see the incoming USDC transaction.

## Understanding the Flow

### 1. First Request (No Payment)
```typescript
// Agent calls API
const response = await x402Client.fetch('http://localhost:3001/sentiment', {
  method: 'POST',
  body: JSON.stringify({ text: 'I love this product!' })
});

// API returns 402
{
  paymentRequired: true,
  amount: '100000',
  recipient: '0x501ab...',
  facilitator: 'https://x402.treasure.lol/facilitator'
}
```

### 2. Payment Creation
```typescript
// Agent creates EIP-712 signature
const signature = await wallet.signTypedData({
  domain: { name: 'USD Coin', version: '2', ... },
  types: { TransferWithAuthorization: [...] },
  message: {
    from: agentWallet,
    to: receiverWallet,
    value: '100000',
    validAfter: 0,
    validBefore: Math.floor(Date.now() / 1000) + 3600,
    nonce: randomBytes(32)
  }
});
```

### 3. Facilitator Submission
```typescript
// Agent sends to facilitator
const facilitatorResponse = await fetch('https://x402.treasure.lol/facilitator', {
  method: 'POST',
  body: JSON.stringify({
    signature,
    authorization: { from, to, value, ... },
    x402Version: 1,
    scheme: 'erc3009',
    network: 'base-sepolia'
  })
});

// Facilitator broadcasts transaction and returns hash
{ transactionHash: '0xabc123...' }
```

### 4. Retry With Payment
```typescript
// Agent retries with payment proof
const response = await fetch('http://localhost:3001/sentiment', {
  method: 'POST',
  headers: {
    'X-PAYMENT': '0xabc123...'  // Transaction hash from facilitator
  },
  body: JSON.stringify({ text: 'I love this product!' })
});

// API validates payment and returns result
{
  sentiment: 'positive',
  confidence: 0.95,
  payment: {
    transactionHash: '0xabc123...',
    status: 'confirmed'
  }
}
```

## Troubleshooting

### Issue: "I can't see any tx"

**Cause**: The tool wasn't calling an x402-protected endpoint.

**Solution**: ✅ Fixed! The sentiment_analysis tool now uses `x402Client.fetch()` to call `http://localhost:3001/sentiment`.

### Issue: 402 response not appearing

**Check**:
1. x402 API server is running on port 3001
2. `.env` has `X402_SENTIMENT_API_URL=http://localhost:3001/sentiment`
3. No firewall blocking localhost connections

### Issue: Payment validation fails

**Check**:
1. Agent wallet has USDC balance (check on Base Sepolia)
2. `RECEIVER_WALLET_ADDRESS` matches in both `.env` files
3. Facilitator URL is correct and reachable
4. Network is set to `base-sepolia` in both places

### Issue: OpenAI error in API

**Check**:
1. `OPENAI_API_KEY` is set in `x402-api/.env`
2. API key is valid and has credits
3. Not hitting rate limits

## Testing Payment Replay Protection

Try using the same payment twice:

```bash
# Get the transaction hash from the first successful request
TX_HASH="0xabc123..."

# Try to use it again
curl -X POST http://localhost:3001/sentiment \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: $TX_HASH" \
  -d '{"text": "Another analysis"}'
```

Expected response:
```json
{
  "error": "Payment already used",
  "message": "This payment has already been processed"
}
```

✅ This prevents someone from reusing the same payment for multiple requests.

## Cost Breakdown

### Per Sentiment Analysis Request

1. **Gas Fee**: ~$0.01 - $0.05 (Base Sepolia is very cheap)
2. **USDC Payment**: $0.10 (goes to receiver wallet)
3. **Total Cost**: ~$0.11 - $0.15

### Where Does the Money Go?

- **USDC (0.10)**: Transferred to `RECEIVER_WALLET_ADDRESS`
- **Gas**: Paid by the facilitator (they may charge a small fee)

## Advanced: On-Chain Payment Validation

For maximum security, the API can validate payments on-chain instead of trusting the facilitator:

Edit `x402-api/src/index.ts`:

```typescript
// Replace facilitator validation with on-chain validation
import { validatePaymentOnChain } from './payment-validator.js';

const isValid = await validatePaymentOnChain(
  paymentHeader,
  process.env.RPC_URL!,
  process.env.RECEIVER_WALLET_ADDRESS!,
  process.env.PAYMENT_AMOUNT!,
  process.env.USDC_TOKEN_ADDRESS!
);
```

This will:
1. Query the blockchain directly
2. Find the transaction
3. Verify it transferred the correct amount
4. Confirm it was successful

**Trade-off**: Slower but more secure.

## Production Checklist

Before deploying to production:

- [ ] Replace in-memory payment storage with Redis/database
- [ ] Enable on-chain payment validation
- [ ] Remove fallback validation
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add monitoring and alerts
- [ ] Use environment-specific RPC URLs
- [ ] Implement proper error handling
- [ ] Add API authentication (beyond payment)
- [ ] Set up HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Add request timeout limits
- [ ] Implement payment expiry (e.g., 5 minutes)

## Next Steps

### Add More Protected Endpoints

Create additional paid endpoints in the x402 API:

```typescript
// Add to x402-api/src/index.ts
app.post('/translate', async (req, res) => {
  // Same x402 payment validation
  // Then perform translation
});

app.post('/summarize', async (req, res) => {
  // Same x402 payment validation
  // Then perform summarization
});
```

### Update Agent Tools

Add corresponding tools in `src/tools/predefined.ts`:

```typescript
registerCustomTool({
  name: 'translate_text',
  isPaid: true,
  cost: 0.15,
  execute: async (params, x402Client) => {
    return await x402Client.fetch('http://localhost:3001/translate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
});
```

### Deploy to Production

1. Deploy x402 API to a hosting service (Render, Railway, etc.)
2. Update `.env` with production URL
3. Test with testnet first
4. Switch to mainnet (base) when ready

## Resources

- [x402 Protocol Docs](https://x402.treasure.lol)
- [EIP-3009 Specification](https://eips.ethereum.org/EIPS/eip-3009)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- [USDC on Base](https://www.circle.com/en/usdc)

## Summary

You now have a complete x402 payment system running:

✅ x402-protected API server
✅ Agent with x402 client integration
✅ Automatic payment flow
✅ Transaction visibility
✅ Payment validation
✅ Replay attack prevention

Every time you ask the agent to analyze sentiment, you'll see a real USDC transaction on Base Sepolia! 🎉
