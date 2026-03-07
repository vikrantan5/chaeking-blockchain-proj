// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TempleRegistry {
    address public superAdmin;

    mapping(address => bool) private registeredTemples;
    address[] private templeList;

    event TempleRegistered(address indexed temple);
    event TempleRemoved(address indexed temple);
    event SuperAdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Not super admin");
        _;
    }

    constructor() {
        superAdmin = msg.sender;
    }

    function registerTemple(address _templeWallet) external onlySuperAdmin {
        require(!registeredTemples[_templeWallet], "Already registered");
        registeredTemples[_templeWallet] = true;
        templeList.push(_templeWallet);
        emit TempleRegistered(_templeWallet);
    }

    function removeTemple(address _templeWallet) external onlySuperAdmin {
        require(registeredTemples[_templeWallet], "Not registered");

        registeredTemples[_templeWallet] = false;

        // Remove from templeList (gas cost: linear)
        for (uint i = 0; i < templeList.length; i++) {
            if (templeList[i] == _templeWallet) {
                templeList[i] = templeList[templeList.length - 1];
                templeList.pop();
                break;
            }
        }

        emit TempleRemoved(_templeWallet);
    }

    function isRegistered(address _templeWallet) public view returns (bool) {
        return registeredTemples[_templeWallet];
    }

    function getAllTemples() external view returns (address[] memory) {
        return templeList;
    }

    function transferSuperAdmin(address newAdmin) external onlySuperAdmin {
        require(newAdmin != address(0), "Invalid address");
        emit SuperAdminTransferred(superAdmin, newAdmin);
        superAdmin = newAdmin;
    }
}
