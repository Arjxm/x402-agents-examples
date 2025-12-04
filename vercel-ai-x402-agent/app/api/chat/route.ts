/**
 * AI Agent API Route with Vercel AI SDK + x402
 */

import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { PAID_APIS, FREE_APIS, executePaidAPI, executeFreeAPI } from '@/lib/tools-registry';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Create tools from registry
  const tools: Record<string, any> = {};

  // Add paid API tools
  PAID_APIS.forEach(api => {
    tools[api.name] = tool({
      description: api.description,
      parameters: api.schema,
      execute: async (params) => {
        try {
          const result = await executePaidAPI(api, params);
          return {
            success: true,
            data: result,
            cost: api.cost
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            cost: 0
          };
        }
      }
    });
  });

  // Add free API tools
  FREE_APIS.forEach(api => {
    tools[api.name] = tool({
      description: api.description,
      parameters: api.schema,
      execute: async (params) => {
        try {
          const result = await executeFreeAPI(api, params);
          return {
            success: true,
            data: result,
            cost: 0
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            cost: 0
          };
        }
      }
    });
  });

  // Create agent with system prompt
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools,
    system: `You are a helpful AI assistant with access to both free and paid APIs.

IMPORTANT RULES:
1. When a paid API is needed, ALWAYS inform the user about the cost BEFORE using it
2. Ask for confirmation before making paid API calls
3. Prefer free APIs when they can accomplish the task
4. Keep track of costs and inform users of total spending
5. For sentiment analysis, prefer "premium_sentiment_analysis" (uses real OpenAI GPT) over test versions

Available Tools:
${PAID_APIS.map(api => `- ${api.name}: ${api.description} (costs $${api.cost})`).join('\n')}
${FREE_APIS.map(api => `- ${api.name}: ${api.description} (free)`).join('\n')}

When using paid APIs:
- Explain why the paid API is necessary
- State the cost clearly
- Wait for user confirmation (if they respond positively, proceed)
- After execution, confirm the result and cost
- Show the detailed analysis results to the user

Example:
User: "Analyze the sentiment of this tweet: 'I love this product!'"
You: "I can analyze the sentiment using our premium AI-powered sentiment analysis API (using GPT), which costs $0.10. Should I proceed?"
User: "Yes"
You: [Call premium_sentiment_analysis] "The sentiment analysis is complete.

Results:
- Sentiment: Positive
- Confidence: 95%
- Key emotions: Joy, Satisfaction
- Key phrases: 'love this product'

Cost: $0.10"`,
    maxToolRoundtrips: 5
  });

  return result.toDataStreamResponse();
}
