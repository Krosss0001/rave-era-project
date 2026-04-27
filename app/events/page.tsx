import { SlidersHorizontal } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { EventGrid } from "@/components/events/event-grid";
import { getPublicEventsWithFallback } from "@/lib/supabase/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="event-reveal flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]">
      <span className="text-white/20">{index}</span>
      <span className="event-line h-px w-7 origin-left bg-white/20" aria-hidden="true" />
      {label}
    </p>
  );
}

export default async function EventsPage() {
  const events = await getPublicEventsWithFallback();
  const featuredDrop = events.find((event) => event.featured) ?? events[0];
  const upcomingEvents = featuredDrop ? events.filter((event) => event.id !== featuredDrop.id) : [];

  return (
    <div className="relative overflow-hidden bg-[#000000]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="pointer-events-none absolute right-[-20%] top-[-8%] -z-10 h-[45vw] w-[45vw] bg-[#00FF88]/10 blur-[150px]" />

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:px-10 md:py-32 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <SectionLabel index="00" label="Event Discovery" />
            <h1 className="event-reveal mt-5 text-[clamp(4rem,9vw,9rem)] font-black uppercase leading-[0.78] text-white">
              Curated Rave<span className="text-[#00FF88] [text-shadow:0_0_70px_rgba(0,255,136,0.26)]">&apos;</span>era events
            </h1>
            <p className="event-reveal mt-7 max-w-2xl text-base font-light leading-7 text-white/55 md:text-lg">
              Concerts, festivals, conferences, corporate events, and cultural programs built for ticket sales, audience growth, and Telegram-supported confirmation.
            </p>
          </div>
          <div className="flex min-h-11 items-center gap-3 border border-white/[0.05] bg-[#020202] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            <SlidersHorizontal className="h-4 w-4 text-[#00FF88]" aria-hidden="true" />
            Filters mocked for MVP
          </div>
        </div>

        <div className="event-reveal mt-14 border-y border-white/[0.05] bg-[#020202]/70 py-4">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 px-1">
            {["All", "Concerts", "Festivals", "Conferences", "Corporate", "Cultural"].map((filter, index) => (
              <button
                type="button"
                key={filter}
                aria-pressed={index === 0}
                className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] motion-safe:transition-colors motion-safe:duration-500 ${
                  index === 0 ? "text-[#00FF88]" : "text-white/35 hover:text-white/60"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] px-4 py-20 sm:px-6 md:px-10 md:py-28 lg:px-12 2xl:max-w-[1500px]">
        <SectionLabel index="01" label="Featured Event" />
        <div className="mt-10">
          {featuredDrop ? <EventCard event={featuredDrop} featured /> : <EventGrid events={[]} />}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] px-4 py-20 sm:px-6 md:px-10 md:py-28 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="02" label="Upcoming Events" />
            <h2 className="event-reveal mt-4 text-5xl font-black uppercase leading-[0.82] text-white md:text-7xl">
              Next on the calendar
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/45">
            Every upcoming event keeps the same operating layer: event page, referral momentum,
            Telegram handoff, and future wallet-ready access.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          )) : <EventGrid events={[]} />}
        </div>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes eventFadeUp {
              from { opacity: 0; transform: translateY(18px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes eventLineReveal {
              from { transform: scaleX(0); opacity: 0.2; }
              to { transform: scaleX(1); opacity: 1; }
            }
            @supports (animation-timeline: view()) {
              .event-reveal {
                opacity: 0;
                animation: eventFadeUp 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-timeline: view();
                animation-range: entry 8% cover 28%;
              }
              .event-line {
                transform: scaleX(0);
                animation: eventLineReveal 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-timeline: view();
                animation-range: entry 10% cover 28%;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .event-reveal,
              .event-line {
                opacity: 1;
                transform: none;
                animation: none;
              }
            }
          `
        }}
      />
    </div>
  );
}
