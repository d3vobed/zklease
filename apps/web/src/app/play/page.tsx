"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { useGame } from "@/hooks/use-game";
import { GameCard } from "@/components/game-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Swords,
  Trophy,
  Users,
  Wallet,
  Loader2,
  Plus,
  Gamepad2,
  AlertCircle,
  ArrowRight,
  Dices,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PlayPage() {
  const { isConnected, connect, isConnecting, publicKey } = useWallet();
  const {
    games,
    isLoading,
    error,
    fetchGames,
    createGame,
    joinGame,
    isCreating,
    winRate,
  } = useGame();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [entryFee, setEntryFee] = useState("10");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleCreate = useCallback(async () => {
    const fee = parseFloat(entryFee);
    if (isNaN(fee) || fee <= 0) return;
    const gameId = await createGame(fee);
    if (gameId) {
      setCreateOpen(false);
      setEntryFee("10");
      router.push(`/play/rps/${gameId}`);
    }
  }, [entryFee, createGame, router]);

  const handleJoin = useCallback(
    async (gameId: string) => {
      setJoiningId(gameId);
      const success = await joinGame(gameId);
      setJoiningId(null);
      if (success) {
        router.push(`/play/rps/${gameId}`);
      }
    },
    [joinGame, router]
  );

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-teal-500/20">
            <Gamepad2 className="h-10 w-10 text-purple-400" />
          </div>
          <h1 className="mb-3 text-3xl font-bold">Play & Earn</h1>
          <p className="mb-8 max-w-md text-zinc-400">
            Connect your wallet to play Rock-Paper-Scissors games and compete
            for prizes on-chain.
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

  const activeGames = games.filter((g) => g.status !== "completed" && g.status !== "cancelled");
  const completedGames = games.filter((g) => g.status === "completed");

  const stats = [
    {
      icon: Swords,
      label: "Active Games",
      value: activeGames.length,
      gradient: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: Users,
      label: "Total Games",
      value: games.length,
      gradient: "from-teal-500/20 to-cyan-500/20",
      iconColor: "text-teal-400",
    },
    {
      icon: Trophy,
      label: "Win Rate",
      value: `${winRate}%`,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
    },
  ];

  const displayGames = activeGames.length > 0 ? activeGames : completedGames;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-grid" />

      <div className="relative mb-8">
        <div className="pointer-events-none absolute -inset-x-20 -top-40 h-48 bg-gradient-to-b from-purple-500/10 via-teal-500/5 to-transparent blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-300 backdrop-blur-sm">
              <Swords className="h-3.5 w-3.5" />
              Gaming Arena
            </div>
            <h1 className="text-3xl font-bold">
              Play &{" "}
              <span className="bg-gradient-to-r from-purple-400 via-teal-400 to-amber-400 bg-clip-text text-transparent">
                Earn
              </span>
            </h1>
            <p className="mt-1 text-zinc-400">
              Challenge opponents in Rock-Paper-Scissors and win USDC
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="group shrink-0">
                <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                Create Game
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-purple-400" />
                  New RPS Game
                </DialogTitle>
                <DialogDescription>
                  Set the entry fee and invite an opponent to play
                  Rock-Paper-Scissors.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="entryFee">Entry Fee (USDC)</Label>
                  <div className="relative">
                    <Input
                      id="entryFee"
                      type="number"
                      min="1"
                      step="1"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      placeholder="10"
                      className="pl-8"
                    />
                    <CoinsIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Both players stake this amount. Winner takes all minus fees.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !entryFee || parseFloat(entryFee) <= 0}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Create & Play
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}
                >
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="relative mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-400 hover:text-red-300"
            onClick={() => fetchGames()}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="relative mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Dices className="h-5 w-5 text-amber-400" />
          Other Games
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/play/dice">
            <Card className="cursor-pointer border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-red-500/5 transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20">
                  <Dices className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold">Dice Roll</p>
                  <p className="text-sm text-muted-foreground">
                    Guess the number and win 5x your bet
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="relative flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayGames.length === 0 ? (
        <div className="relative">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-teal-500/10">
                <Swords className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No Active Games</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                There are no games available right now. Create the first one and
                challenge someone to play!
              </p>
              <Button
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create the First Game
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onJoin={handleJoin}
              isJoining={joiningId === game.id}
            />
          ))}
        </div>
      )}

      {completedGames.length > 0 && activeGames.length > 0 && (
        <div className="relative mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-amber-400" />
            Recent Completed Games
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {completedGames.slice(0, 3).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CoinsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="M16.71 13.88l.7.71-2.82 2.82" />
    </svg>
  );
}
