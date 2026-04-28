"use client";

import Link from "next/link";
import type { RaveeraEvent } from "@/data/events";
import { EventCard } from "@/components/events/event-card";
import { useLanguage } from "@/lib/i18n/use-language";

type EventGridProps = {
  events: RaveeraEvent[];
};

export function EventGrid({ events }: EventGridProps) {
  const { dictionary } = useLanguage();

  if (events.length === 0) {
    return (
      <div className="border border-white/[0.05] bg-[#020202] p-6 text-center sm:p-8">
        <p className="mx-auto mb-4 inline-flex border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          Empty calendar
        </p>
        <h3 className="text-xl font-black uppercase">{dictionary.events.noEventsTitle}</h3>
        <p className="mt-2 text-sm text-white/45">
          {dictionary.events.noEventsCopy}
        </p>
        <Link
          href="/"
          className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center border border-primary/45 bg-primary/[0.025] px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary motion-safe:transition-[background-color,color,transform] motion-safe:duration-300 hover:bg-primary hover:text-black active:scale-[0.98]"
        >
          {dictionary.access.returnHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
