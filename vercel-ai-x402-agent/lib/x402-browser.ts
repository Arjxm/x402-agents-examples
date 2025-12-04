/**
 * x402 Browser Client
 * For client-side wallet signing with MetaMask
 */

import { BrowserProvider, Signer } from 'ethers';

interface PaymentRequirement {
  scheme: string;
  network: string;
  maximumAmount: string;
  asset: string;
  recipient: string;
  resource: string;
  description?: string;
  timeout?: number;
}

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

export class X402BrowserClient {
  private signer: Signer;
  private address: string | null = null;

  constructor(signer: Signer) {
    this.signer = signer;
  }

  async init() {
    this.address = await this.signer.getAddress();
  }

  /**
   * Make HTTP request with automatic x402 payment handling
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.address) await this.init();

    // Step 1: Try request without payment
    let response = await fetch(url, options);

    // Step 2: Handle 402 Payment Required
    if (response.status === 402) {
      const paymentReq = await response.json();
      const method = paymentReq.methods[0];

      console.log('💰 Payment required:', {
        amount: `$${parseInt(method.maximumAmount) / 1_000_000}`,
        description: method.description
      });

      // Step 3: Create payment authorization (MetaMask popup)
      const paymentHeader = await this.createPaymentAuthorization(method);

      // Step 4: Retry with payment
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-PAYMENT': paymentHeader
        }
      });

      if (response.ok) {
        console.log('✅ Payment successful');
      }
    }

    return response;
  }

  /**
   * Create signed payment authorization using EIP-712
   */
  private async createPaymentAuthorization(method: PaymentRequirement): Promise<string> {
    // Generate random nonce
    const nonceBytes = new Uint8Array(32);
    crypto.getRandomValues(nonceBytes);
    const nonce = '0x' + Array.from(nonceBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + (method.timeout ? method.timeout / 1000 : 300);

    // EIP-712 Domain
    const domain = {
      name: 'USDC',
      version: '2',
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
      from: this.address!,
      to: method.recipient,
      value: method.maximumAmount,
      validAfter,
      validBefore,
      nonce
    };

    // Sign with MetaMask (triggers popup)
    const signature = await this.signer.signTypedData(domain, types, message);

    // Parse signature
    const sig = {
      v: parseInt(signature.slice(-2), 16),
      r: signature.slice(0, 66),
      s: '0x' + signature.slice(66, 130)
    };

    // Create payment payload
    const payload: PaymentPayload = {
      x402Version: 1,
      scheme: method.scheme,
      network: method.network,
      payload: {
        from: this.address!,
        to: method.recipient,
        value: method.maximumAmount,
        validAfter,
        validBefore,
        nonce,
        v: sig.v,
        r: sig.r,
        s: sig.s
      }
    };

    // Encode as base64
    return btoa(JSON.stringify(payload));
  }
}

/**
 * Helper to connect wallet and create x402 client
 */
export async function connectWallet(): Promise<X402BrowserClient> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  return new X402BrowserClient(signer);
}
