import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZKLease - Zero-Knowledge USDC Proofs on Stellar",
  description:
    "Prove your USDC holdings without revealing your balance using zero-knowledge proofs on the Stellar network.",
  keywords: [
    "stellar",
    "zeroknowledge",
    "noir",
    "usdc",
    "defi",
    "privacy",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-950 text-zinc-50">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/5 py-6">
              <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
                Built for the Stellar Hackathon &middot;{" "}
                <span className="gradient-text font-medium">ZKLease</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
