"use client";

import Link from "next/link";
import { Swords, Users, Coins, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, truncateAddress } from "@/lib/utils";
import type { Game } from "@/hooks/use-game";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }
> = {
  waiting: { label: "Open", variant: "secondary" },
  committed: { label: "Committed", variant: "warning" },
  revealing: { label: "Revealing", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface GameCardProps {
  game: Game;
  onJoin?: (gameId: string) => void;
  isJoining?: boolean;
}

export function GameCard({ game, onJoin, isJoining }: GameCardProps) {
  const status = statusConfig[game.status] ?? statusConfig.waiting;
  const playerCount = game.players.length;
  const timeAgo = Math.floor((Date.now() - game.createdAt) / 1000);
  const timeDisplay =
    timeAgo < 60
      ? `${timeAgo}s ago`
      : timeAgo < 3600
        ? `${Math.floor(timeAgo / 60)}m ago`
        : `${Math.floor(timeAgo / 3600)}h ago`;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5",
        game.status === "completed" && "hover:border-emerald-500/30"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <CardContent className="relative p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-teal-500/20">
              <Swords className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">RPS Game</p>
              <p className="font-mono text-xs font-medium">
                {truncateAddress(game.id, 6)}
              </p>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-lg bg-white/5 p-2">
            <Coins className="mb-1 h-4 w-4 text-amber-400" />
            <p className="text-sm font-bold">{game.entryFee}</p>
            <p className="text-[10px] text-muted-foreground">USDC</p>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-white/5 p-2">
            <Users className="mb-1 h-4 w-4 text-purple-400" />
            <p className="text-sm font-bold">
              {playerCount}
              <span className="text-muted-foreground">/2</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Players</p>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-white/5 p-2">
            <Clock className="mb-1 h-4 w-4 text-teal-400" />
            <p className="text-sm font-bold">{timeDisplay}</p>
            <p className="text-[10px] text-muted-foreground">Created</p>
          </div>
        </div>

        {game.winner && (
          <div className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-center text-xs text-emerald-400">
            Winner: {truncateAddress(game.winner, 6)}
          </div>
        )}

        <div className="flex gap-2">
          {game.status === "completed" || game.status === "cancelled" ? (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/play/rps/${game.id}`}>View Details</Link>
            </Button>
          ) : playerCount < 2 ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onJoin?.(game.id)}
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join Game"}
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/play/rps/${game.id}`}>View Game</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
