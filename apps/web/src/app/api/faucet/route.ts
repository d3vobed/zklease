import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({
        error: data.detail || "Friendbot funding failed",
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      hash: data.hash,
      address,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Failed to fund account",
    }, { status: 500 });
  }
}
