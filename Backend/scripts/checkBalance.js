import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const balance = await provider.getBalance(wallet.address);
  
  console.log("=== Wallet Balance Check ===");
  console.log(`Wallet Address: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} POL`);
  console.log(`Balance (wei): ${balance.toString()}`);
  console.log("");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("❌ INSUFFICIENT BALANCE for deployment!");
    console.log("You need at least 0.1 POL to deploy contracts.");
    console.log("");
    console.log("🚰 Get FREE testnet POL from:");
    console.log("1. https://faucet.polygon.technology/ (Official Polygon Faucet)");
    console.log("2. https://www.alchemy.com/faucets/polygon-amoy");
    console.log("");
    console.log(`Send testnet POL to: ${wallet.address}`);
  } else {
    console.log("✅ Sufficient balance for deployment!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
