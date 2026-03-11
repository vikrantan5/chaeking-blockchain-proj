import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("         🕉️  BLOCKCHAIN DONATION SYSTEM STATUS  🕉️");
  console.log("═══════════════════════════════════════════════════════");

  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📍 NETWORK: Polygon Amoy Testnet");

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 YOUR WALLET:");
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} POL`);
  console.log(`   View: https://amoy.polygonscan.com/address/${wallet.address}
`);

  console.log("✅ SUCCESSFULLY DEPLOYED:");
  console.log("   TempleRegistry: 0xA07b1233F8d0ea9EBe7f2E7cb2661094f8c18640");
  console.log(`   Super Admin: ${wallet.address} (YOU!)`);
  console.log(`   View: https://amoy.polygonscan.com/address/0xA07b1233F8d0ea9EBe7f2E7cb2661094f8c18640
`);

  console.log("✅ TEMPLE REGISTERED:");
  console.log("   Temple Wallet: 0x1f8be1869DEE8b8758fb1aB1a3b632D0a61eBE35");
  console.log("   Status: REGISTERED in your TempleRegistry");
  console.log("   Transaction: https://amoy.polygonscan.com/tx/0x6fafa26e738af33744cfdbeefd6319e8d6365300e14f779fc6807aee035358ba");

  console.log("⚠️  PENDING:");
  console.log("   TempleFund Contract: NOT YET DEPLOYED");
  console.log(`   Reason: Insufficient POL (need ~0.07 POL, have ${ethers.formatEther(balance)} POL)`);
  console.log("   Required for: Deploying TempleFund contrac");

  console.log("═══════════════════════════════════════════════════════");
  console.log("              🚰 NEXT STEPS TO COMPLETE SETUP");
  console.log("═══════════════════════════════════════════════════════");

  console.log("STEP 1: Get more testnet POL");
  console.log("   🔗 https://faucet.polygon.technology/");
  console.log("   🔗 https://www.alchemy.com/faucets/polygon-amoy");
  console.log(`   Send to: ${wallet.address}`);
  console.log("   Amount needed: At least 0.1 POL");

  console.log("STEP 2: After getting POL, deploy TempleFund:");
  console.log("   Run: cd /app/backend && npx hardhat run scripts/deployFund.js --network amoy");

  console.log("STEP 3: Test donation:");
  console.log("   Run: cd /app/backend && node scripts/DonateEthToTemple.js");

  console.log("STEP 4: Verify donation:");
  console.log("   Run: cd /app/backend && node scripts/getTempleEthBalance.js");

  console.log("═══════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
