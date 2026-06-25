"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Clock,
  Trophy,
  Coins,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, truncateAddress, formatAmount } from "@/lib/utils";

interface Bet {
  address: string;
  optionIndex: number;
  amount: number;
}

interface Option {
  label: string;
  totalBets: number;
}

export type PredictionStatus = "open" | "resolved" | "cancelled";

export interface Prediction {
  id: string;
  question: string;
  options: Option[];
  creator: string;
  status: PredictionStatus;
  endTime: number;
  resolvedAt?: number;
  winningOption?: number;
  totalPool: number;
  bets: Bet[];
  userBet?: { optionIndex: number; amount: number };
}

interface PredictionCardProps {
  prediction: Prediction;
  userAddress?: string | null;
  onBet?: (id: string, optionIndex: number) => void;
  onClaim?: (id: string) => void;
  isBetting?: boolean;
  isClaiming?: boolean;
}

function Countdown({ endTime }: { endTime: number }) {
  const [remaining, setRemaining] = useState(endTime - Date.now());

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining(endTime - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, remaining]);

  if (remaining <= 0) {
    return <span className="text-emerald-400">Ended</span>;
  }

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <span className="tabular-nums">
      {hours > 0 ? `${hours}h ` : ""}
      {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
    </span>
  );
}

export function PredictionCard({
  prediction,
  userAddress,
  onBet,
  onClaim,
  isBetting,
  isClaiming,
}: PredictionCardProps) {
  const isOpen = prediction.status === "open";
  const isResolved = prediction.status === "resolved";
  const totalBets = prediction.options.reduce((s, o) => s + o.totalBets, 0);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5",
        isResolved && "hover:border-emerald-500/30"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <CardContent className="relative p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant={
                  isResolved
                    ? "success"
                    : isOpen
                      ? "warning"
                      : "destructive"
                }
              >
                {isResolved ? "Resolved" : isOpen ? "Open" : "Cancelled"}
              </Badge>
              {isResolved && prediction.winningOption !== undefined && (
                <Badge variant="success" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {prediction.options[prediction.winningOption].label}
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold leading-snug">
              {prediction.question}
            </h3>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
        </div>

        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            {formatAmount(prediction.totalPool)} USDC
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-purple-400" />
            {prediction.bets.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-teal-400" />
            {isResolved ? (
              <span className="text-emerald-400">Ended</span>
            ) : (
              <Countdown endTime={prediction.endTime} />
            )}
          </span>
        </div>

        <div className="mb-3 space-y-2">
          {prediction.options.map((option, idx) => {
            const percentage = totalBets > 0 ? (option.totalBets / totalBets) * 100 : 0;
            const isWinning =
              isResolved && prediction.winningOption === idx;
            const isUserBet =
              prediction.userBet?.optionIndex === idx;

            return (
              <div
                key={idx}
                className={cn(
                  "relative overflow-hidden rounded-lg border p-3 transition-colors",
                  isWinning
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-white/5 bg-white/5",
                  isUserBet && "border-purple-500/30 bg-purple-500/10"
                )}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{option.label}</span>
                    {isWinning && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    {isUserBet && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        Your bet
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-bold">
                    {formatAmount(option.totalBets)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({Math.round(percentage)}%)
                    </span>
                  </span>
                </div>
                <div
                  className={cn(
                    "absolute inset-0 z-0 rounded-lg transition-all duration-500",
                    isWinning
                      ? "bg-gradient-to-r from-emerald-500/20 to-transparent"
                      : "bg-gradient-to-r from-white/5 to-transparent"
                  )}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            );
          })}
        </div>

        {prediction.userBet && isOpen && (
          <div className="mb-3 rounded-lg bg-purple-500/10 px-3 py-1.5 text-center text-xs text-purple-400">
            Your bet: {formatAmount(prediction.userBet.amount)} USDC on{" "}
            {prediction.options[prediction.userBet.optionIndex].label}
          </div>
        )}

        <div className="flex gap-2">
          {isResolved && prediction.userBet && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onClaim?.(prediction.id)}
              disabled={isClaiming}
            >
              {isClaiming ? (
                "Claiming..."
              ) : (
                <>
                  <Coins className="mr-1.5 h-4 w-4" />
                  Claim Winnings
                </>
              )}
            </Button>
          )}
          {isOpen && !prediction.userBet && (
            <div className="flex w-full gap-2">
              {prediction.options.map((option, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onBet?.(prediction.id, idx)}
                  disabled={isBetting}
                >
                  Bet {option.label}
                </Button>
              ))}
            </div>
          )}
          {isOpen && prediction.userBet && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled
            >
              Bet Placed
            </Button>
          )}
          {!isOpen && !prediction.userBet && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled
            >
              {isResolved ? "Resolved" : "Closed"}
            </Button>
          )}
        </div>

        <p className="mt-2 text-[10px] text-muted-foreground">
          Created by {truncateAddress(prediction.creator, 6)}
        </p>
      </CardContent>
    </Card>
  );
}
