# x402-Protected Sentiment Analysis API

A reference implementation of an x402-protected API server that requires payment before serving requests.

## Overview

This server demonstrates how to build an API that:
1. Returns `402 Payment Required` for unpaid requests
2. Validates x402 payments from the facilitator
3. Serves protected content (sentiment analysis) after payment
4. Prevents payment replay attacks

## How It Works

### Request Flow

```
Client Request (no payment)
    ↓
[402 Payment Required Response]
    ↓
Client creates EIP-712 signature
    ↓
Client submits to facilitator
    ↓
Facilitator processes payment
    ↓
Client retries with X-PAYMENT header
    ↓
Server validates payment
    ↓
[200 OK with sentiment analysis]
```

### Payment Validation

The server validates payments using three methods (in order of preference):

1. **Facilitator Validation** (Primary)
   - Queries facilitator to verify payment
   - Most efficient and recommended

2. **On-Chain Validation** (Fallback)
   - Checks transaction on blockchain
   - Most secure but slower
   - Requires RPC access

3. **Format Validation** (Testing Only)
   - Basic format checks
   - NOT SECURE for production
   - Used when facilitator is unavailable

## Setup

### 1. Install Dependencies

```bash
cd x402-api
npm install
```

### 2. Configure Environment

The `.env` file is already configured with your settings:

```env
PORT=3001
OPENAI_API_KEY=your_key_here
RECEIVER_WALLET_ADDRESS=0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
PAYMENT_AMOUNT=100000
USDC_TOKEN_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NETWORK=base-sepolia
FACILITATOR_URL=https://x402.treasure.lol/facilitator
RPC_URL=https://sepolia.base.org
```

### 3. Start the Server

```bash
# Development mode (with hot reload)
./start-api.sh

# Or manually
npm run dev

# Production build
npm run build
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "x402-protected-sentiment-api"
}
```

### Sentiment Analysis (Protected)

```bash
POST /sentiment
Content-Type: application/json

{
  "text": "I love this product!",
  "model": "gpt-3.5-turbo",     // optional
  "temperature": 0.3             // optional
}
```

#### First Request (No Payment)

Response: `402 Payment Required`
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

#### Request With Payment

```bash
POST /sentiment
Content-Type: application/json
X-PAYMENT: 0xabc123...  # Transaction hash from facilitator

{
  "text": "I love this product!"
}
```

Response: `200 OK`
```json
{
  "text": "I love this product!",
  "sentiment": "positive",
  "confidence": 0.95,
  "explanation": "The text expresses strong positive emotion with the word 'love' and enthusiasm about the product.",
  "payment": {
    "transactionHash": "0xabc123...",
    "status": "confirmed",
    "network": "base-sepolia"
  }
}
```

## Testing the x402 Flow

### Using cURL

1. **First request (triggers 402):**
```bash
curl -X POST http://localhost:3001/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this product!"}'
```

2. **Request with payment:**
```bash
curl -X POST http://localhost:3001/sentiment \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: 0x1234567890abcdef..." \
  -d '{"text": "I love this product!"}'
```

### Using the LangGraph Agent

The agent will automatically handle the x402 flow:

```bash
# In the main project directory
npm run dev

# Ask the agent
User: Analyze the sentiment of this text: I love this product!
```

The agent will:
1. Call `/sentiment` endpoint
2. Receive 402 response
3. Create payment signature
4. Submit to facilitator
5. Retry with payment hash
6. Display transaction details

## Security Features

### Payment Replay Prevention

The server tracks processed payment hashes to prevent reuse:
```typescript
const processedPayments = new Set<string>();

if (processedPayments.has(paymentHeader)) {
  return res.status(400).json({
    error: 'Payment already used'
  });
}
```

In production, use Redis or a database instead of in-memory storage.

### Payment Validation

Three validation methods are implemented:
- Facilitator validation (primary)
- On-chain validation (fallback)
- Format validation (testing only)

### Amount Verification

The server verifies that:
- Payment recipient matches expected address
- Payment amount meets minimum requirement
- Payment is on the correct network
- Transaction was successful

## Production Deployment

### Required Changes

1. **Replace In-Memory Storage**
   ```typescript
   // Use Redis or database
   import Redis from 'ioredis';
   const redis = new Redis();

   await redis.set(`payment:${hash}`, '1', 'EX', 3600);
   ```

2. **Enable On-Chain Validation**
   ```typescript
   // Uncomment on-chain validation in payment-validator.ts
   const isValid = await validatePaymentOnChain(
     transactionHash,
     process.env.RPC_URL!,
     expectedRecipient,
     expectedAmount,
     process.env.USDC_TOKEN_ADDRESS!
   );
   ```

3. **Remove Fallback Validation**
   ```typescript
   // Remove validatePaymentFallback() - fail closed in production
   if (!response.ok) {
     return false;  // Don't use fallback
   }
   ```

4. **Add Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });
   app.use(limiter);
   ```

5. **Add Logging & Monitoring**
   - Use structured logging (Winston, Pino)
   - Monitor payment validations
   - Alert on failed validations
   - Track payment usage

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `RECEIVER_WALLET_ADDRESS` | Payment recipient | `0x501a...` |
| `PAYMENT_AMOUNT` | Amount in smallest unit | `100000` (0.10 USDC) |
| `USDC_TOKEN_ADDRESS` | USDC contract address | `0x036C...` |
| `NETWORK` | Network name | `base-sepolia` |
| `FACILITATOR_URL` | x402 facilitator URL | `https://x402.treasure.lol/facilitator` |
| `RPC_URL` | RPC endpoint for on-chain validation | `https://sepolia.base.org` |

## Troubleshooting

### Payment Validation Fails

- Check facilitator is reachable
- Verify network matches (base-sepolia)
- Ensure transaction hash is correct format
- Check receiver address matches

### OpenAI Errors

- Verify `OPENAI_API_KEY` is set
- Check API key has credits
- Ensure rate limits not exceeded

### Server Won't Start

- Check port 3001 is not in use
- Verify all environment variables are set
- Ensure dependencies are installed (`npm install`)

## Architecture

```
┌─────────────────┐
│  Express Server │
├─────────────────┤
│                 │
│  /sentiment     │◄─── POST with/without X-PAYMENT header
│  endpoint       │
│                 │
└────────┬────────┘
         │
         ├─► Payment Validator
         │   ├─► Facilitator Check
         │   ├─► On-Chain Check
         │   └─► Format Check
         │
         └─► Sentiment Service
             └─► OpenAI API

```

## License

MIT
