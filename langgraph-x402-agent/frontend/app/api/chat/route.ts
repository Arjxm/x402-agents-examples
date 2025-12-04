import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Path to the parent directory with the agent
const projectRoot = path.join(process.cwd(), '..');

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('📨 Received message:', message);

    // Create a temporary script to run the agent
    const scriptPath = path.join(projectRoot, 'run-agent-api.mjs');
    const fs = require('fs');

    // Write a temporary script
    const script = `
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
`;

    fs.writeFileSync(scriptPath, script);

    // Run the script
    const { stdout, stderr } = await execAsync(
      `cd "${projectRoot}" && node run-agent-api.mjs "${message.replace(/"/g, '\\"')}"`,
      {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 120000 // 2 minutes
      }
    );

    // Clean up
    fs.unlinkSync(scriptPath);

    if (stderr && !stderr.includes('ExperimentalWarning')) {
      console.error('Agent stderr:', stderr);
    }

    // Parse the last line of stdout (which should be our JSON)
    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1];

    try {
      const result = JSON.parse(jsonLine);
      return NextResponse.json(result);
    } catch (e) {
      // If parsing fails, return the full output
      return NextResponse.json({
        response: stdout,
        transaction: null
      });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
