"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { api, VerificationRecord } from "@/lib/api";

export type ProofStatus =
  | "idle"
  | "generating"
  | "submitting"
  | "verifying"
  | "success"
  | "error";

export interface ProofState {
  status: ProofStatus;
  threshold: string;
  transactionId?: string;
  credentialId?: string;
  error?: string;
  progress: number;
}

export function useProof() {
  const { publicKey } = useWallet();
  const [state, setState] = useState<ProofState>({
    status: "idle",
    threshold: "100",
    progress: 0,
  });
  const [history, setHistory] = useState<VerificationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const setThreshold = useCallback((threshold: string) => {
    setState((prev) => ({ ...prev, threshold }));
  }, []);

  const generateProof = useCallback(async () => {
    if (!publicKey) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Wallet not connected",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "generating",
      error: undefined,
      transactionId: undefined,
      credentialId: undefined,
      progress: 10,
    }));

    try {
      // Simulate proof generation with progress
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => ({ ...prev, progress: 30 }));

      await new Promise((resolve) => setTimeout(resolve, 800));
      setState((prev) => ({ ...prev, progress: 50 }));

      await new Promise((resolve) => setTimeout(resolve, 600));
      setState((prev) => ({ ...prev, progress: 70 }));

      // Simulate proof generation completion
      const mockProof = btoa(JSON.stringify({
        proof: "zk_proof_data",
        publicKey,
        threshold: state.threshold,
        timestamp: Date.now(),
      }));

      setState((prev) => ({ ...prev, status: "submitting", progress: 85 }));

      // Submit to API
      const result = await api.verifyBalance({
        publicKey,
        threshold: state.threshold,
        proof: mockProof,
      });

      if (result.success) {
        setState((prev) => ({
          ...prev,
          status: "success",
          progress: 100,
          transactionId: result.transactionId,
          credentialId: result.credentialId,
        }));
      } else {
        throw new Error(result.error || "Verification failed");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Proof generation failed",
        progress: 0,
      }));
    }
  }, [publicKey, state.threshold]);

  const fetchHistory = useCallback(async () => {
    if (!publicKey) return;
    setIsLoadingHistory(true);
    try {
      const records = await api.getHistory(publicKey);
      setHistory(records);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [publicKey]);

  const reset = useCallback(() => {
    setState({
      status: "idle",
      threshold: "100",
      progress: 0,
    });
  }, []);

  return {
    ...state,
    history,
    isLoadingHistory,
    setThreshold,
    generateProof,
    fetchHistory,
    reset,
  };
}
