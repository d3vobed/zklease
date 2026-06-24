"use client";

import { useProof } from "@/hooks/use-proof";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowRight,
  Wallet,
  Key,
} from "lucide-react";

const proofSteps = [
  { key: "generating", label: "Generating ZK Proof", icon: Key },
  { key: "submitting", label: "Submitting to Chain", icon: ArrowRight },
  { key: "verifying", label: "Verifying On-Chain", icon: Shield },
  { key: "success", label: "Proof Verified", icon: CheckCircle2 },
];

const stepOrder = ["generating", "submitting", "verifying", "success"];

export function BalanceProof() {
  const { publicKey, isConnected } = useWallet();
  const {
    status,
    threshold,
    progress,
    error,
    transactionId,
    credentialId,
    setThreshold,
    generateProof,
    reset,
  } = useProof();

  const isRunning =
    status === "generating" || status === "submitting" || status === "verifying";

  const currentStepIndex = stepOrder.indexOf(status);

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            Prove USDC Balance
          </CardTitle>
          <CardDescription>
            Generate a zero-knowledge proof that you hold at least the specified
            amount of USDC without revealing your actual balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-8 text-center">
              <Wallet className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">Wallet Required</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Connect your Stellar wallet to generate a balance proof.
              </p>
            </div>
          ) : status === "idle" || status === "error" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="threshold">USDC Threshold Amount</Label>
                <div className="relative">
                  <Input
                    id="threshold"
                    type="number"
                    min="1"
                    step="1"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="pl-8"
                    disabled={isRunning}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You will prove you hold at least this much USDC, without
                  revealing the exact amount.
                </p>
              </div>

              <Button
                onClick={generateProof}
                disabled={isRunning || !threshold || parseInt(threshold) < 1}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Proof...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Generate ZK Proof
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/30 p-3 text-sm text-red-400">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Proof Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-teal-400 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {proofSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentStepIndex;
                  const isDone = index < currentStepIndex;
                  const isPending = index > currentStepIndex;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-300 ${
                        isActive
                          ? "border-purple-500/30 bg-purple-500/10"
                          : isDone
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isActive
                            ? "bg-purple-500/20 text-purple-400"
                            : isDone
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/5 text-muted-foreground"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-purple-300"
                              : isDone
                              ? "text-emerald-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                      {isDone && (
                        <Badge variant="success">Complete</Badge>
                      )}
                      {isActive && (
                        <Badge variant="default" className="animate-pulse">
                          In Progress
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              {status === "success" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/30 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-emerald-400" />
                      <span className="font-semibold text-emerald-400">
                        Proof Verified Successfully
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-emerald-300/80">
                      You have proven you hold at least ${threshold} USDC without
                      revealing your balance.
                    </p>
                    {transactionId && (
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>TX:</span>
                        <code className="rounded bg-white/5 px-2 py-0.5 font-mono">
                          {transactionId.slice(0, 16)}...
                        </code>
                      </div>
                    )}
                    {credentialId && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Credential:</span>
                        <code className="rounded bg-white/5 px-2 py-0.5 font-mono">
                          {credentialId}
                        </code>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={reset} variant="outline" className="flex-1">
                      New Proof
                    </Button>
                    <Button
                      onClick={() =>
                        (window.location.href = "/dashboard")
                      }
                      variant="default"
                      className="flex-1"
                    >
                      View Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
