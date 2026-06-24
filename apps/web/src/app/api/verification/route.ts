import { NextRequest, NextResponse } from "next/server";
import { addVerification, getVerificationsByOwner } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.owner || !body.threshold || !body.txHash || !body.network) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Missing required fields: owner, threshold, txHash, network",
      },
      { status: 400 }
    );
  }

  const record = {
    id: crypto.randomUUID(),
    owner: body.owner,
    threshold: body.threshold,
    txHash: body.txHash,
    network: body.network,
    timestamp: Date.now(),
  };

  const saved = addVerification(record);
  return NextResponse.json(saved, { status: 201 });
}
