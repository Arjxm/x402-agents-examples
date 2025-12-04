/**
 * Example: Image Generation Agent
 *
 * Demonstrates how to use the LangGraph x402 agent to generate images
 * This will use the x402 protocol to pay for the image generation
 */

import 'dotenv/config';
import { X402Agent } from '../src/agent/graph.js';
import { initializePredefinedTools } from '../src/tools/predefined.js';
import { loadConfig, validateConfig } from '../src/config.js';

async function main() {
  console.log('🎨 Image Generation Agent Example\n');

  // Load and validate config
  const config = loadConfig();

  try {
    validateConfig(config);
  } catch (error: any) {
    console.error('❌ Configuration Error:', error.message);
    process.exit(1);
  }

  console.log(`📬 Payments will go to: ${config.receiverWalletAddress}\n`);

  // Initialize tools
  initializePredefinedTools();

  // Create agent
  const agent = new X402Agent(
    config.openaiApiKey,
    config.agentWalletPrivateKey,
    config.facilitatorUrl
  );

  console.log('='.repeat(80));

  // Example 1: Simple image generation
  console.log('\n📝 Example 1: Simple Image Generation\n');
  await agent.run('Generate an image of a futuristic city with flying cars');

  console.log('\n' + '='.repeat(80));

  // Example 2: Image with specific requirements
  console.log('\n📝 Example 2: Image with Specific Requirements\n');
  await agent.run('Create a high-quality image of a serene mountain landscape at sunset, with a lake in the foreground');

  console.log('\n' + '='.repeat(80));

  // Example 3: Multiple operations
  console.log('\n📝 Example 3: Image Generation + Sentiment Analysis\n');
  await agent.run(
    'Generate an image of a happy dog playing in a park, and then analyze the sentiment of this text: "This is the best day ever!"'
  );

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ All examples completed!');
}

main().catch(console.error);
