"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";

export interface Bet {
  predictor: string;
  optionIndex: number;
  amount: number;
  claimed: boolean;
}

export interface Prediction {
  id: string;
  question: string;
  options: string[];
  totalBets: number[];
  resolutionTime: number;
  resolved: boolean;
  winningOption: number;
  bets: Bet[];
  myBet?: number;
}

const MOCK_PREDICTIONS: Prediction[] = [
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
    myBet: 0,
  },
];

let predCounter = 3;

export function usePredict() {
  const { publicKey } = useWallet();
  const [predictions, setPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch predictions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPrediction = useCallback(
    async (question: string, options: string[], resolutionTime: number): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 500));
        predCounter++;
        const newPred: Prediction = {
          id: `pred-${predCounter}`,
          question,
          options,
          totalBets: options.map(() => 0),
          resolutionTime,
          resolved: false,
          winningOption: 0,
          bets: [],
        };
        setPredictions((prev) => [newPred, ...prev]);
        return newPred.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create prediction");
        return null;
      }
    },
    [publicKey]
  );

  const placeBet = useCallback(
    async (predictionId: string, optionIndex: number, amount: number): Promise<boolean> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return false;
      }
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 400));
        let placed = false;
        setPredictions((prev) =>
          prev.map((p) => {
            if (p.id !== predictionId || p.resolved) return p;
            placed = true;
            const newBets = [...p.totalBets];
            newBets[optionIndex] = (newBets[optionIndex] || 0) + amount;
            return {
              ...p,
              totalBets: newBets,
              bets: [
                ...p.bets,
                {
                  predictor: publicKey,
                  optionIndex,
                  amount,
                  claimed: false,
                },
              ],
              myBet: optionIndex,
            };
          })
        );
        return placed;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to place bet");
        return false;
      }
    },
    [publicKey]
  );

  const resolvePrediction = useCallback(
    async (predictionId: string, winningOption: number): Promise<boolean> => {
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 300));
        let resolved = false;
        setPredictions((prev) =>
          prev.map((p) => {
            if (p.id !== predictionId || p.resolved) return p;
            resolved = true;
            return { ...p, resolved: true, winningOption };
          })
        );
        return resolved;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resolve prediction");
        return false;
      }
    },
    []
  );

  const claimWinnings = useCallback(
    async (predictionId: string): Promise<number | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 300));
        const pred = predictions.find((p) => p.id === predictionId);
        if (!pred || !pred.resolved) return null;
        const winningTotal = pred.totalBets[pred.winningOption] || 0;
        const pool = pred.totalBets.reduce((a, b) => a + b, 0);
        const myBetAmount = 0;
        const winnings = pool > 0 && winningTotal > 0
          ? Math.floor((myBetAmount * pool) / winningTotal)
          : 0;
        return winnings;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to claim winnings");
        return null;
      }
    },
    [publicKey, predictions]
  );

  return {
    predictions,
    isLoading,
    error,
    fetchPredictions,
    createPrediction,
    placeBet,
    resolvePrediction,
    claimWinnings,
    setError,
  };
}
