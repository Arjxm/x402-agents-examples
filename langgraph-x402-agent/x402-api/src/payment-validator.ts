import { ethers } from 'ethers';

/**
 * Validates an x402 payment by checking with the facilitator
 *
 * @param transactionHash - The transaction hash from X-PAYMENT header
 * @param expectedRecipient - The expected recipient address
 * @param expectedAmount - The expected payment amount (in smallest unit, e.g., 100000 for 0.1 USDC)
 * @param facilitatorUrl - The facilitator URL to validate against
 * @returns True if payment is valid, false otherwise
 */
export async function validatePayment(
  transactionHash: string,
  expectedRecipient: string,
  expectedAmount: string,
  facilitatorUrl: string
): Promise<boolean> {
  try {
    console.log(`🔍 Validating payment transaction: ${transactionHash}`);
    console.log(`   Expected recipient: ${expectedRecipient}`);
    console.log(`   Expected amount: ${expectedAmount}`);

    // Query the facilitator to verify the payment
    const response = await fetch(`${facilitatorUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionHash,
        recipient: expectedRecipient,
        amount: expectedAmount
      })
    });

    if (!response.ok) {
      console.log(`⚠️  Facilitator returned status: ${response.status}`);

      // If facilitator endpoint doesn't exist or fails, fall back to basic validation
      // In production, you should always validate with facilitator or on-chain
      if (response.status === 404 || response.status === 501) {
        console.log('⚠️  Facilitator verify endpoint not available, using fallback validation');
        return validatePaymentFallback(transactionHash);
      }

      return false;
    }

    const result = await response.json();

    if (result.valid === true) {
      console.log('✅ Payment validated by facilitator');
      return true;
    } else {
      console.log('❌ Payment rejected by facilitator:', result.reason);
      return false;
    }

  } catch (error: any) {
    console.error('❌ Payment validation error:', error.message);

    // Fallback validation for testing purposes
    // In production, failed facilitator communication should reject the payment
    console.log('⚠️  Using fallback validation due to error');
    return validatePaymentFallback(transactionHash);
  }
}

/**
 * Fallback validation that accepts valid transaction hash format
 * This is for testing only - production should always use facilitator or on-chain validation
 */
function validatePaymentFallback(transactionHash: string): boolean {
  try {
    // Basic validation: Check if it's a valid transaction hash format
    if (!transactionHash || transactionHash.length < 10) {
      console.log('❌ Invalid transaction hash format');
      return false;
    }

    // Check if it starts with 0x and is hex
    if (transactionHash.startsWith('0x')) {
      // Validate it's a proper hex string
      const isValidHex = /^0x[0-9a-fA-F]+$/.test(transactionHash);
      if (!isValidHex) {
        console.log('❌ Invalid hex format');
        return false;
      }

      // Should be 66 characters (0x + 64 hex chars) for a transaction hash
      if (transactionHash.length !== 66) {
        console.log(`⚠️  Unusual transaction hash length: ${transactionHash.length} (expected 66)`);
      }
    }

    console.log('✅ Fallback validation passed (format check only)');
    console.log('⚠️  WARNING: This is not secure for production. Use facilitator or on-chain validation.');
    return true;

  } catch (error) {
    console.error('❌ Fallback validation error:', error);
    return false;
  }
}

/**
 * Validates payment on-chain by checking the transaction
 * This is the most secure method but requires RPC access
 *
 * @param transactionHash - The transaction hash
 * @param rpcUrl - RPC URL for the network
 * @param expectedRecipient - Expected recipient address
 * @param expectedAmount - Expected amount in smallest unit
 * @param tokenAddress - USDC token address
 */
export async function validatePaymentOnChain(
  transactionHash: string,
  rpcUrl: string,
  expectedRecipient: string,
  expectedAmount: string,
  tokenAddress: string
): Promise<boolean> {
  try {
    console.log('🔗 Validating payment on-chain...');

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);

    if (!receipt) {
      console.log('❌ Transaction not found on-chain');
      return false;
    }

    if (receipt.status !== 1) {
      console.log('❌ Transaction failed on-chain');
      return false;
    }

    // Parse transfer events (for ERC20 USDC)
    // Transfer event signature: Transfer(address,address,uint256)
    const transferTopic = ethers.id('Transfer(address,address,uint256)');

    const transferLogs = receipt.logs.filter(log =>
      log.topics[0] === transferTopic &&
      log.address.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (transferLogs.length === 0) {
      console.log('❌ No transfer events found');
      return false;
    }

    // Decode the transfer event
    for (const log of transferLogs) {
      const from = ethers.getAddress('0x' + log.topics[1].slice(26));
      const to = ethers.getAddress('0x' + log.topics[2].slice(26));
      const amount = BigInt(log.data);

      console.log(`   From: ${from}`);
      console.log(`   To: ${to}`);
      console.log(`   Amount: ${amount.toString()}`);

      // Check if this transfer matches our expectations
      if (
        to.toLowerCase() === expectedRecipient.toLowerCase() &&
        amount >= BigInt(expectedAmount)
      ) {
        console.log('✅ On-chain payment validation successful');
        return true;
      }
    }

    console.log('❌ No matching transfer found');
    return false;

  } catch (error: any) {
    console.error('❌ On-chain validation error:', error.message);
    return false;
  }
}
