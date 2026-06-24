import { SorobanRpc, xdr, Address } from "@stellar/stellar-sdk";
import type { VerificationRecord } from "../types/index.js";

interface SorobanEvent {
  contractId: string;
  topic: string[];
  value: string;
}

/**
 * Parse raw Soroban event data into structured verification records.
 * This is a placeholder – full integration requires subscribing to
 * Soroban event streams or polling a Stellar RPC provider.
 */
export function parseVerificationEvent(
  contractId: string,
  raw: string
): SorobanEvent | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.topic && parsed.value) {
      return {
        contractId,
        topic: Array.isArray(parsed.topic) ? parsed.topic : [parsed.topic],
        value: parsed.value,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convert a parsed Soroban event into a partial VerificationRecord.
 * In production you would decode the xdr.DecoratedContractEvent from
 * SorobanRpc responses.
 */
export function eventToVerification(
  event: SorobanEvent,
  network: string
): Pick<VerificationRecord, "owner" | "threshold" | "txHash" | "network"> | null {
  try {
    if (event.topic.length < 2) return null;

    const owner = event.topic[1] ?? "";
    const threshold = event.value;

    return {
      owner,
      threshold,
      txHash: "",
      network,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch recent events from a SorobanRPC server for a given contract.
 * This is a minimal example – real usage would require a RPC URL and
 * proper pagination.
 */
export async function fetchContractEvents(
  rpcUrl: string,
  contractId: string
): Promise<SorobanEvent[]> {
  try {
    const server = new SorobanRpc.Server(rpcUrl);
    const ledger = await server.getLatestLedger();
    const response = await server.getEvents({
      startLedger: ledger.sequence - 100,
      filters: [
        {
          contractIds: [contractId],
          type: "contract",
        },
      ],
    });

    return response.events.map((ev) => {
      const topic = ev.topic.map((t: xdr.ScVal) => scValToString(t));
      const value = scValToString(ev.value);
      return { contractId, topic, value };
    });
  } catch (err) {
    console.error("Failed to fetch contract events:", err);
    return [];
  }
}

function scValToString(val: xdr.ScVal): string {
  try {
    return val.toString();
  } catch {
    return String(val);
  }
}
