# Quick Setup for Real On-Chain Settlements

## ✅ Changes Made

Both sentiment APIs now use **REAL blockchain settlements** - no more mock hashes!

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your Agent Wallet Address

Your agent wallet is derived from `AGENT_WALLET_PRIVATE_KEY` in `.env`.

**Find the address:**

```bash
# Option A: Use Node
node -e "console.log(new (require('ethers')).Wallet(process.env.AGENT_WALLET_PRIVATE_KEY).address)"

# Option B: Check online converter
# Copy your AGENT_WALLET_PRIVATE_KEY
# Paste into: https://iancoleman.io/eip1752/
# (Use offline for security)
```

### Step 2: Fund Agent Wallet with Testnet USDC

**Get FREE testnet USDC:**

1. Visit: https://faucet.circle.com/
2. Select **Base Sepolia** network
3. Enter your **agent wallet address** from Step 1
4. Click "Request testnet USDC"
5. Wait 30-60 seconds

**Get FREE testnet ETH (for gas):**

1. Visit: https://www.alchemy.com/faucets/base-sepolia
2. Enter your **agent wallet address**
3. Request testnet ETH
4. Wait 30-60 seconds

### Step 3: Verify & Test

**Check your agent wallet has funds:**

https://sepolia.basescan.org/address/YOUR_AGENT_WALLET_ADDRESS

You should see:
- ✅ USDC Balance: 10 USDC (or more)
- ✅ ETH Balance: 0.01 ETH (or more)

**Restart your server:**

```bash
npm run dev
```

**Test a payment:**

In the chat, type:
```
Analyze sentiment of "I love this product!"
```

When agent asks, say: `Yes`

**Click the transaction link** and verify it's real on Basescan! 🎉

---

## What You'll See

### In Terminal:
```
💰 Payment received from: 0x...
💵 Amount: 0.1 USDC
✅ Payment verified
🔄 Settling payment on-chain...
✅ Payment settled on-chain
📝 Transaction hash: 0xREAL_HASH_HERE
```

### In Browser:
```
🔗 View transaction on Block Explorer
```

### On Basescan:
- Real transaction details
- Confirmed status
- Block number
- Timestamp
- USDC transfer proof

---

## Costs

**Per API call:**
- User pays: $0.10 USDC
- Agent pays gas: ~$0.001 ETH (super cheap on Base!)
- Facilitator fee: $0 (FREE!)
- Your profit: ~$0.099

**With 10 USDC testnet balance:**
- You can make ~100 API calls
- Costs nothing (it's testnet!)

---

## Troubleshooting

### "Insufficient funds"
→ Get more testnet USDC from faucet

### "Transaction failed"
→ Get testnet ETH for gas

### "Verification failed"
→ Check `.env` has correct USDC address for base-sepolia

### "Transaction not found"
→ Wait 30 seconds, then refresh block explorer

---

## Files Changed

1. ✅ `app/api/sentiment/route.ts` - Real settlement
2. ✅ `app/api/test-paid/route.ts` - Real settlement
3. ✅ Both now call facilitator `/verify` and `/settle`

---

## Next: Production

When ready for real money:

1. Change `.env` to mainnet:
   ```bash
   X402_NETWORK=base
   USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   ```

2. Fund agent wallet with real USDC + ETH

3. Test with small amounts first!

---

**Ready to test real blockchain settlements? Fund your agent wallet and try it!** 🚀
