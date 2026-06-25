import { STELLAR_RPC_URL, STELLAR_NETWORK_PASSPHRASE } from "./stellar-constants";

export interface ArgSpec {
  type: string;
  value: any;
}

export interface ContractCallResult {
  xdr: string;
  result?: any;
}

export async function simulateContractCall(
  method: string,
  publicKey: string,
  args: ArgSpec[]
): Promise<ContractCallResult> {
  const res = await fetch("/api/contract/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, publicKey, args }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Simulation failed (${res.status})`);
  }
  return res.json();
}

export async function signAndSubmitTransaction(
  kit: any,
  xdr: string,
  publicKey: string
): Promise<string> {
  const { signedTxXdr } = await kit.signTransaction(xdr, {
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    address: publicKey,
  });

  const res = await fetch(STELLAR_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1000000),
      method: "sendTransaction",
      params: { transaction: signedTxXdr },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Submission failed");
  return data.result?.hash || data.result?.id || "";
}
