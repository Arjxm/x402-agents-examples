/**
 * Configuration module
 * Manages environment variables and app configuration
 */

export interface AppConfig {
  openaiApiKey: string;
  agentWalletPrivateKey: string;
  receiverWalletAddress: string;
  facilitatorUrl: string;
  network: string;
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): AppConfig {
  const config: AppConfig = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    agentWalletPrivateKey: process.env.AGENT_WALLET_PRIVATE_KEY || '',
    receiverWalletAddress: process.env.RECEIVER_WALLET_ADDRESS || '0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6',
    facilitatorUrl: process.env.X402_FACILITATOR || 'https://x402.treasure.lol/facilitator',
    network: process.env.X402_NETWORK || 'base-sepolia'
  };

  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (!config.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (!config.agentWalletPrivateKey) {
    errors.push('AGENT_WALLET_PRIVATE_KEY is required');
  }

  if (!config.receiverWalletAddress) {
    errors.push('RECEIVER_WALLET_ADDRESS is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

/**
 * Get receiver wallet address
 */
export function getReceiverWallet(): string {
  return process.env.RECEIVER_WALLET_ADDRESS || '0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6';
}
