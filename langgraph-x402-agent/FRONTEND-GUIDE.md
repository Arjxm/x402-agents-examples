# Frontend Setup Guide

Quick guide to run the beautiful chat interface for your LangGraph x402 Agent.

## 1. Install Frontend Dependencies

```bash
cd langgraph-x402-agent/frontend
npm install
```

## 2. Configure Environment

Copy environment variables:

```bash
# Option 1: Copy from parent
cp ../.env .env.local

# Option 2: Create manually
cat > .env.local << 'EOF'
OPENAI_API_KEY=your_key_here
AGENT_WALLET_PRIVATE_KEY=your_private_key_here
RECEIVER_WALLET_ADDRESS=0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
X402_FACILITATOR=https://x402.treasure.lol/facilitator
X402_NETWORK=base-sepolia
EOF
```

## 3. Run Frontend

```bash
npm run dev
```

Open http://localhost:3001

## Features

### 🎨 Beautiful UI
- Gradient purple/blue theme
- Smooth animations
- Clean, modern design
- Responsive layout

### 💬 Chat Interface
- Real-time messaging
- Loading indicators
- Auto-scroll to latest
- Message history

### 💳 Transaction Display
When using paid tools, you'll see:

```
💳 Payment Transaction
Tool: sentiment_analysis $0.10
Network: base-sepolia
Hash: 0xabc123...def456
[View on Explorer →]
```

Click "View on Explorer" to see on-chain transaction.

## Example Usage

Try these commands in the chat:

```
Analyze sentiment: "This is amazing!"

Translate "Good morning" from English to French

Review this code: function test() { return true; }

Calculate 2 + 2 * 3

What's the current price of bitcoin?
```

## How It Works

```
1. User types message in chat
        ↓
2. Frontend sends to /api/chat
        ↓
3. Backend runs X402Agent
        ↓
4. If paid operation → x402 payment
        ↓
5. Result + transaction hash returned
        ↓
6. Frontend displays with block explorer link
```

## Transaction Flow

```
User: "Analyze sentiment: I love this!"
    ↓
🤖 Agent: Processing...
    ↓
💰 Payment: $0.10 USDC via x402
    ↓
✅ Result shown
    ↓
💳 Transaction displayed:
   - Hash: 0xabc123...
   - Network: base-sepolia
   - Link to explorer
```

## Customization

### Change Colors

Edit `frontend/app/globals.css`:

```css
/* Main background */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Change Port

```bash
npm run dev -- -p 3002
```

### Update Receiver Wallet

Edit `frontend/app/page.tsx`:

```tsx
<div className="wallet-address">YOUR_WALLET_HERE</div>
```

## File Structure

```
frontend/
├── app/
│   ├── api/chat/
│   │   └── route.ts       # API endpoint
│   ├── page.tsx           # Main chat UI
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Styles
├── package.json
└── .env.local             # Your config
```

## Troubleshooting

**Error: Module not found**
```bash
cd ..
npm run build
cd frontend
npm run dev
```

**Port in use**
```bash
npm run dev -- -p 3002
```

**Transaction not showing**
- Check agent wallet has USDC
- Verify `.env.local` is correct
- Check browser console for errors

## Production Build

```bash
npm run build
npm start
```

## Screenshots

**Chat View**:
- Purple gradient header
- White chat container
- User messages (right, purple)
- Agent messages (left, gray)

**Transaction Box**:
- Pink gradient background
- Transaction hash
- Network name
- Explorer link button

## Next Steps

1. Fund your agent wallet with USDC
2. Try paid operations (sentiment analysis, translation)
3. Click transaction links to see on-chain proof
4. Customize colors and styling
5. Deploy to production

---

**Frontend runs on**: http://localhost:3001
**Backend runs on**: Same Next.js server (API routes)
**Payments go to**: 0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6

Enjoy your beautiful AI agent chat interface! 🚀
