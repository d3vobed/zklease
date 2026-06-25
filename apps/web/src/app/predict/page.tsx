"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Trophy,
  Users,
  Coins,
  Loader2,
  Plus,
  Clock,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Wallet,
} from "lucide-react";
import Link from "next/link";

interface Prediction {
  id: string;
  question: string;
  options: string[];
  bets: number[];
  totalBets: number;
  resolutionTime: number;
  resolved: boolean;
  winningOption: number;
  myBet?: number;
}

const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: "pred-1",
    question: "Will XLM price exceed $0.50 by June 30?",
    options: ["Yes", "No"],
    bets: [850, 420],
    totalBets: 1270,
    resolutionTime: Date.now() + 86400000 * 3,
    resolved: false,
    winningOption: 0,
  },
  {
    id: "pred-2",
    question: "Will Stellar Protocol 27 pass in July?",
    options: ["Yes, before July 15", "Yes, after July 15", "No"],
    bets: [1200, 600, 200],
    totalBets: 2000,
    resolutionTime: Date.now() + 86400000 * 7,
    resolved: false,
    winningOption: 0,
  },
  {
    id: "pred-3",
    question: "ZKLease wins the Stellar Hackathon?",
    options: ["Grand Prize", "Runner Up", "No"],
    bets: [500, 300, 100],
    totalBets: 900,
    resolutionTime: Date.now() + 86400000 * 5,
    resolved: true,
    winningOption: 0,
    myBet: 0,
  },
];

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "Ended";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

export default function PredictPage() {
  const { isConnected, connect, isConnecting, publicKey } = useWallet();
  const [predictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [creating, setCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState("");
  const [betAmounts, setBetAmounts] = useState<Record<string, string>>({});

  const handleCreatePrediction = () => {
    setCreating(false);
    setNewQuestion("");
    setNewOptions("");
  };

  const handlePlaceBet = (predictionId: string, optionIndex: number) => {
    console.log("Placing bet on", predictionId, "option", optionIndex);
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <TrendingUp className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="mb-3 text-3xl font-bold">Predict & Profit</h1>
          <p className="mb-8 max-w-md text-zinc-400">
            Connect your wallet to browse prediction markets and place bets on
            real-world outcomes. ZK privacy keeps your positions hidden.
          </p>
          <Button size="lg" onClick={connect} disabled={isConnecting}>
            {isConnecting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Connecting...</>
            ) : (
              <><Wallet className="mr-2 h-5 w-5" /> Connect Wallet</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const activePredictions = predictions.filter((p) => !p.resolved);
  const resolvedPredictions = predictions.filter((p) => p.resolved);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">
            <span className="gradient-text">Predict</span> & Profit
          </h1>
          <p className="text-zinc-400">
            Bet on real-world outcomes with privacy-preserving ZK proofs
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Prediction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Prediction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Question</Label>
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. Will XLM reach $1?"
                />
              </div>
              <div>
                <Label>Options (comma separated)</Label>
                <Input
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="Yes, No, Maybe"
                />
              </div>
              <Button onClick={handleCreatePrediction} className="w-full">
                Create Prediction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activePredictions.length}</p>
              <p className="text-xs text-muted-foreground">Active Markets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Total Bettors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Coins className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">$—</p>
              <p className="text-xs text-muted-foreground">Total Volume</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 text-xl font-semibold">Active Markets</h2>
      {activePredictions.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">No Active Markets</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to create a prediction market.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {activePredictions.map((pred) => {
            const maxBet = Math.max(...pred.bets, 1);
            return (
              <Card key={pred.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {pred.question}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatTimeLeft(pred.resolutionTime - Date.now())}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pred.options.map((option, idx) => {
                    const betAmount = pred.bets[idx] || 0;
                    const pct = pred.totalBets > 0 ? (betAmount / pred.totalBets) * 100 : 0;
                    const inputKey = `${pred.id}-${idx}`;
                    return (
                      <div key={option} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span>{option}</span>
                          <span className="text-muted-foreground">
                            {betAmount} USDC ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="prediction-bar">
                          <div
                            className="prediction-bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={betAmounts[inputKey] || ""}
                            onChange={(e) =>
                              setBetAmounts((prev) => ({
                                ...prev,
                                [inputKey]: e.target.value,
                              }))
                            }
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePlaceBet(pred.id, idx)}
                            disabled={!betAmounts[inputKey]}
                          >
                            Bet
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {resolvedPredictions.length > 0 && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Resolved</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {resolvedPredictions.map((pred) => (
              <Card key={pred.id} className="relative overflow-hidden opacity-80">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{pred.question}</CardTitle>
                    <Badge variant="success">
                      <Trophy className="mr-1 h-3 w-3" />
                      {pred.options[pred.winningOption]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {pred.options.map((option, idx) => {
                    const betAmount = pred.bets[idx] || 0;
                    const pct = pred.totalBets > 0 ? (betAmount / pred.totalBets) * 100 : 0;
                    const won = idx === pred.winningOption;
                    return (
                      <div
                        key={option}
                        className={`mb-2 rounded-lg p-3 ${
                          won
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {option}
                            {won && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          </span>
                          <span className="text-muted-foreground">
                            {betAmount} USDC ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="prediction-bar mt-1">
                          <div
                            className={`prediction-bar-fill ${
                              won ? "bg-emerald-500" : ""
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {pred.myBet !== undefined && (
                    <Button size="sm" className="mt-3 w-full">
                      <Coins className="mr-2 h-4 w-4" />
                      Claim Winnings
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
