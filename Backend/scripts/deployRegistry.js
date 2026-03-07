import pkg from 'hardhat';
const { ethers, run } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  // Compile the contracts
  await run("compile");

  // Get the deployer wallet/signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with address:", deployer.address);

  // Get the contract factory
  const TempleRegistry = await ethers.getContractFactory("TempleRegistry");

  // Deploy the contract
  const registry = await TempleRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("TempleRegistry deployed at:", registryAddress);

  // ⛽ Log gas used for deployment
  const receipt = await registry.deploymentTransaction().wait();
  console.log("⛽ Deployment gas used:", receipt.gasUsed.toString());

  // Prepare addresses JSON path
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");

  // Load existing addresses or initialize new object
  const deployedAddresses = fs.existsSync(addressesPath)
    ? JSON.parse(fs.readFileSync(addressesPath, "utf8"))
    : {};

  // Add contract address and deployer address
  deployedAddresses.TempleRegistry = {
    contractAddress: registryAddress,
    deployedBy: deployer.address
  };

  // Save to JSON file
  fs.writeFileSync(
    addressesPath,
    JSON.stringify(deployedAddresses, null, 2)
  );

  console.log("Addresses saved to scripts/deployedAddresses.json");
}

// Handle async/await properly
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
