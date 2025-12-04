/**
 * x402 Protocol Client
 * Handles payment authorization using x402 protocol with facilitator
 */

import { ethers } from 'ethers';

export interface X402PaymentMethod {
  scheme: string;
  asset: string;
  recipient: string;
  maximumAmount: string;
  minimumAmount: string;
  network: string;
  description?: string;
  timeout?: number;
}

export interface X402Response {
  methods: X402PaymentMethod[];
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  network?: string;
  error?: string;
}

export class X402Client {
  private wallet: ethers.Wallet;
  private facilitatorUrl: string;
  public lastTransaction: PaymentResult | null = null;

  constructor(privateKey: string, facilitatorUrl?: string) {
    this.wallet = new ethers.Wallet(privateKey);
    this.facilitatorUrl = facilitatorUrl || process.env.X402_FACILITATOR || 'https://x402.treasure.lol/facilitator';
  }

  /**
   * Make HTTP request with automatic x402 payment handling
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    this.lastTransaction = null;

    // Step 1: Try request without payment
    let response = await fetch(url, options);

    // Step 2: Handle 402 Payment Required
    if (response.status === 402) {
      const paymentReq = await response.json() as X402Response;
      const method = paymentReq.methods[0]; // Use first available payment method

      console.log('💰 Payment required:', {
        amount: `$${parseInt(method.maximumAmount) / 1_000_000}`,
        description: method.description || 'Paid API call',
        network: method.network
      });

      // Step 3: Create signed payment authorization (EIP-712)
      const signedAuth = await this.createSignedAuthorization(method);

      if (!signedAuth) {
        throw new Error('Failed to create payment authorization');
      }

      console.log('📝 Created signed authorization');

      // Step 4: Retry with signed authorization in X-PAYMENT header
      // The server will submit to facilitator and handle settlement
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-PAYMENT': JSON.stringify(signedAuth)
        }
      });

      if (response.ok) {
        console.log('✅ Payment successful, API call completed');

        // Extract transaction hash from response if available
        const result: any = await response.json();
        if (result.payment?.transactionHash) {
          this.lastTransaction = {
            success: true,
            transactionHash: result.payment.transactionHash,
            network: method.network
          };
        }

        // Return response with the parsed result
        return new Response(JSON.stringify(result), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } else {
        console.error('❌ API call failed after payment:', await response.text());
      }
    }

    return response;
  }

  /**
   * Create signed payment authorization using EIP-712
   * Returns the signed authorization to be sent to the API server
   */
  private async createSignedAuthorization(method: X402PaymentMethod): Promise<any> {
    try {
      // Generate random nonce
      const nonce = ethers.hexlify(ethers.randomBytes(32));

      const validAfter = Math.floor(Date.now() / 1000);
      const validBefore = validAfter + (method.timeout ? method.timeout / 1000 : 300);

      // EIP-712 Domain
      const domain = {
        name: 'USDC',
        version: '2',
        chainId: this.getChainId(method.network),
        verifyingContract: method.asset
      };

      // EIP-712 Types
      const types = {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' }
        ]
      };

      // Message to sign
      const message = {
        from: this.wallet.address,
        to: method.recipient,
        value: method.maximumAmount,
        validAfter,
        validBefore,
        nonce
      };

      // Sign with private key
      const signature = await this.wallet.signTypedData(domain, types, message);

      // Return signed authorization payload for API server to submit
      return {
        x402Version: 1,
        scheme: method.scheme,
        network: method.network,
        payload: {
          signature: signature,
          authorization: {
            from: this.wallet.address,
            to: method.recipient,
            value: method.maximumAmount,
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce
          }
        }
      };

    } catch (error: any) {
      console.error('❌ Failed to create signed authorization:', error.message);
      return null;
    }
  }

  /**
   * Get chain ID for network name
   */
  private getChainId(network: string): number {
    const chainIds: Record<string, number> = {
      'base': 8453,
      'base-sepolia': 84532,
      'ethereum': 1,
      'sepolia': 11155111,
      'polygon': 137,
      'arbitrum': 42161,
      'optimism': 10
    };

    return chainIds[network] || 84532; // Default to base-sepolia
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get last transaction info
   */
  getLastTransaction(): PaymentResult | null {
    return this.lastTransaction;
  }

  /**
   * Get block explorer URL for transaction
   */
  getExplorerUrl(txHash: string, network: string): string {
    const explorers: Record<string, string> = {
      'base': 'https://basescan.org/tx/',
      'base-sepolia': 'https://sepolia.basescan.org/tx/',
      'ethereum': 'https://etherscan.io/tx/',
      'sepolia': 'https://sepolia.etherscan.io/tx/',
      'polygon': 'https://polygonscan.com/tx/',
      'arbitrum': 'https://arbiscan.io/tx/',
      'optimism': 'https://optimistic.etherscan.io/tx/'
    };

    const baseUrl = explorers[network] || explorers['base-sepolia'];
    return `${baseUrl}${txHash}`;
  }
}
