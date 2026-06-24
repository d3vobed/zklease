# ZKLease — Hackathon Submission Guide

> **Track:** Stellar Soroban & ZK Hackathon

## Submission Checklist

### Required Deliverables

- [ ] **GitHub repository** with complete source code
- [ ] **README.md** with project description, setup instructions, and architecture
- [ ] **Live demo** (Vercel + Railway deployment)
- [ ] **Demo video** (3 min max — walk through the app)
- [ ] **Smart contract** deployed on Stellar Testnet
- [ ] **ZK circuit** compiled and functional
- [ ] **API** running and accessible

### Optional but Recommended

- [ ] Pitch deck / presentation slides
- [ ] Technical blog post about the ZK circuit design
- [ ] Open-source license (MIT recommended)

---

## Demo Video Script (2-3 minutes)

### 1. Introduction (0:00 - 0:15)

> "Hi, we're Team [Name]. We built ZKLease — a zero-knowledge proof system that lets users prove their USDC balance on Stellar without revealing how much they actually have."

### 2. The Problem (0:15 - 0:35)

> "Many rental platforms, gated communities, and financial services need to verify users have a minimum balance. Currently, this means sharing bank statements or full wallet balances — a massive privacy violation. ZKLease solves this with zero-knowledge proofs."

### 3. Architecture Overview (0:35 - 1:00)

> "Here's how it works. Our Noir ZK circuit allows a user to prove their balance is above a threshold without revealing the actual balance. The proof is verified on Stellar via a Soroban smart contract. The web app — built with Next.js — connects to Freighter wallet and generates these proofs."

### 4. Live Demo (1:00 - 2:15)

> *Show screen recording of:*

1. **Connect wallet** — Click "Connect Wallet" → Freighter popup → sign in
2. **View dashboard** — Balance overview, recent activity
3. **Generate proof** — Enter threshold (e.g., "500 USDC"), click "Generate Proof"
4. **Proof progress** — Show the progress steps (generating, submitting, verifying)
5. **Success** — Show the credential/transaction confirmation
6. **Verify credential** — Show the credential history page

### 5. Technical Highlights (2:15 - 2:45)

> "Key technical achievements:"
>
> - **Noir circuit** implements range proof with Barretenberg proving system
> - **Soroban contract** handles on-chain verification
> - **Full-stack integration** from Freighter wallet to Stellar testnet
> - **Privacy by design** — never expose the actual balance

### 6. Closing (2:45 - 3:00)

> "ZKLease opens up privacy-preserving access control for the Stellar ecosystem. Check out our repo for full documentation. Thanks for watching!"

---

## Judging Criteria Preparation

### 1. Technical Complexity (30%)

**What to highlight:**
- ZK circuit design in Noir (custom constraint system)
- Soroban smart contract integration
- End-to-end proof generation and verification pipeline
- Stellar wallet integration with Freighter

**Evidence:**
- Show the Noir circuit code (`circuits/noir/src/main.nr`)
- Show the Soroban contract functions
- Demo the full flow from wallet connect to credential issuance

### 2. Practicality & Utility (25%)

**What to highlight:**
- Real-world use case: rental deposits, loan qualification, gated access
- Privacy-preserving alternative to current balance-checking methods
- Low barrier to entry (Freighter wallet, familiar web interface)

**Evidence:**
- Show a real rental/access control scenario
- Compare with existing solutions (manual bank statements, full wallet access)

### 3. User Experience (20%)

**What to highlight:**
- Clean, modern UI with shadcn/ui components
- Smooth proof generation flow with progress indicators
- Dark mode support
- Responsive design (mobile + desktop)

**Evidence:**
- Screen recording of the full UX flow
- Show loading states, error handling, success animations

### 4. Creativity & Innovation (15%)

**What to highlight:**
- Combining Noir ZK with Soroban (novel integration)
- Privacy-first approach to a common DeFi problem
- Proof-of-concept for a new use case on Stellar

### 5. Quality of Code & Documentation (10%)

**What to highlight:**
- Clean monorepo with Turbo
- TypeScript throughout
- Comprehensive README and architecture docs
- Well-structured API with proper error handling

---

## Deployment Checklist

### Prerequisites

- [ ] Freighter wallet installed
- [ ] Stellar Testnet account funded (get XLM from [Friendbot](https://friendbot.stellar.org))
- [ ] Vercel account linked
- [ ] Railway account linked
- [ ] Domain (optional) configured

### Smart Contract Deployment

```bash
# Deploy to testnet
npm run deploy:contracts

# Verify on explorer
open "https://stellar.expert/explorer/testnet/contract/$(cat .contract-id)"
```

### API Deployment (Railway)

```bash
cd apps/api
railway login
railway up

# Set environment variables in Railway dashboard:
#   CONTRACT_ID, STELLAR_RPC_URL, STELLAR_NETWORK_PASSPHRASE
```

### Web Deployment (Vercel)

```bash
cd apps/web
vercel login
vercel --prod

# Set environment variables in Vercel dashboard:
#   NEXT_PUBLIC_API_URL, NEXT_PUBLIC_CONTRACT_ID, etc.
```

---

## Resources

- **Stellar Soroban docs:** https://soroban.stellar.org/docs
- **Noir lang docs:** https://noir-lang.org/docs
- **Freighter wallet:** https://freighter.app
- **Stellar Lab (testnet funding):** https://lab.stellar.org/account/create
- **Stellar Expert explorer:** https://stellar.expert/explorer/testnet

---

## Project Links

| Asset              | URL                                    |
| ------------------ | -------------------------------------- |
| GitHub Repo        | _[your repo URL]_                      |
| Live Web App       | _[vercel URL]_                         |
| API Endpoint       | _[railway URL]_                        |
| Demo Video         | _[YouTube/Loom URL]_                   |
| Contract Explorer  | _[stellar.expert link]_                |
| Pitch Deck         | _[Google Slides / Canva link]_         |

---

Good luck! 🚀
