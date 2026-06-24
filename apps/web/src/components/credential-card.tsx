"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { type Credential } from "@/lib/api";
import {
  Award,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface CredentialCardProps {
  credential: Credential;
  className?: string;
}

export function CredentialCard({ credential, className }: CredentialCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-teal-500/5" />
      <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-purple-500/10 to-teal-500/10 opacity-50" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20">
              <Award className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base">
                Balance Credential
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Verified USDC Holder
              </p>
            </div>
          </div>
          <Badge variant="success" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Verified
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
          <div className="mb-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Threshold</p>
              <p className="text-sm font-semibold text-emerald-400">
                ${credential.threshold} USDC
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="text-sm font-medium">
                {formatDate(credential.issuedAt)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Token ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-white/5 px-2 py-0.5 font-mono text-xs">
                {credential.tokenId}
              </code>
              <button
                onClick={() => handleCopy(credential.tokenId)}
                className="shrink-0 rounded p-1 text-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2.5 text-xs text-emerald-300/80">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span>
            This credential proves you hold &ge; ${credential.threshold} USDC
            without revealing your balance.
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleCopy(credential.tokenId)}
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy ID
              </>
            )}
          </Button>
          {credential.metadata?.transactionId && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${credential.metadata.transactionId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View TX
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
