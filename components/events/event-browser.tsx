"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { RaveeraEvent } from "@/data/events";
import { EventCard } from "@/components/events/event-card";
import { EventGrid } from "@/components/events/event-grid";
import { useLanguage } from "@/lib/i18n/use-language";

type EventBrowserProps = {
  events: RaveeraEvent[];
};

type CategoryFilter = "all" | "concerts" | "festivals" | "conferences" | "corporate" | "cultural";
type CityFilter = "all" | string;

const categories: Array<{ value: CategoryFilter; ua: string; en: string; terms: string[] }> = [
  { value: "all", ua: "Усі", en: "All", terms: [] },
  { value: "concerts", ua: "Концерти", en: "Concerts", terms: ["concert", "techno", "house", "garage", "show"] },
  { value: "festivals", ua: "Фестивалі", en: "Festivals", terms: ["festival", "open air"] },
  { value: "conferences", ua: "Конференції", en: "Conferences", terms: ["conference", "founder", "web3", "solana"] },
  { value: "corporate", ua: "Корпоративні", en: "Corporate", terms: ["corporate", "business", "commerce"] },
  { value: "cultural", ua: "Культурні", en: "Cultural", terms: ["cultural", "culture", "collector", "invite"] }
];

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="event-reveal flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]">
      <span className="text-white/20">{index}</span>
      <span className="event-line h-px w-7 origin-left bg-white/20" aria-hidden="true" />
      {label}
    </p>
  );
}

function matchesCategory(event: RaveeraEvent, category: CategoryFilter) {
  if (category === "all") {
    return true;
  }

  const selected = categories.find((item) => item.value === category);
  const searchable = [event.eventType, event.subtitle, event.description, ...event.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return Boolean(selected?.terms.some((term) => searchable.includes(term)));
}

export function EventBrowser({ events }: EventBrowserProps) {
  const { language } = useLanguage();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [city, setCity] = useState<CityFilter>("all");
  const copy =
    language === "ua"
      ? {
          filters: "Фільтри подій",
          cityAll: "Усі міста",
          featured: "Головна подія",
          upcoming: "Найближчі події",
          showing: "Показано",
          events: "подій",
          category: "категорія",
          city: "місто",
          all: "усі"
        }
      : {
          filters: "Event filters",
          cityAll: "All cities",
          featured: "Featured Event",
          upcoming: "Upcoming Events",
          showing: "Showing",
          events: "events",
          category: "category",
          city: "city",
          all: "all"
        };

  const cities = useMemo(() => {
    return Array.from(new Set(events.map((event) => event.city).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const categoryMatch = matchesCategory(event, category);
      const cityMatch = city === "all" || event.city === city;
      return categoryMatch && cityMatch;
    });
  }, [category, city, events]);

  const featuredDrop = filteredEvents.find((event) => event.featured) ?? filteredEvents[0];
  const upcomingEvents = featuredDrop ? filteredEvents.filter((event) => event.id !== featuredDrop.id) : filteredEvents;
  const categoryLabel = categories.find((item) => item.value === category);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <div className="event-reveal border-y border-white/[0.05] bg-[#020202]/70 py-4">
          <div className="flex flex-col gap-4 px-1">
            <div className="flex min-h-11 w-full items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 sm:w-auto">
              <SlidersHorizontal className="h-4 w-4 text-[#00FF88]" aria-hidden="true" />
              {copy.filters}
            </div>

            <div className="-mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {categories.map((filter) => {
                const active = category === filter.value;

                return (
                  <button
                    type="button"
                    key={filter.value}
                    aria-pressed={active}
                    onClick={() => setCategory(filter.value)}
                    className={`focus-ring min-h-10 shrink-0 border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] motion-safe:transition-[border-color,color,background-color] motion-safe:duration-200 sm:tracking-[0.16em] ${
                      active
                        ? "border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]"
                        : "border-white/[0.06] text-white/48 hover:border-[#00FF88]/35 hover:text-white"
                    }`}
                  >
                    {language === "ua" ? filter.ua : filter.en}
                  </button>
                );
              })}
            </div>

            <div className="-mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto border-t border-white/[0.05] px-1 pb-1 pt-4 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                aria-pressed={city === "all"}
                onClick={() => setCity("all")}
                className={`focus-ring min-h-10 shrink-0 border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] motion-safe:transition-[border-color,color,background-color] motion-safe:duration-200 sm:tracking-[0.16em] ${
                  city === "all"
                    ? "border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]"
                    : "border-white/[0.06] text-white/48 hover:border-[#00FF88]/35 hover:text-white"
                }`}
              >
                {copy.cityAll}
              </button>
              {cities.map((eventCity) => {
                const active = city === eventCity;

                return (
                  <button
                    type="button"
                    key={eventCity}
                    aria-pressed={active}
                    onClick={() => setCity(eventCity)}
                    className={`focus-ring min-h-10 shrink-0 border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] motion-safe:transition-[border-color,color,background-color] motion-safe:duration-200 sm:tracking-[0.16em] ${
                      active
                        ? "border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]"
                        : "border-white/[0.06] text-white/48 hover:border-[#00FF88]/35 hover:text-white"
                    }`}
                  >
                    {eventCity}
                  </button>
                );
              })}
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/42">
              {copy.showing} <span className="text-white">{filteredEvents.length}</span> {copy.events} · {copy.category}:{" "}
              <span className="text-[#00FF88]">{category === "all" ? copy.all : language === "ua" ? categoryLabel?.ua : categoryLabel?.en}</span> · {copy.city}:{" "}
              <span className="text-[#00FF88]">{city === "all" ? copy.all : city}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] px-4 py-16 sm:px-6 md:px-10 md:py-24 lg:px-12 2xl:max-w-[1500px]">
        <SectionLabel index="01" label={copy.featured} />
        <div className="mt-10">
          {featuredDrop ? <EventCard event={featuredDrop} featured /> : <EventGrid events={[]} />}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] px-4 py-16 sm:px-6 md:px-10 md:py-24 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="02" label={copy.upcoming} />
            <h2 className="event-reveal mt-4 text-[clamp(2.25rem,12vw,4.5rem)] font-black uppercase leading-[0.92] text-white md:leading-[0.9]">
              {language === "ua" ? "Наступне в календарі" : "Next on the calendar"}
            </h2>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {upcomingEvents.length > 0 ? upcomingEvents.map((event) => <EventCard key={event.id} event={event} />) : <EventGrid events={[]} />}
        </div>
      </section>
    </>
  );
}
