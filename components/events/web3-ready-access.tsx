"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { getCurrentRole, type AuthProfile } from "@/lib/auth/get-role";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatShortWalletAddress } from "@/components/shared/web3-utils";
import { WalletConnect } from "@/components/shared/wallet-connect";

export function Web3ReadyAccess() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadWalletState() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const roleState = await getCurrentRole(supabase);

      if (!mounted) {
        return;
      }

      setSignedIn(Boolean(roleState.user));
      setProfile(roleState.profile);
      setLoading(false);
    }

    loadWalletState();

    const { data: listener } = supabase?.auth.onAuthStateChange(() => {
      loadWalletState();
    }) ?? { data: null };

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const walletAddress = profile?.wallet_address?.trim() ?? "";

  return (
    <section className="border border-white/[0.06] bg-[#020202] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary/[0.035] text-primary">
          <Wallet className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Web3-ready access</p>
          <p className="mt-3 text-sm leading-6 text-white/58">
            Wallet connection optional. Future NFT ticket, loyalty, and Solana Pay-ready metadata can attach here without changing Telegram registration.
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-white/[0.05] pt-4">
        {loading ? (
          <div className="h-10 bg-white/[0.035] motion-safe:animate-pulse" aria-label="Loading wallet state" />
        ) : !signedIn ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/42">Sign in to connect wallet</p>
        ) : walletAddress ? (
          <div className="grid gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Wallet connected</p>
            <p className="break-all font-mono text-sm text-white">{formatShortWalletAddress(walletAddress)}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-white/48">Connect Phantom to unlock Web3-ready access.</p>
            <WalletConnect />
          </div>
        )}
      </div>
    </section>
  );
}
