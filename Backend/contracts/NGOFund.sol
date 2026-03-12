// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./NGORegistry.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract NGOFund {
    // Reference to the NGORegistry contract
    NGORegistry public ngoRegistry;

    // Mappings for ETH and ERC20 token balances
    mapping(address => uint256) public ethFunds; // ngo => amount
    mapping(address => mapping(address => uint256)) public tokenFunds; // token => ngo => amount
    
    // Case-specific funds
    mapping(bytes32 => uint256) public caseFunds; // caseId => amount
    mapping(bytes32 => address) public caseToNGO; // caseId => ngo address
    mapping(bytes32 => bool) public caseFundsReleased; // caseId => released status

    // Product donation tracking
    mapping(bytes32 => uint256) public productDonationCount; // productId => count

    // Events
    event EthDonationReceived(address indexed donor, address indexed ngo, uint256 amount);
    event TokenDonationReceived(address indexed donor, address indexed token, address indexed ngo, uint256 amount);
    event CaseDonationReceived(address indexed donor, bytes32 indexed caseId, address indexed ngo, uint256 amount);
    event ProductDonationReceived(address indexed donor, bytes32 indexed productId, address indexed ngo, uint256 amount);
    event EthFundsWithdrawn(address indexed ngo, uint256 amount);
    event TokenFundsWithdrawn(address indexed token, address indexed ngo, uint256 amount);
    event CaseFundsReleased(bytes32 indexed caseId, address indexed ngo, uint256 amount);

    // Modifier to check super admin
    modifier onlySuperAdmin() {
        require(msg.sender == ngoRegistry.superAdmin(), "Not super admin");
        _;
    }

    // Constructor
    constructor(address _ngoRegistry) {
        require(_ngoRegistry != address(0), "Invalid registry address");
        ngoRegistry = NGORegistry(_ngoRegistry);
    }

    // ==============================
    //         ETH/MATIC Flow - Direct NGO Donation
    // ==============================

    function donateEthToNGO(address ngo) external payable {
        require(msg.value > 0, "Donation amount must be greater than zero");
        require(ngoRegistry.isRegistered(ngo), "NGO is not registered");

        ethFunds[ngo] += msg.value;
        emit EthDonationReceived(msg.sender, ngo, msg.value);
    }

    // ==============================
    //         Case-Specific Donation
    // ==============================

    function donateToCase(bytes32 caseId, address ngo) external payable {
        require(msg.value > 0, "Donation amount must be greater than zero");
        require(ngoRegistry.isRegistered(ngo), "NGO is not registered");

        // Store case funds separately
        caseFunds[caseId] += msg.value;
        caseToNGO[caseId] = ngo;

        emit CaseDonationReceived(msg.sender, caseId, ngo, msg.value);
    }

    // Release case funds to NGO (only super admin)
    function releaseCaseFunds(bytes32 caseId) external onlySuperAdmin {
        require(caseFunds[caseId] > 0, "No funds to release");
        require(!caseFundsReleased[caseId], "Funds already released");

        address ngo = caseToNGO[caseId];
        require(ngo != address(0), "Invalid case");

        uint256 amount = caseFunds[caseId];
        caseFundsReleased[caseId] = true;
        
        // Transfer to NGO's general fund
        ethFunds[ngo] += amount;

        emit CaseFundsReleased(caseId, ngo, amount);
    }

    // Get case balance
    function getCaseBalance(bytes32 caseId) external view returns (uint256) {
        return caseFunds[caseId];
    }

    // Check if case funds released
    function isCaseFundsReleased(bytes32 caseId) external view returns (bool) {
        return caseFundsReleased[caseId];
    }

    // ==============================
    //         Product Donation
    // ==============================

    function donateProduct(bytes32 productId, address ngo) external payable {
        require(msg.value > 0, "Product price must be greater than zero");
        require(ngoRegistry.isRegistered(ngo), "NGO is not registered");

        // Add to NGO's funds
        ethFunds[ngo] += msg.value;
        productDonationCount[productId]++;

        emit ProductDonationReceived(msg.sender, productId, ngo, msg.value);
    }

    // Get product donation count
    function getProductDonationCount(bytes32 productId) external view returns (uint256) {
        return productDonationCount[productId];
    }

    // ==============================
    //         Withdrawal Functions
    // ==============================

    function withdrawEth(uint256 amount) external {
        require(ngoRegistry.isRegistered(msg.sender), "Only registered NGO can withdraw");
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(ethFunds[msg.sender] >= amount, "Insufficient ETH funds");

        ethFunds[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);

        emit EthFundsWithdrawn(msg.sender, amount);
    }

    function getNGOEthBalance(address ngo) external view returns (uint256) {
        return ethFunds[ngo];
    }

    // ==============================
    //         Token Flow
    // ==============================

    function donateTokenToNGO(address token, address ngo, uint256 amount) external {
        require(amount > 0, "Donation amount must be greater than zero");
        require(ngoRegistry.isRegistered(ngo), "NGO is not registered");

        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");

        tokenFunds[token][ngo] += amount;
        emit TokenDonationReceived(msg.sender, token, ngo, amount);
    }

    function withdrawTokenFunds(address token, uint256 amount) external {
        require(ngoRegistry.isRegistered(msg.sender), "Only registered NGO can withdraw");
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(tokenFunds[token][msg.sender] >= amount, "Insufficient token funds");

        tokenFunds[token][msg.sender] -= amount;

        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Token transfer failed");

        emit TokenFundsWithdrawn(token, msg.sender, amount);
    }

    function getNGOTokenBalance(address token, address ngo) external view returns (uint256) {
        return tokenFunds[token][ngo];
    }
}
