# ZKLease — Zero-Knowledge Proof for USDC Balance on Stellar

> **Hackathon Project** | Privacy-preserving USDC balance verification on Stellar using zero-knowledge proofs on Soroban.

ZKLease lets users prove they hold at least a minimum USDC balance **without revealing their actual balance**. This enables privacy-preserving access control for rental agreements, gated communities, and financial whitelisting.

## Architecture Overview

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Next.js UI   │────▶│  Express API     │────▶│  Soroban Contract│
│  (Vercel)     │◀────│  (Railway)        │◀────│  (Stellar)       │
└──────────────┘     └────────┬─────────┘     └──────────────────┘
                              │
                     ┌────────▼─────────┐
                     │  Noir ZK Circuit │
                     │  (balance proof) │
                     └──────────────────┘
```

- **Web App** — Next.js dashboard with Stellar wallet integration (Freighter)
- **API** — Express server storing verification records, proxying on-chain data
- **Circuit** — Noir ZK-SNARK circuit proving `balance ≥ threshold` without revealing balance
- **Contract** — Soroban smart contract that verifies ZK proofs and issues on-chain credentials

## Features

- **Privacy-preserving verification** — Prove USDC balance ≥ threshold without exposing actual balance
- **Soroban smart contract** — On-chain proof verification and credential issuance
- **Noir ZK circuit** — Custom zero-knowledge circuit for range proof
- **Stellar wallet integration** — Connect with Freighter wallet
- **Verification history** — Track all proof submissions and credentials
- **REST API** — JSON API for credential management and verification
- **Modern UI** — Next.js 15 with shadcn/ui components, dark mode, responsive design

## Tech Stack

| Layer        | Technology                                |
| ------------ | ----------------------------------------- |
| Frontend     | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Backend      | Express.js, TypeScript                    |
| Blockchain   | Stellar / Soroban (Rust smart contracts)  |
| ZK Circuits  | Noir (Barretenberg backend)               |
| Wallet       | Freighter (Stellar Wallet Kit)            |
| Deployment   | Vercel (web), Railway (API)               |
| Monorepo     | Turbo, npm workspaces                     |

## Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **Rust** (for Soroban contracts) — install via [rustup](https://rustup.rs)
- **Noir** (for ZK circuits) — install via [noirup](https://noir-lang.org/docs/getting_started/installation/)
- **Freighter wallet** browser extension — [get it here](https://freighter.app)
- **Stellar account** funded on Testnet — use [Stellar Lab](https://lab.stellar.org/account/create)

## Quick Start

```bash
# 1. Clone and enter the project
git clone <repo-url> zklease
cd zklease

# 2. Full setup (deps, circuits, contracts, apps)
chmod +x scripts/setup.sh && ./scripts/setup.sh

# 3. Start development servers
npm run dev
```

The web app runs on **http://localhost:3000** and the API on **http://localhost:4000**.

### Step-by-step

```bash
# Install dependencies
npm install

# Set up ZK circuits (requires nargo)
cd circuits/noir && nargo compile && cd ../..

# Build Soroban contract (requires Rust + wasm32 target)
cd contracts/zklease && cargo build --release --target wasm32-unknown-unknown && cd ../..

# Build all apps
npm run build

# Seed sample data
npx tsx scripts/seed.ts

# Start development
npm run dev
```

## Project Structure

```
zklease/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/          # Next.js App Router pages
│   │   │   ├── components/   # UI components (shadcn/ui)
│   │   │   ├── hooks/        # React hooks (wallet, proof)
│   │   │   └── lib/          # API client, Stellar SDK utils
│   │   ├── vercel.json       # Vercel deployment config
│   │   └── next.config.js
│   └── api/                  # Express backend
│       ├── src/
│       │   ├── routes/       # REST endpoints
│       │   ├── services/     # Storage, Stellar event parsing
│       │   └── types/        # TypeScript interfaces
│       ├── railway.json      # Railway deployment config
│       └── Dockerfile*       # Docker image for API
├── circuits/
│   └── noir/                 # ZK circuit (Noir lang)
│       ├── Nargo.toml
│       └── src/main.nr       # balance ≥ threshold proof
├── contracts/
│   └── zklease/              # Soroban smart contract (Rust)
│       └── src/
├── scripts/
│   ├── setup.sh              # Full project setup
│   ├── deploy-contracts.sh   # Soroban contract deployment
│   └── seed.ts               # Test data seeder
├── docs/
│   ├── architecture.md       # System architecture
│   ├── submission.md         # Hackathon submission guide
│   └── walkthrough.md        # Demo walkthrough
├── Dockerfile                # Root Dockerfile (API)
├── .env.example              # Environment variables
├── package.json              # Monorepo root
└── turbo.json                # Turbo pipeline config
```

## API Documentation

### Health

```
GET /api/health
```

Response: `{ "status": "ok", "uptime": 123, "timestamp": 1700000000000 }`

### Stats

```
GET /api/stats
```

Response: `{ "totalVerifications": 42, "uniqueAddresses": 10, "lastVerification": 1700000000000 }`

### Verification

**Create a verification record**

```
POST /api/verification
```

Body:
```json
{
  "owner": "G...",
  "threshold": "100",
  "txHash": "abc...",
  "network": "TESTNET"
}
```

**Get verifications by address**

```
GET /api/verification/:address
```

### Credentials

**Get credential status for an address**

```
GET /api/credential/:address
```

Response: `{ "address": "g...", "verified": true, "threshold": "100", "txHashes": [...], "lastVerified": 1700000000000 }`

## Smart Contract Docs

### ZKLease Contract (Soroban)

The Soroban smart contract handles on-chain proof verification and credential issuance.

**Functions:**

| Function          | Description                                |
| ----------------- | ------------------------------------------ |
| `initialize`      | Set contract admin                         |
| `verify_balance`  | Submit a ZK proof for balance verification |
| `get_credential`  | Retrieve credential for an address         |
| `set_threshold`   | Admin: update minimum balance threshold    |

### ZK Circuit (Noir)

The Noir circuit (`circuits/noir/src/main.nr`) implements:

- **Public inputs:** `threshold`, `user_address`
- **Private input:** `balance`
- **Constraint:** `assert(threshold <= balance)`

When a user generates a proof, they prove their `balance` is at least `threshold` without revealing `balance`.

## Deployment

### 1. Smart Contract

```bash
npm run deploy:contracts
```

This builds the Soroban contract, deploys it to testnet, and saves the contract ID.

### 2. API (Railway)

```bash
cd apps/api
railway up
```

Set the `CONTRACT_ID` and `STELLAR_RPC_URL` environment variables in the Railway dashboard.

### 3. Web App (Vercel)

```bash
cd apps/web
vercel --prod
```

Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CONTRACT_ID`, and other env vars in the Vercel dashboard.

## Testing

```bash
# Run all tests
npm test

# API tests only
cd apps/api && npm test

# Lint
npm run lint
```

## Hackathon Submission Guide

See [docs/submission.md](docs/submission.md) for the full submission checklist, video requirements, and judging criteria preparation.

---

## Team

| Role                | Name              |
| ------------------- | ----------------- |
| Smart Contracts     | _Your Name Here_  |
| ZK Circuits         | _Your Name Here_  |
| Frontend            | _Your Name Here_  |
| Backend / API       | _Your Name Here_  |
| UI/UX Design        | _Your Name Here_  |

---

Built with ❤️ for the Stellar Soroban & ZK Hackathon.
