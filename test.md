"# 🚀 Quick Start Guide - Testing Blockchain Payments

## ⚡ Fast Track Testing (5 Minutes)

### Prerequisites
- ✅ MetaMask installed
- ✅ Wallet with 0.1 test MATIC
- ✅ Polygon Amoy Testnet configured

---

## 🎯 Option 1: Test via Frontend (Easiest)

### Step 1: Login to Frontend
```
URL: http://localhost:3001/login
Email: donor@test.com
Password: Test@123
```

### Step 2: Go to Donation Page
```
Navigate to: /user/donate
```

### Step 3: Make Donation
1. Select temple: \"Shri Ram Mandir\"
2. Enter amount: 0.01 MATIC
3. Enter purpose: \"Test Donation\"
4. Click \"Donate\"
5. Confirm in MetaMask

### Step 4: Verify
- Check donation history in your dashboard
- View transaction on PolygonScan
- Verify database record

---

## 🎯 Option 2: Test via Command Line (Fastest)

### Step 1: Make Donation
```bash
cd /app/blockchain-project/Backend
node test_donation.js
```

### Step 2: Record in Database
```bash
# Login first
curl -X POST http://localhost:5050/api/v1/users/login \
  -H \"Content-Type: application/json\" \
  -d '{\"email\": \"donor@test.com\", \"password\": \"Test@123\"}' \
  | jq -r '.data.accessToken' > token.txt

# Record donation (use tx hash from step 1)
TOKEN=$(cat token.txt)
curl -X POST http://localhost:5050/api/v1/transactions/donate-to-temple \
  -H \"Content-Type: application/json\" \
  -H \"Authorization: Bearer $TOKEN\" \
  -d '{
    \"amount\": 0.01,
    \"txHash\": \"PASTE_TX_HASH_HERE\",
    \"gasPrice\": 30932022622,
    \"transactionFee\": 1159950848325000,
    \"purpose\": \"CLI Test Donation\",
    \"status\": \"confirmed\",
    \"templeWalletAddress\": \"0xaD8Cb6a8803AD33990c2C77c1C3414810096f41F\",
    \"cryptoType\": \"matic\"
  }'
```

### Step 3: Verify
```bash
curl http://localhost:5050/api/v1/transactions/my-donations \
  -H \"Authorization: Bearer $(cat token.txt)\" | jq
```

---

## 📱 MetaMask Configuration

### Add Polygon Amoy Testnet
```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency: MATIC
Explorer: https://amoy.polygonscan.com
```

### Import Wallet (if needed)
```
Private Key: 53c5cdcd3d8e5f5cc714586bec2acea9b2eb53bac6cd830d8d3a17b1fc9d779c
Address: 0x70dCd8E3E83EF64B70C9DAFC360572f266682f6F
```

---

## 🔍 Quick Verification Commands

### Check Temple Balance
```bash
cd /app/blockchain-project/Backend
node check_balance.js
```

### Check Services Status
```bash
sudo supervisorctl status
```

### View Backend Logs
```bash
tail -f /var/log/supervisor/blockchain-backend.out.log
```

### View Frontend Logs
```bash
tail -f /var/log/supervisor/blockchain-frontend.out.log
```

---

## 🎫 Test Accounts

### User Account (Donor)
```
Email: donor@test.com
Password: Test@123
Wallet: 0x70dCd8E3E83EF64B70C9DAFC360572f266682f6F
Balance: 0.1 MATIC
```

### SuperAdmin
```
Email: vikrantsinghan5@gmail.com
Password: SecurePassword123!
Wallet: 0x70dCd8E3E83EF64B70C9DAFC360572f266682f6F
```

### Test Temple
```
Name: Shri Ram Mandir
Location: Ayodhya, Uttar Pradesh
Wallet: 0x1f8be1869DEE8b8758fb1aB1a3b632D0a61eBE35
Balance: 12+ MATIC
Status: Active ✅
```

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:5050 |
| PolygonScan | https://amoy.polygonscan.com |
| MATIC Faucet | https://faucet.polygon.technology |
| TempleFund Contract | https://amoy.polygonscan.com/address/0xDF509A4886a9aEfd0116D04daB1CB42da2cD7D95 |
| Test Transaction | https://amoy.polygonscan.com/tx/0x9c405679c5c7caf8a5f2ba8838576459f32426608aa15e2aea1c1ea3f48c3797 |

---

## 🆘 Quick Troubleshooting

### Services not running?
```bash
sudo supervisorctl restart blockchain-backend blockchain-frontend
```

### Need more test MATIC?
```
Visit: https://faucet.polygon.technology/
Enter: 0x70dCd8E3E83EF64B70C9DAFC360572f266682f6F
Wait: 24 hours between requests
```

### MetaMask issues?
```
1. Switch to Polygon Amoy Testnet
2. Refresh page
3. Reconnect wallet
```

### Transaction failing?
```
1. Check MATIC balance (need > 0.002 MATIC)
2. Verify correct network (Amoy Testnet)
3. Check gas price (should auto-adjust)
```

---

## ✅ Success Indicators

✅ **Transaction Successful When:**
- MetaMask shows \"Confirmed\"
- Transaction hash appears
- PolygonScan shows transaction
- Database records donation
- Balance updates in contract

❌ **Transaction Failed When:**
- \"Insufficient funds\" error
- \"Gas estimation failed\" error
- Transaction hash not found
- Long pending time (>2 minutes)

---

## 📊 What to Expect

| Action | Expected Time | Cost |
|--------|--------------|------|
| Transaction broadcast | Instant | 0 |
| Transaction confirmation | 15-30 seconds | ~0.001 MATIC |
| Database recording | 1-2 seconds | 0 |
| UI update | Real-time | 0 |

---

## 🎓 Understanding the Flow

```
1. User clicks \"Donate\" 
   ↓
2. Frontend calls MetaMask
   ↓
3. User approves transaction
   ↓
4. Transaction sent to Polygon Amoy blockchain
   ↓
5. Smart contract processes donation
   ↓
6. Blockchain confirms (15-30s)
   ↓
7. Frontend gets transaction hash
   ↓
8. Backend records in MongoDB
   ↓
9. User sees confirmation ✅
```

---

## 🎉 Ready to Test!

**Everything is set up and working!**

Choose your testing method:
- 🖥️ Frontend UI (Recommended for full experience)
- ⚡ Command Line (Fastest for quick tests)

Both methods are fully functional and tested! 🚀

---

## 📝 Next Steps

After successful testing, you can:
1. Test temple withdrawal functionality
2. Generate donation reports
3. Test with multiple users
4. Explore admin dashboards
5. View real-time notifications

For detailed instructions, see: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
"