"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import {
  makeAddressScVal,
  makeSymbolScVal,
  makeVecScVal,
  makeU64ScVal,
  makeU32ScVal,
  makeU128ScVal,
  simulateContractCall,
} from "@/lib/stellar";

export interface Prediction {
  id: string;
  question: string;
  options: string[];
  totalBets: number[];
  resolutionTime: number;
  resolved: boolean;
  winningOption: number;
  bets: any[];
  myBet?: number;
}

function mapPrediction(raw: any): Prediction {
  return {
    id: raw.id?.toString() || "",
    question: typeof raw.question === "string" ? raw.question : String(raw.question ?? ""),
    options: Array.isArray(raw.options) ? raw.options.map(String) : [],
    totalBets: Array.isArray(raw.total_bets)
      ? raw.total_bets.map((v: any) => Number(v ?? 0))
      : [],
    resolutionTime: raw.resolution_time ? Number(raw.resolution_time) * 1000 : Date.now(),
    resolved: Boolean(raw.resolved ?? false),
    winningOption: Number(raw.winning_option ?? 0),
    bets: [],
  };
}

export function usePredict() {
  const { publicKey } = useWallet();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/predictions");
      if (res.ok) {
        const data = await res.json();
        setPredictions((data.predictions || []).map(mapPrediction));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch predictions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  const createPrediction = useCallback(
    async (question: string, options: string[], resolutionTime: number): Promise<string | null> => {
      if (!publicKey) { setError("Wallet not connected"); return null; }
      setError(null);
      try {
        const xdr = await simulateContractCall(publicKey, "create_prediction", [
          makeAddressScVal(publicKey),
          makeSymbolScVal(question),
          makeVecScVal(options.map((o) => makeSymbolScVal(o))),
          makeU64ScVal(Math.floor(resolutionTime / 1000)),
        ]);
        alert("Sign in wallet to create prediction:\n" + xdr.slice(0, 40) + "...");
        await fetchPredictions();
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create prediction");
        return null;
      }
    },
    [publicKey, fetchPredictions]
  );

  const placeBet = useCallback(
    async (predictionId: string, optionIndex: number, amount: number): Promise<boolean> => {
      if (!publicKey) { setError("Wallet not connected"); return false; }
      setError(null);
      try {
        const xdr = await simulateContractCall(publicKey, "place_bet", [
          makeU64ScVal(Number(predictionId)),
          makeAddressScVal(publicKey),
          makeU32ScVal(optionIndex),
          makeU128ScVal(amount),
        ]);
        alert("Sign bet transaction:\n" + xdr.slice(0, 40) + "...");
        await fetchPredictions();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to place bet");
        return false;
      }
    },
    [publicKey, fetchPredictions]
  );

  const resolvePrediction = useCallback(
    async (predictionId: string, winningOption: number): Promise<boolean> => {
      setError(null);
      try {
        alert("Only the prediction creator can resolve. Sign in wallet.");
        await fetchPredictions();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resolve");
        return false;
      }
    },
    [fetchPredictions]
  );

  const claimWinnings = useCallback(
    async (predictionId: string): Promise<number | null> => {
      if (!publicKey) { setError("Wallet not connected"); return null; }
      setError(null);
      try {
        const pred = predictions.find((p) => p.id === predictionId);
        if (!pred) return null;
        const pool = pred.totalBets.reduce((a, b) => a + b, 0);
        const winningTotal = pred.totalBets[pred.winningOption] || 1;
        const myBetAmount = 0;
        const winnings = Math.floor((myBetAmount * pool) / winningTotal);
        return winnings > 0 ? winnings : null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to claim");
        return null;
      }
    },
    [publicKey, predictions]
  );

  return {
    predictions, isLoading, error,
    fetchPredictions, createPrediction, placeBet, resolvePrediction, claimWinnings, setError,
  };
}
