# Project Summary: AI Agent with Vercel AI SDK + x402

## What I Built For You

A complete, production-ready AI agent that can autonomously call paid APIs using x402 protocol. Built with Vercel AI SDK and Next.js.

---

## 🎯 Key Features

### 1. **Flexible Tool System**
Add any paid API in 30 seconds - just add one object to `tools-registry.ts`

### 2. **Automatic x402 Payments**
Agent handles all payment logic - signing, verification, settlement

### 3. **Cost Transparency**
Agent ALWAYS asks user before spending money

### 4. **Mix of Free & Paid APIs**
Use free APIs when possible, paid when needed

### 5. **Beautiful UI**
Chat interface with real-time streaming responses

---

## 📁 Project Structure

```
vercel-ai-x402-agent/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Main agent API
│   ├── page.tsx                  # Chat UI
│   ├── layout.tsx                # App layout
│   └── globals.css               # Styles
├── lib/
│   ├── x402-browser.ts           # Browser-side x402 client
│   ├── x402-server.ts            # Server-side x402 client
│   └── tools-registry.ts         # 🌟 ADD YOUR APIS HERE
├── .env.example                  # Environment variables
├── package.json                  # Dependencies
├── README.md                     # Full documentation
├── QUICK-START.md                # 5-minute setup guide
└── EXAMPLE-PAID-API.md           # How to create paid APIs
```

---

## 🚀 How It Works

### User Flow

```
1. User: "Analyze sentiment of 'I love this!'"
   ↓
2. Agent: "I'll use premium sentiment API, costs $0.10. Proceed?"
   ↓
3. User: "Yes"
   ↓
4. Agent:
   - Signs payment with its wallet
   - Calls API with x402 payment
   - API verifies & settles payment
   - Returns result
   ↓
5. Agent: "Sentiment: Positive (95% confidence). Cost: $0.10"
```

### Technical Flow

```
User Message
    ↓
Vercel AI SDK (GPT-4)
    ↓
Decides which tool to use
    ↓
Asks user if it costs money
    ↓
Executes tool (calls paid API)
    ↓
x402ServerClient
    ↓
Signs payment with agent wallet
    ↓
Paid API (returns 402)
    ↓
x402 client retries with payment
    ↓
API verifies → Settles → Returns data
    ↓
Agent shows result to user
```

---

## 🛠️ How to Add Your Own Paid API

### Option 1: Call Existing Paid API

Edit `lib/tools-registry.ts`:

```typescript
export const PAID_APIS = [
  {
    name: 'your_api',
    description: 'Description (costs $X.XX)',
    endpoint: 'https://api.example.com/endpoint',
    method: 'POST',
    cost: 0.25,
    schema: z.object({
      input: z.string()
    }),
    transform: (params) => params
  }
];
```

Done! Agent now knows about your API.

### Option 2: Create Your Own Paid API

See `EXAMPLE-PAID-API.md` for complete guide.

Quick version:
```typescript
// app/api/my-service/route.ts
export async function POST(req) {
  const xPayment = req.headers.get('X-PAYMENT');

  if (!xPayment) {
    // Return 402 with payment requirements
    return Response.json({ /* payment details */ }, { status: 402 });
  }

  // Verify payment
  // Return service
}
```

---

## 💰 Payment Architecture

### Current Setup: Agent Pays

```
Agent Wallet (yours) → Pays API → You track spending
```

**Pros:**
- ✅ No user wallet needed
- ✅ Simple UX
- ✅ Works immediately

**Cons:**
- ❌ You front the money
- ❌ Need to bill users later

### Recommended for Production: Prepaid Balance

```
1. User deposits $10 to YOUR service (via x402 or Stripe)
2. You track balance in database
3. Agent uses YOUR wallet to pay APIs
4. You deduct from user's balance
```

Code is already there - just uncomment in `tools-registry.ts`:

```typescript
// Uncomment these lines:
// const user = await db.users.findOne({ id: userId });
// if (user.balance < apiConfig.cost) throw new Error('Insufficient balance');
// await db.users.updateOne({ id: userId }, { $inc: { balance: -apiConfig.cost } });
```

---

## 🎨 What Makes This Different

### vs Traditional API Keys
- ❌ API keys can be stolen
- ✅ x402 payments are single-use, time-limited

### vs Credit Cards
- ❌ Credit card fees (2.9% + 30¢)
- ✅ x402 has ZERO fees

### vs Prepaid Credits
- ❌ Funds locked up
- ✅ Pay exactly what you use

### vs Manual Payments
- ❌ Human intervention needed
- ✅ Fully autonomous agents

---

## 📊 Example Use Cases

### 1. AI Research Assistant
```typescript
PAID_APIS = [
  { name: 'academic_paper_search', cost: 0.15 },
  { name: 'citation_analysis', cost: 0.10 },
  { name: 'pdf_extraction', cost: 0.05 }
]
```

User: "Find papers on quantum computing and analyze citations"
Agent: Autonomously calls 3 APIs, pays $0.30 total

### 2. Business Intelligence Agent
```typescript
PAID_APIS = [
  { name: 'company_data_enrichment', cost: 0.25 },
  { name: 'financial_analysis', cost: 0.50 },
  { name: 'competitor_research', cost: 0.30 }
]
```

User: "Research Acme Corp and competitors"
Agent: Gathers comprehensive data, pays $1.05 total

### 3. Content Creation Agent
```typescript
PAID_APIS = [
  { name: 'image_generation', cost: 0.20 },
  { name: 'grammar_check_premium', cost: 0.05 },
  { name: 'plagiarism_check', cost: 0.10 }
]
```

User: "Create a blog post with image"
Agent: Writes, checks, generates image, pays $0.35 total

---

## 🔧 Customization Points

### 1. Change LLM Model

In `app/api/chat/route.ts`:
```typescript
model: openai('gpt-4-turbo')  // Change to gpt-3.5, claude-3, etc.
```

### 2. Adjust System Prompt

Modify the `system:` message to change agent behavior:
```typescript
system: `You are a financial analyst AI...`
```

### 3. Add Budget Limits

```typescript
const MAX_COST_PER_REQUEST = 1.00;

if (apiConfig.cost > MAX_COST_PER_REQUEST) {
  throw new Error('Cost exceeds budget');
}
```

### 4. Add Approval Workflow

```typescript
system: `For costs over $0.50, you MUST get explicit confirmation.
For costs under $0.50, you can proceed automatically if it helps the user.`
```

### 5. Style the UI

Edit `app/page.tsx` - uses Tailwind CSS, fully customizable

---

## 🚦 Getting Started (5 Minutes)

1. **Clone/Download** this project

2. **Install**
   ```bash
   npm install
   ```

3. **Configure**
   ```bash
   cp .env.example .env
   # Add your OpenAI key and wallet private key
   ```

4. **Fund Agent**
   - Get testnet USDC: https://faucet.circle.com/

5. **Run**
   ```bash
   npm run dev
   ```

6. **Test**
   - Open http://localhost:3000
   - Try: "Analyze the sentiment of 'I love this!'"

---

## 📚 Files You'll Edit

### Most Common: `lib/tools-registry.ts`
Add your paid/free APIs here (90% of your changes)

### Sometimes: `app/api/chat/route.ts`
Change system prompt or model

### Rarely: `app/page.tsx`
Customize UI

### Never: `lib/x402-*.ts`
These are the x402 client implementations (work out of the box)

---

## 🎓 Learning Path

**Day 1:**
- Setup project
- Run example
- Understand flow

**Day 2:**
- Add 1-2 paid APIs from registry
- Test with agent
- See how it works

**Day 3:**
- Create your own paid API endpoint
- Integrate with agent
- Test full payment flow

**Day 4:**
- Add database for user balances
- Implement prepaid system
- Deploy to production

---

## 🐛 Common Issues & Solutions

### "Agent wallet has no funds"
**Solution:** Get testnet USDC from https://faucet.circle.com/

### "Payment verification failed"
**Solution:** Check USDC address matches network (base vs base-sepolia)

### "Tool not found"
**Solution:** Restart dev server after adding tools

### "OpenAI API error"
**Solution:** Verify OPENAI_API_KEY in .env

---

## 🚀 Deployment

### Vercel (Easiest)
```bash
vercel
```

### Others (Railway, Render, etc.)
Standard Next.js deployment - works everywhere!

---

## 📈 Scaling Considerations

**< 100 users:**
- Agent wallet pays
- Track costs manually
- Simple setup

**100-1000 users:**
- Add prepaid balance system
- Database for tracking
- Monitor spending

**1000+ users:**
- Dedicated database
- Rate limiting
- Caching layer
- Multiple agent wallets

---

## 🎁 What You Get

✅ Complete working agent
✅ x402 integration done
✅ Beautiful UI
✅ Flexible tool system
✅ Full TypeScript
✅ Production-ready architecture
✅ Comprehensive docs
✅ Example APIs
✅ Easy to extend

---

## 🤝 Support

- **Questions?** Read README.md
- **Can't get it working?** Check QUICK-START.md
- **Want to create paid API?** See EXAMPLE-PAID-API.md
- **Need help with x402?** Visit https://x402.org

---

## 🎯 Next Steps

1. ✅ Get it running (5 min)
2. ✅ Add your first paid API (2 min)
3. ✅ Test with agent
4. ✅ Deploy to production
5. ✅ Build your AI economy!

---

**You now have everything you need to build autonomous AI agents that can pay for services!** 🚀

The future of AI is autonomous - your agents can now:
- Pay for APIs automatically
- Manage budgets
- Make decisions
- Operate 24/7
- Scale infinitely

Start building! 💪
