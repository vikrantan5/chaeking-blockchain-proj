import { ethers } from "ethers";

export const NGO_FUND_ABI = [
  "function donateEthToNGO(address ngo) payable",
  "function donateToCase(bytes32 caseId, address ngo) payable",
  "function donateProduct(bytes32 productId, address ngo) payable"
];

export const getNGOFundContract = (providerOrSigner: ethers.BrowserProvider | ethers.Signer) => {
  const address = process.env.NEXT_PUBLIC_NGO_FUND_ADDRESS;
  if (!address) {
    throw new Error("NGO fund contract address is missing. Set NEXT_PUBLIC_NGO_FUND_ADDRESS in frontend .env");
  }

  return new ethers.Contract(address, NGO_FUND_ABI, providerOrSigner);
};

export const toBytes32Id = (value: string) => ethers.keccak256(ethers.toUtf8Bytes(value));