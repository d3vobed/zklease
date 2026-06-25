"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";
import { isStellarAddress } from "@/lib/stellar-constants";

interface WalletContextType {
  kit: StellarWalletsKit | null;
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  network: string;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [network] = useState("TESTNET");

  useEffect(() => {
    const stellarKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
    setKit(stellarKit);

    const storedKey = localStorage.getItem("zklease_public_key");
    if (storedKey && isStellarAddress(storedKey)) {
      setPublicKey(storedKey);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!kit) return;
    setIsConnecting(true);
    try {
      await kit.openModal({
        onWalletSelected: async (wallet) => {
          kit.setWallet(wallet.id);
          const { address } = await kit.getAddress();
          localStorage.setItem("zklease_public_key", address);
          setPublicKey(address);
        },
      });
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [kit]);

  const disconnect = useCallback(() => {
    localStorage.removeItem("zklease_public_key");
    setPublicKey(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        kit,
        publicKey,
        isConnected: !!publicKey,
        isConnecting,
        connect,
        disconnect,
        network,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
