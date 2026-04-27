import type { RaveeraEvent } from "@/data/events";
import { EventCard } from "@/components/events/event-card";

type EventGridProps = {
  events: RaveeraEvent[];
};

export function EventGrid({ events }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="border border-white/[0.05] bg-[#020202] p-8 text-center">
        <h3 className="text-xl font-black uppercase">No events open yet</h3>
        <p className="mt-2 text-sm text-white/45">
          New Rave&apos;era concerts, festivals, conferences, and cultural events will appear here as soon as they are published.
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
