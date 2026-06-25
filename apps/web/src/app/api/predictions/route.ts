import { NextResponse } from "next/server";

export async function GET() {
  const predictions = [
    {
      id: "pred-1",
      question: "Will XLM price exceed $0.50 by June 30?",
      options: ["Yes", "No"],
      totalBets: [850, 420],
      resolutionTime: Date.now() + 86400000 * 3,
      resolved: false,
      winningOption: 0,
      bets: [],
    },
    {
      id: "pred-2",
      question: "Will Stellar Protocol 27 pass in July?",
      options: ["Yes, before July 15", "Yes, after July 15", "No"],
      totalBets: [1200, 600, 200],
      resolutionTime: Date.now() + 86400000 * 7,
      resolved: false,
      winningOption: 0,
      bets: [],
    },
    {
      id: "pred-3",
      question: "ZKLease wins the Stellar Hackathon?",
      options: ["Grand Prize", "Runner Up", "No"],
      totalBets: [500, 300, 100],
      resolutionTime: Date.now() + 86400000 * 5,
      resolved: true,
      winningOption: 0,
      bets: [],
    },
  ];

  return NextResponse.json({ predictions });
}
