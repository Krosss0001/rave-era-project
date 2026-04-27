"use client";

import { useEffect, useMemo, useState } from "react";

type LiveEventSignalsProps = {
  eventId: string;
};

export function LiveEventSignals({ eventId }: LiveEventSignalsProps) {
  const seed = useMemo(
    () => eventId.split("").reduce((total, char) => total + char.charCodeAt(0), 0),
    [eventId]
  );
  const [viewers, setViewers] = useState(21 + (seed % 5));
  const [minutesAgo, setMinutesAgo] = useState(2);

  useEffect(() => {
    let cycle = 0;

    const interval = window.setInterval(() => {
      setViewers((value) => {
        const delta = cycle % 2 === 0 ? 2 : -1;
        return Math.max(13, Math.min(31, value + delta));
      });
      setMinutesAgo((value) => (cycle % 5 === 4 ? 0 : Math.min(value + 1, 4)));
      cycle += 1;
    }, 5200 + (seed % 3) * 700);

    return () => window.clearInterval(interval);
  }, [seed]);

  const purchaseLabel = minutesAgo === 0 ? "Last purchase: just now" : `Last purchase: ${minutesAgo} min ago`;

  return (
    <div className="drop-reveal mt-5 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
      {[purchaseLabel, `${viewers} people viewing this event`, "Telegram confirmations active"].map((item) => (
        <span key={item} className="border border-white/[0.05] bg-[#020202]/85 px-3 py-2 text-white/55 backdrop-blur-sm">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.45)] motion-safe:animate-[signalPulse_1.8s_ease-out_infinite]" aria-hidden="true" />
          {item}
        </span>
      ))}
    </div>
  );
}
