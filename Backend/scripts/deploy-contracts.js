const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts to Hardhat localhost...");

  // Deploy NGORegistry
  const NGORegistry = await hre.ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.deploy();
  await ngoRegistry.waitForDeployment();
  const registryAddress = await ngoRegistry.getAddress();
  console.log("✅ NGORegistry deployed to:", registryAddress);

  // Deploy NGOFund with registry address
  const NGOFund = await hre.ethers.getContractFactory("NGOFund");
  const ngoFund = await NGOFund.deploy(registryAddress);
  await ngoFund.waitForDeployment();
  const fundAddress = await ngoFund.getAddress();
  console.log("✅ NGOFund deployed to:", fundAddress);

  console.log("📋 Contract Addresses:");
  console.log("NGO_REGISTRY_ADDRESS=" + registryAddress);
  console.log("NGO_FUND_ADDRESS=" + fundAddress);
  console.log("RPC_URL=http://127.0.0.1:8545");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
