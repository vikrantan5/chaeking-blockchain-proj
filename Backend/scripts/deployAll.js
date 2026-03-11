const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
async function main() {
  console.log("🚀 Starting complete NGO platform deployment...");

 // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC");

  // Deploy NGORegistry
  console.log("1️⃣  Deploying NGORegistry...");
  const NGORegistry = await hre.ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.deploy();
  await ngoRegistry.waitForDeployment();
  const ngoRegistryAddress = await ngoRegistry.getAddress();
  console.log("✅ NGORegistry deployed to:", ngoRegistryAddress, "");

  // Deploy NGOFund
  console.log("2️⃣  Deploying NGOFund...");
  const NGOFund = await hre.ethers.getContractFactory("NGOFund");
  const ngoFund = await NGOFund.deploy(ngoRegistryAddress);
  await ngoFund.waitForDeployment();
  const ngoFundAddress = await ngoFund.getAddress();
  console.log("✅ NGOFund deployed to:", ngoFundAddress, "");
  // Save addresses
  const addresses = {
    ngoRegistry: ngoRegistryAddress,
    ngoFund: ngoFundAddress,
    deployer: deployer.address,
    network: "amoy",
    deployedAt: new Date().toISOString()
  };

  const addressesPath = path.join(process.cwd(), "scripts", "deployedAddresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("📄 Addresses saved to deployedAddresses.json");

  console.log("🎉 Deployment complete!");
  console.log("📋 Contract Addresses:");
  console.log("=" .repeat(60));
  console.log("  NGORegistry:", ngoRegistryAddress);
  console.log("  NGOFund:    ", ngoFundAddress);
  console.log("  Deployer:   ", deployer.address);
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
