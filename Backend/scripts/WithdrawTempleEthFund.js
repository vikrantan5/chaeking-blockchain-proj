import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  // Load deployed addresses
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const contractAddress = deployed.TempleFund.contractAddress;

  // Get signer from private key
  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
  const signer = new ethers.Wallet(process.env.TEMPLE_PRIVATE_KEY, provider);

  // Load ABI
  const abiPath = path.resolve("artifacts", "contracts", "TempleFund.sol", "TempleFund.json");
  const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

  // Connect to the TempleFund contract
  const fund = new ethers.Contract(contractAddress, contractABI, signer);

  // Define withdrawal amount (in ether)
  const amountInEther = "0.005"; // example amount

  // Send withdraw transaction
  const tx = await fund.withdrawEth(ethers.parseEther(amountInEther));
  console.log(`Withdraw transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Successfully withdrew ${amountInEther} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
