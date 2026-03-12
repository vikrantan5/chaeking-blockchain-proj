const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying NGOFund to existing NGORegistry...");

    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC");

    // Use existing NGORegistry address
    const ngoRegistryAddress = "0xf786b9caf9994A8925c23B93fb095E3582b6D4d5";
    console.log("📝 Using existing NGORegistry at:", ngoRegistryAddress);

    // Deploy NGOFund
    console.log("📝 Deploying NGOFund...");
    const NGOFund = await ethers.getContractFactory("NGOFund");
    const ngoFund = await NGOFund.deploy(ngoRegistryAddress);
    await ngoFund.waitForDeployment();
    const ngoFundAddress = await ngoFund.getAddress();
    
    console.log("✅ NGOFund deployed to:", ngoFundAddress);

    // Save deployment addresses
    const deploymentData = {
        network: "Polygon Amoy Testnet",
        chainId: 80002,
        deployer: deployer.address,
        deploymentDate: new Date().toISOString(),
        contracts: {
            NGORegistry: {
                address: ngoRegistryAddress,
                explorer: `https://amoy.polygonscan.com/address/${ngoRegistryAddress}`
            },
            NGOFund: {
                address: ngoFundAddress,
                explorer: `https://amoy.polygonscan.com/address/${ngoFundAddress}`
            }
        }
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filePath = path.join(deploymentsDir, "amoy-deployment.json");
    fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2));

    console.log("" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(70));
    console.log("📄 Contract Addresses:");
    console.log("   NGORegistry:", ngoRegistryAddress);
    console.log("   NGOFund:", ngoFundAddress);
    console.log("🔗 Verify on Polygonscan:");
    console.log("   NGORegistry:", deploymentData.contracts.NGORegistry.explorer);
    console.log("   NGOFund:", deploymentData.contracts.NGOFund.explorer);
    console.log("💾 Deployment data saved to:", filePath);
    console.log("=".repeat(70) + "");

    // Create .env update instructions
    console.log("📝 Add these to your .env file:");
    console.log("-".repeat(70));
    console.log(`NGO_REGISTRY_ADDRESS=${ngoRegistryAddress}`);
    console.log(`NGO_FUND_ADDRESS=${ngoFundAddress}`);
    console.log("-".repeat(70) + "");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
