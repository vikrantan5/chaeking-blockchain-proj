// Contract Configuration for Blockchain Integration
export const CONTRACTS = {
  NGO_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_NGO_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  NGO_FUND_ADDRESS: process.env.NEXT_PUBLIC_NGO_FUND_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337"),
};

// NGO Fund Contract ABI
export const NGO_FUND_ABI = [
  "function donateEthToNGO(address ngo) payable",
  "function donateToCase(bytes32 caseId, address ngo) payable",
  "function donateProduct(bytes32 productId, address ngo) payable",
  "function getNGOEthBalance(address ngo) view returns (uint256)",
  "function getCaseBalance(bytes32 caseId) view returns (uint256)",
  "function getProductDonationCount(bytes32 productId) view returns (uint256)",
  "event EthDonationReceived(address indexed donor, address indexed ngo, uint256 amount)",
  "event CaseDonationReceived(address indexed donor, bytes32 indexed caseId, address indexed ngo, uint256 amount)",
  "event ProductDonationReceived(address indexed donor, bytes32 indexed productId, address indexed ngo, uint256 amount)"
];

// NGO Registry Contract ABI
export const NGO_REGISTRY_ABI = [
  "function registerNGO(address _ngoWallet) external",
  "function removeNGO(address _ngoWallet) external",
  "function isRegistered(address _ngoWallet) public view returns (bool)",
  "function getAllNGOs() external view returns (address[] memory)",
  "event NGORegistered(address indexed ngo)",
  "event NGORemoved(address indexed ngo)"
];

// Utility function to convert ID to bytes32
export const toBytes32 = (value: string): string => {
  const { ethers } = require("ethers");
  return ethers.keccak256(ethers.toUtf8Bytes(value));
};

// Utility function to format ETH amount
export const formatEth = (value: string | number): string => {
  return parseFloat(value.toString()).toFixed(4);
};

// Utility function to parse ETH to Wei
export const parseEthToWei = (ethAmount: string): bigint => {
  const { ethers } = require("ethers");
  return ethers.parseEther(ethAmount);
};

// Utility function to format Wei to ETH
export const formatWeiToEth = (weiAmount: bigint | string): string => {
  const { ethers } = require("ethers");
  return ethers.formatEther(weiAmount);
};
