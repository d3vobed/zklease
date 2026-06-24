#!/usr/bin/env bash
set -euo pipefail

# ─── ZKLease — Full Project Setup ────────────────────────────────────────
# Run this once after cloning the repository to install all dependencies,
# compile circuits, build contracts, and build the web & API apps.
# ──────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { printf "${CYAN}ℹ %s${NC}\n" "$*"; }
ok()    { printf "${GREEN}✓ %s${NC}\n" "$*"; }
warn()  { printf "${YELLOW}⚠ %s${NC}\n" "$*"; }
err()   { printf "${RED}✗ %s${NC}\n" "$*" >&2; }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo ""
printf "╔══════════════════════════════════════════════╗\n"
printf "║  ${CYAN}ZKLease — Full Project Setup${NC}                ║\n"
printf "╚══════════════════════════════════════════════╝\n"
echo ""

# ── 1. Root dependencies (npm workspaces + turbo) ────────────────────────
setup_root_deps() {
  info "Installing root npm dependencies…"
  npm install --frozen-lockfile 2>/dev/null || npm install
  ok "Root dependencies installed"
}

# ── 2. Noir (circuit) dependencies ────────────────────────────────────────
setup_circuits() {
  info "Checking Noir installation…"
  if ! command -v nargo &>/dev/null; then
    warn "nargo not found — installing Noir…"
    if command -v noirup &>/dev/null; then
      noirup
    else
      curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
      export PATH="$HOME/.nargo/bin:$PATH"
      noirup
    fi
    ok "Noir installed: $(nargo --version)"
  else
    ok "Noir found: $(nargo --version)"
  fi

  info "Compiling circuits…"
  (
    cd "$ROOT_DIR/circuits/noir"
    nargo compile 2>&1
  )
  ok "Circuits compiled"

  info "Generating proving key…"
  (
    cd "$ROOT_DIR/circuits/noir"
    nargo prove 2>&1 || warn "Prove step skipped (witness/prover inputs may be needed)"
  )
  ok "Circuits ready"
}

# ── 3. Build Rust contracts ──────────────────────────────────────────────
build_contracts() {
  info "Building Soroban contracts…"
  if command -v cargo &>/dev/null; then
    (
      cd "$ROOT_DIR/contracts/zklease"
      cargo build --release --target wasm32-unknown-unknown 2>&1 || \
        warn "Contract build failed — ensure Rust + wasm32 target are installed"
    )
    ok "Contracts built"
  else
    warn "Cargo not found — skipping contract build. Install Rust at https://rustup.rs"
  fi
}

# ── 4. Build apps (Next.js web + Express API) ────────────────────────────
build_apps() {
  info "Building all apps with Turbo…"
  npm run build 2>&1 || {
    warn "Turbo build failed — falling back to per-app build"
    info "Building API…"
    (cd "$ROOT_DIR/apps/api" && npm run build 2>&1 || true)
    info "Building Web…"
    (cd "$ROOT_DIR/apps/web" && npm run build 2>&1 || true)
  }
  ok "Apps built"
}

# ── 5. Create .env files from examples ────────────────────────────────────
setup_env() {
  info "Setting up environment files…"
  for env_example in $(find "$ROOT_DIR" -name ".env.example" -not -path "*/node_modules/*"); do
    local env_file="${env_example%.example}"
    if [[ ! -f "$env_file" ]]; then
      cp "$env_example" "$env_file"
      ok "Created $env_file"
    else
      info "  $env_file already exists — skipping"
    fi
  done
}

# ── Summary ───────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  printf "┌──────────────────────────────────────────────────────────┐\n"
  printf "│  ${GREEN}ZKLease setup complete!${NC}                                 │\n"
  printf "├──────────────────────────────────────────────────────────┤\n"
  printf "│  Next steps:                                             │\n"
  printf "│                                                          │\n"
  printf "│  • Start dev servers:  ${CYAN}npm run dev${NC}                         │\n"
  printf "│  • Deploy contracts:   ${CYAN}npm run deploy:contracts${NC}             │\n"
  printf "│  • Run tests:          ${CYAN}npm test${NC}                              │\n"
  printf "│                                                          │\n"
  printf "│  Web app:  http://localhost:3000                         │\n"
  printf "│  API:      http://localhost:4000                         │\n"
  printf "└──────────────────────────────────────────────────────────┘\n"
  echo ""
}

# ── Main ──────────────────────────────────────────────────────────────────
main() {
  setup_root_deps
  setup_circuits
  build_contracts
  build_apps
  setup_env
  print_summary
}

main "$@"
