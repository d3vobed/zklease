import { NextRequest, NextResponse } from "next/server";
import {
  BASE_FEE,
  Contract,
  nativeToScVal,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  xdr,
  scValToNative,
} from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const CONTRACT_ID = "CAWSA6HEU3KCIU64A3P3AMQWF5E7UDKE6PWWEFDFJO4V7TPSYGC3M4LW";
const ADMIN_SOURCE = "GDIVMD5PJ4GCANFUJMOWKLDDNITY4DY63IF4VAHEEEYK7KAIAOBAWZBF";

const server = new SorobanRpc.Server(RPC_URL, { allowHttp: true });

function buildScVal(arg: { type: string; value: any }): xdr.ScVal {
  switch (arg.type) {
    case "address": return nativeToScVal(String(arg.value), { type: "address" });
    case "u128": return nativeToScVal(Number(arg.value), { type: "u128" });
    case "i128": return nativeToScVal(Number(arg.value), { type: "i128" });
    case "u64": return nativeToScVal(Number(arg.value), { type: "u64" });
    case "i64": return nativeToScVal(Number(arg.value), { type: "i64" });
    case "u32": return nativeToScVal(Number(arg.value), { type: "u32" });
    case "i32": return nativeToScVal(Number(arg.value), { type: "i32" });
    case "bytes": return nativeToScVal(new Uint8Array(arg.value), { type: "bytes" });
    case "symbol": return nativeToScVal(String(arg.value), { type: "symbol" });
    case "bool": return nativeToScVal(Boolean(arg.value), { type: "bool" });
    case "string": return nativeToScVal(String(arg.value), { type: "string" });
    case "vec": {
      if (!Array.isArray(arg.value)) throw new Error("vec arg must be an array");
      return xdr.ScVal.scvVec(arg.value.map((v: any) => buildScVal(v)));
    }
    case "option": {
      if (arg.value === null || arg.value === undefined) {
        return xdr.ScVal.scvVec([]);
      }
      return xdr.ScVal.scvVec([buildScVal(arg.value)]);
    }
    default: throw new Error(`Unknown arg type: ${arg.type}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { method, publicKey, args } = await request.json();

    if (!method || !publicKey) {
      return NextResponse.json({ error: "Missing method or publicKey" }, { status: 400 });
    }

    let account;
    try {
      account = await server.getAccount(publicKey);
    } catch {
      account = await server.getAccount(ADMIN_SOURCE);
    }

    const contract = new Contract(CONTRACT_ID);
    const scVals = (args || []).map(buildScVal);
    const op = contract.call(method, ...scVals);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    if ("error" in simulation) {
      return NextResponse.json({ error: simulation.error }, { status: 400 });
    }

    const foot = simulation.transactionData?.build()?.toXDR("base64");
    if (!foot) {
      return NextResponse.json({ error: "No transaction data from simulation" }, { status: 500 });
    }

    let result: any;
    try {
      const retval = (simulation as any).result?.retval;
      if (retval) result = scValToNative(retval);
    } catch {}

    return NextResponse.json({ xdr: foot, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
