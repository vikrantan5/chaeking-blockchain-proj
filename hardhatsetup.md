"# Blockchain NGO Donation Platform - Hardhat Setup Guide

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension installed
- MongoDB running locally or cloud instance

---

## 📦 Step 1: Install Dependencies

### Backend
```bash
cd /app/backend
npm install
```

### Frontend
```bash
cd /app/frontend
yarn install
```

---

## ⛓️ Step 2: Start Hardhat Local Blockchain

### Start Hardhat Node (Keep this running in terminal)
```bash
cd /app/backend
npx hardhat node
```

**Important:** Keep this terminal open! Hardhat provides 20 test accounts with 10,000 ETH each.

**Output you'll see:**
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d73c4e8d0fd
...
```

---

## 📝 Step 3: Deploy Smart Contracts

### In a NEW terminal, deploy contracts to local network:
```bash
cd /app/backend
npx hardhat run scripts/deployLocalhost.cjs --network localhost
```

**You'll see:**
```
✅ NGORegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ NGOFund deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**Contract addresses are automatically saved** to:
- `/app/backend/scripts/deployedAddresses-localhost.json`
- Backend `.env` file
- Frontend `.env` file

---

## 🦊 Step 4: Configure MetaMask

### Add Hardhat Local Network to MetaMask

1. Open MetaMask
2. Click network dropdown → \"Add Network\" → \"Add a network manually\"
3. Enter these details:

```
Network Name: Hardhat Localhost
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

4. Click \"Save\"

### Import Test Accounts

Import accounts from Hardhat to MetaMask using private keys:

**Super Admin Account (for admin operations):**
```
Account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d73c4e8d0fd
```

**User Account (for donations):**
```
Account: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**NGO Account:**
```
Account: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

**How to Import:**
1. Click MetaMask account icon → \"Import Account\"
2. Paste the private key
3. Click \"Import\"

---

## 🗄️ Step 5: Set Up MongoDB

### If using local MongoDB:
```bash
sudo service mongodb start
# or
sudo mongod --dbpath /data/db
```

### MongoDB URI is already configured in `/app/backend/.env`:
```
MONGODB_URI=m
```

---

## 🖥️ Step 6: Start Backend Server

```bash
cd /app/backend/src
node index.js
```

**You should see:**
```
MONGODB CONNECTED !! DB HOST: ...
SERVER IS RUNNING ON PORT : 5050
WebSocket server is running on port 5050
```

---

## 🌐 Step 7: Start Frontend

```bash
cd /app/frontend
yarn dev
```

**Frontend will start on:** `http://localhost:3000` or `http://localhost:3001`

---

## 🎯 Step 8: Initialize Super Admin

### Create super admin account:
```bash
curl -X POST http://localhost:5050/api/v1/superAdmin/seed-script
```

**Super Admin Credentials (from .env):**
```
Email: vikrantsinghan5@gmail.com
Password: SecurePassword123!
Wallet: 0x70dCd8E3E83EF64B70C9DAFC360572f266682f6F
```

---

## ✅ Testing the Platform

### 1. Login as Super Admin
- Go to: `http://localhost:3000/superadminlogin`
- Use super admin credentials
- You'll be redirected to dashboard

### 2. User Registration
- Go to: `http://localhost:3000/signup`
- Register a new user account
- Connect MetaMask wallet

### 3. NGO Registration
- Login as user
- Go to NGO registration
- Fill in NGO details and upload documents
- Verify OTP sent to email

### 4. Super Admin Approves NGO
- Login as super admin
- Go to \"Pending NGOs\" section
- Review and approve NGO applications
- **NGO admin will receive email notification**

### 5. NGO Admin Access
- NGO admin can now login with their credentials
- Access NGO dashboard to:
  - View donation history
  - Create fundraising cases
  - Withdraw funds

### 6. Make Donations

**Donate to NGO:**
1. Browse NGOs list
2. Click on NGO
3. Click \"Donate Now\"
4. MetaMask will popup for transaction
5. Confirm transaction
6. Donation recorded on blockchain + database

**Donate to Fundraising Case:**
1. Browse active cases
2. Select a case
3. Enter donation amount
4. Confirm MetaMask transaction

**Donate Products:**
1. Go to Products page
2. Select a product
3. Choose quantity
4. Pay via MetaMask
5. Product donation recorded

---

## 🔧 Important Notes

### ⚠️ Restart Hardhat Node
If you restart Hardhat node, you MUST:
1. Stop Hardhat node (Ctrl+C)
2. Restart it: `npx hardhat node`
3. Re-deploy contracts: `npx hardhat run scripts/deployLocalhost.cjs --network localhost`
4. Restart backend server

**Why?** Hardhat resets blockchain state on restart.

### 💾 Contract Addresses
- Contract addresses are saved in `/app/backend/scripts/deployedAddresses-localhost.json`
- Backend and frontend `.env` files are automatically updated

### 🔑 Private Keys Security
**NEVER share or commit private keys to production!**
- These Hardhat keys are PUBLIC and for testing ONLY
- Any funds sent to these addresses on real networks will be LOST

---

## 📁 Project Structure

```
/app/
├── backend/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── NGORegistry.sol
│   │   └── NGOFund.sol
│   ├── scripts/            # Deployment scripts
│   │   └── deployLocalhost.cjs
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # Express routes
│   │   └── index.js        # Server entry point
│   └── hardhat.config.cjs  # Hardhat configuration
├── frontend/
│   ├── app/
│   │   ├── components/     # React components
│   │   ├── superadmin/     # Super admin pages
│   │   ├── ngoadmin/       # NGO admin pages
│   │   └── utils/          # Utility functions
│   └── package.json
```

---

## 🐛 Troubleshooting

### Issue: MetaMask shows \"Could not fetch chain ID\"
**Solution:** Make sure Hardhat node is running on port 8545

### Issue: Contract deployment fails
**Solution:** 
1. Stop Hardhat node
2. Delete `/app/backend/cache` and `/app/backend/artifacts` folders
3. Restart Hardhat and redeploy

### Issue: Frontend can't connect to backend
**Solution:** Check backend is running on port 5050: `http://localhost:5050`

### Issue: MongoDB connection failed
**Solution:** Verify MongoDB is running: `sudo service mongodb status`

### Issue: Transactions failing
**Solution:** 
1. Make sure you're on Hardhat Localhost network in MetaMask
2. Check you have test ETH (should show ~10000 ETH)
3. Ensure backend server is running

---

## 📞 Support

For issues or questions:
1. Check error logs: `/tmp/backend.log`, `/tmp/frontend.log`
2. Verify all services are running
3. Check contract deployment status

---

## ✨ Features Implemented

✅ NGO registration with OTP verification
✅ NGO approval system with email notifications
✅ Direct NGO donations via blockchain
✅ Case-specific donations
✅ Product donation system
✅ Hardhat local blockchain integration
✅ MetaMask wallet connectivity
✅ Transaction transparency
✅ Super admin dashboard
✅ NGO admin dashboard
✅ Real-time donation tracking

---

## 🔐 Security Notes

1. **Test Environment Only:** This setup is for development and testing
2. **Never use test private keys in production**
3. **Change all default passwords in production**
4. **Use environment variables for sensitive data**
5. **Enable proper authentication in production**

---

**Happy Testing! 🎉**
"