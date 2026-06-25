export const STELLAR_RPC_URL = "https://soroban-testnet.stellar.org";
export const STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const STELLAR_EXPLORER_URL = "https://stellar.expert/explorer/testnet";

export const ZKLEASE_CONTRACT_ID =
  "CAWSA6HEU3KCIU64A3P3AMQWF5E7UDKE6PWWEFDFJO4V7TPSYGC3M4LW";

export function isStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}
