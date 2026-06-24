"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { api, type Credential } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CredentialCard } from "@/components/credential-card";
import { VerificationHistory } from "@/components/verification-history";
import { truncateAddress } from "@/lib/utils";
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
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { publicKey, isConnected, connect, isConnecting } = useWallet();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoadingCreds, setIsLoadingCreds] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

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
            Connect your Stellar wallet to view your credentials, verification
            history, and manage your proofs.
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

  const stats = [
    {
      icon: Award,
      label: "Credential",
      value: credential?.verified ? "1" : "0",
      gradient: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: Shield,
      label: "Total Proofs",
      value: totalProofs.toString(),
      gradient: "from-teal-500/20 to-cyan-500/20",
      iconColor: "text-teal-400",
    },
    {
      icon: Activity,
      label: "Verifications",
      value: totalProofs.toString(),
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-zinc-400">
          Manage your credentials and verification history
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
              <Link href="/verify">
                New Proof
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
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
          <CredentialCard
            credential={credential}
          />
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
