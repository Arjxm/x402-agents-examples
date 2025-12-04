
import 'dotenv/config';
import { X402Agent } from './dist/agent/graph.js';
import { initializePredefinedTools } from './dist/tools/predefined.js';
import { loadConfig } from './dist/config.js';

// Initialize
const config = loadConfig();
initializePredefinedTools();

// Create agent
const agent = new X402Agent(
  config.openaiApiKey,
  config.agentWalletPrivateKey,
  config.facilitatorUrl
);

// Run
const response = await agent.run(process.argv[2]);
const lastTx = agent.getLastTransaction();

// Output JSON
console.log(JSON.stringify({
  response,
  transaction: lastTx && lastTx.success && lastTx.transactionHash ? {
    hash: lastTx.transactionHash,
    network: lastTx.network || 'base-sepolia',
    explorerUrl: agent.getExplorerUrl(lastTx.transactionHash, lastTx.network || 'base-sepolia')
  } : null
}));
