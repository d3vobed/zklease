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

function toGame(raw: any) {
  return {
    id: String(raw.id ?? ""),
    creator: String(raw.creator ?? ""),
    opponent: raw.opponent ? String(raw.opponent) : null,
    entryFee: Number(raw.entry_fee ?? 0),
    state: String(raw.state ?? "Waiting"),
    winner: raw.winner ? String(raw.winner) : null,
    createdAt: Number(raw.created_at ?? 0) * 1000,
  };
}

export async function GET() {
  try {
    const sim = await simulateCall("get_all_rps_games");
    const retval = (sim as any).result?.retval;
    if (!retval) return NextResponse.json({ games: [] });
    const native = scValToNative(retval);
    const games = Array.isArray(native) ? native.map(toGame) : [];
    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
