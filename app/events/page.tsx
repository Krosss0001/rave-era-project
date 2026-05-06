import { EventBrowser } from "@/components/events/event-browser";
import { LocalizedText } from "@/components/shared/localized-text";
import { BackgroundGrid, GlowField, ScanLine, VisualSystemStyles } from "@/components/shared/visual-system";
import { getPublicEventsWithFallback } from "@/lib/supabase/events";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function SectionLabel({ index, label }: { index: string; label: ReactNode }) {
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

  return (
    <div className="relative overflow-hidden bg-[#000000]">
      <BackgroundGrid />
      <GlowField />
      <ScanLine className="opacity-50" />

      <section className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-20 md:px-10 md:py-24 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <SectionLabel index="00" label={<LocalizedText ua="Пошук подій" en="Event discovery" />} />
            <h1 className="mobile-hero-title event-reveal mt-5 text-[clamp(1.95rem,9vw,6.75rem)] font-black uppercase leading-[0.98] text-white sm:leading-[0.86]">
              <LocalizedText ua="Події Rave'era" en="Curated Rave'era events" />
            </h1>
            <p className="event-reveal mt-6 max-w-2xl text-base font-light leading-7 text-white/62 md:mt-7 md:text-lg">
              <LocalizedText
                ua="Концерти, фестивалі, конференції, корпоративні та культурні події для продажу квитків, зростання аудиторії й Telegram-підтверджень."
                en="Concerts, festivals, conferences, corporate events, and cultural programs built for ticket sales, audience growth, and Telegram-supported confirmation."
              />
            </p>
          </div>
        </div>
      </section>

      <EventBrowser events={events} />
      <VisualSystemStyles />
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
