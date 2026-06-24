import { NextResponse } from "next/server";
import { getStats } from "@/lib/storage";

export async function GET() {
  return NextResponse.json(getStats());
}
