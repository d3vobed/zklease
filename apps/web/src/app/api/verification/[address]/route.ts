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
  return NextResponse.json(verifications);
}
