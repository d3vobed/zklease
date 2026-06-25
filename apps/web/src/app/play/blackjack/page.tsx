"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet, Loader2, Coins, ArrowLeft, Sparkles,
} from "lucide-react";
import Link from "next/link";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck;
}

function shuffle(d: string[]): string[] {
  const a = [...d];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardValue(rank: string): number {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return parseInt(rank);
}

function handValue(hand: string[]): number {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    const rank = card.slice(0, -1);
    if (rank === "A") aces++;
    total += cardValue(rank);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function cardColor(card: string): string {
  const suit = card.slice(-1);
  return suit === "♥" || suit === "♦" ? "text-red-500" : "text-gray-900";
}

function CardView({ card, hidden }: { card: string; hidden?: boolean }) {
  if (hidden) {
    return (
      <div className="flex h-28 w-20 items-center justify-center rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-800/50">
        <Sparkles className="h-6 w-6 text-zinc-500" />
      </div>
    );
  }
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return (
    <div className={`flex h-28 w-20 flex-col justify-between rounded-xl border border-zinc-600 bg-white p-2 shadow-lg ${cardColor(card)}`}>
      <span className="text-sm font-bold leading-none">{rank}</span>
      <span className="self-center text-xl">{suit}</span>
      <span className="self-end text-sm font-bold leading-none">{rank}</span>
    </div>
  );
}

export default function BlackjackPage() {
  const { isConnected, connect, isConnecting } = useWallet();
  const [balance, setBalance] = useState(500);
  const [bet, setBet] = useState("10");
  const [deck, setDeck] = useState<string[]>([]);
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [dealerHand, setDealerHand] = useState<string[]>([]);
  const [gamePhase, setGamePhase] = useState<"bet" | "play" | "result">("bet");
  const [message, setMessage] = useState("");
  const [gameResult, setGameResult] = useState<"win" | "lose" | "push" | null>(null);
  const [dealerHidden, setDealerHidden] = useState(true);

  const deal = useCallback(() => {
    const amt = parseFloat(bet);
    if (!amt || amt <= 0 || amt > balance) return;
    const d = shuffle(createDeck());
    const p = [d.pop()!, d.pop()!];
    const de = [d.pop()!, d.pop()!];
    setDeck(d);
    setPlayerHand(p);
    setDealerHand(de);
    setGamePhase("play");
    setMessage("");
    setGameResult(null);
    setDealerHidden(true);
    setBalance((b) => b - amt);
  }, [bet, balance]);

  const hit = useCallback(() => {
    if (gamePhase !== "play") return;
    const d = [...deck];
    const hand = [...playerHand, d.pop()!];
    setDeck(d);
    setPlayerHand(hand);
    if (handValue(hand) > 21) {
      setDealerHidden(false);
      setGamePhase("result");
      setGameResult("lose");
      setMessage(`Bust! You lost ${bet} USDC.`);
    }
  }, [gamePhase, deck, playerHand, bet]);

  const stand = useCallback(() => {
    if (gamePhase !== "play") return;
    setDealerHidden(false);
    let d = [...deck];
    let dh = [...dealerHand];
    while (handValue(dh) < 17) {
      dh = [...dh, d.pop()!];
    }
    setDeck(d);
    setDealerHand(dh);
    setGamePhase("result");

    const pv = handValue(playerHand);
    const dv = handValue(dh);
    const amt = parseFloat(bet);
    if (dv > 21 || pv > dv) {
      setGameResult("win");
      setBalance((b) => b + amt * 2);
      setMessage(`You won ${amt * 2} USDC!`);
    } else if (pv === dv) {
      setGameResult("push");
      setBalance((b) => b + amt);
      setMessage("Push! Bet returned.");
    } else {
      setGameResult("lose");
      setMessage(`Dealer wins. You lost ${amt} USDC.`);
    }
  }, [gamePhase, deck, playerHand, dealerHand, bet]);

  const newGame = useCallback(() => {
    setGamePhase("bet");
    setPlayerHand([]);
    setDealerHand([]);
    setMessage("");
    setGameResult(null);
  }, []);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
            <Sparkles className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="mb-3 text-3xl font-bold">Blackjack</h1>
          <p className="mb-8 max-w-md text-zinc-400">Connect your wallet to play.</p>
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

  const pv = handValue(playerHand);
  const dv = handValue(dealerHand);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/play"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Lobby
      </Link>

      <div className="mb-6 text-center">
        <h1 className="mb-2 text-3xl font-bold">
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            Blackjack
          </span>
        </h1>
        <p className="text-zinc-400">Beat the dealer to win 2x your bet</p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/10">
          <CardContent className="flex items-center gap-2 px-4 py-2">
            <Coins className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-emerald-400">{balance} USDC</span>
          </CardContent>
        </Card>
      </div>

      {gamePhase === "bet" && (
        <Card className="mb-8">
          <CardContent className="space-y-4 p-5">
            <div>
              <Label>Bet Amount (USDC)</Label>
              <Input
                type="number"
                min="1"
                max={balance}
                value={bet}
                onChange={(e) => setBet(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={deal}
              disabled={!bet || parseFloat(bet) <= 0 || parseFloat(bet) > balance}
            >
              Deal Cards
            </Button>
          </CardContent>
        </Card>
      )}

      {(gamePhase === "play" || gamePhase === "result") && (
        <>
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Dealer: {dealerHidden ? dv - cardValue(dealerHand[1].slice(0, -1)) : dv}
            </h3>
            <div className="flex flex-wrap gap-2">
              {dealerHand.map((card, i) => (
                <CardView key={i} card={card} hidden={i === 1 && dealerHidden} />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-2 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              You: {pv}
            </h3>
            <div className="flex flex-wrap gap-2">
              {playerHand.map((card, i) => (
                <CardView key={i} card={card} />
              ))}
            </div>
          </div>

          {gamePhase === "play" && (
            <div className="mb-8 flex justify-center gap-4">
              <Button size="lg" onClick={hit} className="w-32">
                Hit
              </Button>
              <Button size="lg" variant="outline" onClick={stand} className="w-32">
                Stand
              </Button>
            </div>
          )}

          {gamePhase === "result" && (
            <div className="mb-8 text-center">
              <Card className={`border ${gameResult === "win" ? "border-emerald-500/30 bg-emerald-500/10" : gameResult === "push" ? "border-amber-500/30 bg-amber-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                <CardContent className="py-6">
                  <p className="mb-1 text-lg font-bold capitalize text-foreground">{gameResult === "win" ? "🎉 You Won!" : gameResult === "push" ? "🤝 Push" : "😞 You Lost"}</p>
                  <p className="text-zinc-400">{message}</p>
                </CardContent>
              </Card>
              <Button size="lg" className="mt-4" onClick={newGame}>
                Play Again
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
