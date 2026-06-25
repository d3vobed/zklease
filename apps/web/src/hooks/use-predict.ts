"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { simulateContractCall, signAndSubmitTransaction } from "@/lib/contract-call";

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
  const { publicKey, kit } = useWallet();
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

  const submitTx = useCallback(async (method: string, args: { type: string; value: any }[]) => {
    if (!publicKey) throw new Error("Wallet not connected");
    if (!kit) throw new Error("Wallet kit not initialized");
    const { xdr, result } = await simulateContractCall(method, publicKey, args);
    await signAndSubmitTransaction(kit, xdr, publicKey);
    return result;
  }, [publicKey, kit]);

  const createPrediction = useCallback(
    async (question: string, options: string[], resolutionTime: number): Promise<string | null> => {
      if (!publicKey) { setError("Wallet not connected"); return null; }
      setError(null);
      try {
        const result = await submitTx("create_prediction", [
          { type: "address", value: publicKey },
          { type: "symbol", value: question },
          { type: "vec", value: options.map((o) => ({ type: "symbol", value: o })) },
          { type: "u64", value: Math.floor(resolutionTime / 1000) },
        ]);
        await fetchPredictions();
        return result?.toString() || null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create prediction");
        return null;
      }
    },
    [publicKey, submitTx, fetchPredictions]
  );

  const placeBet = useCallback(
    async (predictionId: string, optionIndex: number, amount: number): Promise<boolean> => {
      if (!publicKey) { setError("Wallet not connected"); return false; }
      setError(null);
      try {
        await submitTx("place_bet", [
          { type: "u64", value: Number(predictionId) },
          { type: "address", value: publicKey },
          { type: "u32", value: optionIndex },
          { type: "u128", value: amount },
        ]);
        await fetchPredictions();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to place bet");
        return false;
      }
    },
    [publicKey, submitTx, fetchPredictions]
  );

  const resolvePrediction = useCallback(
    async (predictionId: string, winningOption: number): Promise<boolean> => {
      if (!publicKey) { setError("Wallet not connected"); return false; }
      setError(null);
      try {
        await submitTx("resolve_prediction", [
          { type: "u64", value: Number(predictionId) },
          { type: "address", value: publicKey },
          { type: "u32", value: winningOption },
        ]);
        await fetchPredictions();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resolve");
        return false;
      }
    },
    [publicKey, submitTx, fetchPredictions]
  );

  const claimWinnings = useCallback(
    async (predictionId: string): Promise<number | null> => {
      if (!publicKey) { setError("Wallet not connected"); return null; }
      setError(null);
      try {
        const result = await submitTx("claim_winnings", [
          { type: "u64", value: Number(predictionId) },
          { type: "address", value: publicKey },
        ]);
        await fetchPredictions();
        return result ? Number(result) : null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to claim");
        return null;
      }
    },
    [publicKey, submitTx, fetchPredictions]
  );

  return {
    predictions, isLoading, error,
    fetchPredictions, createPrediction, placeBet, resolvePrediction, claimWinnings, setError,
  };
}
