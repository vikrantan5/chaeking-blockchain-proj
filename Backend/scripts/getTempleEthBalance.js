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

  const templeAddress = "0x1f8be1869DEE8b8758fb1aB1a3b632D0a61eBE35"; // replace

  const balance = await fund.getTempleEthBalance(templeAddress);
  console.log(`Temple ${templeAddress} ETH Balance: ${ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
