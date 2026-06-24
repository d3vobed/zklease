# ZKLease — Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Next.js App (Vercel)                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │   │
│  │  │ Dashboard│  │  Verify  │  │  Wallet  │  │  Credential    │  │   │
│  │  │  Page    │  │  Page    │  │  Connect │  │  History       │  │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │   │
│  │       │              │             │                │            │   │
│  │  ┌────▼──────────────▼─────────────▼────────────────▼────────┐   │   │
│  │  │              React Hooks Layer                             │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │   │   │
│  │  │  │ useWallet() │  │ useProof()  │  │ Stellar Wallet Kit│  │   │   │
│  │  │  └──────┬──────┘  └──────┬──────┘  └────────┬──────────┘  │   │   │
│  │  └─────────┼────────────────┼───────────────────┼─────────────┘   │   │
│  └────────────┼────────────────┼───────────────────┼─────────────────┘   │
│               │                │                   │                      │
└───────────────┼────────────────┼───────────────────┼──────────────────────┘
                │                │                   │
         ┌──────▼────────────────▼───────────────────▼──────┐
         │  HTTP (fetch)    │  RPC (Soroban)   │  Freighter │
         │                  │                    │  Extension │
         └──────┬────────────────────┬───────────────────────┘
                │                    │
         ┌──────▼──────┐      ┌──────▼──────────────────────┐
         │  Express API │      │  Stellar Network (Testnet) │
         │  (Railway)   │      │                            │
         │              │      │  ┌──────────────────────┐  │
         │  ┌────────┐  │      │  │  Soroban Contract   │  │
         │  │ Routes │  │      │  │  (ZKLease)          │  │
         │  ├────────┤  │      │  │  - verify_balance   │  │
         │  │Storage │  │      │  │  - get_credential   │  │
         │  │(JSON)  │  │      │  └──────────────────────┘  │
         │  └────────┘  │      │                            │
         │              │      │  ┌──────────────────────┐  │
         │  ┌────────┐  │      │  │  USDC Token Contract │  │
         │  │Stellar │  │      │  └──────────────────────┘  │
         │  │Service │  │      └────────────────────────────┘
         │  └────────┘  │
         └──────┬───────┘
                │
         ┌──────▼──────────────────────────────────────────┐
         │              Noir ZK Circuit                    │
         │  ┌──────────────────────────────────────────┐   │
         │  │  Public Inputs: threshold, address       │   │
         │  │  Private Input: balance                  │   │
         │  │  Constraint:  threshold ≤ balance        │   │
         │  │  Output: ZK-SNARK proof                  │   │
         │  └──────────────────────────────────────────┘   │
         └─────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. Next.js Frontend (`apps/web`)

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS with shadcn/ui component library
- **Wallet Integration:** `@creit.tech/stellar-wallets-kit` (Freighter)
- **State Management:** React hooks (`useWallet`, `useProof`)
- **Pages:**
  - `/dashboard` — Main dashboard with balance overview and recent verifications
  - `/verify` — Proof generation and submission flow
  - (Additional pages: credential history, settings)

### 2. Express API (`apps/api`)

- **Framework:** Express.js with TypeScript
- **Endpoints:**
  - `GET /api/health` — Health check
  - `GET /api/stats` — Platform statistics
  - `POST /api/verification` — Create verification record
  - `GET /api/verification/:address` — Get verifications by address
  - `GET /api/credential/:address` — Get credential status
- **Storage:** Simple JSON file storage (`data/db.json`)
- **Stellar Integration:** SorobanRPC client for event parsing

### 3. Soroban Smart Contract (`contracts/zklease`)

- **Language:** Rust (Soroban SDK)
- **Target:** Stellar Testnet
- **Functions:**
  - `initialize(admin)` — Set contract administrator
  - `verify_balance(proof, threshold, address)` — Verify ZK proof and issue credential
  - `get_credential(address)` — Query credential status
  - `set_threshold(new_threshold)` — Admin function to update minimum threshold

### 4. Noir ZK Circuit (`circuits/noir`)

- **Language:** Noir (Barretenberg backend)
- **Prover:** `prove` generates a ZK-SNARK proof
- **Verifier:** `verify` checks proof validity
- **Proving system:** UltraHonk (Barretenberg)

## Data Flow

### Balance Verification Flow

```
1. User connects Freighter wallet
       │
2. User enters threshold amount (e.g., "I have ≥ 500 USDC")
       │
3. Browser generates ZK proof using Noir circuit:
   - Private input: actual USDC balance (from Stellar account)
   - Public inputs: threshold, user's Stellar address
   - Output: proof bytes
       │
4. Browser submits proof to Express API:
   POST /api/verification { owner, threshold, proof }
       │
5. API stores verification record (off-chain) and/or
   submits proof to Soroban contract on Stellar
       │
6. Soroban contract verifies proof on-chain:
   - If valid: emits Verification event, issues credential
   - If invalid: reverts
       │
7. User can now present their credential to any verifier
   (merchant, landlord, platform) without revealing balance
```

### Credential Verification Flow

```
1. Third party (verifier) queries credential by Stellar address
       │
2. API returns { verified: true, threshold: "500", lastVerified: ... }
       │
3. Verifier confirms the address has proven ≥ 500 USDC balance
   without ever learning the actual balance
```

## Security Considerations

### Zero-Knowledge Properties

- **Soundness:** The Noir circuit enforces `threshold ≤ balance`. It is computationally infeasible to produce a valid proof if this constraint is not satisfied.
- **Zero-Knowledge:** The proof reveals only `threshold` and the user's address. The actual `balance` remains private.
- **Proof size:** Noir UltraHonk proofs are compact (~few KB) and efficient to verify on-chain.

### Smart Contract Security

- **Access control:** Only the admin can update contract parameters
- **Replay protection:** Each proof includes a nonce to prevent replay attacks
- **Upgradability:** Contract uses Soroban's upgrade mechanism if needed

### API Security

- **Helmet middleware:** Sets secure HTTP headers
- **CORS:** Configured for frontend origin only
- **Input validation:** All API inputs are validated
- **Rate limiting:** Not yet implemented but recommended

### Limitations & Future Work

- **Testnet only:** Currently deployed on Stellar Testnet
- **JSON storage:** Production should use PostgreSQL or similar
- **No on-chain proof verification yet:** The contract skeleton is ready, full Soroban proof verification is the next milestone
- **Sybil resistance:** Not yet addressed — consider adding Stellar account age or minimum XLM balance requirements
