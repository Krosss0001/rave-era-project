"use client";

import { useState } from "react";
import { ExternalLink, Wallet } from "lucide-react";

export function WalletPlaceholder() {
  const [connected, setConnected] = useState(false);

  return (
    <section className="group relative border border-white/[0.06] bg-[#020202] p-4 transition duration-200 hover:border-[#00FF88]/25">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#00FF88]/25 bg-black text-[#00FF88]">
          <Wallet className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF88]">Solana</p>
          <h2 className="mt-2 text-lg font-black uppercase leading-none text-white">Wallet standby</h2>
          <p className="mt-2 text-sm leading-6 text-white/48">Optional pass layer for future gated access.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setConnected((value) => !value)}
        aria-pressed={connected}
        className="focus-ring mt-4 inline-flex min-h-10 w-full items-center justify-between gap-2 border border-white/[0.08] bg-black px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 transition duration-200 hover:border-[#00FF88]/30 hover:text-[#00FF88] active:scale-[0.99]"
      >
        <span>{connected ? "Demo wallet connected" : "Wallet layer standby"}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.5)]" aria-hidden="true" />
      </button>
      {connected ? (
        <div className="mt-3 flex items-center justify-between gap-3 border border-[#00FF88]/25 bg-[#00FF88]/[0.035] p-3 text-sm">
          <span className="min-w-0 truncate font-mono text-[#00FF88]">8rAv...ERA9</span>
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 px-2 text-white/40 transition duration-200 hover:text-[#00FF88]"
          >
            Phantom
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </section>
  );
}
