import { ethers } from 'ethers';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const WALLET_ADDRESS = '0x6580509400368302f8DA3823e82eD0D1d7fa2612';
const RPC_URL = 'https://sepolia.base.org';

// USDC ERC20 ABI (balanceOf function)
const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function checkBalance() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

    console.log('🔍 Checking USDC balance on Base Sepolia...\n');
    console.log(`Wallet: ${WALLET_ADDRESS}`);
    console.log(`USDC Token: ${USDC_ADDRESS}`);
    console.log(`Network: Base Sepolia\n`);

    const balance = await usdc.balanceOf(WALLET_ADDRESS);
    const decimals = await usdc.decimals();
    const formattedBalance = ethers.formatUnits(balance, decimals);

    console.log(`💰 USDC Balance: ${formattedBalance} USDC`);
    console.log(`   Raw balance: ${balance.toString()}`);

    if (parseFloat(formattedBalance) === 0) {
      console.log('\n⚠️  WARNING: Wallet has 0 USDC balance!');
      console.log('   You need USDC to make x402 payments.');
      console.log('\n📝 To get testnet USDC:');
      console.log('   1. Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet');
      console.log('   2. Visit the USDC faucet or swap some ETH for USDC on a testnet DEX');
      console.log(`   3. Or ask the admin to send some USDC to: ${WALLET_ADDRESS}`);
    } else if (parseFloat(formattedBalance) < 0.10) {
      console.log('\n⚠️  WARNING: Low USDC balance!');
      console.log('   Each sentiment analysis costs 0.10 USDC');
      console.log(`   You can make ${Math.floor(parseFloat(formattedBalance) / 0.10)} more requests`);
    } else {
      console.log('\n✅ Sufficient balance for x402 payments!');
      console.log(`   You can make ${Math.floor(parseFloat(formattedBalance) / 0.10)} sentiment analysis requests`);
    }

    console.log(`\n🔗 View wallet on explorer: https://sepolia.basescan.org/address/${WALLET_ADDRESS}`);

  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
  }
}

checkBalance();
