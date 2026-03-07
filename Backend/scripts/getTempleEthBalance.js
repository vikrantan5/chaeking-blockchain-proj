import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const contractAddress = deployed.TempleFund.contractAddress;

  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);

  const abiPath = path.resolve("artifacts", "contracts", "TempleFund.sol", "TempleFund.json");
  const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

  const fund = new ethers.Contract(contractAddress, contractABI, provider);

  const templeAddress = "0xaD8Cb6a8803AD33990c2C77c1C3414810096f41F"; // replace

  const balance = await fund.getTempleEthBalance(templeAddress);
  console.log(`Temple ${templeAddress} ETH Balance: ${ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
