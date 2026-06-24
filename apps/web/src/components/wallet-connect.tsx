"use client";

import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { truncateAddress } from "@/lib/utils";
import {
  Wallet,
  LogOut,
  Loader2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

export function WalletConnect() {
  const { publicKey, isConnected, isConnecting, connect, disconnect } =
    useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <Badge
          variant="success"
          className="flex items-center gap-1.5 px-3 py-1"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Connected
        </Badge>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm backdrop-blur-sm">
          <Wallet className="h-3.5 w-3.5 text-purple-400" />
          <span className="font-mono text-foreground/80">
            {truncateAddress(publicKey, 6)}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="rounded-md p-1.5 text-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
          title="Copy address"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <a
          href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-1.5 text-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
          title="View on explorer"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          title="Disconnect"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} disabled={isConnecting} size="sm">
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
