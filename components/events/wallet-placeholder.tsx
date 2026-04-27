"use client";

import { useState } from "react";
import { Wallet, ExternalLink } from "lucide-react";

export function WalletPlaceholder() {
  const [connected, setConnected] = useState(false);

  return (
    <section className="group relative border border-white/[0.05] bg-[#030303] p-5 motion-safe:transition-colors motion-safe:duration-500 hover:border-[#00FF88]/25">
      <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#00FF88]/30 bg-[#020202] text-[#00FF88]">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF88]">Roadmap layer</p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none">Solana-ready access</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Phantom is a visible placeholder for future passes, gated events, attendance proofs,
            and organizer settlements.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setConnected((value) => !value)}
        aria-pressed={connected}
        className="focus-ring mt-5 inline-flex min-h-10 w-full items-center justify-between gap-2 border border-white/[0.05] bg-[#020202] px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45 motion-safe:transition-[color,border-color,transform] motion-safe:duration-500 motion-safe:ease-out hover:border-[#00FF88]/30 hover:text-[#00FF88] active:scale-[0.98] motion-safe:hover:-translate-y-0.5"
      >
        <span>{connected ? "Demo wallet connected" : "Wallet layer standby"}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.5)] motion-safe:animate-pulse" aria-hidden="true" />
      </button>
      {connected ? (
        <div className="mt-4 flex items-center justify-between border border-[#00FF88]/30 bg-[#00FF88]/[0.04] p-3 text-sm">
          <span className="font-mono text-[#00FF88]">8rAv...ERA9</span>
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex min-h-10 items-center gap-2 px-2 text-white/35 transition hover:text-[#00FF88]"
          >
            Phantom
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </section>
  );
}
