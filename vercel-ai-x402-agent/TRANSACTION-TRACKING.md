# Transaction Tracking Feature

## Overview

Every paid API call made by the agent now includes a clickable link to view the transaction on the blockchain explorer!

## What You Get

When the agent makes a paid API call:

1. ✅ Payment is made via x402
2. 📝 Transaction hash is captured
3. 🔗 Link to block explorer is shown in UI
4. 👀 User can verify payment on-chain

---

## How It Works

### 1. x402 Client Captures Transaction Hash

When a payment is made, the x402 client captures the transaction hash from the API response:

```typescript
// lib/x402-server.ts
export class X402ServerClient {
  public lastTransactionHash: string | null = null;
  public lastNetwork: string | null = null;

  async fetch(url: string) {
    // ... payment logic ...

    // Capture transaction hash from response
    if (data.transactionHash) {
      this.lastTransactionHash = data.transactionHash;
    }
  }

  getLastTransaction() {
    return {
      hash: this.lastTransactionHash,
      network: this.lastNetwork
    };
  }
}
```

### 2. Tool Registry Includes Transaction Info

The result now includes transaction metadata:

```typescript
// lib/tools-registry.ts
return {
  ...result,
  _transaction: {
    hash: txInfo.hash,
    network: txInfo.network,
    explorerUrl: getExplorerUrl(txInfo.hash, txInfo.network)
  }
};
```

### 3. UI Displays Clickable Link

The chat interface shows a link to the block explorer:

```tsx
{tool.result.data?._transaction?.explorerUrl && (
  <a href={tool.result.data._transaction.explorerUrl}
     target="_blank">
    View transaction on Basescan
  </a>
)}
```

---

## Supported Block Explorers

The system automatically uses the correct explorer based on network:

| Network | Explorer | URL |
|---------|----------|-----|
| **base** | Basescan | https://basescan.org/tx/ |
| **base-sepolia** | Basescan Testnet | https://sepolia.basescan.org/tx/ |
| **ethereum** | Etherscan | https://etherscan.io/tx/ |
| **polygon** | Polygonscan | https://polygonscan.com/tx/ |
| **arbitrum** | Arbiscan | https://arbiscan.io/tx/ |
| **optimism** | Optimism Etherscan | https://optimistic.etherscan.io/tx/ |

---

## Example User Experience

### 1. User Asks for Paid Service

```
User: "Analyze the sentiment of 'I love this product!'"
```

### 2. Agent Asks for Confirmation

```
Agent: "I'll use the test sentiment analysis API, which costs $0.10. Should I proceed?"
```

### 3. User Confirms

```
User: "Yes"
```

### 4. Agent Makes Payment & Shows Result

```
Agent: "The sentiment analysis is complete:
- Sentiment: Positive
- Confidence: 95%

🔧 test_sentiment_analysis
✅ Success (Cost: $0.10)
🔗 View transaction on Block Explorer"
```

### 5. User Clicks Link

Opens block explorer showing:
- Transaction hash
- From address (agent's wallet)
- To address (API owner's wallet)
- Amount (0.10 USDC)
- Timestamp
- Gas fees
- Block number

---

## For API Developers

### How to Return Transaction Hash

When you create your own paid API, include the transaction hash in your response:

```typescript
// app/api/your-paid-endpoint/route.ts
export async function POST(req: NextRequest) {
  const xPayment = req.headers.get('X-PAYMENT');

  if (!xPayment) {
    return NextResponse.json({ /* 402 response */ }, { status: 402 });
  }

  // Verify and settle payment with facilitator
  const settlement = await facilitator.settle(paymentPayload);

  // Return your data WITH transaction hash
  return NextResponse.json({
    // Your API response data
    result: "Your API result",
    data: { /* ... */ },

    // Include transaction hash from settlement
    transactionHash: settlement.transactionHash,
    network: settlement.network,

    // Optional: additional transaction info
    payer: paymentPayload.payload.from,
    amount: paymentPayload.payload.value
  });
}
```

The x402 client will automatically capture any of these fields:
- `transactionHash`
- `txHash`
- `tx`

---

## Testing the Feature

### 1. Start the Dev Server

```bash
npm run dev
```

### 2. Try the Test API

In the chat, type:

```
Analyze sentiment of "This is amazing!"
```

The agent will:
1. Use `test_sentiment_analysis` (our test endpoint)
2. Make payment
3. Show result with transaction link

### 3. Click the Transaction Link

You'll see a **mock transaction hash** (for demo purposes).

In production with real payments, you'll see actual transaction details:
- Real transaction hash
- Live on blockchain
- Verified on block explorer

---

## Configuration

### Change Block Explorer (Optional)

Edit `lib/tools-registry.ts`:

```typescript
function getExplorerUrl(txHash: string, network: string | null): string {
  const explorers: Record<string, string> = {
    'base': 'https://basescan.org/tx/',
    'base-sepolia': 'https://sepolia.basescan.org/tx/',
    // Add your custom explorer
    'my-network': 'https://my-explorer.com/tx/'
  };

  const baseUrl = explorers[network || 'base-sepolia'];
  return `${baseUrl}${txHash}`;
}
```

---

## Benefits

### For Users
- ✅ **Transparency** - See exactly where money went
- ✅ **Verification** - Confirm payment on blockchain
- ✅ **Trust** - Cryptographic proof of payment
- ✅ **Records** - Permanent transaction history

### For Developers
- ✅ **Debugging** - Track payments easily
- ✅ **Support** - Help users verify transactions
- ✅ **Compliance** - Audit trail for all payments
- ✅ **Trust** - Users can verify everything

---

## Production Considerations

### 1. Real Transaction Hashes

In production with a real facilitator:

```typescript
// The facilitator returns real transaction hash
const settlement = await facilitator.settle(paymentPayload);

// settlement.transactionHash is a real on-chain transaction
// Example: 0x8f5e2b3c1d7a9e4f6b8c2d1a3e5f7b9c1d3e5f7b9c1d3e5f7b9c1d3e5f7b9c
```

### 2. Settlement Time

- Verification: ~100ms (off-chain signature check)
- Settlement: ~2 seconds (on-chain transaction)

The transaction link appears after settlement completes.

### 3. Network Congestion

If blockchain is congested:
- Transaction might take longer
- Gas fees might be higher
- Consider queueing system for high volume

---

## Troubleshooting

### "No transaction link shown"

**Possible causes:**
1. API didn't return transaction hash
2. Using mock/test API without real settlement
3. Settlement failed but API returned data anyway

**Solution:**
- Check API response includes `transactionHash`, `txHash`, or `tx` field
- Use real facilitator for real transaction hashes
- Check server logs for transaction info

### "Transaction not found on explorer"

**Possible causes:**
1. Using mock transaction hash (test mode)
2. Wrong network selected
3. Transaction not yet confirmed

**Solution:**
- Wait 10-30 seconds for confirmation
- Verify correct network in `.env`
- Check facilitator returned real transaction hash

---

## Future Enhancements

Planned features:

- [ ] Transaction status polling (pending → confirmed)
- [ ] Gas fee display
- [ ] Transaction receipt download
- [ ] Multi-signature transaction support
- [ ] Batch transaction tracking
- [ ] Historical transaction list

---

## Example API Response

### With Transaction Hash (Production)

```json
{
  "sentiment": "positive",
  "confidence": 95,
  "transactionHash": "0x8f5e2b3c1d7a9e4f6b8c2d1a3e5f7b9c...",
  "network": "base",
  "payer": "0xAgentWallet...",
  "amount": "100000"
}
```

### Without Transaction Hash (Will work, but no link)

```json
{
  "sentiment": "positive",
  "confidence": 95
}
```

---

## Summary

✅ **Automatic** - No extra code needed
✅ **Transparent** - Users see blockchain proof
✅ **Configurable** - Support any block explorer
✅ **Production-ready** - Works with real facilitators

Every payment now has a permanent, verifiable record on the blockchain that users can inspect! 🎉
