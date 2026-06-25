"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { api, type Credential } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CredentialCard } from "@/components/credential-card";
import { VerificationHistory } from "@/components/verification-history";
import { truncateAddress, formatAmount } from "@/lib/utils";
import {
  Wallet,
  Shield,
  Award,
  Activity,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  ArrowRight,
  Swords,
  TrendingUp,
  Gamepad2,
  Trophy,
  Coins,
  Percent,
  Clock,
  Play,
  Eye,
  FileCode,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ActiveGame {
  id: string;
  type: "rps" | "prediction";
  entryFee: string;
  status: "waiting" | "committed" | "reveal" | "completed";
  opponent?: string;
  myMove?: string;
  outcome?: "win" | "lose" | "draw";
  createdAt: number;
}

interface Prediction {
  id: string;
  market: string;
  amount: string;
  position: string;
  status: "active" | "won" | "lost" | "claimed";
  outcome?: string;
  payout?: string;
  createdAt: number;
  resolvedAt?: number;
}

interface ChainGame {
  id: string;
  creator: string;
  opponent: string | null;
  entryFee: number;
  state: string;
  winner: string | null;
  createdAt: number;
}

export default function DashboardPage() {
  const { publicKey, isConnected, connect, isConnecting } = useWallet();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoadingCreds, setIsLoadingCreds] = useState(true);
  const [copied, setCopied] = useState(false);
  const [chainGames, setChainGames] = useState<any[]>([]);
  const [chainPredictions, setChainPredictions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/games").then((r) => r.json().then((d) => setChainGames(d.games || [])).catch(() => {}));
    fetch("/api/predictions").then((r) => r.json().then((d) => setChainPredictions(d.predictions || [])).catch(() => {}));
  }, []);

  const activeGames: ActiveGame[] = chainGames.map((g: ChainGame) => ({
    id: g.id,
    type: "rps" as const,
    entryFee: String(g.entryFee),
    status: g.state === "Completed" ? "completed" as const : g.state === "AwaitingReveal" ? "committed" as const : "waiting" as const,
    opponent: g.opponent ? g.opponent.slice(0, 4) + "…" + g.opponent.slice(-4) : undefined,
    createdAt: g.createdAt,
  }));

  const myPredictions: Prediction[] = chainPredictions.map((p: any) => ({
    id: p.id,
    market: p.question || "",
    amount: "0",
    position: "",
    status: p.resolved ? ("won" as const) : ("active" as const),
    outcome: p.resolved ? p.options[p.winningOption] || "" : "",
    payout: "",
    createdAt: p.resolutionTime,
  }));

  const handleCopy = useCallback(async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey) {
      setCredential(null);
      setIsLoadingCreds(false);
      return;
    }

    const fetchCredential = async () => {
      setIsLoadingCreds(true);
      try {
        const data = await api.getCredential(publicKey);
        setCredential(data);
      } catch {
        setCredential(null);
      } finally {
        setIsLoadingCreds(false);
      }
    };

    fetchCredential();
  }, [publicKey]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-teal-500/20">
            <Wallet className="h-10 w-10 text-purple-400" />
          </div>
          <h1 className="mb-3 text-3xl font-bold">Dashboard</h1>
          <p className="mb-8 max-w-md text-zinc-400">
            Connect your Stellar wallet to view your games, predictions,
            credentials, and more.
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

  const totalProofs = credential?.txHashes?.length ?? 0;
  const gamesPlayed = activeGames.length;
  const gamesWon = chainGames.filter((g: any) => g.state === "Completed" && g.winner).length;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const totalPredictions = myPredictions.length;
  const totalWinnings = myPredictions
    .filter((p) => p.status === "won" || p.status === "claimed")
    .reduce((sum, p) => sum + parseFloat(p.payout || "0"), 0);

  const stats = [
    {
      icon: Award,
      label: "Credential",
      value: credential?.verified ? "Active" : "None",
      gradient: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: Swords,
      label: "Games Played",
      value: gamesPlayed.toString(),
      gradient: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-400",
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: `${winRate}%`,
      gradient: "from-teal-500/20 to-cyan-500/20",
      iconColor: "text-teal-400",
    },
    {
      icon: TrendingUp,
      label: "Predictions",
      value: totalPredictions.toString(),
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
    },
    {
      icon: Trophy,
      label: "Total Winnings",
      value: `$${formatAmount(totalWinnings, 2)}`,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  const getStatusBadge = (status: ActiveGame["status"]) => {
    switch (status) {
      case "waiting":
        return <Badge variant="warning">Waiting</Badge>;
      case "committed":
        return <Badge variant="default">Active</Badge>;
      case "reveal":
        return <Badge variant="success">Reveal Ready</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
    }
  };

  const getPredictionStatusBadge = (status: Prediction["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "won":
        return <Badge variant="success">Won</Badge>;
      case "lost":
        return <Badge variant="destructive">Lost</Badge>;
      case "claimed":
        return <Badge variant="success">Claimed</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-zinc-400">
          Your games, predictions, credentials, and activity
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20">
              <Wallet className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Connected Wallet</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm font-medium">
                  {truncateAddress(publicKey!, 8)}
                </code>
                <button
                  onClick={handleCopy}
                  className="rounded p-1 text-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <Badge
                  variant="success"
                  className="flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                if (!publicKey) return;
                const res = await fetch(`/api/faucet?address=${publicKey}`);
                const data = await res.json();
                if (data.success) alert("Account funded! 10,000 XLM added.");
                else alert("Funding failed: " + (data.error || "unknown"));
              }}
            >
              <Coins className="mr-2 h-4 w-4" />
              Fund Account
            </Button>
            <Button asChild variant="outline">
              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </a>
            </Button>
            <Button asChild>
              <Link href="/play">
                <Swords className="mr-2 h-4 w-4" />
                Play Game
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <FileCode className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ZKLease Contract</p>
              <code className="font-mono text-xs sm:text-sm">
CAWSA6HEU3KCIU64A3P3AMQWF5E7UDKE6PWWEFDFJO4V7TPSYGC3M4LW
              </code>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <a
              href="https://stellar.expert/explorer/testnet/contract/CAWSA6HEU3KCIU64A3P3AMQWF5E7UDKE6PWWEFDFJO4V7TPSYGC3M4LW"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              View Contract
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
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

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Gamepad2 className="h-5 w-5 text-purple-400" />
            Active Games
          </h2>
          {activeGames.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10">
                  <Gamepad2 className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No Active Games</h3>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                  Start a private game to see it here.
                </p>
                <Button asChild>
                  <Link href="/play">
                    <Swords className="mr-2 h-4 w-4" />
                    Start Playing
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeGames.map((game) => {
                const Icon = game.type === "rps" ? Swords : TrendingUp;
                return (
                  <Card key={game.id} className="game-card-hover">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-teal-500/20">
                          <Icon className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium capitalize">
                              {game.type === "rps"
                                ? "Rock Paper Scissors"
                                : "Prediction Market"}
                            </p>
                            {getStatusBadge(game.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {game.entryFee} USDC entry
                            {game.opponent && (
                              <> vs {game.opponent}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {game.status === "reveal" && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Reveal
                          </Button>
                        )}
                        {game.status === "committed" && (
                          <Button size="sm" variant="outline" disabled>
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            Waiting
                          </Button>
                        )}
                        {game.status === "waiting" && (
                          <Button size="sm" variant="outline">
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            Join
                          </Button>
                        )}
                        {game.status === "completed" && (
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            Prediction History
          </h2>
          {myPredictions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="mb-2 text-lg font-medium">
                  No Predictions Yet
                </h3>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                  Make your first prediction to see it here.
                </p>
                <Button asChild>
                  <Link href="/predict">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Make Prediction
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Market
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Position
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Payout
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPredictions.map((prediction) => (
                        <tr
                          key={prediction.id}
                          className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="max-w-[200px] truncate px-4 py-3 text-sm">
                            {prediction.market}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                            ${prediction.amount}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                prediction.position === "Yes"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {prediction.position}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-emerald-400">
                            {prediction.payout
                              ? `$${formatAmount(prediction.payout, 2)}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {getPredictionStatusBadge(prediction.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {isLoadingCreds ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-muted-foreground" />
              Credential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : credential?.verified ? (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Award className="h-5 w-5 text-purple-400" />
            Verified Credential
          </h2>
          <CredentialCard credential={credential} />
        </div>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-muted-foreground" />
              Credential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-teal-500/10">
                <Award className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="mb-2 text-lg font-medium">
                No Credential Yet
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Generate your first zero-knowledge proof to receive a verified
                credential.
              </p>
              <Button asChild>
                <Link href="/verify">
                  <Shield className="mr-2 h-4 w-4" />
                  Generate Proof
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <VerificationHistory />
    </div>
  );
}
