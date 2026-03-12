// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NGORegistry {
    address public superAdmin;

    mapping(address => bool) private registeredNGOs;
    address[] private ngoList;

    event NGORegistered(address indexed ngo);
    event NGORemoved(address indexed ngo);
    event SuperAdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Not super admin");
        _;
    }

    constructor() {
        superAdmin = msg.sender;
    }

    function registerNGO(address _ngoWallet) external onlySuperAdmin {
        require(!registeredNGOs[_ngoWallet], "Already registered");
        registeredNGOs[_ngoWallet] = true;
        ngoList.push(_ngoWallet);
        emit NGORegistered(_ngoWallet);
    }

    function removeNGO(address _ngoWallet) external onlySuperAdmin {
        require(registeredNGOs[_ngoWallet], "Not registered");

        registeredNGOs[_ngoWallet] = false;

        // Remove from ngoList (gas cost: linear)
        for (uint i = 0; i < ngoList.length; i++) {
            if (ngoList[i] == _ngoWallet) {
                ngoList[i] = ngoList[ngoList.length - 1];
                ngoList.pop();
                break;
            }
        }

        emit NGORemoved(_ngoWallet);
    }

    function isRegistered(address _ngoWallet) public view returns (bool) {
        return registeredNGOs[_ngoWallet];
    }

    function getAllNGOs() external view returns (address[] memory) {
        return ngoList;
    }

    function transferSuperAdmin(address newAdmin) external onlySuperAdmin {
        require(newAdmin != address(0), "Invalid address");
        emit SuperAdminTransferred(superAdmin, newAdmin);
        superAdmin = newAdmin;
    }
}
