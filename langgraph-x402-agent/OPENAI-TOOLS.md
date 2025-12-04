# OpenAI-Powered Paid Tools

All paid tools now use **OpenAI's API directly** - no need for external services!

## Updated Tools Using OpenAI

### 1. Sentiment Analysis ($0.10)
**Tool**: `sentiment_analysis`
**Model**: GPT-3.5-turbo
**What it does**: Analyzes text sentiment with confidence scores

**Example**:
```
You: Analyze the sentiment: "I love this product!"

Response:
{
  "sentiment": "positive",
  "confidence": 0.95,
  "explanation": "The text expresses strong positive emotion using 'love'..."
}
```

### 2. Translation ($0.15)
**Tool**: `translate_text`
**Model**: GPT-4
**What it does**: Professional translation between languages

**Example**:
```
You: Translate "Hello, how are you?" from English to Spanish

Response:
{
  "original_text": "Hello, how are you?",
  "translated_text": "Hola, ¿cómo estás?",
  "source_language": "English",
  "target_language": "Spanish"
}
```

### 3. Code Review ($0.20)
**Tool**: `code_review`
**Model**: GPT-4
**What it does**: Reviews code for bugs, security, performance

**Example**:
```
You: Review this Python code: def add(a,b): return a+b

Response:
{
  "language": "Python",
  "review": "The function is correct but could benefit from:
    - Type hints for parameters
    - Docstring explaining purpose
    - Input validation..."
}
```

### 4. Company Research ($0.25)
**Tool**: `research_company`
**Model**: GPT-4
**What it does**: Researches company information and market intelligence

**Example**:
```
You: Research Tesla and tell me about their products and market position

Response:
{
  "company_name": "Tesla",
  "research": "Tesla is a leading electric vehicle manufacturer...
    Products: Model S, Model 3, Model X, Model Y...
    Market Position: Dominant in EV market..."
}
```

### 5. Image Generation ($0.50)
**Tool**: `generate_image`
**Model**: DALL-E 3
**What it does**: Generates AI images from text descriptions

**Example**:
```
You: Generate an image of a sunset over mountains
```

## How It Works

1. **User makes request** → "Analyze sentiment: I love this!"
2. **Agent selects tool** → `sentiment_analysis`
3. **x402 payment** → Agent pays $0.10 USDC
4. **OpenAI API call** → GPT analyzes the text
5. **Response returned** → With transaction hash

## Payment Flow

```
User Request
    ↓
Agent detects paid tool needed
    ↓
x402 Client creates payment authorization
    ↓
Facilitator settles payment (to 0x501ab...)
    ↓
OpenAI API is called
    ↓
Results + Transaction Hash returned
```

## Cost Breakdown

| Tool | Model | Cost | Use Case |
|------|-------|------|----------|
| sentiment_analysis | GPT-3.5-turbo | $0.10 | Text sentiment analysis |
| translate_text | GPT-4 | $0.15 | Professional translation |
| code_review | GPT-4 | $0.20 | Code quality review |
| research_company | GPT-4 | $0.25 | Business intelligence |
| generate_image | DALL-E 3 | $0.50 | AI image generation |

## Try It Now!

```bash
npm run dev
```

Then try:

```
You: Analyze the sentiment: "This product is amazing!"

You: Translate "Good morning" from English to French

You: Review this code: function test() { console.log('hi') }

You: Research Google and tell me about their main products
```

## Benefits

✅ **No External APIs needed** - Everything uses OpenAI
✅ **Works immediately** - No setup required
✅ **High quality** - Powered by GPT-4 and DALL-E 3
✅ **x402 payments** - Automatic micropayments
✅ **Transaction tracking** - Full transparency

## Configuration

Your `.env` already has everything:

```env
OPENAI_API_KEY=sk-proj-...  ✅ Used for all AI tools
AGENT_WALLET_PRIVATE_KEY=0x...  ✅ Pays for services
RECEIVER_WALLET_ADDRESS=0x501ab...  ✅ Receives payments
```

## Example Session

```
You: Analyze sentiment: "I absolutely love this new feature!"

💰 Executing paid tool: sentiment_analysis (cost: $0.1)
🤖 Agent: {
  "sentiment": "positive",
  "confidence": 0.98,
  "explanation": "Strong positive sentiment with emphatic language..."
}

💳 Payment Transaction:
   Hash: 0xabc123...
   Network: base-sepolia
   Explorer: https://sepolia.basescan.org/tx/0xabc123...
```

## Adding More OpenAI Tools

Want to add your own OpenAI-powered tool?

```typescript
registerCustomTool({
  name: 'my_ai_tool',
  description: 'My custom AI tool',
  schema: z.object({
    input: z.string()
  }),
  isPaid: true,
  cost: 0.15,
  execute: async (params, x402Client) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Your system prompt...' },
          { role: 'user', content: params.input }
        ]
      })
    });

    const data: any = await response.json();
    return { result: data.choices[0].message.content };
  }
});
```

## Notes

- **GPT-3.5-turbo**: Fast and cost-effective for simple tasks
- **GPT-4**: Best for complex reasoning, translation, code review
- **DALL-E 3**: Latest image generation model
- All calls use your `OPENAI_API_KEY`
- x402 protocol handles all payment logic automatically

---

**Ready to use!** All AI tools work out of the box with OpenAI. 🚀
