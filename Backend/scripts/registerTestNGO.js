import hre from "hardhat";

async function main() {
  console.log("🔗 Registering Test NGO Wallet on Blockchain...");

  const testNGOWallet = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const ngoRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  console.log("🎯 Test NGO Wallet to register:", testNGOWallet);
  console.log("📋 NGO Registry Contract:", ngoRegistryAddress);
  console.log();

  // Get contract instance
  const NGORegistry = await hre.ethers.getContractAt("NGORegistry", ngoRegistryAddress);

  // Check if already registered
  const isAlreadyRegistered = await NGORegistry.isRegistered(testNGOWallet);
  
  if (isAlreadyRegistered) {
    console.log("✅ NGO Wallet is already registered on blockchain!");
    return;
  }

  // Register the NGO
  console.log("⏳ Registering NGO on blockchain...");
  const tx = await NGORegistry.registerNGO(testNGOWallet);
  console.log("📤 Transaction submitted:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  console.log();
  
  // Verify registration
  const isNowRegistered = await NGORegistry.isRegistered(testNGOWallet);
  
  if (isNowRegistered) {
    console.log("🎉 SUCCESS! NGO Wallet is now registered on blockchain!");
    console.log("🔗 The wallet can now receive donations through the platform.");
  } else {
    console.log("❌ Registration failed. Please check the transaction.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
