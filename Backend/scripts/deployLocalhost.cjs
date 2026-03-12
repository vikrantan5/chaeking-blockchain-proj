const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment to Hardhat Localhost...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei");

  // Deploy NGORegistry
  console.log("📦 Deploying NGORegistry...");
  const NGORegistry = await hre.ethers.getContractFactory("NGORegistry");
  const ngoRegistry = await NGORegistry.deploy();
  await ngoRegistry.waitForDeployment();
  const ngoRegistryAddress = await ngoRegistry.getAddress();
  console.log("✅ NGORegistry deployed to:", ngoRegistryAddress);

  // Deploy NGOFund with NGORegistry address
  console.log("📦 Deploying NGOFund...");
  const NGOFund = await hre.ethers.getContractFactory("NGOFund");
  const ngoFund = await NGOFund.deploy(ngoRegistryAddress);
  await ngoFund.waitForDeployment();
  const ngoFundAddress = await ngoFund.getAddress();
  console.log("✅ NGOFund deployed to:", ngoFundAddress);

  // Save deployed addresses
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    deployer: deployer.address,
    contracts: {
      NGORegistry: ngoRegistryAddress,
      NGOFund: ngoFundAddress
    },
    timestamp: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "deployedAddresses-localhost.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", outputPath);

  // Display summary
  console.log("" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:        Hardhat Localhost (Chain ID: 31337)");
  console.log("NGORegistry:   ", ngoRegistryAddress);
  console.log("NGOFund:       ", ngoFundAddress);
  console.log("Super Admin:   ", deployer.address);
  console.log("=".repeat(60));
  console.log("✅ All contracts deployed successfully!");
  console.log("📝 Next steps:");
  console.log("1. Update backend .env with these contract addresses");
  console.log("2. Configure MetaMask to connect to Hardhat localhost");
  console.log("3. Import test accounts from Hardhat into MetaMask");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
