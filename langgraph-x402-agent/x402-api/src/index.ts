import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeSentiment } from './sentiment-service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for processed payment hashes (in production, use Redis/DB)
const processedPayments = new Set<string>();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'x402-protected-sentiment-api' });
});

// x402-Protected Sentiment Analysis Endpoint
app.post('/sentiment', async (req: Request, res: Response) => {
  try {
    const paymentHeader = req.headers['x-payment'] as string | undefined;

    // Step 1: Check if payment header is present
    if (!paymentHeader) {
      console.log('💳 402 Payment Required - No payment header found');

      // Return 402 Payment Required in x402 protocol format
      return res.status(402).json({
        methods: [
          {
            scheme: 'eip3009',
            asset: process.env.USDC_TOKEN_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
            recipient: process.env.RECEIVER_WALLET_ADDRESS || '0x501ab28fc3c7d29c2d12b243723eb5c5418b9de6',
            maximumAmount: process.env.PAYMENT_AMOUNT || '100000',
            minimumAmount: process.env.PAYMENT_AMOUNT || '100000',
            network: process.env.NETWORK || 'base-sepolia',
            description: 'Sentiment Analysis API - Premium GPT-4 powered analysis',
            timeout: 300000 // 5 minutes
          }
        ]
      });
    }

    // Step 2: Parse signed authorization from X-PAYMENT header
    console.log('📝 Processing signed authorization...');
    let signedAuth: any;

    try {
      signedAuth = JSON.parse(paymentHeader);
    } catch (parseError) {
      console.log('❌ Invalid payment authorization format');
      return res.status(400).json({
        error: 'Invalid payment format',
        message: 'X-PAYMENT header must contain valid JSON signed authorization'
      });
    }

    // Validate authorization structure
    if (!signedAuth.payload?.signature || !signedAuth.payload?.authorization) {
      console.log('❌ Missing required fields in authorization');
      return res.status(400).json({
        error: 'Invalid authorization',
        message: 'Authorization missing required fields'
      });
    }

    // Create unique payment identifier from authorization
    const authNonce = signedAuth.payload.authorization.nonce;

    // Check if payment was already processed (prevent double-spending)
    if (processedPayments.has(authNonce)) {
      console.log('⚠️  Payment authorization already used');
      return res.status(400).json({
        error: 'Payment already used',
        message: 'This payment authorization has already been processed'
      });
    }

    // Step 3: Submit signed authorization to facilitator
    console.log('📤 Submitting authorization to facilitator...');

    const facilitatorUrl = process.env.FACILITATOR_URL!;
    let transactionHash: string;

    try {
      const facilitatorResponse = await fetch(facilitatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signedAuth)
      });

      if (!facilitatorResponse.ok) {
        const errorText = await facilitatorResponse.text();
        console.log(`❌ Facilitator returned status ${facilitatorResponse.status}: ${errorText}`);
        return res.status(402).json({
          error: 'Payment settlement failed',
          message: `Facilitator error: ${errorText}`
        });
      }

      const facilitatorResult = await facilitatorResponse.json();
      transactionHash = facilitatorResult.transactionHash;

      if (!transactionHash) {
        console.log('❌ Facilitator did not return transaction hash');
        return res.status(402).json({
          error: 'Payment settlement failed',
          message: 'Facilitator did not return transaction hash'
        });
      }

      console.log(`✅ Payment settled! Transaction: ${transactionHash}`);

    } catch (facilitatorError: any) {
      console.error('❌ Error communicating with facilitator:', facilitatorError.message);
      return res.status(502).json({
        error: 'Facilitator communication failed',
        message: `Could not reach payment facilitator: ${facilitatorError.message}`
      });
    }

    // Mark payment as processed
    processedPayments.add(authNonce);
    console.log('✅ Payment authorization marked as used');

    // Step 4: Extract request parameters
    const { text, model, temperature } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }

    // Step 5: Perform sentiment analysis
    console.log(`🤖 Analyzing sentiment for: "${text.substring(0, 50)}..."`);
    const result = await analyzeSentiment(text, model, temperature);

    // Step 6: Return result with payment confirmation
    console.log('📊 Sentiment analysis complete');
    return res.json({
      ...result,
      payment: {
        transactionHash: transactionHash,
        status: 'confirmed',
        network: process.env.NETWORK
      }
    });

  } catch (error: any) {
    console.error('❌ Error processing request:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 x402-Protected Sentiment API Server');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`💳 Payment: ${process.env.PAYMENT_AMOUNT} USDC (${process.env.USDC_TOKEN_ADDRESS})`);
  console.log(`💰 Receiver: ${process.env.RECEIVER_WALLET_ADDRESS}`);
  console.log(`🌐 Network: ${process.env.NETWORK}`);
  console.log(`🔗 Facilitator: ${process.env.FACILITATOR_URL}`);
  console.log('\n✅ Ready to accept x402 payments!\n');
});
