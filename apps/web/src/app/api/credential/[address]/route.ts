import { NextResponse } from "next/server";
import { getVerificationsByOwner } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!address) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Address parameter is required" },
      { status: 400 }
    );
  }

  const verifications = getVerificationsByOwner(address);

  if (verifications.length === 0) {
    return NextResponse.json(null);
  }

  const txHashes = verifications.map((v) => v.txHash);
  const lastVerified = Math.max(...verifications.map((v) => v.timestamp));
  const threshold = verifications[0].threshold;

  const credential = {
    address: address.toLowerCase(),
    verified: verifications.length > 0,
    threshold,
    txHashes,
    lastVerified,
  };

  return NextResponse.json(credential);
}
