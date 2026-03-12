require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    amoy: {
      url: process.env.AMOY_RPC_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 80002,
        gasPrice: 30000000000, // 30 gwei
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY,
    },
  },
};