"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { useGame, type MoveOption } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Swords,
  Users,
  Coins,
  Loader2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Clock,
  Wallet,
  Hand,
} from "lucide-react";
import { cn, truncateAddress } from "@/lib/utils";
import Link from "next/link";

const statusBadge: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }
> = {
  waiting: { label: "Waiting", variant: "secondary" },
  committed: { label: "Moves Committed", variant: "warning" },
  revealing: { label: "Revealing", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const MOVE_EMOJIS: Record<MoveOption, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

function useCountdown(target: number | undefined): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!target) return;
    const update = () => setRemaining(Math.max(0, target - Date.now()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [target]);
  return remaining;
}

export default function RPSGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { isConnected, connect, isConnecting, publicKey } = useWallet();
  const {
    currentGame,
    isLoading,
    error,
    fetchGame,
    joinGame,
    makeMove,
    revealMove,
    setError,
  } = useGame();

  const [selectedMove, setSelectedMove] = useState<MoveOption | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchGame(gameId);
    }
  }, [gameId, fetchGame]);

  const handleJoin = useCallback(async () => {
    setIsJoining(true);
    await joinGame(gameId);
    setIsJoining(false);
    fetchGame(gameId);
  }, [gameId, joinGame, fetchGame]);

  const handleCommit = useCallback(async () => {
    if (!selectedMove) return;
    setIsCommitting(true);
    await makeMove(gameId, selectedMove);
    setIsCommitting(false);
    fetchGame(gameId);
  }, [gameId, selectedMove, makeMove, fetchGame]);

  const handleReveal = useCallback(async () => {
    setIsRevealing(true);
    await revealMove(gameId);
    setIsRevealing(false);
    fetchGame(gameId);
  }, [gameId, revealMove, fetchGame]);

  const handlePlayAgain = useCallback(() => {
    setSelectedMove(null);
    setError(null);
    fetchGame(gameId);
  }, [gameId, fetchGame, setError]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-teal-500/20">
            <Wallet className="h-10 w-10 text-purple-400" />
          </div>
          <h2 className="mb-3 text-2xl font-bold">Wallet Required</h2>
          <p className="mb-8 max-w-md text-zinc-400">
            Connect your wallet to join this game.
          </p>
          <Button size="lg" onClick={connect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="mb-3 text-2xl font-bold">Game Not Found</h2>
          <p className="mb-8 text-zinc-400">
            This game does not exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/play">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lobby
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { status, players, entryFee, winner } = currentGame;
  const myPlayer = players.find((p) => p.address === publicKey);
  const opponent = players.find((p) => p.address !== publicKey);
  const isCreator = currentGame.creator === publicKey;
  const needsOpponent = players.length < 2;
  const badge = statusBadge[status] ?? statusBadge.waiting;

  const allCommitted = players.length === 2 && players.every((p) => p.committed);
  const allRevealed = players.length === 2 && players.every((p) => p.revealed);
  const myCommitted = myPlayer?.committed ?? false;
  const myRevealed = myPlayer?.revealed ?? false;
  const opponentCommitted = opponent?.committed ?? false;
  const opponentRevealed = opponent?.revealed ?? false;
  const canReveal = myCommitted && !myRevealed && opponentCommitted && !allRevealed;
  const canCommit = !myCommitted && !needsOpponent && !selectedMove;

  const iWon = winner === publicKey;
  const iLost = winner && winner !== publicKey;
  const isDraw = status === "completed" && !winner;

  const amICreator = currentGame.creator === publicKey;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-grid" />

      <div className="relative mb-6">
        <Link
          href="/play"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lobby
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-2xl font-bold">Rock Paper Scissors</h1>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <code className="font-mono text-xs text-muted-foreground">
              Game: {truncateAddress(gameId, 12)}
            </code>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400">
              <Coins className="h-4 w-4" />
              {entryFee} USDC
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="relative mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-400 hover:text-red-300"
            onClick={() => { setError(null); fetchGame(gameId); }}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="relative mb-8 grid gap-4 sm:grid-cols-2">
        <Card className={cn(myPlayer && "border-purple-500/20")}>
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {isCreator ? "You (Creator)" : "You"}
            </div>
            <p className="font-mono text-sm font-medium">
              {publicKey ? truncateAddress(publicKey, 8) : "Not connected"}
            </p>
            {myPlayer?.move && myPlayer.revealed && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-2">
                <span className="text-lg">{MOVE_EMOJIS[myPlayer.move]}</span>
                <span className="text-sm font-medium capitalize">
                  {myPlayer.move}
                </span>
              </div>
            )}
            {myPlayer?.committed && !myPlayer.revealed && (
              <div className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                Move committed (hidden)
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={cn(
            !needsOpponent && opponent ? "border-emerald-500/20" : "border-zinc-800"
          )}
        >
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {needsOpponent ? "Opponent" : opponent!.address === currentGame.creator ? "Opponent (Creator)" : "Opponent"}
            </div>
            {needsOpponent ? (
              <div className="flex flex-col items-center py-3 text-center">
                <div className="mb-2 h-8 w-8 animate-pulse rounded-full bg-white/10" />
                <p className="text-sm text-muted-foreground">
                  Waiting for opponent...
                </p>
              </div>
            ) : (
              <>
                <p className="font-mono text-sm font-medium">
                  {truncateAddress(opponent!.address, 8)}
                </p>
                {opponent?.revealed && opponent?.move && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
                    <span className="text-lg">{MOVE_EMOJIS[opponent.move]}</span>
                    <span className="text-sm font-medium capitalize">
                      {opponent.move}
                    </span>
                  </div>
                )}
                {opponent?.committed && !opponent?.revealed && (
                  <div className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                    Move committed (hidden)
                  </div>
                )}
                {!opponent?.committed && (
                  <div className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                    Has not moved yet
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {needsOpponent && amICreator && (
        <Card className="relative mb-8 border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Waiting for Opponent
            </h3>
            <p className="mb-6 max-w-md text-sm text-zinc-400">
              Share the game ID with someone so they can join. The game will
              start once an opponent connects.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 font-mono text-sm">
              <code>{truncateAddress(gameId, 16)}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/play/rps/${gameId}`
                  );
                }}
              >
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {needsOpponent && !amICreator && (
        <div className="relative mb-8">
          <Button
            size="lg"
            className="w-full"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Joining Game...
              </>
            ) : (
              <>
                <Swords className="mr-2 h-5 w-5" />
                Join Game
              </>
            )}
          </Button>
        </div>
      )}

      {!needsOpponent && status !== "completed" && status !== "cancelled" && (
        <div className="relative mb-8">
          {allRevealed ? null : canReveal ? (
            <div className="space-y-4">
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-5 text-center">
                  <div className="mb-2 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                    <CheckCircle2 className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="mb-1 font-semibold">
                    Opponent Has Committed
                  </h3>
                  <p className="mb-4 text-sm text-zinc-400">
                    Reveal your move to see who wins!
                  </p>
                  <Button
                    size="lg"
                    onClick={handleReveal}
                    disabled={isRevealing}
                    className="animate-pulse-glow"
                  >
                    {isRevealing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Revealing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Reveal My Move
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : myCommitted && !opponentCommitted ? (
            <Card className="border-purple-500/20">
              <CardContent className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">
                  Waiting for Opponent
                </h3>
                <p className="text-sm text-zinc-400">
                  You committed your move. Waiting for the opponent to commit
                  theirs.
                </p>
              </CardContent>
            </Card>
          ) : status === "committed" && !myRevealed ? (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-5 text-center">
                <h3 className="mb-4 font-semibold">
                  Both Players Committed — Time to Reveal!
                </h3>
                <Button
                  size="lg"
                  onClick={handleReveal}
                  disabled={isRevealing}
                  className="animate-pulse-glow"
                >
                  {isRevealing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Revealing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Reveal My Move
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : !myCommitted && !opponentCommitted && selectedMove ? (
            <div className="space-y-4">
              <Card className="border-purple-500/20">
                <CardContent className="p-5">
                  <div className="mb-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      You selected:
                    </p>
                    <p className="text-2xl font-bold capitalize">
                      {MOVE_EMOJIS[selectedMove]} {selectedMove}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleCommit}
                    disabled={isCommitting}
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Committing Move...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Commit Move
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-muted-foreground"
                    onClick={() => setSelectedMove(null)}
                  >
                    Change selection
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>
              {status !== "committed" && status !== "revealing" && (
                <>
                  <h3 className="mb-4 text-center text-lg font-semibold">
                    Make Your Move
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {(["rock", "paper", "scissors"] as MoveOption[]).map(
                      (move) => {
                        const isSelected = selectedMove === move;
                        return (
                          <button
                            key={move}
                            onClick={() => setSelectedMove(move)}
                            className={cn(
                              "group relative flex flex-col items-center gap-3 rounded-xl border p-6 transition-all duration-200",
                              isSelected
                                ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10 scale-105"
                                : "border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 hover:scale-[1.02]"
                            )}
                          >
                            <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
                              {MOVE_EMOJIS[move]}
                            </span>
                            <span
                              className={cn(
                                "text-sm font-semibold capitalize",
                                isSelected && "text-purple-300"
                              )}
                            >
                              {move}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </>
              )}

              {!myCommitted && opponentCommitted && (
                <Card className="mt-4 border-amber-500/20 bg-amber-500/5">
                  <CardContent className="p-5 text-center">
                    <h3 className="mb-1 font-semibold">
                      Opponent has committed their move
                    </h3>
                    <p className="mb-4 text-sm text-zinc-400">
                      Select your move and commit to proceed.
                    </p>
                    {selectedMove && (
                      <Button
                        size="lg"
                        onClick={handleCommit}
                        disabled={isCommitting}
                        className="animate-pulse-glow"
                      >
                        {isCommitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Committing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Commit Move
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {status === "completed" && (
        <div className="relative mb-8">
          <Card
            className={cn(
              "overflow-hidden border",
              iWon
                ? "border-emerald-500/30"
                : iLost
                  ? "border-red-500/20"
                  : "border-amber-500/20"
            )}
          >
            <div
              className={cn(
                "p-8 text-center",
                iWon && "bg-gradient-to-b from-emerald-500/10 to-transparent",
                iLost && "bg-gradient-to-b from-red-500/10 to-transparent",
                isDraw && "bg-gradient-to-b from-amber-500/10 to-transparent"
              )}
            >
              {iWon && (
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <Trophy className="h-8 w-8 text-emerald-400" />
                </div>
              )}
              {iLost && (
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              )}
              {isDraw && (
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
                  <Hand className="h-8 w-8 text-amber-400" />
                </div>
              )}

              <h2
                className={cn(
                  "mb-2 text-2xl font-bold",
                  iWon && "text-emerald-400",
                  iLost && "text-red-400",
                  isDraw && "text-amber-400"
                )}
              >
                {iWon && "You Won!"}
                {iLost && "You Lost"}
                {isDraw && "It's a Draw!"}
              </h2>

              <p className="mb-6 text-zinc-400">
                {iWon && `Congratulations! You won ${entryFee * 2} USDC.`}
                {iLost && `Better luck next time! You lost ${entryFee} USDC.`}
                {isDraw && "No winner this round. The pot rolls over."}
              </p>

              <div className="mx-auto mb-6 grid max-w-xs grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">You played</p>
                  <p className="mt-1 text-xl">
                    {myPlayer?.move ? MOVE_EMOJIS[myPlayer.move] : "?"}
                  </p>
                  <p className="text-xs font-medium capitalize">
                    {myPlayer?.move ?? "Unknown"}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Opponent played</p>
                  <p className="mt-1 text-xl">
                    {opponent?.move ? MOVE_EMOJIS[opponent.move] : "?"}
                  </p>
                  <p className="text-xs font-medium capitalize">
                    {opponent?.move ?? "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  variant="outline"
                  onClick={handlePlayAgain}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Play Again
                </Button>
                <Button asChild>
                  <Link href="/play">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Lobby
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {status === "cancelled" && (
        <Card className="relative border-red-500/20">
          <CardContent className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Game Cancelled</h3>
            <p className="mb-6 text-sm text-zinc-400">
              This game was cancelled. All entry fees will be refunded.
            </p>
            <Button asChild>
              <Link href="/play">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lobby
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!needsOpponent && status !== "completed" && status !== "cancelled" && (
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => fetchGame(gameId)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Game State
          </Button>
        </div>
      )}
    </div>
  );
}
