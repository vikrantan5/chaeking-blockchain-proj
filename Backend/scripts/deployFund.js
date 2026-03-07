import pkg from "hardhat";
const { ethers, run } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  // Compile the contracts
  await run("compile");

  // Get the deployer wallet/signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with address:", deployer.address);

  // Load the TempleRegistry contract address from the deployedAddresses.json file
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");

  if (!fs.existsSync(addressesPath)) {
    console.error(
      "deployedAddresses.json not found! Please deploy the TempleRegistry contract first."
    );
    process.exit(1);
  }

  const deployedAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  if (
    !deployedAddresses.TempleRegistry ||
    !deployedAddresses.TempleRegistry.contractAddress
  ) {
    console.error(
      "TempleRegistry address not found in deployedAddresses.json!"
    );
    process.exit(1);
  }

  const templeRegistryAddress =
    deployedAddresses.TempleRegistry.contractAddress;
  console.log("TempleRegistry address:", templeRegistryAddress);

  // Get the contract factory for TempleFund
  const TempleFund = await ethers.getContractFactory("TempleFund");

  // Deploy the TempleFund contract with the address of the TempleRegistry
  // Deploy the TempleFund contract with gas fee overrides
  const feeData = await ethers.provider.getFeeData();
console.log("Network fee data:", feeData);

const overrides = {
  maxPriorityFeePerGas: feeData.maxPriorityFeePerGas*2n, // give 2x tip
  maxFeePerGas: feeData.maxFeePerGas*2n                  // double cap
};


  const fund = await TempleFund.deploy(templeRegistryAddress, overrides);
  await fund.waitForDeployment();

  const fundAddress = await fund.getAddress();
  console.log("TempleFund deployed at:", fundAddress);

  // Add the TempleFund contract address to the deployedAddresses.json
  deployedAddresses.TempleFund = {
    contractAddress: fundAddress,
    deployedBy: deployer.address,
  };

  // Save the updated addresses to deployedAddresses.json
  fs.writeFileSync(addressesPath, JSON.stringify(deployedAddresses, null, 2));

  console.log("Updated addresses saved to scripts/deployedAddresses.json");
}

// Handle async/await properly
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
