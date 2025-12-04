# Real On-Chain Settlement Guide

## What Changed

✅ **No more mock transaction hashes!**

Both sentiment analysis APIs now use **real blockchain settlements** via the x402 facilitator, which means:

- ✅ Real transaction hashes
- ✅ Verifiable on block explorers
- ✅ Actual USDC transfers
- ✅ On-chain proof of payment

---

## Prerequisites

For real settlements to work, you need:

### 1. ✅ Facilitator URL (Already Set)

```bash
X402_FACILITATOR_URL=https://x402.org/facilitator
```

This is Coinbase's hosted facilitator - **FREE to use!**

### 2. ✅ Agent Wallet with USDC

Your agent's wallet (from `AGENT_WALLET_PRIVATE_KEY`) needs USDC to pay APIs.

#### For Testing (Base Sepolia Testnet):

**Get FREE testnet USDC:**

1. Go to: https://faucet.circle.com/
2. Select **Base Sepolia** network
3. Enter your agent wallet address
4. Request testnet USDC (you'll get ~10 USDC)
5. Wait 30 seconds

**Your agent wallet address:**
```bash
# Run this to see your agent's wallet address
node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY'); console.log('Agent wallet:', wallet.address);"
```

Or check your `.env`:
```bash
# Find your wallet private key
cat .env | grep AGENT_WALLET_PRIVATE_KEY

# Then use an online tool to convert to address (or use ethers.js)
```

#### For Production (Base Mainnet):

1. Buy USDC on Coinbase/Kraken/Binance
2. Send to your agent wallet address
3. Update `.env`:
   ```bash
   X402_NETWORK=base
   USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   ```

### 3. ✅ Your Recipient Wallet

Set where you want to receive payments:

```bash
YOUR_WALLET_ADDRESS=0xYourAddress
```

This is where users' payments will be sent.

---

## How It Works Now

### Old Flow (Mock):
```
User pays → API generates fake hash → Shows fake transaction
```

### New Flow (Real):
```
User pays → Facilitator verifies signature → Facilitator settles on-chain → Returns REAL tx hash → Shows on block explorer
```

### Detailed Flow:

1. **User makes payment** - Agent signs with user's USDC
2. **API receives payment** - Gets X-PAYMENT header
3. **Verify with facilitator** - POST `/verify` checks signature is valid
4. **Settle on-chain** - POST `/settle` executes blockchain transaction
5. **Get real tx hash** - Facilitator returns actual on-chain transaction hash
6. **Show in UI** - User can click link to see on Basescan

---

## What You'll See

### In Terminal Logs:

```
💰 Payment received from: 0xUserWallet...
💵 Amount: 0.1 USDC
✅ Payment verified
🔄 Settling payment on-chain...
✅ Payment settled on-chain
📝 Transaction hash: 0xabcd1234...real-hash...5678
```

### In UI:

```
🔧 premium_sentiment_analysis
✅ Success (Cost: $0.10)
🔗 View transaction on Basescan
```

### On Basescan:

Click the link and you'll see:
- ✅ Transaction Hash: 0xabcd...
- ✅ Status: Success
- ✅ Block: #12345678
- ✅ From: 0xAgentWallet (your agent)
- ✅ To: 0xYourWallet (you)
- ✅ Value: 0.1 USDC
- ✅ Timestamp: 2 minutes ago
- ✅ Gas Fee: 0.00001 ETH

---

## Testing Real Settlements

### Step 1: Fund Your Agent Wallet

```bash
# 1. Get your agent wallet address
# 2. Go to https://faucet.circle.com/
# 3. Select Base Sepolia
# 4. Enter your agent wallet address
# 5. Get testnet USDC
```

### Step 2: Verify Balance

Check your agent has USDC:
https://sepolia.basescan.org/address/YOUR_AGENT_WALLET_ADDRESS

You should see USDC balance > 0.

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test Payment

In the chat:
```
"Analyze sentiment of 'I love this product!'"
```

Agent will:
1. Ask for confirmation
2. You say "Yes"
3. Agent pays with its USDC
4. API settles on-chain
5. Shows REAL transaction hash

### Step 5: Verify Transaction

Click the transaction link in the UI.

You should see:
- ✅ Real transaction on Basescan
- ✅ Confirmed status
- ✅ Block number
- ✅ Actual transfer of 0.1 USDC

---

## Costs

### Per Transaction:

**User pays:** $0.10 USDC (sent to YOUR_WALLET_ADDRESS)

**Agent pays (gas):** ~$0.001-0.01 ETH
- This is the cost of executing the transaction
- On Base, gas is VERY cheap (~$0.001)
- Agent's wallet needs ETH for gas

**Facilitator fee:** $0 (FREE!)

**Your profit:** ~$0.099 per API call

### Gas Fees

Your agent wallet needs a tiny bit of ETH for gas:

**Base Sepolia (Testnet):**
- Get free ETH: https://www.alchemy.com/faucets/base-sepolia
- Or: https://faucet.quicknode.com/base/sepolia

**Base Mainnet:**
- Buy ETH on Coinbase
- Bridge to Base: https://bridge.base.org/
- Send ~0.01 ETH to agent wallet (enough for 100+ transactions)

---

## Troubleshooting

### "Payment verification failed"

**Possible causes:**
1. Agent wallet has no USDC
2. Wrong network (mainnet vs testnet)
3. Invalid signature

**Solution:**
```bash
# Check agent wallet has USDC
# Go to: https://sepolia.basescan.org/address/YOUR_AGENT_ADDRESS

# Check .env settings
X402_NETWORK=base-sepolia
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Restart server
npm run dev
```

### "Payment settlement failed"

**Possible causes:**
1. Agent wallet has no ETH for gas
2. Insufficient USDC balance
3. Network congestion

**Solution:**
```bash
# Get testnet ETH for gas
# Visit: https://www.alchemy.com/faucets/base-sepolia

# Check both ETH and USDC balances
# https://sepolia.basescan.org/address/YOUR_AGENT_ADDRESS
```

### "Transaction hash still looks fake"

**Possible causes:**
1. Agent wallet not funded
2. Facilitator not responding
3. Running in offline mode

**Solution:**
```bash
# Verify facilitator URL
echo $X402_FACILITATOR_URL
# Should be: https://x402.org/facilitator

# Check network connection
curl https://x402.org/facilitator/supported

# Check agent wallet has funds
```

### "Transaction not found on explorer"

**Possible causes:**
1. Wrong network (check base vs base-sepolia)
2. Transaction not confirmed yet (wait 10-30 seconds)

**Solution:**
```bash
# Wait a minute and refresh

# Verify network in URL:
# Testnet: https://sepolia.basescan.org/tx/0x...
# Mainnet: https://basescan.org/tx/0x...
```

---

## Configuration Checklist

Before testing, verify your `.env`:

```bash
# ✅ Required for real settlements
OPENAI_API_KEY=sk-...                          # For sentiment analysis
AGENT_WALLET_PRIVATE_KEY=0x...                 # Agent's wallet (needs USDC + ETH)
X402_FACILITATOR_URL=https://x402.org/facilitator  # Coinbase facilitator
X402_NETWORK=base-sepolia                      # Testnet for testing
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e  # Base Sepolia USDC
YOUR_WALLET_ADDRESS=0x...                       # Where you receive payments
```

---

## Migration to Production

When ready for real money:

### 1. Update Network

```bash
# Change to mainnet
X402_NETWORK=base
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### 2. Fund Agent Wallet (Mainnet)

```bash
# Buy real USDC on Coinbase
# Send to agent wallet
# Get ETH for gas (bridge from Ethereum to Base)
```

### 3. Test Small Amount First

```bash
# Test with $1-2 USDC first
# Verify transactions work
# Then scale up
```

### 4. Monitor Costs

```bash
# Track agent wallet balance
# Set up alerts when balance low
# Refill before running out
```

---

## Advanced: Custom Facilitator

If you want to run your own facilitator (instead of using Coinbase's):

```bash
# Clone facilitator repo
git clone https://github.com/coinbase/x402
cd x402/facilitator

# Setup and deploy
# See: /path/to/x402-facilitator-server/README.md

# Update .env
X402_FACILITATOR_URL=https://your-facilitator.com
```

---

## Summary

✅ **What You Get:**

- Real blockchain transactions
- Verifiable payment proof
- Actual USDC transfers
- Professional payment system
- Zero facilitator fees
- Transaction history on block explorer

✅ **What You Need:**

- Agent wallet with USDC (for paying APIs)
- Agent wallet with ETH (for gas fees)
- Your wallet address (for receiving payments)
- Coinbase facilitator (free!)

✅ **What Changed:**

- ❌ Old: Mock/fake transaction hashes
- ✅ New: Real on-chain settlement with verifiable transactions

✅ **Cost Per Transaction:**

- User pays: $0.10 USDC → Your wallet
- Agent pays: ~$0.001 ETH → Gas fees
- Facilitator: FREE
- Your profit: ~$0.099

🚀 **Ready to test real settlements!**

Get testnet USDC, fund your agent wallet, and try it now!
