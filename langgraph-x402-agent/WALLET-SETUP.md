# Wallet Setup Guide

Understanding the two wallets used in the LangGraph x402 Agent.

## Two Wallets Explained

### 1. Agent Wallet (Payer)
**Environment Variable**: `AGENT_WALLET_PRIVATE_KEY`

- **Purpose**: This wallet PAYS for API services
- **What you need**: Private key (e.g., `0x7cbf...`)
- **Requirements**: Must have USDC balance to pay for services
- **Security**: KEEP PRIVATE - never share or commit to git

**Example**:
```env
AGENT_WALLET_PRIVATE_KEY=0x7cbfb63cf0362e1a04a3761d3bcff48cf69380755fad23ffeaa920dd077360d3
```

### 2. Receiver Wallet (Payee)
**Environment Variable**: `RECEIVER_WALLET_ADDRESS`

- **Purpose**: This wallet RECEIVES payments for YOUR paid APIs
- **What you need**: Public address (e.g., `0x501a...`)
- **Default**: `0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6`
- **Security**: Safe to share - it's a public address

**Example**:
```env
RECEIVER_WALLET_ADDRESS=0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
```

## Payment Flow

```
User Request
    ↓
Agent needs paid service (e.g., image generation)
    ↓
Agent Wallet (AGENT_WALLET_PRIVATE_KEY)
    └─> Signs payment authorization
    └─> Pays USDC amount
    └─> Via x402 protocol + Facilitator
        ↓
Receiver Wallet (RECEIVER_WALLET_ADDRESS)
    └─> Receives the USDC payment
    └─> This is YOUR revenue!
```

## Configuration in .env

Your `.env` file should have:

```env
# OpenAI for the LLM
OPENAI_API_KEY=sk-proj-...

# Wallet that PAYS for services (needs USDC)
AGENT_WALLET_PRIVATE_KEY=0x...your-private-key...

# Wallet that RECEIVES payments (your revenue!)
RECEIVER_WALLET_ADDRESS=0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6

# x402 Protocol settings
X402_FACILITATOR=https://x402.treasure.lol/facilitator
X402_NETWORK=base-sepolia
```

## Setup Steps

### Step 1: Get an Agent Wallet

Option A - Create New Wallet:
```bash
# Using ethers.js
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address); console.log('Private Key:', w.privateKey);"
```

Option B - Use Existing Wallet:
- Export private key from MetaMask or other wallet
- Make sure it has USDC on your chosen network

### Step 2: Fund Agent Wallet

For testing on Base Sepolia:
1. Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Get testnet USDC:
   - Swap ETH for USDC on Uniswap testnet
   - Or use a USDC faucet if available

For production on Base mainnet:
1. Send real ETH to your agent wallet
2. Swap some ETH for USDC

### Step 3: Set Receiver Wallet

This should be YOUR wallet where you want to receive revenue:
- Use your MetaMask address
- Or any wallet you control
- Default is provided: `0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6`

## Checking Balances

### Check Agent Wallet Balance

```bash
# View on block explorer
open "https://sepolia.basescan.org/address/YOUR_AGENT_WALLET_ADDRESS"

# Or check programmatically
node -e "
const ethers = require('ethers');
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const address = 'YOUR_AGENT_ADDRESS';
provider.getBalance(address).then(b => console.log('ETH:', ethers.formatEther(b)));
"
```

### Check Receiver Wallet Balance

```bash
# View on block explorer
open "https://sepolia.basescan.org/address/0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6"
```

## Security Best Practices

### ✅ DO:
- Keep `AGENT_WALLET_PRIVATE_KEY` in `.env` file
- Add `.env` to `.gitignore`
- Use testnet for development
- Monitor agent wallet balance
- Rotate private keys regularly
- Use a dedicated wallet for the agent

### ❌ DON'T:
- Never commit private keys to git
- Don't share private keys
- Don't use your main wallet's private key
- Don't hardcode keys in source code
- Don't store large amounts in agent wallet

## Example Usage

When you run the agent:

```bash
npm run dev
```

You'll see:

```
🔧 Initializing tools...
📬 Receiver wallet for payments: 0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
✅ Predefined tools initialized
🚀 Creating agent...

🤖 X402 Agent initialized
💼 Wallet address: 0xYourAgentWalletAddress

📊 Agent Configuration:
   Agent Wallet: 0xYourAgentWalletAddress
   Receiver Wallet: 0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
   Network: base-sepolia
   Tools: 10
   Facilitator: https://x402.treasure.lol/facilitator
```

## Transaction Tracking

Every paid operation shows:
- Payment amount in USDC
- Transaction hash
- Network used
- Block explorer link

Example:
```
💳 Payment Transaction:
   Hash: 0xabc123...
   Network: base-sepolia
   Explorer: https://sepolia.basescan.org/tx/0xabc123...
```

Click the explorer link to see:
- From: Agent Wallet
- To: Receiver Wallet
- Amount: USDC paid
- Status: Confirmed/Pending

## Networks Supported

- **Base Sepolia** (testnet) - Chain ID: 84532
- **Base** (mainnet) - Chain ID: 8453
- **Ethereum** (mainnet) - Chain ID: 1
- **Sepolia** (testnet) - Chain ID: 11155111

## FAQs

**Q: Where do I get USDC for testing?**
A: On Base Sepolia, you can swap testnet ETH for USDC on test DEXs.

**Q: Can I use the same wallet for both agent and receiver?**
A: Yes, but it's not recommended. Better to separate concerns.

**Q: How much USDC do I need in the agent wallet?**
A: Depends on usage. Each paid API costs between $0.10-$0.50. Start with $10 USDC for testing.

**Q: Can I change the receiver wallet later?**
A: Yes, just update `RECEIVER_WALLET_ADDRESS` in `.env` and restart.

**Q: Is my private key safe?**
A: As long as you keep it in `.env`, don't commit it, and don't share it.

## Monitoring Revenue

Track your receiver wallet to see incoming payments:

```bash
# Check on block explorer
https://basescan.org/address/0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6

# Or use a service like:
- Etherscan notifications
- Coinbase wallet
- MetaMask
```

## Troubleshooting

**Error: Insufficient funds**
→ Agent wallet needs more USDC

**Error: Invalid private key**
→ Check `AGENT_WALLET_PRIVATE_KEY` format (must start with 0x)

**Error: Payment failed**
→ Check facilitator URL and network

**Transaction pending forever**
→ Network congestion, wait or increase gas

---

Need help? Check the main README.md or examples folder.
