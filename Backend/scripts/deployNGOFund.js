import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting NGOFund deployment...");

  // Read deployed addresses
  const addressesPath = path.join(process.cwd(), "scripts", "deployedAddresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error("❌ Please deploy NGORegistry first!");
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const ngoRegistryAddress = addresses.ngoRegistry;

  if (!ngoRegistryAddress) {
    throw new Error("❌ NGORegistry address not found. Please deploy NGORegistry first!");
  }

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("🔗 Using NGORegistry at:", ngoRegistryAddress);

  // Deploy NGOFund
  const NGOFund = await ethers.getContractFactory("NGOFund");
  const ngoFund = await NGOFund.deploy(ngoRegistryAddress);
  await ngoFund.waitForDeployment();

  const ngoFundAddress = await ngoFund.getAddress();
  console.log("✅ NGOFund deployed to:", ngoFundAddress);

  // Update addresses file
  addresses.ngoFund = ngoFundAddress;
  addresses.ngoFundDeployedAt = new Date().toISOString();

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("📄 Address saved to deployedAddresses.json");

  console.log("🎉 Deployment complete!");
  console.log("📋 Contract Addresses:");
  console.log("  NGORegistry:", ngoRegistryAddress);
  console.log("  NGOFund:", ngoFundAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
