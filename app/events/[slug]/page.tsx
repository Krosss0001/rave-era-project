import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Tags, Users } from "lucide-react";
import { organizer } from "@/data/organizers";
import { formatEventDate, getCapacityPercent } from "@/lib/format";
import { getPublicEventBySlugWithFallback } from "@/lib/supabase/events";
import { TelegramCta } from "@/components/events/telegram-cta";
import { EventRegistrationForm } from "@/components/events/event-registration-form";
import { ReferralBox } from "@/components/events/referral-box";
import { WalletPlaceholder } from "@/components/events/wallet-placeholder";
import { LiveEventSignals } from "@/components/events/live-event-signals";
import { SafeEventImage } from "@/components/events/safe-event-image";
import { LocalizedText } from "@/components/shared/localized-text";
import { LocalizedPrice } from "@/components/shared/localized-price";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type EventDetailPageProps = {
  params: { slug: string };
  searchParams?: { ref?: string };
};

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const event = await getPublicEventBySlugWithFallback(params.slug);

  if (!event) {
    notFound();
  }

  const referralCode = searchParams?.ref;
  const capacityPercent = getCapacityPercent(event.registered, event.capacity);
  const urgent = capacityPercent >= 60;
  const capacityTone =
    capacityPercent >= 90
      ? "bg-[#00FF88] shadow-[0_0_24px_rgba(0,255,136,0.48)]"
      : capacityPercent >= 70
        ? "bg-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.4)]"
        : capacityPercent >= 40
          ? "bg-[#00FF88]"
          : "bg-white/45";
  const pressure =
    capacityPercent >= 90
      ? { label: "Critical capacity", tone: "border-red-400/25 bg-red-400/[0.035] text-red-200" }
      : capacityPercent >= 70
        ? { label: "Warning capacity", tone: "border-[#00FF88]/30 bg-[#00FF88]/[0.035] text-[#00FF88]" }
        : capacityPercent >= 40
          ? { label: "Demand warming", tone: "border-white/[0.08] bg-white/[0.025] text-white/60" }
          : { label: "Calm wave", tone: "border-white/[0.05] bg-white/[0.018] text-white/45" };

  return (
    <div className="bg-[#000000]">
      <section className="group relative min-h-[calc(100svh-4rem)] overflow-hidden border-b border-white/[0.05] lg:min-h-[86vh]">
        <SafeEventImage
          src={event.image}
          alt={`${event.title} atmosphere`}
          priority
          className="object-cover object-center opacity-42 grayscale motion-safe:transition-[transform,opacity,filter] motion-safe:duration-500 motion-safe:ease-out group-hover:scale-[1.01] group-hover:opacity-58 group-hover:grayscale-0"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:80px_80px] opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.76)_42%,rgba(0,0,0,0.38)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/58 to-[#000000]/36" />
        <div className="absolute right-[-14%] top-[10%] h-[45vw] w-[45vw] bg-[#00FF88]/10 blur-[160px] motion-safe:animate-[orbDrift_10s_cubic-bezier(0.16,1,0.3,1)_infinite_alternate]" />
        <div className="absolute inset-0 opacity-[0.055] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-end px-4 pb-10 pt-28 sm:px-6 md:px-10 lg:min-h-[86vh] lg:px-12 2xl:max-w-[1500px]">
          <div className="max-w-[min(54rem,100%)]">
            <span className="inline-flex min-h-8 items-center border border-[#00FF88]/40 bg-[#00FF88]/5 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#00FF88]">
              {event.status === "limited" ? "Limited capacity" : event.status === "live" ? "Tickets live" : "Coming soon"}
            </span>
            {referralCode ? (
              <span className="ml-3 inline-flex min-h-8 items-center border border-white/[0.05] bg-[#020202] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">
                Ref {referralCode}
              </span>
            ) : null}
            <h1 className="drop-reveal mt-6 max-w-[min(100%,19rem)] break-normal whitespace-normal text-[clamp(2.25rem,11vw,4.5rem)] font-black uppercase leading-[0.92] tracking-normal text-white [hyphens:none] [overflow-wrap:normal] [text-wrap:balance] [word-break:normal] sm:max-w-[min(100%,36rem)] sm:text-[clamp(3rem,8vw,6rem)] lg:max-w-[min(100%,52rem)] lg:text-[clamp(4.25rem,7vw,7.25rem)]">
              {event.title}
            </h1>
            <p className="drop-reveal mt-7 max-w-2xl text-lg font-light leading-8 text-white/60">{event.subtitle}</p>
            <p className="mt-5 inline-flex border-l border-[#00FF88] pl-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00FF88] motion-safe:animate-[signalPulse_1.8s_ease-out_infinite]">
              {event.urgencyNote || "Last wave of tickets / Access closing soon"}
            </p>
            <LiveEventSignals eventId={event.id} />
            <div className="drop-reveal mt-10 grid gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [CalendarDays, `${formatEventDate(event.date)} / ${event.time}`],
                [MapPin, `${event.city}, ${event.venue}`],
                [Tags, event.eventType || event.tags[0] || "Event"],
                [Users, `${event.registered}/${event.capacity} registered`]
              ].map(([Icon, text]) => (
                <div key={text as string} className="flex min-h-14 items-center gap-3 border border-white/[0.05] bg-[#020202]/85 px-4 py-3 backdrop-blur-sm motion-safe:transition-colors motion-safe:duration-500 hover:border-[#00FF88]/25">
                  <Icon className="h-4 w-4 text-[#00FF88]" aria-hidden="true" />
                  <span>{text as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 md:px-10 md:py-32 lg:grid-cols-[1fr_400px] lg:px-12 2xl:max-w-[1500px]">
        <div className="space-y-10">
          <article className="border-y border-white/[0.05] bg-[#020202] py-8 md:px-8">
            <p className="drop-reveal flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]">
              <span className="text-white/20">01</span>
              <span className="drop-line h-px w-7 origin-left bg-white/20" aria-hidden="true" />
              <LocalizedText ua="Профіль події" en="Event profile" />
            </p>
            <h2 className="drop-reveal mt-5 text-4xl font-black uppercase leading-[0.88] text-white md:text-7xl">
              <LocalizedText ua="Преміальна подія, контрольований доступ" en="Premium event, controlled entry" />
            </h2>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/60">{event.description}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                event.address ? `Address: ${event.address}` : null,
                event.doorsOpen ? `Doors: ${event.doorsOpen}` : null,
                event.ageLimit ? `Age: ${event.ageLimit}` : null,
                event.dressCode ? `Dress: ${event.dressCode}` : null
              ].filter((detail): detail is string => Boolean(detail)).map((detail) => (
                <div key={detail} className="border border-white/[0.05] bg-[#030303] p-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
                  {detail}
                </div>
              ))}
              {event.tags.map((tag) => (
                <div key={tag} className="border border-white/[0.05] bg-[#030303] p-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 motion-safe:transition-colors motion-safe:duration-500 hover:border-[#00FF88]/30 hover:text-[#00FF88]">
                  {tag}
                </div>
              ))}
            </div>
          </article>

          <article className="border-y border-white/[0.05] bg-[#020202] py-8 md:px-8">
            <p className="drop-reveal flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]">
              <span className="text-white/20">02</span>
              <span className="drop-line h-px w-7 origin-left bg-white/20" aria-hidden="true" />
              Lineup
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {event.lineup.map((artist, index) => (
                <div key={artist} className="group relative overflow-hidden border border-white/[0.05] bg-[#030303] p-5 motion-safe:transition-colors motion-safe:duration-500 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02]">
                  <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
                  <p className="font-mono text-[10px] text-white/20">{String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-3 text-2xl font-black uppercase leading-none text-white motion-safe:transition-colors motion-safe:duration-500 group-hover:text-[#00FF88]">
                    {artist}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="border-y border-white/[0.05] bg-[#020202] py-8 md:px-8">
            <p className="drop-reveal flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]">
              <span className="text-white/20">03</span>
              <span className="drop-line h-px w-7 origin-left bg-white/20" aria-hidden="true" />
              <LocalizedText ua="Організатор" en="Organizer" />
            </p>
            <h2 className="mt-5 text-3xl font-black uppercase text-white">{event.organizerName || organizer.name}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">{event.organizerDescription || organizer.description}</p>
            {event.organizerContact ? (
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{event.organizerContact}</p>
            ) : null}
          </article>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="relative border border-[#00FF88]/20 bg-[#020202] p-5 shadow-[0_0_90px_rgba(0,255,136,0.07)]">
            <span className="absolute left-0 top-0 h-px w-full bg-[#00FF88]" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">Ticket wave</p>
            <p className="mt-3 font-mono text-4xl font-semibold text-white"><LocalizedPrice price={event.price} currency={event.currency} /></p>
            {urgent ? (
              <p className="mt-3 border border-[#00FF88]/25 bg-[#00FF88]/[0.035] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00FF88] motion-safe:animate-[signalPulse_1.8s_ease-out_infinite]">
                Last wave active
              </p>
            ) : null}
            <div className="mt-3 grid gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
              <p className={`border px-3 py-2 ${pressure.tone}`}>{pressure.label}</p>
              <p className="border border-[#00FF88]/25 bg-[#00FF88]/[0.03] px-3 py-2 text-[#00FF88]">{event.ticketWaveLabel || "Wave 3 active"}</p>
              <p className="border border-white/[0.05] bg-[#030303] px-3 py-2 text-white/35">Next wave locked</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-y border-white/[0.05] py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Registered</p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-white">{event.registered}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Capacity</p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-white">{event.capacity}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                <span>Capacity</span>
                <span className="font-mono tabular-nums">{capacityPercent}% filled</span>
              </div>
              <div className="h-px overflow-hidden bg-white/20">
                <div
                  className={`h-full origin-left ${capacityTone} motion-safe:animate-[barFill_700ms_cubic-bezier(0.16,1,0.3,1)_both] ${
                    capacityPercent >= 70 ? "motion-safe:animate-[barFill_700ms_cubic-bezier(0.16,1,0.3,1)_both,signalPulse_1.8s_ease-out_infinite]" : ""
                  }`}
                  style={{ width: `${capacityPercent}%`, "--bar-width": `${capacityPercent}%` } as CSSProperties}
                />
              </div>
            </div>
            <div className="mt-5 grid gap-2 border-t border-white/[0.05] pt-4">
              {[
                "Telegram confirmation active",
                event.referralEnabled === false ? "Referral layer disabled" : "Referral link ready",
                event.walletEnabled === false ? "Wallet layer disabled" : "Wallet layer standby"
              ].map((item) => (
                <p key={item} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.45)]" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </section>
          <TelegramCta eventSlug={event.slug} referralCode={referralCode} />
          <ReferralBox path={`/events/${event.slug}`} activeReferral={referralCode} />
          <WalletPlaceholder />
          <EventRegistrationForm eventId={event.id} eventSlug={event.slug} eventPrice={event.price} referralCode={referralCode} />
        </aside>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes barFill {
              from { width: 0; }
              to { width: var(--bar-width); }
            }
            @keyframes signalPulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.58; }
            }
            @keyframes orbDrift {
              from { transform: translate3d(0, 0, 0) scale(1); }
              to { transform: translate3d(-5%, 4%, 0) scale(1.08); }
            }
            @keyframes dropFadeUp {
              from { opacity: 0; transform: translateY(18px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes dropLineReveal {
              from { transform: scaleX(0); opacity: 0.2; }
              to { transform: scaleX(1); opacity: 1; }
            }
            @supports (animation-timeline: view()) {
              .drop-reveal {
                opacity: 0;
                animation: dropFadeUp 820ms cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-timeline: view();
                animation-range: entry 8% cover 30%;
              }
              .drop-line {
                transform: scaleX(0);
                animation: dropLineReveal 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-timeline: view();
                animation-range: entry 10% cover 30%;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .drop-reveal,
              .drop-line {
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
