/**
 * Predefined Tools
 *
 * Collection of pre-configured paid and free tools
 * These serve as examples and can be easily extended
 *
 * Note: Paid APIs will use the RECEIVER_WALLET_ADDRESS from .env
 * as the recipient for x402 payments. Default: 0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6
 */

import { z } from 'zod';
import { registerPaidAPI, registerFreeAPI, registerCustomTool } from './registry.js';
import { getReceiverWallet } from '../config.js';

/**
 * Initialize all predefined tools
 */
export function initializePredefinedTools() {
  const receiverWallet = getReceiverWallet();
  console.log(`📬 Receiver wallet for payments: ${receiverWallet}`);
  // ========================================
  // PAID TOOLS (using x402 protocol)
  // ========================================

  // Image Generation (DALL-E style)
  registerPaidAPI({
    name: 'generate_image',
    description: 'Generate an AI image from a text prompt using DALL-E',
    endpoint: 'https://api.openai.com/v1/images/generations',
    schema: z.object({
      prompt: z.string().describe('Text description of the image to generate'),
      size: z.enum(['256x256', '512x512', '1024x1024']).optional().describe('Image size (default: 1024x1024)'),
      quality: z.enum(['standard', 'hd']).optional().describe('Image quality (default: standard)')
    }),
    cost: 0.50,
    method: 'POST',
    transformParams: (params) => ({
      model: 'dall-e-3',
      prompt: params.prompt,
      n: 1,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard'
    })
  });

  // Premium Sentiment Analysis using x402-protected endpoint
  registerCustomTool({
    name: 'sentiment_analysis',
    description: 'Advanced AI-powered sentiment analysis with detailed insights using GPT-4',
    schema: z.object({
      text: z.string().describe('The text to analyze')
    }),
    isPaid: true,
    cost: 0.10,
    execute: async (params, x402Client) => {
      if (!x402Client) {
        throw new Error('x402 client required');
      }

      // Use x402Client to call the x402-protected sentiment API
      // This endpoint will return 402 Payment Required, triggering the payment flow
      const x402ProtectedEndpoint = process.env.X402_SENTIMENT_API_URL || 'https://x402-api.example.com/sentiment';

      const response = await x402Client.fetch(x402ProtectedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: params.text,
          model: 'gpt-3.5-turbo',
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Sentiment API error: ${response.statusText}`);
      }

      const data: any = await response.json();

      // The x402-protected API should return sentiment analysis result
      // in format: { sentiment, confidence, explanation }
      return data;
    }
  });

  // Company Research using OpenAI
  registerCustomTool({
    name: 'research_company',
    description: 'Research company information and provide business intelligence using GPT-4',
    schema: z.object({
      company_name: z.string().describe('Company name to research'),
      aspects: z.array(z.string()).describe('Information to gather: industry, products, competitors, market position, etc.')
    }),
    isPaid: true,
    cost: 0.25,
    execute: async (params, x402Client) => {
      if (!x402Client) {
        throw new Error('x402 client required');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a business intelligence analyst. Provide comprehensive, factual information about companies based on publicly available knowledge.'
            },
            {
              role: 'user',
              content: `Research ${params.company_name}. Focus on: ${params.aspects.join(', ')}. Provide structured, factual information.`
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data: any = await response.json();

      return {
        company_name: params.company_name,
        research: data.choices[0].message.content,
        aspects_covered: params.aspects
      };
    }
  });

  // Professional Translation using OpenAI
  registerCustomTool({
    name: 'translate_text',
    description: 'Professional translation with context awareness using GPT-4',
    schema: z.object({
      text: z.string().describe('Text to translate'),
      source_language: z.string().describe('Source language (e.g., English, Spanish, French)'),
      target_language: z.string().describe('Target language'),
      context: z.string().optional().describe('Additional context for better translation')
    }),
    isPaid: true,
    cost: 0.15,
    execute: async (params, x402Client) => {
      if (!x402Client) {
        throw new Error('x402 client required');
      }

      const contextNote = params.context ? `\nContext: ${params.context}` : '';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Translate the given text accurately while preserving meaning and tone.'
            },
            {
              role: 'user',
              content: `Translate this text from ${params.source_language} to ${params.target_language}:${contextNote}\n\nText: "${params.text}"`
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data: any = await response.json();

      return {
        original_text: params.text,
        translated_text: data.choices[0].message.content,
        source_language: params.source_language,
        target_language: params.target_language
      };
    }
  });

  // AI Code Review using OpenAI
  registerCustomTool({
    name: 'code_review',
    description: 'AI-powered code review with security analysis and best practices using GPT-4',
    schema: z.object({
      code: z.string().describe('Code to review'),
      language: z.string().describe('Programming language'),
      focus: z.array(z.string()).optional().describe('Review focus areas: security, performance, style, etc.')
    }),
    isPaid: true,
    cost: 0.20,
    execute: async (params, x402Client) => {
      if (!x402Client) {
        throw new Error('x402 client required');
      }

      const focusAreas = params.focus && params.focus.length > 0
        ? `\nFocus on: ${params.focus.join(', ')}`
        : '';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert code reviewer. Analyze code for bugs, security issues, performance problems, and best practices. Provide specific, actionable feedback.'
            },
            {
              role: 'user',
              content: `Review this ${params.language} code:${focusAreas}\n\n\`\`\`${params.language}\n${params.code}\n\`\`\``
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data: any = await response.json();

      return {
        language: params.language,
        review: data.choices[0].message.content,
        code_snippet: params.code.substring(0, 100) + '...'
      };
    }
  });

  // ========================================
  // FREE TOOLS
  // ========================================

  // Weather API
  registerFreeAPI({
    name: 'get_weather',
    description: 'Get current weather information for any location',
    endpoint: 'https://api.open-meteo.com/v1/forecast',
    schema: z.object({
      latitude: z.number().describe('Latitude of the location'),
      longitude: z.number().describe('Longitude of the location'),
      location_name: z.string().optional().describe('Human-readable location name for reference')
    }),
    method: 'GET',
    buildUrl: (params) =>
      `https://api.open-meteo.com/v1/forecast?latitude=${params.latitude}&longitude=${params.longitude}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`
  });

  // Web Search
  registerFreeAPI({
    name: 'search_web',
    description: 'Search the web for information',
    endpoint: 'https://api.duckduckgo.com/',
    schema: z.object({
      query: z.string().describe('Search query')
    }),
    method: 'GET',
    buildUrl: (params) =>
      `https://api.duckduckgo.com/?q=${encodeURIComponent(params.query)}&format=json&no_html=1`
  });

  // Cryptocurrency Prices
  registerFreeAPI({
    name: 'get_crypto_price',
    description: 'Get current cryptocurrency prices',
    endpoint: 'https://api.coingecko.com/api/v3/simple/price',
    schema: z.object({
      coin_id: z.string().describe('Coin ID (e.g., bitcoin, ethereum)'),
      currency: z.string().optional().describe('Currency to display price in (default: usd)')
    }),
    method: 'GET',
    buildUrl: (params) =>
      `https://api.coingecko.com/api/v3/simple/price?ids=${params.coin_id}&vs_currencies=${params.currency || 'usd'}`
  });

  // IP Geolocation
  registerFreeAPI({
    name: 'geolocate_ip',
    description: 'Get geolocation information for an IP address',
    endpoint: 'https://ipapi.co/',
    schema: z.object({
      ip_address: z.string().describe('IP address to geolocate')
    }),
    method: 'GET',
    buildUrl: (params) => `https://ipapi.co/${params.ip_address}/json/`
  });

  // ========================================
  // CUSTOM TOOLS (with custom logic)
  // ========================================

  // Calculator (local execution)
  registerCustomTool({
    name: 'calculator',
    description: 'Perform mathematical calculations',
    schema: z.object({
      expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2 * 3")')
    }),
    isPaid: false,
    execute: async (params) => {
      try {
        // Safe eval alternative - only allows basic math operations
        const sanitized = params.expression.replace(/[^0-9+\-*/().\s]/g, '');
        const result = Function('"use strict"; return (' + sanitized + ')')();
        return {
          expression: params.expression,
          result: result,
          success: true
        };
      } catch (error: any) {
        return {
          expression: params.expression,
          error: error.message,
          success: false
        };
      }
    }
  });

  // Timestamp converter
  registerCustomTool({
    name: 'convert_timestamp',
    description: 'Convert between timestamps and human-readable dates',
    schema: z.object({
      timestamp: z.number().optional().describe('Unix timestamp to convert'),
      date_string: z.string().optional().describe('Date string to convert to timestamp'),
      format: z.string().optional().describe('Output format')
    }),
    isPaid: false,
    execute: async (params) => {
      if (params.timestamp) {
        const date = new Date(params.timestamp * 1000);
        return {
          timestamp: params.timestamp,
          date: date.toISOString(),
          formatted: date.toLocaleString()
        };
      } else if (params.date_string) {
        const date = new Date(params.date_string);
        return {
          date_string: params.date_string,
          timestamp: Math.floor(date.getTime() / 1000),
          iso: date.toISOString()
        };
      }
      return { error: 'Provide either timestamp or date_string' };
    }
  });

  console.log('✅ Predefined tools initialized');
}
