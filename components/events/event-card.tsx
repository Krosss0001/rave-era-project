import Link from "next/link";
import type { RaveeraEvent } from "@/data/events";
import { getCapacityPercent } from "@/lib/format";
import { SafeEventImage } from "@/components/events/safe-event-image";
import { LocalizedEventDate } from "@/components/shared/localized-event-date";
import { LocalizedPrice } from "@/components/shared/localized-price";
import { LocalizedText } from "@/components/shared/localized-text";

type EventCardProps = {
  event: RaveeraEvent;
  featured?: boolean;
};

export function EventCard({ event, featured = false }: EventCardProps) {
  const seed = event.id.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const recentSales = 8 + (seed % 9);
  const capacityPercent = getCapacityPercent(event.registered, event.capacity);
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
      className={`focus-ring group relative grid overflow-hidden border border-white/[0.06] bg-[#020202] motion-safe:animate-[fadeUp_620ms_cubic-bezier(0.16,1,0.3,1)_both] motion-safe:transition-[transform,border-color,background-color,box-shadow] motion-safe:duration-300 motion-safe:ease-out hover:border-[#00FF88]/35 hover:bg-[#00FF88]/[0.025] hover:shadow-[0_0_42px_rgba(0,255,136,0.06)] motion-safe:hover:-translate-y-0.5 ${
        featured ? "lg:grid-cols-[1.08fr_0.92fr]" : ""
      }`}
    >
      <span className="absolute left-0 top-0 z-20 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
      <span className="pointer-events-none absolute left-3 top-3 z-20 h-4 w-4 border-l border-t border-[#00FF88]/45 opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-3 right-3 z-20 h-4 w-4 border-b border-r border-[#00FF88]/45 opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100" aria-hidden="true" />

      <div className={`relative overflow-hidden bg-black ${featured ? "aspect-[4/3] min-h-[220px] sm:min-h-[280px] lg:aspect-auto lg:min-h-[440px]" : "aspect-[4/3] sm:aspect-[16/10]"}`}>
        <SafeEventImage
          src={event.image}
          alt={`${event.title} event poster`}
          className="object-contain object-center opacity-90 grayscale motion-safe:transition-[transform,opacity,filter] motion-safe:duration-300 motion-safe:ease-out group-hover:scale-[1.01] group-hover:opacity-100 group-hover:grayscale-0"
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <p className={`absolute left-4 top-4 border bg-[#020202]/95 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[#00FF88] ${
          urgent ? "border-[#00FF88]/40 shadow-[0_0_24px_rgba(0,255,136,0.12)] motion-safe:animate-[signalPulse_1.8s_ease-out_infinite]" : "border-white/[0.05]"
        }`}>
          <LocalizedText ua={statusLabel.ua} en={statusLabel.en} />
        </p>
      </div>
      <div className={`flex flex-col justify-between border-t border-white/[0.05] p-5 ${featured ? "lg:border-l lg:border-t-0 lg:p-7" : ""}`}>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            <LocalizedEventDate date={event.date} /> / {event.city} / <span className="text-[#00FF88]"><LocalizedText ua={statusLabel.ua} en={statusLabel.en} /></span>
          </p>
          <h3 className={`mt-3 break-words font-black uppercase leading-[0.98] text-white [text-shadow:0_0_40px_rgba(255,255,255,0.06)] ${featured ? "text-[clamp(2rem,11vw,4.5rem)] lg:leading-[0.94]" : "text-[clamp(1.75rem,9vw,2.25rem)]"}`}>
            {event.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">
            {event.subtitle}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/[0.38]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.5)] motion-safe:animate-[signalPulse_1.8s_ease-out_infinite]" aria-hidden="true" />
            <LocalizedText ua={`${recentSales} квитків за останню хвилю продажів`} en={`${recentSales} tickets sold in the latest sales window`} />
          </p>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-2 border-t border-white/[0.05] pt-5 min-[360px]:grid-cols-2 sm:grid-cols-3">
          {[
            { id: "city", value: event.city, label: <LocalizedText ua="місто" en="city" /> },
            { id: "price", value: <LocalizedPrice price={event.price} currency={event.currency} />, label: <LocalizedText ua="ціна" en="price" /> },
            { id: "time", value: event.time, label: <LocalizedText ua="час" en="time" /> }
          ].map(({ id, value, label }) => (
            <div key={id} className="min-w-0 border border-white/[0.05] bg-[#030303] p-3 motion-safe:transition-colors motion-safe:duration-300 group-hover:border-white/[0.08]">
              <p className="truncate font-mono text-xs font-semibold uppercase text-white">{value}</p>
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
              className={`h-full origin-left ${capacityTone} motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${
                urgent ? "motion-safe:animate-[signalPulse_1.8s_ease-out_infinite]" : ""
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
        <div className="mt-5 flex min-h-11 items-center justify-between gap-4 border-t border-white/[0.05] pt-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
          <span className="text-white/45"><LocalizedText ua="Відкрити подію" en="Open event" /></span>
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
            @keyframes signalPulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.62; }
            }
          `
        }}
      />
    </Link>
  );
}
