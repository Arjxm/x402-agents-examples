/**
 * Example: Adding Custom Tools
 *
 * Demonstrates how to add your own custom paid or free tools
 */

import 'dotenv/config';
import { z } from 'zod';
import { X402Agent } from '../src/agent/graph.js';
import { registerPaidAPI, registerCustomTool } from '../src/tools/registry.js';
import { initializePredefinedTools } from '../src/tools/predefined.js';
import { loadConfig, validateConfig, getReceiverWallet } from '../src/config.js';

async function main() {
  console.log('🔧 Custom Tool Example\n');

  // Load and validate config
  const config = loadConfig();

  try {
    validateConfig(config);
  } catch (error: any) {
    console.error('❌ Configuration Error:', error.message);
    process.exit(1);
  }

  console.log(`📬 Payments will go to: ${config.receiverWalletAddress}\n`);

  // Initialize predefined tools
  initializePredefinedTools();

  // ========================================
  // Example 1: Add a custom paid API
  // ========================================

  registerPaidAPI({
    name: 'generate_logo',
    description: 'Generate a professional logo design',
    endpoint: 'https://api.example.com/logo/generate',
    schema: z.object({
      company_name: z.string().describe('Company name'),
      industry: z.string().describe('Industry/sector'),
      style: z.enum(['modern', 'classic', 'minimal', 'bold']).describe('Logo style')
    }),
    cost: 1.50, // $1.50 USDC
    method: 'POST',
    transformParams: (params) => ({
      name: params.company_name,
      industry: params.industry,
      style: params.style,
      format: 'png'
    })
  });

  console.log('✅ Registered custom paid API: generate_logo');

  // ========================================
  // Example 2: Add a custom local tool
  // ========================================

  registerCustomTool({
    name: 'base64_encode',
    description: 'Encode text to base64',
    schema: z.object({
      text: z.string().describe('Text to encode')
    }),
    isPaid: false,
    execute: async (params) => {
      const encoded = Buffer.from(params.text).toString('base64');
      return {
        original: params.text,
        encoded: encoded
      };
    }
  });

  console.log('✅ Registered custom local tool: base64_encode');

  // ========================================
  // Example 3: Add a custom paid tool with complex logic
  // ========================================

  registerCustomTool({
    name: 'advanced_data_processing',
    description: 'Process data with custom ML model (costs $0.75)',
    schema: z.object({
      data: z.array(z.number()).describe('Array of numbers to process'),
      operation: z.enum(['normalize', 'standardize', 'analyze']).describe('Processing operation')
    }),
    isPaid: true,
    cost: 0.75,
    execute: async (params, x402Client) => {
      if (!x402Client) {
        throw new Error('x402 client required for paid operation');
      }

      // Make a paid API call
      const response = await x402Client.fetch('https://api.example.com/ml/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: params.data,
          operation: params.operation
        })
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      return await response.json();
    }
  });

  console.log('✅ Registered custom paid tool: advanced_data_processing\n');

  // ========================================
  // Create agent and test
  // ========================================

  console.log('='.repeat(80));

  const agent = new X402Agent(
    config.openaiApiKey,
    config.agentWalletPrivateKey,
    config.facilitatorUrl
  );

  // Test the custom tools
  console.log('\n📝 Testing custom tools:\n');

  await agent.run('Encode this text to base64: Hello World!');

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Custom tool example completed!');
  console.log('\n💡 Tip: You can add any API or tool using registerPaidAPI, registerFreeAPI, or registerCustomTool');
}

main().catch(console.error);
