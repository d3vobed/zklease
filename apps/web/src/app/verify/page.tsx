"use client";

import { BalanceProof } from "@/components/balance-proof";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { Wallet, Shield, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  const { isConnected, connect, isConnecting, publicKey } = useWallet();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Verify Balance</h1>
        <p className="text-zinc-400">
          Generate a zero-knowledge proof to verify your USDC holdings
        </p>
      </div>

      {!isConnected ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-teal-500/20">
              <Wallet className="h-10 w-10 text-purple-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold">
              Wallet Required
            </h2>
            <p className="mb-8 max-w-md text-zinc-400">
              Connect your Stellar wallet to generate zero-knowledge proofs of
              your USDC balance. Your balance remains private — only the proof
              is verified.
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
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {publicKey && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-300">
                    Wallet Connected
                  </p>
                  <p className="text-xs text-emerald-400/70">
                    You can now generate zero-knowledge proofs
                  </p>
                </div>
                <Badge variant="success" className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready
                </Badge>
              </CardContent>
            </Card>
          )}

          <BalanceProof />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-muted-foreground" />
                About Zero-Knowledge Proofs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Zero-knowledge proofs allow you to prove a statement is true
                without revealing any additional information. In this case, you
                prove that your USDC balance is at least the threshold amount
                without disclosing your exact balance.
              </p>
              <p>
                The proof is generated locally in your browser using Noir — a
                domain-specific language for writing zero-knowledge circuits.
                The generated proof is then verified on the Stellar network via
                Soroban smart contracts.
              </p>
              <p>
                Once verified, a credential NFT is minted to your wallet,
                serving as a tamper-proof record of your verified status.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
