import {
  BASE_FEE,
  Contract,
  nativeToScVal,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  Horizon,
  xdr,
  scValToNative,
} from "@stellar/stellar-sdk";

export const STELLAR_NETWORK = Networks.TESTNET;
export const STELLAR_RPC_URL = "https://soroban-testnet.stellar.org";
export const STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org";

export const STELLAR_EXPLORER_URL = "https://stellar.expert/explorer/testnet";

// Update this after deploying the contract via `soroban contract deploy`
export let ZKLEASE_CONTRACT_ID =
  "CAABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUV";

export function setContractId(id: string) {
  ZKLEASE_CONTRACT_ID = id;
}

export interface AccountBalance {
  asset: string;
  balance: string;
  contractId?: string;
}

const sorobanServer = new SorobanRpc.Server(STELLAR_RPC_URL, {
  allowHttp: true,
});

const horizonServer = new Horizon.Server(STELLAR_HORIZON_URL, {
  allowHttp: true,
});

export async function getAccountBalances(
  publicKey: string
): Promise<AccountBalance[]> {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    const balances: AccountBalance[] = [];

    for (const balance of account.balances) {
      if (balance.asset_type === "native") {
        balances.push({
          asset: "XLM",
          balance: balance.balance,
        });
      } else if (balance.asset_type === "credit_alphanum4") {
        balances.push({
          asset: balance.asset_code,
          balance: balance.balance,
        });
      }
    }

    return balances;
  } catch {
    return [];
  }
}

export async function getUsdcBalance(publicKey: string): Promise<string> {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    const usdcBalance = account.balances.find(
      (b) =>
        b.asset_type === "credit_alphanum4" &&
        b.asset_code === "USDC"
    );
    return usdcBalance?.balance ?? "0";
  } catch {
    return "0";
  }
}

async function simulateAndBuildTx(
  publicKey: string,
  contractOp: xdr.Operation
): Promise<string> {
  const account = await sorobanServer.getAccount(publicKey);
  const contract = new Contract(ZKLEASE_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK,
  })
    .addOperation(contractOp)
    .setTimeout(30)
    .build();

  const simulation = await sorobanServer.simulateTransaction(tx);
  if ("error" in simulation) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  const foot = simulation.transactionData?.build()?.toXDR("base64");
  if (!foot) throw new Error("No transaction data from simulation");

  return foot;
}

export async function simulateContractCall(
  publicKey: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  const contract = new Contract(ZKLEASE_CONTRACT_ID);
  const op = contract.call(method, ...args);
  return simulateAndBuildTx(publicKey, op);
}

export async function submitProofTransaction(
  publicKey: string,
  proof: Uint8Array,
  publicInputs: string[]
): Promise<string> {
  try {
    const account = await sorobanServer.getAccount(publicKey);
    const contract = new Contract(ZKLEASE_CONTRACT_ID);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_NETWORK,
    })
      .addOperation(
        contract.call(
          "grant_credential",
          nativeToScVal(publicKey, { type: "address" }),
          nativeToScVal(Number(publicInputs[0]) || 0, { type: "u128" }),
          nativeToScVal(proof, { type: "bytes" })
        )
      )
      .setTimeout(30)
      .build();

    const simulation = await sorobanServer.simulateTransaction(tx);
    if ("error" in simulation) {
      throw new Error(`Simulation failed: ${simulation.error}`);
    }

    const foot = simulation.transactionData?.build()?.toXDR("base64");
    if (!foot) throw new Error("No transaction data from simulation");

    return foot;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to submit proof: ${message}`);
  }
}

export async function getCredentialStatus(
  publicKey: string
): Promise<{ hasCredential: boolean; tokenId?: string }> {
  try {
    const contract = new Contract(ZKLEASE_CONTRACT_ID);
    await sorobanServer.getAccount(publicKey);
    return { hasCredential: false };
  } catch {
    return { hasCredential: false };
  }
}

export function isStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}

export function scvalToString(val: xdr.ScVal): string {
  const native = scValToNative(val);
  return typeof native === "string" ? native : JSON.stringify(native);
}

export function makeAddressScVal(address: string): xdr.ScVal {
  return nativeToScVal(address, { type: "address" });
}

export function makeU128ScVal(val: number): xdr.ScVal {
  return nativeToScVal(val, { type: "u128" });
}

export function makeU64ScVal(val: number): xdr.ScVal {
  return nativeToScVal(val, { type: "u64" });
}

export function makeU32ScVal(val: number): xdr.ScVal {
  return nativeToScVal(val, { type: "u32" });
}

export function makeBytesScVal(bytes: Uint8Array): xdr.ScVal {
  return nativeToScVal(bytes, { type: "bytes" });
}

export function makeSymbolScVal(sym: string): xdr.ScVal {
  return nativeToScVal(sym, { type: "symbol" });
}

export function makeVecScVal(items: xdr.ScVal[]): xdr.ScVal {
  return xdr.ScVal.scvVec(items);
}
