# LangGraph x402 Agent - Frontend

Beautiful chat interface for the LangGraph x402 Agent with transaction tracking.

## Features

- 🎨 Beautiful gradient UI
- 💬 Real-time chat interface
- 💳 Transaction hash display with explorer links
- 🔗 One-click view on block explorer
- 📱 Responsive design
- ⚡ Fast and lightweight

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
OPENAI_API_KEY=your_openai_key_here
AGENT_WALLET_PRIVATE_KEY=your_wallet_private_key_here
RECEIVER_WALLET_ADDRESS=0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
X402_FACILITATOR=https://x402.treasure.lol/facilitator
X402_NETWORK=base-sepolia
```

Or copy from parent directory:

```bash
cp ../.env .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3001 in your browser.

## Usage

### Example Commands

Try these in the chat:

```
Analyze sentiment: "I love this product!"

Translate "Hello world" from English to Spanish

Review this code: function add(a, b) { return a + b; }

Research Apple and tell me about their main products

Calculate 15 * 24 + 100
```

### Transaction Display

When a paid operation completes, you'll see:

```
💳 Payment Transaction
Tool: sentiment_analysis $0.10
Network: base-sepolia
Hash: 0xabc123...
[View on Explorer →]
```

Click the "View on Explorer" link to see the transaction on-chain.

## Architecture

```
Frontend (Next.js)
    ↓
/api/chat (API Route)
    ↓
X402Agent (Backend)
    ↓
x402 Protocol
    ↓
Facilitator
    ↓
On-chain Payment
```

## API Endpoint

### POST /api/chat

Request:
```json
{
  "message": "Analyze sentiment: I love this!"
}
```

Response:
```json
{
  "response": "The sentiment is positive with high confidence...",
  "transaction": {
    "hash": "0xabc123...",
    "network": "base-sepolia",
    "explorerUrl": "https://sepolia.basescan.org/tx/0xabc123..."
  }
}
```

## Customization

### Colors

Edit `app/globals.css`:

```css
/* Main gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Transaction box */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
```

### Receiver Wallet

Edit `app/page.tsx`:

```tsx
<div className="wallet-address">YOUR_WALLET_ADDRESS_HERE</div>
```

## Build for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | OpenAI API key | Yes |
| AGENT_WALLET_PRIVATE_KEY | Wallet that pays | Yes |
| RECEIVER_WALLET_ADDRESS | Wallet that receives | Yes |
| X402_FACILITATOR | Payment facilitator URL | No |
| X402_NETWORK | Network to use | No |

## Troubleshooting

**Port already in use**
```bash
# Use different port
npm run dev -- -p 3002
```

**API not working**
- Check `.env.local` is configured
- Ensure parent directory has built code (`npm run build` in parent)
- Check console for errors

**Transaction not showing**
- Make sure agent wallet has USDC
- Check facilitator URL is correct
- Verify network is supported

## Screenshots

**Chat Interface**:
- Clean, modern design
- Gradient purple/blue theme
- Smooth animations

**Transaction Display**:
- Transaction hash
- Network name
- Direct link to block explorer
- Cost and tool used

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- CSS3 (No external UI libraries)

## License

MIT
