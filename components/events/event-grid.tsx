"use client";

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
      <div className="border border-white/[0.05] bg-[#020202] p-8 text-center">
        <h3 className="text-xl font-black uppercase">{dictionary.events.noEventsTitle}</h3>
        <p className="mt-2 text-sm text-white/45">
          {dictionary.events.noEventsCopy}
        </p>
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
