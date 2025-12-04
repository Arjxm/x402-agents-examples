/**
 * x402 Server Client
 * For server-side payments using agent wallet
 */

import { ethers } from 'ethers';

interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
    v: number;
    r: string;
    s: string;
  };
}

export class X402ServerClient {
  private wallet: ethers.Wallet;
  private address: string;
  public lastTransactionHash: string | null = null;
  public lastNetwork: string | null = null;

  constructor(privateKey: string) {
    this.wallet = new ethers.Wallet(privateKey);
    this.address = this.wallet.address;
    console.log('🔑 Agent wallet initialized:', this.address);
  }

  /**
   * Make HTTP request with automatic x402 payment handling
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Reset transaction info
    this.lastTransactionHash = null;
    this.lastNetwork = null;

    // Step 1: Try request without payment
    console.log('🌐 Making initial request to:', url);
    let response = await fetch(url, options);
    console.log('📥 Initial response status:', response.status);

    // Step 2: Handle 402 Payment Required
    if (response.status === 402) {
      console.log('💳 Received 402 Payment Required, processing payment...');
      const paymentReq = await response.json();
      const methodRaw = paymentReq.accepts?.[0] || paymentReq.methods?.[0];

      // Normalize field names (support both formats)
      const method = {
        maximumAmount: methodRaw.maximumAmount || methodRaw.maxAmountRequired,
        recipient: methodRaw.recipient || methodRaw.payTo,
        timeout: methodRaw.timeout || (methodRaw.maxTimeoutSeconds ? methodRaw.maxTimeoutSeconds * 1000 : undefined),
        scheme: methodRaw.scheme,
        network: methodRaw.network,
        asset: methodRaw.asset,
        description: methodRaw.description,
        extra: methodRaw.extra
      };

      console.log('💰 Agent paying:', {
        amount: `$${parseInt(method.maximumAmount) / 1_000_000}`,
        description: method.description,
        endpoint: url
      });

      console.log('🔍 Payment method details:', JSON.stringify(method, null, 2));

      // Step 3: Create payment authorization
      const paymentHeader = await this.createPaymentAuthorization(method);
      this.lastNetwork = method.network;

      console.log('🔐 Payment header created, retrying request...');

      // Decode and log the payment payload for debugging
      try {
        const decodedPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
        console.log('📤 Payment payload:', JSON.stringify(decodedPayload, null, 2));
      } catch (e) {
        console.log('📤 X-PAYMENT header (first 100 chars):', paymentHeader.substring(0, 100) + '...');
      }

      // Step 4: Retry with payment
      const retryHeaders = {
        ...options.headers,
        'X-PAYMENT': paymentHeader
      };

      console.log('🔄 Retrying request with headers:', Object.keys(retryHeaders));
      console.log('🔄 X-PAYMENT header is present:', !!retryHeaders['X-PAYMENT']);

      response = await fetch(url, {
        ...options,
        headers: retryHeaders
      });

      console.log('📥 Retry response status:', response.status);

      if (response.ok) {
        console.log('✅ Payment successful');

        // Try to extract transaction hash from response
        try {
          const responseClone = response.clone();
          const data = await responseClone.json();
          if (data.transactionHash || data.txHash || data.tx) {
            this.lastTransactionHash = data.transactionHash || data.txHash || data.tx;
            console.log('📝 Transaction hash:', this.lastTransactionHash);
          }
        } catch (e) {
          // Response might not be JSON, that's okay
        }
      } else {
        // Clone response before reading to avoid "Body is unusable" error
        const errorText = await response.clone().text();
        console.error('❌ Payment failed:', errorText);
      }
    }

    return response;
  }

  /**
   * Get last transaction info
   */
  getLastTransaction(): { hash: string | null; network: string | null } {
    return {
      hash: this.lastTransactionHash,
      network: this.lastNetwork
    };
  }

  /**
   * Create signed payment authorization using EIP-712
   */
  private async createPaymentAuthorization(method: any): Promise<string> {
    // Generate random nonce
    const nonce = ethers.hexlify(ethers.randomBytes(32));

    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + (method.timeout ? method.timeout / 1000 : 300);

    // Convert to strings for facilitator
    const validAfterStr = validAfter.toString();
    const validBeforeStr = validBefore.toString();

    // EIP-712 Domain
    const domain = {
      name: method.extra?.name || 'USDC',
      version: method.extra?.version || '2',
      chainId: method.network === 'base' ? 8453 : 84532,
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
      from: this.address,
      to: method.recipient,
      value: method.maximumAmount,
      validAfter,
      validBefore,
      nonce
    };

    // Sign with private key
    const signature = await this.wallet.signTypedData(domain, types, message);

    // Create payment payload with BOTH signature and authorization (ERC-3009 format)
    const payload = {
      x402Version: 1,
      scheme: method.scheme,
      network: method.network,
      payload: {
        signature: signature, // Compact signature string
        authorization: {
          from: this.address,
          to: method.recipient,
          value: method.maximumAmount,
          validAfter: validAfterStr,
          validBefore: validBeforeStr,
          nonce
        }
      }
    };

    // Encode as base64
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  getAddress(): string {
    return this.address;
  }
}
