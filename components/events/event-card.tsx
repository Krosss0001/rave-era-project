import Link from "next/link";
import type { RaveeraEvent } from "@/data/events";
import { getCapacityPercent } from "@/lib/format";
import { SafeEventImage } from "@/components/events/safe-event-image";
import { LocalizedEventDate } from "@/components/shared/localized-event-date";
import { LocalizedPrice } from "@/components/shared/localized-price";
import { LocalizedText } from "@/components/shared/localized-text";
import { StatusBadge } from "@/components/shared/status-badge";

type EventCardProps = {
  event: RaveeraEvent;
  featured?: boolean;
};

export function EventCard({ event, featured = false }: EventCardProps) {
  const registeredCount = event.stats?.total_registrations ?? event.registered;
  const remainingCapacity = event.stats?.remaining_capacity ?? Math.max(0, event.capacity - registeredCount);
  const capacityPercent = event.stats?.fill_percent ?? getCapacityPercent(registeredCount, event.capacity);
  const paidTickets = event.stats?.paid_tickets ?? 0;
  const reservedTickets = event.stats?.reserved_tickets ?? 0;
  const statusLabel =
    capacityPercent >= 70
      ? { ua: "Майже повно", en: "Almost full" }
      : event.status === "limited"
        ? { ua: "Обмежено", en: "Limited" }
        : event.status === "live"
          ? { ua: "Наживо", en: "Live" }
          : { ua: "Скоро", en: "Soon" };
  const urgent = capacityPercent >= 70;
  const capacityTone =
    capacityPercent >= 90
      ? "bg-[#00FF88] shadow-[0_0_22px_rgba(0,255,136,0.46)]"
      : capacityPercent >= 70
        ? "bg-[#00FF88] shadow-[0_0_18px_rgba(0,255,136,0.35)]"
        : capacityPercent >= 40
          ? "bg-[#00FF88]"
          : "bg-white/45";

  return (
    <Link
      href={`/events/${event.slug}`}
      aria-label={`Open event ${event.title}`}
      className={`focus-ring app-native-panel group relative grid min-w-0 overflow-hidden motion-safe:animate-[fadeUp_620ms_cubic-bezier(0.16,1,0.3,1)_both] motion-safe:transition-[transform,border-color,background-color,box-shadow] motion-safe:duration-300 motion-safe:ease-out hover:border-[#00FF88]/35 hover:bg-[#00FF88]/[0.025] hover:shadow-[0_0_46px_rgba(0,255,136,0.08)] motion-safe:hover:-translate-y-0.5 ${
        featured ? "lg:grid-cols-[1.08fr_0.92fr]" : ""
      }`}
    >
      <span className="absolute left-0 top-0 z-20 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
      <span className="pointer-events-none absolute left-3 top-3 z-20 h-4 w-4 border-l border-t border-[#00FF88]/45 opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-3 right-3 z-20 h-4 w-4 border-b border-r border-[#00FF88]/45 opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100" aria-hidden="true" />

      <div className={`relative overflow-hidden bg-black ${featured ? "aspect-[3/4] min-h-[320px] sm:aspect-[4/3] sm:min-h-[320px] lg:aspect-auto lg:min-h-[460px]" : "aspect-[3/4] min-h-[320px] sm:aspect-[4/3]"}`}>
        <SafeEventImage
          src={event.image}
          alt={`${event.title} event poster`}
          className="object-contain object-center opacity-95 motion-safe:transition-[transform,opacity,filter] motion-safe:duration-300 motion-safe:ease-out group-hover:scale-[1.01] group-hover:opacity-100"
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/22 via-transparent to-black/5" />
        <p className={`absolute left-4 top-4 border bg-[#020202]/95 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#00FF88] ${
          urgent ? "border-[#00FF88]/40 shadow-[0_0_24px_rgba(0,255,136,0.12)]" : "border-white/[0.05]"
        }`}>
          <LocalizedText ua={statusLabel.ua} en={statusLabel.en} />
        </p>
      </div>
      <div className={`flex min-w-0 flex-col justify-between border-t border-white/[0.05] p-5 ${featured ? "lg:border-l lg:border-t-0 lg:p-7" : ""}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              <LocalizedEventDate date={event.date} /> / {event.city}
            </p>
            <StatusBadge label={event.status} variant={urgent ? "limited" : event.status} size="sm" />
          </div>
          <h3 className={`mt-3 break-words font-black uppercase leading-[0.98] text-white [text-shadow:0_0_40px_rgba(255,255,255,0.06)] ${featured ? "text-[clamp(1.9rem,10vw,4.25rem)] lg:leading-[0.94]" : "text-[clamp(1.55rem,8vw,2.1rem)]"}`}>
            {event.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">
            {event.subtitle}
          </p>
          <p className="mt-4 inline-flex items-start gap-2 font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-white/[0.46] sm:tracking-[0.18em]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.5)]" aria-hidden="true" />
            <LocalizedText ua={`${registeredCount} зареєстровано / ${remainingCapacity} місць залишилось`} en={`${registeredCount} registered / ${remainingCapacity} spots remaining`} />
          </p>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-2 border-t border-white/[0.05] pt-5 min-[360px]:grid-cols-2 sm:grid-cols-3">
          {[
            { id: "city", value: event.city, label: <LocalizedText ua="місто" en="city" /> },
            { id: "price", value: <LocalizedPrice price={event.price} currency={event.currency} />, label: <LocalizedText ua="ціна" en="price" /> },
            { id: "registered", value: registeredCount, label: <LocalizedText ua="зареєстровано" en="registered" /> },
            { id: "remaining", value: remainingCapacity, label: <LocalizedText ua="залишилось" en="remaining" /> },
            ...(paidTickets > 0 || reservedTickets > 0
              ? [{ id: "tickets", value: `${paidTickets}/${reservedTickets}`, label: <LocalizedText ua="оплачено/резерв" en="paid/reserved" /> }]
              : [])
          ].map(({ id, value, label }) => (
            <div key={id} className="min-w-0 border border-white/[0.05] bg-[#030303] p-3 motion-safe:transition-colors motion-safe:duration-300 group-hover:border-white/[0.08]">
              <p className="break-words font-mono text-xs font-semibold uppercase leading-5 text-white">{value}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            <span><LocalizedText ua="Місткість" en="Capacity" /></span>
            <span className="font-mono tabular-nums"><LocalizedText ua={`${capacityPercent}% заповнено`} en={`${capacityPercent}% filled`} /></span>
          </div>
          <div className="h-1 overflow-hidden bg-white/15">
            <div
              className={`h-full origin-left ${capacityTone} motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
        <div className="mt-5 flex min-h-12 items-center justify-between gap-4 border border-primary/25 bg-primary/[0.035] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
          <span className="text-primary"><LocalizedText ua="Відкрити подію" en="Open event" /></span>
          <span className="text-[#00FF88] motion-safe:transition-transform motion-safe:duration-300 group-hover:translate-x-1" aria-hidden="true">
            -&gt;
          </span>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(14px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `
        }}
      />
    </Link>
  );
}
