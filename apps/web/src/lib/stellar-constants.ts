export const STELLAR_RPC_URL = "https://soroban-testnet.stellar.org";
export const STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const STELLAR_EXPLORER_URL = "https://stellar.expert/explorer/testnet";

export const ZKLEASE_CONTRACT_ID =
  "CDTQZLYPXSUULOE6UECBJK5T63AAPP3K6A4LQ246AOHTYD7TQPADXMLG";

export function isStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}
