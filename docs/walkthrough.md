# ZKLease — Demo Walkthrough

> A step-by-step guide to using the ZKLease privacy-preserving balance verification system.

---

## Prerequisites

Before starting the walkthrough:

1. Install the [Freighter Wallet](https://freighter.app) browser extension
2. Create a Stellar account on Testnet via [Stellar Lab](https://lab.stellar.org/account/create)
3. Fund your account with test XLM using [Friendbot](https://friendbot.stellar.org)
4. Make sure you have some test USDC (use the Stellar lab to issue or swap)
5. Start the dev servers: `npm run dev`

---

## Step 1: Connect Your Wallet

> **Screenshot:** Wallet connection dialog

1. Open the ZKLease app at `http://localhost:3000`
2. Click the **"Connect Wallet"** button in the top-right corner
3. The **Freighter** modal appears — select your wallet
4. Approve the connection request in the Freighter popup
5. Your Stellar public key appears in the header

**Expected result:** The dashboard loads with your account information. Your truncated public key (e.g., `GA3S…ABCD`) displays in the top bar.

**Troubleshooting:**
- If Freighter doesn't open, ensure the extension is installed and unlocked
- If connection fails, check that you're on Stellar Testnet (not Mainnet)
- You can switch networks in Freighter's settings

---

## Step 2: View Dashboard

> **Screenshot:** Dashboard page with balance and stats

After connecting, the dashboard shows:

- **Account balance** — Your XLM and USDC balances (from Stellar testnet)
- **Verification history** — List of previously generated proofs
- **Credential status** — Whether you hold an active credential
- **Quick actions** — "Generate Proof" button

**Note:** If this is your first time, the verification history will be empty.

---

## Step 3: Generate a ZK Proof

> **Screenshot:** Proof generation form with threshold input

1. Navigate to the **"Verify"** page using the navigation
2. Enter a **threshold amount** in the input field (e.g., `100` USDC)
3. Click **"Generate Proof"**

The proof generation flow progresses through these states:

```
IDLE → GENERATING → SUBMITTING → VERIFYING → SUCCESS
```

> **Screenshot:** Progress indicators showing each stage

**Stage details:**

| Stage        | What happens                                                    |
| ------------ | --------------------------------------------------------------- |
| **GENERATING** | The Noir circuit runs in-browser (or via API) to create a ZK-SNARK proof that your balance ≥ threshold |
| **SUBMITTING** | The proof is sent to the Express API for off-chain storage |
| **VERIFYING**  | (Optional) The proof is submitted to the Soroban contract for on-chain verification |
| **SUCCESS**    | A credential is issued and the transaction hash is recorded |

---

## Step 4: View Your Credential

> **Screenshot:** Success state with credential details

After successful proof generation:

- A green success banner appears
- **Transaction ID** is displayed (click to view on Stellar Expert)
- **Credential ID** is generated
- The credential is now associated with your Stellar address

**Example success output:**

```
✅ Proof verified successfully!
Transaction: a1b2c3d4... (view on explorer)
Credential: zk-cred-1234-5678
```

---

## Step 5: Check Credential History

> **Screenshot:** History page with list of previous verifications

1. Navigate to the **dashboard** or **history** section
2. See all previous verifications listed with:
   - **Date** of verification
   - **Threshold** amount proven
   - **Status** (verified / pending / failed)
   - **Transaction hash** (clickable for block explorer)

You can verify at any time that a given Stellar address has a valid credential by calling the API:

```bash
curl http://localhost:4000/api/credential/GA3SXJ6Y5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6
```

Response:
```json
{
  "address": "ga3sxj6y5q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6q6",
  "verified": true,
  "threshold": "100",
  "txHashes": ["a1b2c3d4..."],
  "lastVerified": 1700000000000
}
```

---

## Step 6: Verify Someone Else's Credential

> **Screenshot:** Verify page with address lookup

You can verify whether another Stellar address holds a valid credential:

1. Go to the **"Verify Address"** section
2. Enter the Stellar public key you want to check
3. Click **"Check"**
4. The system returns `verified: true/false` along with the threshold

**Important:** The API never reveals the actual balance — only whether it meets or exceeds the proven threshold.

---

## API Testing (curl)

### Health Check

```bash
curl http://localhost:4000/api/health
```

### Get Platform Stats

```bash
curl http://localhost:4000/api/stats
```

### Create Verification

```bash
curl -X POST http://localhost:4000/api/verification \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "GA3SXJ6Y5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6",
    "threshold": "500",
    "txHash": "abc123def456",
    "network": "TESTNET"
  }'
```

### Get Verifications for Address

```bash
curl http://localhost:4000/api/verification/GA3SXJ6Y5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6
```

### Get Credential Status

```bash
curl http://localhost:4000/api/credential/GA3SXJ6Y5Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6
```

---

## Smart Contract Interaction

### Via Stellar Expert

1. Open the contract page using your deployed contract ID:
   `https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>`
2. Use the "Write" tab to invoke contract functions
3. Use the "Read" tab to query contract state

### Via Soroban CLI

```bash
# Read current admin
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source zklease-admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --network testnet \
  -- \
  get_admin

# Get credential for address
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source zklease-admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --network testnet \
  -- \
  get_credential \
  --address G...
```

---

## Common Issues & Troubleshooting

| Issue                          | Solution                                        |
| ------------------------------ | ----------------------------------------------- |
| Freighter not detecting wallet | Reload page, ensure extension is unlocked       |
| "Insufficient balance" error   | Fund your account via Friendbot                 |
| Proof generation hangs         | Check browser console, ensure API is running    |
| API returns 404                | Verify the API is running on port 4000          |
| Contract call fails            | Ensure CONTRACT_ID is set in environment        |
| CORS error                     | Check API CORS config allows your frontend URL  |

---

## Seed Data

To quickly populate the database with sample data for testing:

```bash
npx tsx scripts/seed.ts
```

This creates 5 sample addresses with 1-3 verification records each, covering thresholds of 100, 250, 500, and 1000 USDC.
