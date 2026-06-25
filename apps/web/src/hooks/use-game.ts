"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";

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
  ) {
    return 0;
  }
  return 1;
}

let gameCounter = 3;

function createMockGame(creator: string, entryFee: number): Game {
  gameCounter++;
  return {
    id: `game_${String(gameCounter).padStart(3, "0")}`,
    creator,
    entryFee,
    status: "waiting",
    players: [{ address: creator, committed: false, revealed: false }],
    createdAt: Date.now(),
  };
}

const API_BASE = typeof window !== "undefined" ? "" : "";

export function useGame() {
  const { publicKey } = useWallet();
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
      const res = await fetch(`${API_BASE}/api/games`).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setGames(data.games || []);
      } else {
        await new Promise((r) => setTimeout(r, 400));
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
    setError(null);
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

  const createGame = useCallback(
    async (entryFee: number): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }
      setIsCreating(true);
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 600));
        const newGame = createMockGame(publicKey, entryFee);
        setGames((prev) => [...prev, newGame]);
        return newGame.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create game");
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [publicKey]
  );

  const joinGame = useCallback(
    async (gameId: string): Promise<boolean> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return false;
      }
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 500));
        let joined = false;
        setGames((prev) =>
          prev.map((g) => {
            if (g.id === gameId && g.players.length < 2) {
              joined = true;
              return {
                ...g,
                opponent: publicKey,
                players: [
                  ...g.players,
                  { address: publicKey, committed: false, revealed: false },
                ],
              };
            }
            return g;
          })
        );
        return joined;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join game");
        return false;
      }
    },
    [publicKey]
  );

  const makeMove = useCallback(
    async (gameId: string, move: MoveOption): Promise<boolean> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return false;
      }
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 400));
        let committed = false;
        setGames((prev) =>
          prev.map((g) => {
            if (g.id !== gameId) return g;
            const players = g.players.map((p) => {
              if (p.address === publicKey && !p.committed) {
                committed = true;
                return { ...p, move, committed: true };
              }
              return p;
            });
            const allCommitted = players.every((p) => p.committed);
            return {
              ...g,
              players,
              status: allCommitted ? "committed" : g.status,
            };
          })
        );

        if (committed) {
          setGames((prev) => {
            const updated = prev.find((g) => g.id === gameId);
            if (updated) setCurrentGame(updated);
            return prev;
          });
        }
        return committed;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to commit move");
        return false;
      }
    },
    [publicKey]
  );

  const revealMove = useCallback(
    async (gameId: string): Promise<boolean> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return false;
      }
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 400));
        let revealed = false;
        setGames((prev) =>
          prev.map((g) => {
            if (g.id !== gameId) return g;
            const players = g.players.map((p) => {
              if (p.address === publicKey && p.committed && !p.revealed) {
                revealed = true;
                return { ...p, revealed: true };
              }
              return p;
            });
            const allRevealed = players.every((p) => p.revealed);
            if (allRevealed && revealed) {
              const p1 = players[0];
              const p2 = players[1];
              if (p1.move && p2.move) {
                const result = determineWinner(p1.move, p2.move);
                let winner: string | undefined;
                if (result === 0) winner = p1.address;
                else if (result === 1) winner = p2.address;
                return {
                  ...g,
                  players,
                  status: "completed",
                  winner,
                };
              }
            }
            const anyRevealed = players.some((p) => p.revealed);
            return {
              ...g,
              players,
              status: anyRevealed ? "revealing" : g.status,
            };
          })
        );

        if (revealed) {
          setGames((prev) => {
            const updated = prev.find((g) => g.id === gameId);
            if (updated) setCurrentGame(updated);
            return prev;
          });
        }
        return revealed;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reveal move");
        return false;
      }
    },
    [publicKey]
  );

  const fetchGame = useCallback(
    async (gameId: string) => {
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 200));
        const game = games.find((g) => g.id === gameId) || null;
        setCurrentGame(game);
        return game;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch game");
        return null;
      }
    },
    [games]
  );

  const resetCurrentGame = useCallback(() => {
    setCurrentGame(null);
  }, []);

  const winRate =
    myGames.length > 0
      ? Math.round(
          (myGames.filter((g) => g.winner === publicKey).length /
            myGames.filter((g) => g.status === "completed").length) *
            100
        )
      : 0;

  return {
    games,
    myGames,
    currentGame,
    isLoading,
    isCreating,
    error,
    winRate,
    fetchGames,
    fetchMyGames,
    createGame,
    joinGame,
    makeMove,
    revealMove,
    fetchGame,
    resetCurrentGame,
    setError,
  };
}
