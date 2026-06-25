"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Zap,
  Lock,
  Eye,
  ArrowRight,
  Wallet,
  CheckCircle2,
  Sparkles,
  Swords,
  TrendingUp,
  Gamepad2,
  Trophy,
  Users,
  Coins,
  BarChart3,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

const features = [
  {
    icon: Swords,
    title: "Private Gaming",
    description:
      "Play Rock-Paper-Scissors with ZK commitments. Your move stays hidden until reveal — provably fair.",
    gradient: "from-purple-500 to-violet-600",
    accent: "purple",
  },
  {
    icon: TrendingUp,
    title: "Prediction Markets",
    description:
      "Bet on real-world outcomes. Your position stays private. Claim winnings with a single click.",
    gradient: "from-amber-500 to-orange-600",
    accent: "amber",
  },
  {
    icon: Shield,
    title: "Balance Proofs",
    description:
      "Prove solvency without revealing your balance. Get verified credentials on Stellar.",
    gradient: "from-emerald-500 to-teal-500",
    accent: "emerald",
  },
];

const steps = [
  {
    step: 1,
    icon: Wallet,
    title: "Connect Wallet",
    description: "Connect your Stellar wallet (Freighter, Wallet Kit, etc.)",
    gradient: "from-purple-500/20 to-teal-500/20",
  },
  {
    step: 2,
    icon: Shield,
    title: "Prove Balance",
    description:
      "Prove your USDC balance with a ZK proof — no balance data leaked",
    gradient: "from-teal-500/20 to-cyan-500/20",
  },
  {
    step: 3,
    icon: Gamepad2,
    title: "Play Private Games",
    description:
      "Play games with hash-committed moves. Fair and private by design.",
    gradient: "from-purple-500/20 to-violet-500/20",
  },
  {
    step: 4,
    icon: BarChart3,
    title: "Predict & Earn",
    description:
      "Predict outcomes and earn rewards. Your position stays confidential.",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    step: 5,
    icon: Trophy,
    title: "Build Reputation",
    description:
      "Earn on-chain reputation. Credentials follow you across games.",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
];

const statsData = [
  { icon: Gamepad2, label: "Games Played", value: 0, suffix: "+", accent: "purple" },
  { icon: Shield, label: "Credentials Issued", value: 0, suffix: "+", accent: "emerald" },
  { icon: Coins, label: "Total Value Locked", value: 0, prefix: "$", suffix: "+", accent: "amber" },
  { icon: Users, label: "Active Players", value: 0, suffix: "+", accent: "teal" },
];

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 30;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="animate-counter-in">
      {prefix}{count}{suffix}
    </span>
  );
}

export default function LandingPage() {
  const { isConnected, connect, publicKey } = useWallet();

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 bg-grid" />

      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <div className="hero-glow" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex animate-float items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Zero-Knowledge Gaming & Finance on Stellar
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            ZKLease —{" "}
            <span className="gradient-text">Zero-Knowledge</span>
            <br />
            Gaming & Finance on Stellar
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            Prove, Play, Predict. All without revealing your secrets.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/play">
              <Button size="lg" className="group animate-pulse-glow">
                <Swords className="mr-2 h-5 w-5" />
                Start Playing
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/verify">
              <Button variant="outline" size="lg" className="group">
                <Shield className="mr-2 h-5 w-5" />
                Verify Balance
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="group">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
            </Link>
          </div>

          {publicKey && (
            <div className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4" />
              Wallet connected — ready to play
            </div>
          )}
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              How It{" "}
              <span className="gradient-text">Works</span>
            </h2>
            <p className="text-zinc-400">
              Five steps to private gaming, predictions, and proofs
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="group relative">
                  <div className="glass-card p-6 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-7 w-7 text-purple-400" />
                    </div>
                    <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                      {item.step}
                    </div>
                    <h3 className="mb-2 font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything{" "}
              <span className="gradient-text">Private</span>
            </h2>
            <p className="text-zinc-400">
              Gaming, predictions, and proofs — all powered by zero-knowledge
              cryptography
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              const borderColor =
                feature.accent === "purple"
                  ? "border-purple-500/20 group-hover:border-purple-500/40"
                  : feature.accent === "amber"
                  ? "border-amber-500/20 group-hover:border-amber-500/40"
                  : "border-emerald-500/20 group-hover:border-emerald-500/40";
              const iconBg =
                feature.accent === "purple"
                  ? "from-purple-500/20 to-violet-500/20"
                  : feature.accent === "amber"
                  ? "from-amber-500/20 to-orange-500/20"
                  : "from-emerald-500/20 to-teal-500/20";
              const iconColor =
                feature.accent === "purple"
                  ? "text-purple-400"
                  : feature.accent === "amber"
                  ? "text-amber-400"
                  : "text-emerald-400";
              return (
                <Card
                  key={feature.title}
                  className={`group game-card-hover border ${borderColor}`}
                >
                  <CardContent className="p-6">
                    <div
                      className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg}`}
                    >
                      <Icon className={`h-7 w-7 ${iconColor}`} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Built for the{" "}
              <span className="gradient-text">Stellar Hackathon</span>
            </h2>
            <p className="text-zinc-400">
              Privacy-first gaming and finance on Stellar
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat) => {
              const Icon = stat.icon;
              const borderColor =
                stat.accent === "purple"
                  ? "border-purple-500/20"
                  : stat.accent === "emerald"
                  ? "border-emerald-500/20"
                  : stat.accent === "amber"
                  ? "border-amber-500/20"
                  : "border-teal-500/20";
              const iconColor =
                stat.accent === "purple"
                  ? "text-purple-400"
                  : stat.accent === "emerald"
                  ? "text-emerald-400"
                  : stat.accent === "amber"
                  ? "text-amber-400"
                  : "text-teal-400";
              const iconBg =
                stat.accent === "purple"
                  ? "from-purple-500/20 to-violet-500/20"
                  : stat.accent === "emerald"
                  ? "from-emerald-500/20 to-teal-500/20"
                  : stat.accent === "amber"
                  ? "from-amber-500/20 to-orange-500/20"
                  : "from-teal-500/20 to-cyan-500/20";
              return (
                <Card key={stat.label} className={`border ${borderColor}`}>
                  <CardContent className="p-6 text-center">
                    <div
                      className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg}`}
                    >
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <p className="mb-1 text-3xl font-bold">
                      <AnimatedCounter
                        target={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="glass-card relative overflow-hidden p-10 sm:p-14">
            <div className="pointer-events-none absolute -inset-x-20 -top-40 h-96 bg-gradient-to-b from-purple-500/10 via-teal-500/5 to-transparent blur-3xl" />

            <h2 className="relative mb-4 text-3xl font-bold sm:text-4xl">
              Ready to{" "}
              <span className="gradient-text">Play</span>?
            </h2>
            <p className="relative mb-8 text-zinc-400">
              Connect your wallet and start playing private games, making
              predictions, or proving your balance.
            </p>
            <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/play">
                <Button size="lg" className="group">
                  <Swords className="mr-2 h-5 w-5" />
                  Start Playing
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/predict">
                <Button variant="outline" size="lg" className="group border-amber-500/30 hover:border-amber-500/50">
                  <TrendingUp className="mr-2 h-5 w-5 text-amber-400" />
                  Make Predictions
                </Button>
              </Link>
              <Link href="/verify">
                <Button variant="outline" size="lg" className="group border-emerald-500/30 hover:border-emerald-500/50">
                  <Shield className="mr-2 h-5 w-5 text-emerald-400" />
                  Verify Balance
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
