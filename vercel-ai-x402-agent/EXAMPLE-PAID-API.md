# Example: Creating Your Own Paid API with x402

This guide shows you how to create an API endpoint that accepts x402 payments.

## Simple Example: Sentiment Analysis API

### Step 1: Create API Route

Create `app/api/example-paid/sentiment/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory verification (for demo)
// In production, use proper facilitator verification
function verifyPayment(xPaymentHeader: string): boolean {
  try {
    // Decode payment payload
    const paymentPayload = JSON.parse(
      Buffer.from(xPaymentHeader, 'base64').toString('utf-8')
    );

    // Basic validation
    if (!paymentPayload.payload.from) return false;
    if (!paymentPayload.payload.value) return false;

    // In production: verify signature, check amount, etc.
    console.log('Payment verified:', paymentPayload);

    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const xPayment = req.headers.get('X-PAYMENT');

  // Step 1: No payment - return 402
  if (!xPayment) {
    return NextResponse.json({
      x402Version: 1,
      message: 'Payment required',
      methods: [{
        scheme: 'exact',
        network: process.env.X402_NETWORK || 'base-sepolia',
        maximumAmount: '100000', // $0.10 USDC
        asset: process.env.USDC_ADDRESS,
        recipient: process.env.YOUR_WALLET_ADDRESS,
        resource: '/api/example-paid/sentiment',
        description: 'Sentiment analysis API',
        timeout: 300000
      }]
    }, { status: 402 });
  }

  // Step 2: Verify payment
  const isValidPayment = verifyPayment(xPayment);

  if (!isValidPayment) {
    return NextResponse.json({
      error: 'Invalid payment'
    }, { status: 402 });
  }

  // Step 3: Payment verified - provide service
  const { text } = await req.json();

  // Simple sentiment analysis (in production, use real ML model)
  const positiveWords = ['love', 'great', 'awesome', 'excellent', 'amazing', 'wonderful'];
  const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'horrible', 'worst'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  let sentiment = 'neutral';
  let confidence = 50;

  if (positiveCount > negativeCount) {
    sentiment = 'positive';
    confidence = Math.min(90, 60 + positiveCount * 10);
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    confidence = Math.min(90, 60 + negativeCount * 10);
  }

  return NextResponse.json({
    sentiment,
    confidence,
    positiveWords: positiveCount,
    negativeWords: negativeCount,
    text
  });
}
```

### Step 2: Add to Tools Registry

In `lib/tools-registry.ts`:

```typescript
export const PAID_APIS = [
  // ... existing APIs ...

  {
    name: 'example_sentiment_analysis',
    description: 'Sentiment analysis (costs $0.10 USDC)',
    endpoint: 'http://localhost:3000/api/example-paid/sentiment',
    method: 'POST' as const,
    cost: 0.10,
    schema: z.object({
      text: z.string().describe('Text to analyze')
    }),
    transform: (params: any) => ({
      text: params.text
    })
  }
];
```

### Step 3: Test It

```bash
# Start server
npm run dev

# In chat UI, type:
"Analyze the sentiment of 'I love this product!'"

# Agent will:
# 1. Ask: "I'll use sentiment analysis API, costs $0.10. Proceed?"
# 2. You: "Yes"
# 3. Agent pays and shows result
```

---

## Production-Ready Example with Facilitator Verification

```typescript
// app/api/paid/advanced-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

async function verifyPaymentWithFacilitator(
  paymentPayload: any,
  requiredAmount: string,
  recipient: string
): Promise<boolean> {
  try {
    const response = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements: {
          scheme: 'exact',
          network: paymentPayload.network,
          maximumAmount: requiredAmount,
          asset: process.env.USDC_ADDRESS,
          recipient,
          resource: '/api/paid/advanced-analysis'
        }
      })
    });

    const result = await response.json();
    return result.success;

  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
}

async function settlePayment(paymentPayload: any): Promise<boolean> {
  try {
    const response = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentPayload })
    });

    const result = await response.json();
    console.log('Payment settled:', result.transactionHash);
    return result.success;

  } catch (error) {
    console.error('Payment settlement failed:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const xPayment = req.headers.get('X-PAYMENT');
  const PRICE = '250000'; // $0.25 USDC
  const RECIPIENT = process.env.YOUR_WALLET_ADDRESS!;

  // Return 402 if no payment
  if (!xPayment) {
    return NextResponse.json({
      x402Version: 1,
      message: 'Payment required',
      methods: [{
        scheme: 'exact',
        network: process.env.X402_NETWORK || 'base-sepolia',
        maximumAmount: PRICE,
        asset: process.env.USDC_ADDRESS,
        recipient: RECIPIENT,
        resource: '/api/paid/advanced-analysis',
        description: 'Advanced data analysis',
        timeout: 300000
      }]
    }, { status: 402 });
  }

  // Decode payment
  const paymentPayload = JSON.parse(
    Buffer.from(xPayment, 'base64').toString('utf-8')
  );

  // Verify with facilitator
  const isValid = await verifyPaymentWithFacilitator(
    paymentPayload,
    PRICE,
    RECIPIENT
  );

  if (!isValid) {
    return NextResponse.json({
      error: 'Payment verification failed'
    }, { status: 402 });
  }

  // Settle payment (async - don't wait)
  settlePayment(paymentPayload).catch(console.error);

  // Provide service
  const { data } = await req.json();

  // Your actual service logic here
  const result = {
    analysis: 'Advanced analysis result',
    data: data,
    timestamp: new Date().toISOString(),
    cost: 0.25
  };

  return NextResponse.json(result);
}
```

---

## Testing Your Paid API

### 1. Test with cURL

```bash
# Step 1: Get payment requirements
curl -X POST http://localhost:3000/api/example-paid/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this!"}'

# Returns 402 with payment requirements

# Step 2: Make payment and call API
# (Your x402 client handles this automatically)
```

### 2. Test with Agent

Just add to registry and ask the agent:

```
User: "Analyze the sentiment of 'This is amazing!'"

Agent: "I'll use the sentiment analysis API, which costs $0.10. Proceed?"

User: "Yes"

Agent: [Makes payment and calls your API]
```

---

## API Checklist

When creating a paid API:

- [ ] Return 402 for requests without payment
- [ ] Include all required payment fields
- [ ] Verify payment signature
- [ ] Check payment amount matches
- [ ] Settle payment with facilitator
- [ ] Only provide service after verification
- [ ] Handle errors gracefully
- [ ] Log transactions for debugging
- [ ] Set reasonable timeout (300s recommended)
- [ ] Document your API clearly

---

## Common Patterns

### Pattern 1: Simple Verification (Development)

```typescript
if (!xPayment) return 402;
if (basicValidation(xPayment)) {
  return service();
}
```

### Pattern 2: Facilitator Verification (Production)

```typescript
if (!xPayment) return 402;
if (await facilitator.verify(xPayment)) {
  facilitator.settle(xPayment); // Async
  return service();
}
```

### Pattern 3: With Balance Check

```typescript
if (!xPayment) return 402;
if (await verifyAndCheckBalance(xPayment)) {
  await deductBalance(user, cost);
  return service();
}
```

---

## Next Steps

1. Create your API endpoint
2. Test with agent
3. Deploy to production
4. Monitor usage and costs
5. Scale as needed

Your API can now accept x402 payments and work with AI agents automatically!
