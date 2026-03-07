import pkg from 'hardhat';
const { ethers } = pkg;
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  // Load deployed contract address
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const contractAddress = deployed.TempleRegistry.contractAddress;

  // Get signer from private key
  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Get contract ABI using fs.readFileSync
  const abiPath = path.resolve("artifacts","contracts","TempleRegistry.sol", "TempleRegistry.json");
  const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

  // Connect to the contract
  const registry = new ethers.Contract(contractAddress, contractABI, signer);

  // Define temple address to register
  const templeAddress = "0x75BF063b574656c6C645615497A104482960E9Ae"; // replace with actual address

  // Call the write function
  const tx = await registry.registerTemple(templeAddress);
  console.log("Transaction sent. Waiting for confirmation...");
  await tx.wait();
  console.log(`Temple ${templeAddress} removed successfully.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});