<div align="center">

# 🗳️ CipherBallot

### A Blockchain-Based Decentralized Voting Platform

*Secure. Transparent. Tamper-Resistant.*

Built by **Team Citadel** — Blockchain Vertical, **Web & Coding Club, NIT Patna**

[![Solidity](https://img.shields.io/badge/Solidity-Hardhat-363636?logo=solidity)](#)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-61DAFB?logo=react)](#)
[![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js)](#)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)](#)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [College Use Case](#-college-use-case)
- [System Architecture](#-system-architecture)
- [Application Flow](#-application-flow)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Team & Responsibilities](#-team--responsibilities)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🧩 About the Project

**CipherBallot** is a decentralized voting system that leverages blockchain technology to conduct elections that are secure, publicly auditable, and resistant to manipulation. Every vote is recorded immutably on-chain, ensuring that once a vote is cast, it cannot be altered, deleted, or duplicated.

The platform is designed to work at scale for institutional elections — with an initial deployment targeted at **college campus elections** (Student Council, Class Representatives, hostel wardens, and club coordinator elections).

## ❗ Problem Statement

Traditional voting systems — including many digital ones — often suffer from:

- Lack of transparency in vote counting
- Susceptibility to manipulation or double voting
- No independent way for voters to verify results

CipherBallot solves this by anchoring the voting process on the **Ethereum blockchain (Sepolia Testnet)**, guaranteeing that every eligible wallet can vote exactly once and every result can be independently verified on a public block explorer.

## 🎯 Project Objectives

- ✅ Build a secure, end-to-end online voting platform
- ✅ Prevent double voting through on-chain whitelisting
- ✅ Provide fully transparent, verifiable election results
- ✅ Enable decentralized, tamper-proof vote storage

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **MetaMask Wallet Login** | Voters and admins interact with the platform using their Ethereum wallet |
| 🗳️ **One Vote Per Wallet** | Smart contract logic strictly enforces a single vote per whitelisted address |
| ⛓️ **On-Chain Vote Storage** | Every vote is permanently and immutably recorded on the blockchain |
| 🛠️ **Admin Dashboard** | Create elections, manage candidates, control election phases |
| 📊 **Live Results Display** | Graphical, real-time display of election outcomes after voting closes |
| 🔎 **Public Auditability** | Anyone can verify vote counts directly on Sepolia Etherscan |

## 🎓 College Use Case

CipherBallot's general-purpose voting engine is adapted for a campus environment as follows:

- **Campus Elections** — Supports Student Council, Class Representative (CR), hostel warden, and club coordinator elections.
- **Student Wallet Linkage** — Students log in via college email SSO and connect their MetaMask wallet; the backend maps their roll number to their wallet address in MongoDB, ensuring only verified students can participate.
- **On-Chain Whitelisting** — Admins upload mapped student wallets and whitelist them on the smart contract before voting begins, preventing proxy and double voting.
- **Academic Eligibility Checks** — Candidate registration validates eligibility criteria (e.g., CGPA ≥ 7.5, no active backlogs) before adding a candidate to the on-chain registry.
- **Auditability & Trust** — Every student can independently verify vote counts on the Sepolia Etherscan explorer.

## 🏗 System Architecture

```
User <-> React Frontend <-> Ethers.js <-> MetaMask <-> Smart Contract <-> Sepolia Blockchain
```

The React frontend also communicates directly with a Node.js/Express backend, which persists off-chain data (student records, candidate profiles, election metadata) in MongoDB — keeping the chain lean while enabling rich UI features like candidate manifestos and photos.

## 🔄 Application Flow

### 👤 Student (Voter) Flow
1. **SSO Login** — Voter logs in with official college email credentials
2. **Wallet Connection** — Voter connects their MetaMask wallet
3. **Identity Mapping** — Backend links college ID to wallet address in MongoDB
4. **Voter Dashboard** — System verifies whitelist status and shows active elections
5. **Browse Candidates** — Voter reviews candidate profiles and manifestos
6. **Cast Vote** — Voter selects a candidate and triggers the vote transaction
7. **MetaMask Signing** — Voter approves the transaction in MetaMask
8. **Tx Confirmation** — System awaits transaction validation on Sepolia
9. **Success Screen** — Displays the transaction receipt and locks further voting
10. **View Results** — Voter can view the election outcome once voting closes

### 🛡️ Admin (Election Committee) Flow
1. **Admin Login** — Secure credential-based authentication
2. **Admin Dashboard** — View live election metrics and voter turnout stats
3. **Create Election** — Configure on-chain parameters (timestamps, rules)
4. **Register Candidates** — Add candidates who meet eligibility criteria
5. **Voter Whitelisting** — Upload student wallet addresses on-chain in batches
6. **Start Election** — Set the on-chain election phase to `Active`
7. **End Election** — Set the on-chain election phase to `Ended`
8. **Publish Results** — Smart contract aggregates vote counts and results go live on the voter dashboard

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js + Tailwind CSS (Vite) |
| **Blockchain** | Solidity, Hardhat, Ethers.js |
| **Backend** | Node.js + Express |
| **Database** | MongoDB (off-chain data) |
| **Wallet** | MetaMask |
| **Testing** | Hardhat/Chai (contracts), Cypress/Playwright (E2E), Postman (API) |
| **Deployment** | Vercel (frontend), Render/Railway (backend), Sepolia Testnet (contracts) |
| **CI/CD** | GitHub Actions |

## 📁 Repository Structure

This project follows a **Monorepo structure**, allowing all 6 team members to work in clearly segregated sub-projects and minimizing merge conflicts.

```
cipherballot/
├── .github/                    # CI/CD workflows (Member 5)
│   └── workflows/
│       ├── test.yml            # Automated Solidity & backend tests
│       └── deploy.yml          # Auto-deployment scripts
│
├── contracts/                  # Smart Contracts (Member 1)
│   ├── contracts/
│   │   ├── Voting.sol
│   │   └── ElectionManager.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── voting.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/                    # Node.js + Express + MongoDB (Member 2)
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React + Tailwind UI (Members 3 & 4)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Common/
│   │   │   ├── Voter/
│   │   │   └── Admin/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── tests/                      # Integration & E2E Testing (Member 5)
│   ├── e2e/voting_flow.spec.js
│   └── postman/backend_apis.json
│
├── docs/                       # Documentation (Member 6)
│   ├── architecture_diagram.png
│   ├── app_flowchart.png
│   ├── PRD.md
│   └── project_ppt.pdf
│
├── .gitignore
├── README.md
└── package.json                 # Root (npm workspaces, optional)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MetaMask browser extension
- MongoDB (local or Atlas)
- Sepolia Testnet ETH (via a faucet)

### Setup

```bash
# Clone the repository
git clone https://github.com/<org>/cipherballot.git
cd cipherballot

# Install smart contract dependencies
cd contracts && npm install

# Deploy contracts to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Install & run backend
cd ../backend && npm install
cp .env.example .env   # fill in MongoDB URI, etc.
npm run dev

# Install & run frontend
cd ../frontend && npm install
npm run dev
```

> ⚠️ Remember to update contract addresses and ABIs in the frontend after deployment.

## 🗺 Roadmap

- [ ] Smart contract deployment on Sepolia Testnet
- [ ] Student SSO + wallet mapping
- [ ] Admin whitelist upload flow
- [ ] End-to-end voting flow (cast → confirm → results)
- [ ] Public results verification via Etherscan
- [ ] Mainnet / L2 migration (future scope)

---

<div align="center">

Developed by **Team Citadel** — Web & Coding Club, NIT Patna

</div>