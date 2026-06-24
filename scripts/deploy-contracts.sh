#!/usr/bin/env bash
set -euo pipefail

# ─── ZKLease — Soroban Contract Deployment ───────────────────────────────
# Deploys the ZKLease Soroban smart contract to Stellar testnet.
# Prerequisites: Rust toolchain, soroban-cli, and a funded Stellar keypair.
# ──────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { printf "${CYAN}ℹ %s${NC}\n" "$*"; }
ok()    { printf "${GREEN}✓ %s${NC}\n" "$*"; }
warn()  { printf "${YELLOW}⚠ %s${NC}\n" "$*"; }
err()   { printf "${RED}✗ %s${NC}\n" "$*" >&2; }

# ── Config ────────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="$ROOT_DIR/contracts/zklease"
SOROBAN_NETWORK="testnet"
SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
SOROBAN_NETWORK_PASSPHRASE="${SOROBAN_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"
SOROBAN_ACCOUNT="${SOROBAN_ACCOUNT:-zklease-admin}"
WASM_OUTPUT_DIR="$CONTRACT_DIR/target/wasm32-unknown-unknown/release"

# ── Check dependencies ────────────────────────────────────────────────────
check_deps() {
  if ! command -v rustc &>/dev/null; then
    err "Rust is not installed. Install from https://rustup.rs"
    exit 1
  fi

  if ! command -v soroban &>/dev/null; then
    warn "soroban-cli not found — installing…"
    cargo install soroban-cli --locked
    ok "soroban-cli installed"
  fi

  SOROBAN_VERSION="$(soroban version 2>/dev/null | head -1)"
  info "soroban-cli $SOROBAN_VERSION"
}

# ── Build contract ────────────────────────────────────────────────────────
build_contract() {
  info "Building contract (release)…"
  (
    cd "$CONTRACT_DIR"
    cargo build --release --target wasm32-unknown-unknown 2>&1
  )
  ok "Contract built"
}

# ── Deploy to testnet ─────────────────────────────────────────────────────
deploy_contract() {
  local wasm_file
  wasm_file=$(find "$WASM_OUTPUT_DIR" -name "*.wasm" -type f | head -1)

  if [[ -z "$wasm_file" ]]; then
    err "No .wasm file found in $WASM_OUTPUT_DIR"
    exit 1
  fi

  info "Deploying $(basename "$wasm_file") to $SOROBAN_NETWORK…"

  local contract_id
  contract_id=$(soroban contract deploy \
    --wasm "$wasm_file" \
    --source "$SOROBAN_ACCOUNT" \
    --rpc-url "$SOROBAN_RPC_URL" \
    --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" \
    --network "$SOROBAN_NETWORK" 2>&1 | tail -1)

  if [[ -z "$contract_id" || "$contract_id" == *"error"* ]]; then
    err "Deployment failed: $contract_id"
    exit 1
  fi

  ok "Contract deployed: $contract_id"
  echo "$contract_id" > "$ROOT_DIR/.contract-id"
  info "Contract ID saved to .contract-id"
}

# ── Initialize contract ───────────────────────────────────────────────────
init_contract() {
  local contract_id
  contract_id=$(cat "$ROOT_DIR/.contract-id" 2>/dev/null || true)

  if [[ -z "$contract_id" ]]; then
    warn "No .contract-id found — skipping initialization"
    return
  fi

  info "Initializing contract $contract_id…"

  soroban contract invoke \
    --id "$contract_id" \
    --source "$SOROBAN_ACCOUNT" \
    --rpc-url "$SOROBAN_RPC_URL" \
    --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" \
    --network "$SOROBAN_NETWORK" \
    -- \
    initialize \
    --admin "$SOROBAN_ACCOUNT" 2>&1 || {
    warn "Initialization failed (may already be initialized)"
  }

  ok "Contract initialized"
}

# ── Output summary ────────────────────────────────────────────────────────
print_summary() {
  local contract_id
  contract_id=$(cat "$ROOT_DIR/.contract-id" 2>/dev/null || echo "N/A")

  echo ""
  printf "┌─────────────────────────────────────────────────────────┐\n"
  printf "│  ${CYAN}ZKLease — Deployment Summary${NC}                         │\n"
  printf "├─────────────────────────────────────────────────────────┤\n"
  printf "│  Network  : %-42s │\n" "$SOROBAN_NETWORK"
  printf "│  RPC URL  : %-42s │\n" "$SOROBAN_RPC_URL"
  printf "│  Contract : %-42s │\n" "$contract_id"
  printf "│  Explorer : %-42s │\n" "https://stellar.expert/explorer/testnet/contract/$contract_id"
  printf "└─────────────────────────────────────────────────────────┘\n"
  echo ""
  info "Add CONTRACT_ID=$contract_id to your .env files"
}

# ── Main ──────────────────────────────────────────────────────────────────
main() {
  echo ""
  printf "╔═══════════════════════════════════════════════════════════╗\n"
  printf "║  ${CYAN}ZKLease — Soroban Contract Deployment${NC}                  ║\n"
  printf "╚═══════════════════════════════════════════════════════════╝\n"
  echo ""

  check_deps
  build_contract
  deploy_contract
  init_contract
  print_summary
}

main "$@"
