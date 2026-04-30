import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, CalendarDays, Clock, MapPin, Mic2, Send, Tags, UserRound, Users } from "lucide-react";
import { organizer } from "@/data/organizers";
import { getEventDetailStatsWithFallback, getPublicEventBySlugWithFallback } from "@/lib/supabase/events";
import { buildTelegramUrl } from "@/lib/telegram";
import { TelegramCta } from "@/components/events/telegram-cta";
import { ReferralClickTracker } from "@/components/events/referral-click-tracker";
import { ReferralBox } from "@/components/events/referral-box";
import { WalletPlaceholder } from "@/components/events/wallet-placeholder";
import { SafeEventImage } from "@/components/events/safe-event-image";
import { LocalizedText } from "@/components/shared/localized-text";
import { LocalizedEventDate } from "@/components/shared/localized-event-date";
import { LocalizedPrice } from "@/components/shared/localized-price";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type EventDetailPageProps = {
  params: { slug: string };
  searchParams?: { ref?: string };
};

function getEventParagraphs(value: string | null | undefined) {
  const text = value?.trim();

  if (!text) {
    return [];
  }

  const explicit = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

  if (explicit.length > 1 || text.length <= 360) {
    return explicit;
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((items, sentence) => {
      const current = items[items.length - 1] ?? "";

      if (!current || current.length + sentence.length > 260) {
        items.push(sentence);
      } else {
        items[items.length - 1] = `${current} ${sentence}`;
      }

      return items;
    }, []);
}

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const event = await getPublicEventBySlugWithFallback(params.slug);

  if (!event) {
    notFound();
  }

  const referralCode = searchParams?.ref?.trim() || null;
  const stats = await getEventDetailStatsWithFallback(event);
  const registeredCount = stats.totalRegistrations;
  const telegramUrl = buildTelegramUrl(event.slug, referralCode);
  const eventStatusLabel =
    event.status === "soon"
      ? { ua: "Скоро", en: "SOON" }
      : event.status === "limited"
        ? { ua: "Обмежено", en: "LIMITED" }
        : { ua: "Наживо", en: "LIVE" };
  const aboutParagraphs = getEventParagraphs(event.description);
  const capacityPercent = stats.capacityFillPercent;
  const urgent = capacityPercent >= 60;
  const locationLabel = [event.city, event.venue].filter(Boolean).join(", ") || event.address || "Локація уточнюється";
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
      ? { label: { ua: "Критична місткість", en: "Critical capacity" }, tone: "border-red-400/25 bg-red-400/[0.035] text-red-200" }
      : capacityPercent >= 70
        ? { label: { ua: "Місткість швидко заповнюється", en: "Warning capacity" }, tone: "border-[#00FF88]/30 bg-[#00FF88]/[0.035] text-[#00FF88]" }
        : capacityPercent >= 40
          ? { label: { ua: "Попит зростає", en: "Demand warming" }, tone: "border-white/[0.08] bg-white/[0.025] text-white/60" }
          : { label: { ua: "Спокійна хвиля", en: "Calm wave" }, tone: "border-white/[0.05] bg-white/[0.018] text-white/45" };
  const eventInfo = [
    { key: "date", label: <LocalizedText ua="Дата" en="Date" />, value: <LocalizedEventDate date={event.date} />, Icon: CalendarDays },
    { key: "time", label: <LocalizedText ua="Час" en="Time" />, value: event.doorsOpen || event.time || "TBA", Icon: Clock },
    { key: "location", label: <LocalizedText ua="Локація" en="Location" />, value: event.address || locationLabel, Icon: MapPin },
    { key: "age", label: <LocalizedText ua="Вік" en="Age" />, value: event.ageLimit || "18+", Icon: Users },
    { key: "format", label: <LocalizedText ua="Формат" en="Format" />, value: event.eventType || <LocalizedText ua="Жива подія" en="Live event" />, Icon: Activity },
    { key: "category", label: <LocalizedText ua="Категорія" en="Category" />, value: event.tags[0] || "Rave", Icon: Tags }
  ];

  return (
    <div className="overflow-x-hidden bg-[#000000] text-white">
      <ReferralClickTracker eventId={event.id} referralCode={referralCode} />
      <section className="group relative overflow-hidden border-b border-white/[0.05]">
        <SafeEventImage
          src={event.image}
          alt={`${event.title} atmosphere`}
          priority
          className="object-cover object-center opacity-48 motion-safe:transition-[transform,opacity,filter] motion-safe:duration-300 motion-safe:ease-out group-hover:scale-[1.01] group-hover:opacity-60"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.68)_46%,rgba(0,0,0,0.18)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:80px_80px] opacity-45" />

        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-end gap-8 px-3 pb-10 pt-12 sm:px-6 sm:pt-20 md:min-h-[680px] md:px-10 md:pb-16 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.72fr)] lg:items-center lg:px-12 2xl:max-w-[1500px]">
          <div className="w-full max-w-[860px]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={eventStatusLabel.en} variant={event.status === "limited" ? "limited" : event.status === "soon" ? "soon" : "live"} />
              {referralCode ? (
                <span className="inline-flex min-h-8 items-center border border-white/[0.06] bg-black/80 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  Ref {referralCode}
                </span>
              ) : null}
            </div>

            <h1 className="mt-6 max-w-[900px] whitespace-normal text-[clamp(2rem,11vw,4.25rem)] font-black uppercase leading-[1] tracking-normal text-white [hyphens:none] [overflow-wrap:anywhere] [text-wrap:balance] [word-break:normal] lg:leading-[0.96]">
              {event.title}
            </h1>

            {event.subtitle ? (
              <p className="mt-5 max-w-[700px] text-base font-light leading-7 text-white/70 sm:text-lg sm:leading-8">{event.subtitle}</p>
            ) : null}

            <div className="mt-8 grid gap-3 font-mono text-[10px] uppercase tracking-[0.09em] text-white/78 sm:grid-cols-2 sm:tracking-[0.13em] lg:grid-cols-4">
              {[
                { key: "date", Icon: CalendarDays, text: <LocalizedEventDate date={event.date} /> },
                { key: "location", Icon: MapPin, text: locationLabel },
                { key: "price", Icon: Tags, text: <LocalizedPrice price={event.price} currency={event.currency} /> },
                { key: "capacity", Icon: Users, text: <LocalizedText ua={`${registeredCount}/${event.capacity} зареєстровано`} en={`${registeredCount}/${event.capacity} registered`} /> }
              ].map(({ key, Icon, text }) => (
                <div key={key} className="flex min-h-14 min-w-0 items-center gap-3 border border-white/[0.06] bg-black/74 px-4 py-3 backdrop-blur-sm">
                  <Icon className="h-4 w-4 shrink-0 text-[#00FF88]" aria-hidden="true" />
                  <span className="min-w-0 break-words leading-5">{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:flex sm:items-center">
              <Link
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-3 bg-[#00FF88] px-5 py-3 text-center font-mono text-[11px] font-bold uppercase leading-5 tracking-[0.12em] text-black shadow-[0_0_34px_rgba(0,255,136,0.16)] transition duration-200 hover:scale-[1.01] hover:brightness-110 hover:shadow-[0_0_44px_rgba(0,255,136,0.22)] active:scale-[0.99] sm:w-auto sm:px-6 sm:tracking-[0.16em]"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <LocalizedText ua="Відкрити Telegram bot" en="Open Telegram bot" />
              </Link>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/42">
                <LocalizedText ua="Реєстрація проходить через Telegram-бот." en="Registration continues in the Telegram bot." />
              </p>
            </div>
          </div>

          <div className="order-first w-full lg:order-none">
            <div className="relative mx-auto aspect-[3/4] max-h-[68vh] min-h-[300px] max-w-[620px] overflow-hidden border border-white/[0.08] bg-black shadow-[0_0_80px_rgba(0,255,136,0.08)] sm:aspect-[4/3] lg:ml-auto lg:max-h-[560px]">
              <SafeEventImage
                src={event.image}
                alt={`${event.title} event poster`}
                priority
                className="object-contain object-center opacity-100 motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.01]"
                sizes="(min-width: 1024px) 44vw, 100vw"
              />
              <div className="pointer-events-none absolute inset-0 border border-[#00FF88]/10" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-3 py-10 sm:px-6 md:px-10 md:py-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:px-12 xl:grid-cols-[minmax(0,1fr)_384px] 2xl:max-w-[1500px]">
        <div className="space-y-10">
          <article className="max-w-[700px] border-y border-white/[0.05] py-7 md:py-10">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF88]">
                <LocalizedText ua="Про подію" en="About event" />
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">01</span>
            </div>
            <div className="mt-6 space-y-5 text-base leading-7 text-white/68 sm:text-lg sm:leading-[1.7]">
              {(aboutParagraphs.length ? aboutParagraphs : [event.description]).filter(Boolean).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <article className="border-y border-white/[0.05] py-8 md:py-10">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF88]"><LocalizedText ua="Інформація" en="Event info" /></p>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">02</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {eventInfo.map(({ key, label, value, Icon }) => (
                <div key={key} className="group flex min-h-24 items-start gap-4 border border-white/[0.06] bg-[#020202] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#00FF88]/25">
                  <Icon className="mt-1 h-4 w-4 shrink-0 text-[#00FF88]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</p>
                    <p className="mt-2 break-words text-sm leading-6 text-white/72">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="border-y border-white/[0.05] py-8 md:py-10">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF88]"><LocalizedText ua="Лайнап / програма" en="Lineup / agenda" /></p>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">03</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {event.lineup.map((artist, index) => (
                <div key={artist} className="group flex min-h-32 flex-col justify-between border border-white/[0.06] bg-[#020202] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#00FF88]/35 hover:bg-[#00FF88]/[0.025]">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/26">{String(index + 1).padStart(2, "0")}</p>
                    <Mic2 className="h-4 w-4 text-[#00FF88]" aria-hidden="true" />
                  </div>
                  <p className="mt-6 break-words text-2xl font-black uppercase leading-none text-white transition duration-200 group-hover:text-[#00FF88]">{artist}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="border-y border-white/[0.05] py-8 md:py-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]">
              <LocalizedText ua="Організатор" en="Organizer" />
            </p>
            <div className="mt-6 flex flex-col gap-5 border border-white/[0.06] bg-[#020202] p-5 sm:flex-row sm:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#00FF88]/25 bg-[#00FF88]/[0.04] text-[#00FF88]">
                <UserRound className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-black uppercase leading-none text-white">{event.organizerName || organizer.name}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62">{event.organizerDescription || organizer.description}</p>
                {event.organizerContact ? <p className="mt-4 break-words font-mono text-[10px] uppercase tracking-[0.18em] text-[#00FF88]">{event.organizerContact}</p> : null}
              </div>
            </div>
          </article>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="relative border border-[#00FF88]/20 bg-[#020202] p-5 shadow-[0_0_72px_rgba(0,255,136,0.06)]">
            <span className="absolute left-0 top-0 h-px w-full bg-[#00FF88]" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35"><LocalizedText ua="Квиток" en="Ticket" /></p>
            <p className="mt-3 font-mono text-[clamp(2rem,11vw,2.5rem)] font-semibold leading-none text-white">
              <LocalizedPrice price={event.price} currency={event.currency} />
            </p>
            {urgent ? (
              <p className="mt-3 border border-[#00FF88]/25 bg-[#00FF88]/[0.035] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00FF88]">
                <LocalizedText ua="Активна остання хвиля" en="Last wave active" />
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
              <p className={`border px-3 py-2 ${pressure.tone}`}><LocalizedText ua={pressure.label.ua} en={pressure.label.en} /></p>
              <p className="border border-[#00FF88]/25 bg-[#00FF88]/[0.03] px-3 py-2 text-[#00FF88]">{event.ticketWaveLabel || <LocalizedText ua="Хвиля активна" en="Wave active" />}</p>
            </div>
            <div className="mt-5 grid gap-2 border-y border-white/[0.05] py-4 min-[360px]:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35"><LocalizedText ua="Зареєстровано" en="Registered" /></p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-white">{registeredCount}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35"><LocalizedText ua="Місткість" en="Capacity" /></p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-white">{event.capacity}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 border-b border-white/[0.05] pb-4 min-[360px]:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35"><LocalizedText ua="Підтверджено / очікують" en="Confirmed / pending" /></p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-white">
                  {stats.confirmedRegistrations} / {stats.pendingRegistrations}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35"><LocalizedText ua="Оплачено / резерв" en="Paid / reserved" /></p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-white">
                  {stats.paidTickets} / {stats.reservedTickets}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                <span><LocalizedText ua="Місткість" en="Capacity" /></span>
                <span className="tabular-nums"><LocalizedText ua={`${capacityPercent}% заповнено`} en={`${capacityPercent}% filled`} /></span>
              </div>
              <div className="h-1 overflow-hidden bg-white/20">
                <div className={`h-full origin-left ${capacityTone} motion-safe:animate-[barFill_700ms_cubic-bezier(0.16,1,0.3,1)_both]`} style={{ width: `${capacityPercent}%`, "--bar-width": `${capacityPercent}%` } as CSSProperties} />
              </div>
            </div>
          </section>

          <TelegramCta eventSlug={event.slug} referralCode={referralCode} />
          <ReferralBox path={`/events/${event.slug}`} activeReferral={referralCode} />
          <WalletPlaceholder />
        </aside>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes barFill {
              from { width: 0; }
              to { width: var(--bar-width); }
            }
          `
        }}
      />
    </div>
  );
}
