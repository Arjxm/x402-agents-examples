/**
 * LangGraph x402 Agent - Main Entry Point
 *
 * Usage:
 *   npm run dev                     - Interactive CLI
 *   npm run example                 - Run example
 */

import 'dotenv/config';
import { X402Agent } from './agent/graph.js';
import { initializePredefinedTools } from './tools/predefined.js';
import { loadConfig, validateConfig } from './config.js';
import * as readline from 'readline';

async function main() {
  // Load and validate configuration
  const config = loadConfig();

  try {
    validateConfig(config);
  } catch (error: any) {
    console.error('❌ Configuration Error:', error.message);
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Initialize predefined tools
  console.log('🔧 Initializing tools...');
  initializePredefinedTools();

  // Create agent
  console.log('🚀 Creating agent...\n');
  const agent = new X402Agent(
    config.openaiApiKey,
    config.agentWalletPrivateKey,
    config.facilitatorUrl
  );

  // Display stats
  const stats = agent.getStats();
  console.log('\n📊 Agent Configuration:');
  console.log(`   Agent Wallet: ${stats.walletAddress}`);
  console.log(`   Receiver Wallet: ${config.receiverWalletAddress}`);
  console.log(`   Network: ${config.network}`);
  console.log(`   Tools: ${stats.totalTools}`);
  console.log(`   Facilitator: ${config.facilitatorUrl}\n`);

  // Interactive CLI
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('='.repeat(80));
  console.log('🤖 LangGraph x402 Agent - Interactive Mode');
  console.log('='.repeat(80));
  console.log('\nType your request (or "exit" to quit)');
  console.log('Examples:');
  console.log('  - "Generate an image of a sunset over the ocean"');
  console.log('  - "Analyze the sentiment of this text: I love this product!"');
  console.log('  - "What\'s the weather like at latitude 40.7128, longitude -74.0060?"');
  console.log('  - "Calculate 2 + 2 * 3"');
  console.log('\n' + '='.repeat(80) + '\n');

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      const message = input.trim();

      if (!message) {
        askQuestion();
        return;
      }

      if (message.toLowerCase() === 'exit') {
        console.log('\n👋 Goodbye!');
        rl.close();
        process.exit(0);
      }

      try {
        await agent.run(message);
      } catch (error: any) {
        console.error('Error:', error.message);
      }

      console.log('\n' + '-'.repeat(80) + '\n');
      askQuestion();
    });
  };

  askQuestion();
}

// Handle errors
process.on('unhandledRejection', (error: any) => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});

// Run
main().catch(console.error);
