import { NextResponse } from "next/server";

export async function GET() {
  const games = [
    {
      id: "1",
      creator: "GBDITFOZFOYIJZPWCJ3XLMQ4UQJFPJPROJZ6J5Q6ZQ6J5Q6ZQ6J5Q6",
      opponent: "GCPH4YZ3Y6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5QZ6",
      entryFee: 10,
      status: "waiting",
      players: [{ address: "GBDITFOZFOYIJZPWCJ3XLMQ4UQJFPJPROJZ6J5Q6ZQ6J5Q6ZQ6J5Q6", committed: false, revealed: false }],
      createdAt: Date.now() - 3600000,
    },
    {
      id: "2",
      creator: "GCVJ5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6",
      entryFee: 5,
      status: "waiting",
      players: [{ address: "GCVJ5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6J5Q6ZQ6", committed: false, revealed: false }],
      createdAt: Date.now() - 1800000,
    },
  ];

  return NextResponse.json({ games });
}
