import { NextResponse } from "next/server";
import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  scValToNative,
} from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const CONTRACT_ID = "CAWSA6HEU3KCIU64A3P3AMQWF5E7UDKE6PWWEFDFJO4V7TPSYGC3M4LW";
const NETWORK = Networks.TESTNET;
const SOURCE = "GDIVMD5PJ4GCANFUJMOWKLDDNITY4DY63IF4VAHEEEYK7KAIAOBAWZBF";

const server = new SorobanRpc.Server(RPC_URL, { allowHttp: true });
const contract = new Contract(CONTRACT_ID);

async function simulateCall(method: string) {
  const account = await server.getAccount(SOURCE);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
    .addOperation(contract.call(method))
    .setTimeout(30)
    .build();
  const result = await server.simulateTransaction(tx);
  if ("error" in result) throw new Error(String(result.error));
  return result;
}

function toPrediction(raw: any) {
  return {
    id: String(raw.id ?? ""),
    question: String(raw.question ?? ""),
    options: Array.isArray(raw.options) ? raw.options.map(String) : [],
    totalBets: Array.isArray(raw.total_bets) ? raw.total_bets.map((v: any) => Number(v ?? 0)) : [],
    resolutionTime: Number(raw.resolution_time ?? 0) * 1000,
    resolved: Boolean(raw.resolved ?? false),
    winningOption: Number(raw.winning_option ?? 0),
  };
}

export async function GET() {
  try {
    const sim = await simulateCall("get_all_predictions");
    const retval = (sim as any).result?.retval;
    if (!retval) return NextResponse.json({ predictions: [] });
    const native = scValToNative(retval);
    const predictions = Array.isArray(native) ? native.map(toPrediction) : [];
    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json({ predictions: [] });
  }
}
