"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { simulateContractCall, signAndSubmitTransaction } from "@/lib/contract-call";

export type GameStatus = "waiting" | "committed" | "revealing" | "completed" | "cancelled";
export type MoveOption = "rock" | "paper" | "scissors";

export interface Player {
  address: string;
  move?: MoveOption;
  committed: boolean;
  revealed: boolean;
}

export interface Game {
  id: string;
  creator: string;
  opponent?: string;
  entryFee: number;
  status: GameStatus;
  players: Player[];
  winner?: string;
  createdAt: number;
}

const MOVES: MoveOption[] = ["rock", "paper", "scissors"];

function determineWinner(move1: MoveOption, move2: MoveOption): number {
  if (move1 === move2) return -1;
  if (
    (move1 === "rock" && move2 === "scissors") ||
    (move1 === "paper" && move2 === "rock") ||
    (move1 === "scissors" && move2 === "paper")
  ) return 0;
  return 1;
}

function mapStatus(s: string): GameStatus {
  switch (s) {
    case "Waiting": return "waiting";
    case "AwaitingReveal": return "committed";
    case "Revealed": return "revealing";
    case "Completed": return "completed";
    default: return "waiting";
  }
}

function mapGame(raw: any): Game {
  return {
    id: raw.id?.toString() || "",
    creator: raw.creator || "",
    opponent: raw.opponent || undefined,
    entryFee: Number(raw.entryFee ?? raw.entry_fee ?? 0),
    status: mapStatus(raw.state || raw.status || "Waiting"),
    players: [],
    winner: raw.winner || undefined,
    createdAt: raw.createdAt ? Number(raw.createdAt) : Date.now(),
  };
}

export function useGame() {
  const { publicKey, kit } = useWallet();
  const [games, setGames] = useState<Game[]>([]);
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games");
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.games || []).map(mapGame);
        setGames(mapped);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch games");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyGames = useCallback(async () => {
    if (!publicKey) return;
    setIsLoading(true);
    try {
      const userGames = games.filter(
        (g) => g.creator === publicKey || g.opponent === publicKey
      );
      setMyGames(userGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch your games");
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, games]);

  useEffect(() => { fetchMyGames(); }, [fetchMyGames]);

  const submitTx = useCallback(async (method: string, args: { type: string; value: any }[]) => {
    if (!publicKey) throw new Error("Wallet not connected");
    if (!kit) throw new Error("Wallet kit not initialized");
    const { xdr, result } = await simulateContractCall(method, publicKey, args);
    await signAndSubmitTransaction(kit, xdr, publicKey);
    return result;
  }, [publicKey, kit]);

  const depositFunds = useCallback(async () => {
    if (!publicKey || !kit) return;
    try {
      const { result } = await simulateContractCall("get_balance", publicKey, [
        { type: "address", value: publicKey },
      ]);
      if (!result || Number(result) === 0) {
        await submitTx("deposit", [
          { type: "address", value: publicKey },
          { type: "u128", value: 1000000000 },
        ]);
      }
    } catch {
      // silently fail - deposit might fail if account not funded
    }
  }, [publicKey, kit, submitTx]);

  const createGame = useCallback(
    async (entryFee: number): Promise<string | null> => {
      if (!publicKey) { setError("Wallet not connected"); return null; }
      setIsCreating(true);
      setError(null);
      try {
        await depositFunds();
        const result = await submitTx("create_rps_game", [
          { type: "address", value: publicKey },
          { type: "option", value: null },
          { type: "u128", value: entryFee },
        ]);
        await fetchGames();
        return result?.toString() || null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create game");
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [publicKey, submitTx, fetchGames, depositFunds]
  );

  const joinGame = useCallback(
    async (gameId: string): Promise<boolean> => {
      if (!publicKey) { setError("Wallet not connected"); return false; }
      setError(null);
      try {
        await submitTx("join_rps_game", [
          { type: "u64", value: Number(gameId) },
          { type: "address", value: publicKey },
        ]);
        await fetchGames();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join game");
        return false;
      }
    },
    [publicKey, submitTx, fetchGames]
  );

  const makeMove = useCallback(
    async (gameId: string, move: MoveOption): Promise<boolean> => {
      if (!publicKey) { setError("Wallet not connected"); return false; }
      setError(null);
      try {
        const salt = crypto.getRandomValues(new Uint8Array(8));
        const encoder = new TextEncoder();
        const preimage = new Uint8Array([...salt, ...encoder.encode(move)]);
        const hashBuffer = await crypto.subtle.digest("SHA-256", preimage);
        const commitment = new Uint8Array(hashBuffer);

        localStorage.setItem(`rps_salt_${gameId}_${publicKey}`,
          JSON.stringify({ salt: Array.from(salt), move }));

        await submitTx("commit_move", [
          { type: "u64", value: Number(gameId) },
          { type: "address", value: publicKey },
          { type: "bytes", value: Array.from(commitment) },
        ]);
        await fetchGames();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to commit move");
        return false;
      }
    },
    [publicKey, submitTx, fetchGames]
  );

  const revealMove = useCallback(
    async (gameId: string): Promise<boolean> => {
      if (!publicKey) { setError("Wallet not connected"); return false; }
      setError(null);
      try {
        const stored = localStorage.getItem(`rps_salt_${gameId}_${publicKey}`);
        if (!stored) {
          setError("Move data not found. Did you commit from this device?");
          return false;
        }
        const { salt, move } = JSON.parse(stored);
        const moveIndex = MOVES.indexOf(move as MoveOption);

        await submitTx("reveal_move", [
          { type: "u64", value: Number(gameId) },
          { type: "address", value: publicKey },
          { type: "u32", value: moveIndex },
          { type: "bytes", value: salt },
        ]);
        await fetchGames();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reveal move");
        return false;
      }
    },
    [publicKey, submitTx, fetchGames]
  );

  const fetchGame = useCallback(
    async (gameId: string) => {
      setError(null);
      try {
        if (games.length === 0) await fetchGames();
        const game = games.find((g) => g.id === gameId) || null;
        setCurrentGame(game);
        return game;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch game");
        return null;
      }
    },
    [games, fetchGames]
  );

  const resetCurrentGame = useCallback(() => setCurrentGame(null), []);

  const winRate = myGames.length > 0
    ? Math.round(
        (myGames.filter((g) => g.winner === publicKey).length /
          Math.max(myGames.filter((g) => g.status === "completed").length, 1)) * 100
      )
    : 0;

  return {
    games, myGames, currentGame, isLoading, isCreating, error, winRate,
    fetchGames, fetchMyGames, createGame, joinGame, makeMove, revealMove,
    fetchGame, resetCurrentGame, setError,
  };
}
