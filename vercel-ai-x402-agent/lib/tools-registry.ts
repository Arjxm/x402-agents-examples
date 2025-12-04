/**
 * Tool Registry - Easy way to add paid and free APIs
 *
 * To add a new paid API:
 * 1. Add entry to PAID_APIS array
 * 2. That's it! Agent will automatically use x402 for payment
 */

import { z } from 'zod';
import { X402ServerClient } from './x402-server';
import { getBaseApiUrl } from './config';

// Initialize x402 client for agent payments
const x402Client = new X402ServerClient(
  process.env.AGENT_WALLET_PRIVATE_KEY || ''
);

/**
 * Define your paid APIs here
 * Add as many as you want - they'll be available as tools to the agent
 */
export const PAID_APIS = [
  {
    name: 'test_sentiment_analysis',
    description: 'Test sentiment analysis with transaction tracking (costs $0.10 USDC) - Working demo!',
    endpoint: `${getBaseApiUrl()}/api/test-paid`,
    method: 'POST' as const,
    cost: 0.10,
    schema: z.object({
      text: z.string().describe('The text to analyze')
    }),
    transform: (params: any) => ({
      text: params.text
    })
  },
  {
    name: 'premium_sentiment_analysis',
    description: 'Advanced AI-powered sentiment analysis using GPT (costs $0.10 USDC) - Real OpenAI API!',
    endpoint: `${getBaseApiUrl()}/api/sentiment`,
    method: 'POST' as const,
    cost: 0.10,
    schema: z.object({
      text: z.string().describe('The text to analyze'),
      language: z.string().optional().describe('Language code (default: en)')
    }),
    transform: (params: any) => ({
      text: params.text,
      language: params.language || 'en'
    })
  },
  {
    name: 'data_enrichment',
    description: 'Enrich company data with premium database (costs $0.25 USDC)',
    endpoint: 'https://api.example.com/enrich',
    method: 'POST' as const,
    cost: 0.25,
    schema: z.object({
      company_name: z.string().describe('Company name to enrich'),
      fields: z.array(z.string()).describe('Fields to retrieve: revenue, employees, industry, etc.')
    }),
    transform: (params: any) => ({
      company: params.company_name,
      fields: params.fields
    })
  },
  {
    name: 'advanced_translation',
    description: 'Professional translation with context awareness (costs $0.15 USDC per 1000 chars)',
    endpoint: 'https://api.example.com/translate',
    method: 'POST' as const,
    cost: 0.15,
    schema: z.object({
      text: z.string().describe('Text to translate'),
      source_lang: z.string().describe('Source language code'),
      target_lang: z.string().describe('Target language code'),
      context: z.string().optional().describe('Additional context for better translation')
    }),
    transform: (params: any) => params
  },
  {
    name: 'advanced_translation',
    description: 'Professional translation with context awareness (costs $0.15 USDC per 1000 chars)',
    endpoint: 'https://api.example.com/translate',
    method: 'POST' as const,
    cost: 0.15,
    schema: z.object({
      text: z.string().describe('Text to translate'),
      source_lang: z.string().describe('Source language code'),
      target_lang: z.string().describe('Target language code'),
      context: z.string().optional().describe('Additional context for better translation')
    }),
    transform: (params: any) => params
  },
  {
    name: 'paid_weather',
    description: 'Get current weather for a location with 402 payment flow (costs $0.10 USDC)',
    endpoint: 'https://2701e145a0b0.ngrok-free.app/api/weather',
    method: 'GET' as const,
    cost: 0.1,
    schema: z.object({
      latitude: z.number().describe('Latitude'),
      longitude: z.number().describe('Longitude')
    }),
    transform: (params: any) => null, // GET request, params in URL
    buildUrl: (params: any) =>
      `https://2701e145a0b0.ngrok-free.app/api/weather?latitude=${params.latitude}&longitude=${params.longitude}`
  },
];

/**
 * Define your free APIs here
 */
export const FREE_APIS = [
  {
    name: 'search_web',
    description: 'Search the web using DuckDuckGo (free)',
    endpoint: 'https://api.duckduckgo.com/',
    method: 'GET' as const,
    cost: 0,
    schema: z.object({
      query: z.string().describe('Search query')
    }),
    transform: (params: any) => null,
    buildUrl: (params: any) =>
      `https://api.duckduckgo.com/?q=${encodeURIComponent(params.query)}&format=json`
  }
];

/**
 * Execute a paid API call using x402
 */
export async function executePaidAPI(
  apiConfig: typeof PAID_APIS[0],
  params: any,
  userId?: string
): Promise<any> {
  console.log(`🔐 Executing paid API: ${apiConfig.name} (cost: $${apiConfig.cost})`);

  // TODO: In production, check user balance here
  // const user = await db.users.findOne({ id: userId });
  // if (user.balance < apiConfig.cost) {
  //   throw new Error(`Insufficient balance. Required: $${apiConfig.cost}, Available: $${user.balance}`);
  // }

  try {
    // Build URL if buildUrl function exists (for GET requests)
    const url = (apiConfig as any).buildUrl ? (apiConfig as any).buildUrl(params) : apiConfig.endpoint;

    // Transform parameters
    const body = apiConfig.transform(params);

    // Make paid API call using x402
    const response = await x402Client.fetch(url, {
      method: apiConfig.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: apiConfig.method === 'GET' ? undefined : JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API call failed: ${error}`);
    }

    const result = await response.json();

    // Log the API response
    console.log('📊 API Response:', JSON.stringify(result, null, 2));

    // Get transaction info
    const txInfo = x402Client.getLastTransaction();

    // TODO: In production, deduct from user balance
    // await db.users.updateOne(
    //   { id: userId },
    //   { $inc: { balance: -apiConfig.cost } }
    // );

    console.log(`✅ Paid API call successful`);

    return {
      ...result,
      _transaction: txInfo.hash ? {
        hash: txInfo.hash,
        network: txInfo.network,
        explorerUrl: getExplorerUrl(txInfo.hash, txInfo.network)
      } : null
    };

  } catch (error) {
    console.error(`❌ Paid API call failed:`, error);
    throw error;
  }
}

/**
 * Get block explorer URL for transaction
 */
function getExplorerUrl(txHash: string, network: string | null): string {
  const explorers: Record<string, string> = {
    'base': 'https://basescan.org/tx/',
    'base-sepolia': 'https://sepolia.basescan.org/tx/',
    'ethereum': 'https://etherscan.io/tx/',
    'polygon': 'https://polygonscan.com/tx/',
    'arbitrum': 'https://arbiscan.io/tx/',
    'optimism': 'https://optimistic.etherscan.io/tx/'
  };

  const baseUrl = explorers[network || 'base-sepolia'] || explorers['base-sepolia'];
  return `${baseUrl}${txHash}`;
}

/**
 * Execute a free API call
 */
export async function executeFreeAPI(
  apiConfig: typeof FREE_APIS[0],
  params: any
): Promise<any> {
  console.log(`🆓 Executing free API: ${apiConfig.name}`);

  try {
    const url = apiConfig.buildUrl ? apiConfig.buildUrl(params) : apiConfig.endpoint;

    const response = await fetch(url, {
      method: apiConfig.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API call failed: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Free API call successful`);

    return result;

  } catch (error) {
    console.error(`❌ Free API call failed:`, error);
    throw error;
  }
}

/**
 * Get all available tools (paid + free) for the agent
 */
export function getAllAPIs() {
  return [...PAID_APIS, ...FREE_APIS];
}

/**
 * Get tool by name
 */
export function getAPIByName(name: string) {
  return getAllAPIs().find(api => api.name === name);
}

/**
 * Calculate total cost for multiple API calls
 */
export function calculateCost(apiNames: string[]): number {
  return apiNames.reduce((total, name) => {
    const api = getAPIByName(name);
    return total + (api?.cost || 0);
  }, 0);
}
