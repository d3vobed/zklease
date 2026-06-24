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
  GraduationCap,
} from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Zero-Knowledge Proofs",
    description:
      "Prove you hold a minimum amount of USDC without revealing your exact balance. Your financial privacy is preserved.",
    gradient: "from-purple-500 to-violet-600",
  },
  {
    icon: Lock,
    title: "Privacy Preserving",
    description:
      "Using Noir zk-SNARKs, only the validity of your statement is verified — your balance stays completely confidential.",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    icon: Shield,
    title: "On-Chain Verification",
    description:
      "Verifiable credentials are minted as NFTs on Stellar, providing tamper-proof proof of your financial status.",
    gradient: "from-purple-500 to-teal-400",
  },
  {
    icon: Zap,
    title: "Instant Verification",
    description:
      "Generate and verify proofs in seconds. No trusted setup, no complex configuration — just connect and prove.",
    gradient: "from-amber-400 to-orange-500",
  },
];

const steps = [
  {
    step: 1,
    icon: Wallet,
    title: "Connect Wallet",
    description: "Connect your Stellar wallet (Freighter, Wallet Kit, etc.)",
  },
  {
    step: 2,
    icon: Shield,
    title: "Set Threshold",
    description:
      "Choose the minimum USDC amount you want to prove you hold",
  },
  {
    step: 3,
    icon: Sparkles,
    title: "Generate Proof",
    description:
      "A zero-knowledge proof is created using Noir to verify your balance",
  },
  {
    step: 4,
    icon: GraduationCap,
    title: "Get Credential",
    description:
      "Receive a verified credential NFT on Stellar as proof of your status",
  },
];

export default function LandingPage() {
  const { isConnected, connect, publicKey } = useWallet();

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 bg-grid" />

      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <div className="pointer-events-none absolute -inset-x-20 -top-40 h-96 bg-gradient-to-b from-purple-500/10 via-teal-500/5 to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Zero-Knowledge Privacy on Stellar
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Prove Your{" "}
            <span className="gradient-text">USDC Holdings</span>
            <br />
            Without Revealing a Thing
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            Generate zero-knowledge proofs to verify you hold at least a
            specified amount of USDC — without disclosing your actual balance.
            Privacy-preserving financial verification on Stellar.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isConnected ? (
              <Link href="/verify">
                <Button size="lg" className="group">
                  Start Verification
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" onClick={connect} className="group">
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet to Start
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
            <Link href="#how-it-works">
              <Button variant="outline" size="lg">
                How It Works
              </Button>
            </Link>
          </div>

          {publicKey && (
            <div className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4" />
              Wallet connected — ready to prove your balance
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
              Four simple steps to verify your USDC balance privately
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="group relative">
                  <div className="glass-card p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 group-hover:from-purple-500/30 group-hover:to-teal-500/30 transition-colors">
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
              Why{" "}
              <span className="gradient-text">ZKLease</span>
            </h2>
            <p className="text-zinc-400">
              Privacy-first financial verification powered by zero-knowledge
              cryptography
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="group glass-hover">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20">
                      <Icon className="h-6 w-6 text-purple-400" />
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
        <div className="mx-auto max-w-3xl text-center">
          <div className="glass-card relative overflow-hidden p-10 sm:p-14">
            <div className="pointer-events-none absolute -inset-x-20 -top-40 h-96 bg-gradient-to-b from-purple-500/10 via-teal-500/5 to-transparent blur-3xl" />

            <h2 className="relative mb-4 text-3xl font-bold sm:text-4xl">
              Ready to Prove Your{" "}
              <span className="gradient-text">Balance</span>?
            </h2>
            <p className="relative mb-8 text-zinc-400">
              Connect your Stellar wallet and generate your first
              zero-knowledge proof in minutes. No data shared, complete
              privacy.
            </p>
            <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isConnected ? (
                <Link href="/verify">
                  <Button size="lg" className="group">
                    Start Verification
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={connect}>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>
              )}
              {isConnected && (
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    View Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
