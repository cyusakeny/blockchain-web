# 🧾 AutoHash Asset Registry (Ethereum DApp)

This decentralized application (dApp) allows users to **register, view, and transfer digital assets** on the Ethereum blockchain.  
Each asset is automatically assigned a **unique hash ID**, ensuring authenticity, transparency, and traceability.  

The frontend is built with **Next.js (React)** and connected to an **Ethereum smart contract** written in Solidity using **ethers.js**.

---

## 🚀 Features

- ✅ Register new digital assets (auto-hashed IDs)
- ✅ Fetch and view all asset hashes owned by a wallet
- ✅ View detailed asset information by hash
- ✅ Transfer asset ownership between wallet addresses
- ✅ Real-time event feed (📊 logs of all blockchain activity)
- ✅ Automatic network detection (Sepolia)
- ✅ Live monitoring of contract events (`AssetRegistered`, `AssetTransferred`)

---

## 🧠 Smart Contract Overview

### Contract Name
`AutoHashAssetRegistry.sol`

### Main Functions
| Function | Description |
|-----------|-------------|
| `registerAsset(string name, uint256 cost)` | Registers a new asset and generates a unique hash |
| `transferAsset(bytes32 idHash, address newOwner)` | Transfers ownership of an asset |
| `getAsset(bytes32 idHash)` | Retrieves details of a specific asset |
| `getAssetsOf(address ownerAddr)` | Returns a list of asset hashes owned by an address |

### Events
| Event | Description |
|--------|-------------|
| `AssetRegistered(bytes32 idHash, address owner, string name, uint256 cost)` | Triggered when an asset is registered |
| `AssetTransferred(bytes32 idHash, address prevOwner, address newOwner)` | Triggered when ownership changes |

---

## 🧰 Software Environment & Tools

| Tool / Library | Version / Network | Description |
|-----------------|------------------|--------------|
| **Solidity** | `^0.8.19` | Smart contract programming language |
| **Ethereum Testnet** | `Sepolia (chainId: 11155111)` | Network for testing transactions |
| **Next.js** | `14+` | React framework for frontend |
| **ethers.js** | `6.15.0` | Library for blockchain interaction |
| **MetaMask** | Latest | Browser wallet for interacting with Ethereum |
| **Remix IDE** | Latest | Used for compiling and deploying the contract |


## ⚙️ Project Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/cyusakeny/blockchain-web.git
cd blockchain-web
 ```
### 2 install dependencies
```bash
npm install
```

### 3 Run project 
```bash
npm run dev
```
Before running the app, make sure you have MetaMask installed and connected to the Sepolia Test Network 
with a small amount of SepoliaETH for gas fees.

### 🧩 How to Use

- Connect MetaMask to Sepolia Test Network

- Register Asset — enter name and cost, confirm transaction

- Fetch My Asset Hashes — view all your asset IDs

- View Details — click 🔍 to see asset info (owner, cost, time)

- Transfer Ownership — enter asset hash + new owner address

- Watch the Event Feed update live with blockchain actions

### Known Issues / Limitations

- ⚙️ Event Duplication in Dev Mode
duplicated event logs to show live transactions happening on the network

- 🧾 Sepolia Network Dependency
The contract only works on Sepolia. Attempting to use it on another network will show a "Wrong Network" warning.

- 💰 Requires SepoliaETH
You need Sepolia test ETH for registering or transferring assets.
You can get it from the official faucet linked above.
[link](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- 🧹 Local Event Persistence
The event feed resets after page reload (use localStorage for persistent logs if needed).
