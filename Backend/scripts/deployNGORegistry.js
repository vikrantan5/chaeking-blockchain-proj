import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting NGORegistry deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy NGORegistry
  const NGORegistry = await ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.deploy();
  await ngoRegistry.waitForDeployment();

  const ngoRegistryAddress = await ngoRegistry.getAddress();
  console.log("✅ NGORegistry deployed to:", ngoRegistryAddress);

  // Save address to file
  const addresses = {
    ngoRegistry: ngoRegistryAddress,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    deployedAt: new Date().toISOString()
  };

  const addressesPath = path.join(process.cwd(), "scripts", "deployedAddresses.json");
  
  // Read existing addresses if any
  let existingAddresses = {};
  if (fs.existsSync(addressesPath)) {
    existingAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  }

  // Merge with new addresses
  const updatedAddresses = { ...existingAddresses, ...addresses };
  
  fs.writeFileSync(addressesPath, JSON.stringify(updatedAddresses, null, 2));
  console.log("📄 Address saved to deployedAddresses.json");

  console.log("🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
