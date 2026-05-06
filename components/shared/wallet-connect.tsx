"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Unplug, Wallet } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  on?: (event: "accountChanged" | "disconnect", handler: (publicKey?: { toString(): string } | null) => void) => void;
  removeListener?: (event: "accountChanged" | "disconnect", handler: (publicKey?: { toString(): string } | null) => void) => void;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

function getPhantomProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const provider = window.solana;
  return provider?.isPhantom ? provider : null;
}

function formatWalletAddress(address: string) {
  return address.length > 9 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
}

function isMobileUserAgent() {
  if (typeof window === "undefined") {
    return false;
  }

  return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalonePwa() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as NavigatorWithStandalone).standalone);
}

function buildPhantomBrowseUrl(currentUrl: string) {
  const ref = typeof window === "undefined" ? currentUrl : window.location.origin;
  return `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(ref)}`;
}

type WalletConnectProps = {
  onWalletSaved?: (address: string) => void;
};

export function WalletConnect({ onWalletSaved }: WalletConnectProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [walletAddress, setWalletAddress] = useState("");
  const [phantomReady, setPhantomReady] = useState(false);
  const [mobileNoProvider, setMobileNoProvider] = useState(false);
  const [phantomBrowseUrl, setPhantomBrowseUrl] = useState("https://phantom.app/");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const provider = getPhantomProvider();
    const mobile = isMobileUserAgent();
    const standalone = isStandalonePwa();
    setPhantomReady(Boolean(provider));
    setMobileNoProvider(!provider && (mobile || standalone));
    setPhantomBrowseUrl(buildPhantomBrowseUrl(window.location.href));

    if (!provider) {
      return;
    }

    if (provider.publicKey) {
      setWalletAddress(provider.publicKey.toString());
      setStatus("connected");
    }

    function handleAccountChanged(publicKey?: { toString(): string } | null) {
      const nextAddress = publicKey?.toString() ?? "";
      setWalletAddress(nextAddress);
      setStatus(nextAddress ? "connected" : "idle");
    }

    function handleDisconnect() {
      setWalletAddress("");
      setStatus("idle");
    }

    provider.on?.("accountChanged", handleAccountChanged);
    provider.on?.("disconnect", handleDisconnect);

    return () => {
      provider.removeListener?.("accountChanged", handleAccountChanged);
      provider.removeListener?.("disconnect", handleDisconnect);
    };
  }, []);

  async function saveWallet(address: string) {
    if (!supabase) {
      setMessage("Wallet connected. Sign in to save it.");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setMessage("Wallet connected. Sign in to save it.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ wallet_address: address })
      .eq("id", user.id);

    if (error) {
      setMessage("Connected, but profile save failed.");
      return;
    }

    setMessage("Wallet saved to profile.");
    onWalletSaved?.(address);
  }

  async function connectWallet() {
    const provider = getPhantomProvider();

    if (!provider) {
      window.open(mobileNoProvider ? phantomBrowseUrl : "https://phantom.app/download", "_blank", "noopener,noreferrer");
      return;
    }

    setStatus("connecting");
    setMessage("");

    try {
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);
      setStatus("connected");
      await saveWallet(address);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Wallet connection was cancelled.");
    }
  }

  async function disconnectWallet() {
    const provider = getPhantomProvider();
    await provider?.disconnect?.();
    setWalletAddress("");
    setStatus("idle");
    setMessage("");
  }

  if (!phantomReady) {
    if (mobileNoProvider) {
      return (
        <div className="grid min-w-0 gap-2">
          <a
            href={phantomBrowseUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-primary/45 bg-primary/[0.045] px-3 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-primary transition duration-200 hover:bg-primary hover:text-black"
            title="Open this app in Phantom"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Open in Phantom</span>
          </a>
          <p className="max-w-xs text-xs leading-5 text-white/52">
            Wallet connection works inside Phantom browser on mobile. Open this app in Phantom to connect your wallet.
          </p>
          <a
            href="https://phantom.app/download"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 border border-white/[0.08] bg-[#050505] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/58 transition duration-200 hover:border-primary/35 hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Install Phantom
          </a>
        </div>
      );
    }

    return (
      <a
        href="https://phantom.app/download"
        target="_blank"
        rel="noreferrer"
        className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-white/[0.08] bg-[#050505] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/62 transition duration-200 hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
        title="Install Phantom"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden min-[440px]:inline">Install Phantom</span>
        <span className="min-[440px]:hidden">Wallet</span>
      </a>
    );
  }

  if (walletAddress) {
    return (
      <div className="relative flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={disconnectWallet}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-primary/35 bg-primary/[0.045] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-primary transition duration-200 hover:border-primary hover:bg-primary hover:text-black"
          title={message || "Disconnect wallet"}
        >
          <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formatWalletAddress(walletAddress)}</span>
        </button>
        <span className="sr-only" aria-live="polite">{message}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={connectWallet}
      disabled={status === "connecting"}
      className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-white/[0.08] bg-[#050505] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/72 transition duration-200 hover:border-primary/45 hover:bg-primary/[0.045] hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
      title={message || "Connect Wallet"}
    >
      {status === "connecting" ? <Unplug className="h-3.5 w-3.5" aria-hidden="true" /> : <Wallet className="h-3.5 w-3.5" aria-hidden="true" />}
      <span className="hidden min-[440px]:inline">{status === "connecting" ? "Connecting" : "Connect Wallet"}</span>
      <span className="min-[440px]:hidden">Wallet</span>
    </button>
  );
}
