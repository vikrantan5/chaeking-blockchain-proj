// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./TempleRegistry.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TempleFund {
    // Reference to the TempleRegistry contract
    TempleRegistry public templeRegistry;

    // Mappings for ETH and ERC20 token balances
    mapping(address => uint256) public ethFunds; // temple => amount
    mapping(address => mapping(address => uint256)) public tokenFunds; // token => temple => amount

    // Events
    event EthDonationReceived(address indexed donor, address indexed temple, uint256 amount);
    event TokenDonationReceived(address indexed donor, address indexed token, address indexed temple, uint256 amount);
    event EthFundsWithdrawn(address indexed temple, uint256 amount);
    event TokenFundsWithdrawn(address indexed token, address indexed temple, uint256 amount);

    // Constructor
    constructor(address _templeRegistry) {
        require(_templeRegistry != address(0), "Invalid registry address");
        templeRegistry = TempleRegistry(_templeRegistry);
    }

    // ==============================
    //         ETH/MATIC Flow
    // ==============================

    function donateEthToTemple(address temple) external payable {
        require(msg.value > 0, "Donation amount must be greater than zero");
        require(templeRegistry.isRegistered(temple), "Temple is not registered");

        ethFunds[temple] += msg.value;
        emit EthDonationReceived(msg.sender, temple, msg.value);
    }

    function withdrawEth(uint256 amount) external {
        require(templeRegistry.isRegistered(msg.sender), "Only registered temple can withdraw");
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(ethFunds[msg.sender] >= amount, "Insufficient ETH funds");

        ethFunds[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);

        emit EthFundsWithdrawn(msg.sender, amount);
    }

    function getTempleEthBalance(address temple) external view returns (uint256) {
        return ethFunds[temple];
    }

    // ==============================
    //         Token Flow
    // ==============================

    function donateTokenToTemple(address token, address temple, uint256 amount) external {
        require(amount > 0, "Donation amount must be greater than zero");
        require(templeRegistry.isRegistered(temple), "Temple is not registered");

        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");

        tokenFunds[token][temple] += amount;
        emit TokenDonationReceived(msg.sender, token, temple, amount);
    }

    function withdrawTokenFunds(address token, uint256 amount) external {
        require(templeRegistry.isRegistered(msg.sender), "Only registered temple can withdraw");
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(tokenFunds[token][msg.sender] >= amount, "Insufficient token funds");

        tokenFunds[token][msg.sender] -= amount;

        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Token transfer failed");

        emit TokenFundsWithdrawn(token, msg.sender, amount);
    }

    function getTempleTokenBalance(address token, address temple) external view returns (uint256) {
        return tokenFunds[token][temple];
    }
}
