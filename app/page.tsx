import Link from "next/link";
import { ArrowRight, Bot, ChartNoAxesCombined, Sparkles, WalletCards } from "lucide-react";
import { featuredEvent } from "@/data/events";
import { formatPrice, getCapacityPercent } from "@/lib/format";
import { SafeEventImage } from "@/components/events/safe-event-image";

const platformCards = [
  {
    icon: Sparkles,
    title: "Event Discovery",
    copy: "Premium event pages and a public discovery surface built to make demand visible."
  },
  {
    icon: Bot,
    title: "Telegram Execution",
    copy: "Registration state, payment context, and confirmations continue inside the channel people use."
  },
  {
    icon: ChartNoAxesCombined,
    title: "Referral Growth",
    copy: "Every attendee can become distribution through tracked shares, source signals, and conversion loops."
  },
  {
    icon: WalletCards,
    title: "Solana-ready Access",
    copy: "Wallet-ready architecture for gated access, collector passes, and future reward mechanics."
  }
];

const growthCards = [
  ["Not just ticketing", "Raveera treats the event page as a conversion surface, not a checkout link."],
  ["Referral loops", "Each registration can create measurable distribution before the doors open."],
  ["Telegram confirmation layer", "The operational handoff stays close to the audience instead of buried in email."],
  ["Organizer growth analytics", "Capacity, source, and attendee signals shape the next announcement."],
  ["Future wallet rewards", "Solana-ready access keeps room for loyalty, collector passes, and gated event utility."]
];

const demoSteps = [
  ["Discover", "Browse the curated public event page."],
  ["Register on web", "Commit through the lightweight web flow."],
  ["Continue in Telegram", "Receive status and confirmation where the community already lives."],
  ["Share referral", "Invite trusted friends through a tracked link."],
  ["Unlock access", "Arrive with verified status today and wallet-ready access later."]
];

const partners = [
  "MUSIC BOX",
  "STUDFEST",
  "CRYPTO.KARATIST",
  "ZEEKR",
  "MAISON CASTEL",
  "JACK DANIELS Old No. 7",
  "HIKE",
  "SENOR CARTEL",
  "TOOSECCO",
  "LAVAZZA",
  "NCrypto 2025",
  "NCrypto Awards",
  "E-Commerce Conf",
  "Parkovy",
  "VYAVA"
];

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="scroll-reveal mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]/90">
      <span className="text-white/20">{index}</span>
      <span className="scroll-line h-px w-7 origin-left bg-white/20" aria-hidden="true" />
      {label}
    </p>
  );
}

function CornerBrackets() {
  return (
    <>
      <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-[#00FF88]/45 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#00FF88]/45 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
    </>
  );
}

const revealStyle = (index: number) => ({
  animationDelay: `${index * 90}ms`
});

export default function HomePage() {
  const capacityPercent = getCapacityPercent(featuredEvent.registered, featuredEvent.capacity);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="pointer-events-none absolute left-[-20%] top-[28%] -z-10 h-[42vw] w-[42vw] bg-[#00FF88]/[0.035] blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.045] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px]" />
      <section className="relative overflow-hidden">
        <div className="absolute right-[-18%] top-[4%] -z-10 h-[55vw] w-[55vw] bg-[#00FF88]/10 blur-[150px] motion-safe:animate-[heroGlow_9s_cubic-bezier(0.16,1,0.3,1)_infinite_alternate]" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-28 sm:px-6 md:px-10 md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 2xl:max-w-[1500px]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 border border-white/[0.05] bg-[#020202] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88] shadow-[0_0_16px_rgba(0,255,136,0.75)] motion-safe:animate-[softPulse_2.2s_ease-out_infinite]" aria-hidden="true" />
              <span className="whitespace-nowrap">Rave<span className="text-[#00FF88]">&apos;</span>era</span> Group <span className="text-[#00FF88]" aria-hidden="true">{"\u00B7"}</span> Concerts <span className="text-[#00FF88]">&amp;</span> Marketing Agency
            </p>
            <h1 className="mt-8 text-[clamp(4.5rem,9.6vw,10.5rem)] font-black uppercase leading-[0.76] text-white">
              {["WE BUILD", "EVENTS", "THAT SELL"].map((line, index) => (
                <span
                  key={line}
                  className={`block motion-safe:animate-[revealLine_700ms_cubic-bezier(0.16,1,0.3,1)_both] ${
                    index === 2 ? "text-[#00FF88] [text-shadow:0_0_80px_rgba(0,255,136,0.28)]" : ""
                  }`}
                  style={revealStyle(index)}
                >
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-8 max-w-xl text-xl font-semibold uppercase leading-[1.05] text-white motion-safe:animate-[fadeUp_520ms_cubic-bezier(0.16,1,0.3,1)_360ms_both] md:text-3xl">
              We don&apos;t just run events.
              <br />
              We scale them.
            </p>
            <div className="mt-10 flex flex-col gap-3 motion-safe:animate-[fadeUp_520ms_cubic-bezier(0.16,1,0.3,1)_460ms_both] sm:flex-row">
              <Link
                href="/events"
                className="focus-ring group relative inline-flex min-h-11 items-center justify-center overflow-hidden border border-[#00FF88] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#00FF88] transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-black hover:shadow-[0_0_30px_rgba(0,255,136,0.12)] active:scale-[0.98]"
              >
                <span className="absolute inset-0 -translate-x-full bg-[#00FF88] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" aria-hidden="true" />
                <span className="relative z-10 inline-flex items-center">
                  Web version
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
              <Link
                href="/organizer"
                className="focus-ring group relative inline-flex min-h-11 items-center justify-center overflow-hidden bg-[#00FF88] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-black transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_0_30px_rgba(0,255,136,0.14)] active:scale-[0.98]"
              >
                <span className="absolute inset-0 -translate-x-full bg-white transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" aria-hidden="true" />
                <span className="relative z-10">Organizer OS</span>
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["8.4K", "community reach"],
                ["74%", "Noir Signal capacity"],
                ["76", "referral registrations"]
              ].map(([value, label], index) => (
                <div
                  key={label}
                  className="group relative overflow-hidden border border-white/[0.05] bg-[#020202] p-4 motion-safe:animate-[fadeUp_520ms_cubic-bezier(0.16,1,0.3,1)_both] transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02]"
                  style={revealStyle(index + 6)}
                >
                  <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
                  <p className="font-mono text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="group relative overflow-hidden border border-white/[0.05] bg-[#020202] transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:shadow-[0_0_80px_rgba(0,255,136,0.08)]">
              <CornerBrackets />
              <div className="relative aspect-[4/5]">
                <SafeEventImage
                  src={featuredEvent.image}
                  alt="Rave'era featured event audience"
                  priority
                  className="object-cover opacity-70 grayscale transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                  sizes="(min-width: 1024px) 42vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-[#00FF88]/[0.035] blur-2xl opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF88]">
                    Featured event
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-tight">{featuredEvent.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/45">{featuredEvent.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-reveal relative overflow-hidden border-y border-white/[0.05] bg-[#020202] py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.05),transparent_62%)]" />
        <div className="relative z-10 mx-auto mb-8 flex max-w-7xl flex-col justify-between gap-4 px-4 sm:px-6 md:flex-row md:items-end md:px-10 lg:px-12 2xl:max-w-[1500px]">
          <div>
            <p className="scroll-reveal font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]">Trusted By</p>
            <h2 className="scroll-reveal mt-3 text-4xl font-black uppercase leading-[0.86] text-white md:text-6xl">
              15+ Brands &amp; Partners
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/35">
            Culture, commerce, music, corporate, and crypto audiences already orbit the Raveera network.
          </p>
        </div>
        <div className="relative z-10 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="flex shrink-0 animate-[marquee_42s_linear_infinite] items-center gap-12 pr-12 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-white/25 hover:[animation-play-state:paused] md:gap-16 md:pr-16">
            {[...partners, ...partners].map((partner, index) => (
              <span
                key={`${partner}-${index}`}
                className="whitespace-nowrap opacity-70 transition duration-500 hover:opacity-100 hover:text-[#00FF88] hover:[text-shadow:0_0_18px_rgba(0,255,136,0.22)]"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] bg-[#000000] px-4 py-28 sm:px-6 md:px-10 md:py-40 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="01" label="Platform System" />
            <h2 className="scroll-reveal mt-4 max-w-3xl text-5xl font-black uppercase leading-[0.82] text-white md:text-7xl">
              One system for event demand
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-white/45">
            Raveera connects discovery, registration, Telegram execution, referral growth, and
            Solana-ready access without turning the experience into generic ticketing software.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformCards.map((card, index) => (
            <article
              key={card.title}
              className="scroll-card group relative border border-white/[0.05] bg-[#020202] p-5 transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02]"
              style={revealStyle(index)}
            >
              <CornerBrackets />
              <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
              <span className="absolute right-4 top-4 font-mono text-[10px] text-white/20 motion-safe:transition-[transform,color] motion-safe:duration-500 group-hover:-translate-y-0.5 group-hover:text-[#00FF88]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="inline-flex border border-white/[0.05] p-2 text-[#00FF88] transition group-hover:border-[#00FF88]/30 group-hover:shadow-[0_0_24px_rgba(0,255,136,0.12)]">
                <card.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-[11px] font-black uppercase tracking-[0.08em] text-white transition group-hover:text-[#00FF88]">
                {card.title}
              </h3>
              <p className="mt-3 text-xs leading-6 text-white/35">{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] bg-[#020202] px-4 py-28 sm:px-6 md:px-10 md:py-40 lg:px-12 2xl:max-w-[1500px]">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionLabel index="02" label="Featured Event" />
            <h2 className="scroll-reveal mt-4 text-5xl font-black uppercase leading-[0.82] text-white md:text-7xl">
              Event pages as product proof
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/45">
              The featured event shows the platform loop in one place: discovery page, conversion
              mechanics, capacity signals, Telegram continuation, and organizer-ready attribution.
            </p>
            <div className="mt-8">
              <Link
                href={`/events/${featuredEvent.slug}`}
                className="focus-ring inline-flex font-mono text-[11px] font-bold uppercase tracking-widest text-white/55 underline decoration-white/20 underline-offset-8 transition hover:text-[#00FF88] hover:decoration-[#00FF88]"
              >
                View event page
              </Link>
            </div>
          </div>
          <Link
            href={`/events/${featuredEvent.slug}`}
            className="scroll-card focus-ring group relative grid overflow-hidden border border-white/[0.05] bg-[#030303] transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02] md:grid-cols-[1.05fr_0.95fr]"
          >
            <CornerBrackets />
            <span className="absolute h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
            <div className="relative min-h-[320px] overflow-hidden">
              <SafeEventImage
                src={featuredEvent.image}
                alt={`${featuredEvent.title} event crowd`}
                className="object-cover opacity-70 grayscale transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                sizes="(min-width: 1024px) 42vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute left-4 top-4 border border-white/[0.05] bg-[#020202] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/55">
                {featuredEvent.status}
              </div>
            </div>
            <div className="flex flex-col justify-between border-t border-white/[0.05] p-6 md:border-l md:border-t-0">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00FF88]">
                  {featuredEvent.city} / {featuredEvent.venue}
                </p>
                <h3 className="mt-4 text-4xl font-black uppercase leading-[0.86] text-white md:text-5xl">
                  {featuredEvent.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-white/45">{featuredEvent.subtitle}</p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/[0.05] pt-5">
                {[
                  [capacityPercent + "%", "capacity"],
                  [formatPrice(featuredEvent.price, featuredEvent.currency), "price"],
                  [featuredEvent.city, "city"]
                ].map(([value, label]) => (
                  <div key={label} className="border border-white/[0.05] bg-[#020202] p-3">
                    <p className="font-mono text-sm font-semibold uppercase text-white">{value}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] bg-[#000000] px-4 py-28 sm:px-6 md:px-10 md:py-40 lg:px-12 2xl:max-w-[1500px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionLabel index="03" label="Growth Engine" />
            <h2 className="scroll-reveal mt-4 text-5xl font-black uppercase leading-[0.82] text-white md:text-6xl">
              Built beyond ticketing
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/45">
              Raveera keeps the premium event surface intact while adding the operating layers an
              organizer needs to grow: distribution, confirmation, analytics, and future wallet utility.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {growthCards.map(([title, copy], index) => (
              <article
                key={title}
                className={index === 0 ? "scroll-card group relative overflow-hidden border border-white/[0.05] bg-[#030303] p-5 transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02] md:col-span-2" : "scroll-card group relative overflow-hidden border border-white/[0.05] bg-[#020202] p-5 transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02]"}
                style={revealStyle(index)}
              >
                <CornerBrackets />
                <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.08em] text-white transition group-hover:text-[#00FF88]">
                    {title}
                  </h3>
                  <span className="font-mono text-[10px] text-white/20 transition group-hover:text-[#00FF88]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/45">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] bg-[#020202] px-4 py-28 sm:px-6 md:px-10 md:py-40 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="04" label="Demo Flow" />
            <h2 className="scroll-reveal mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.82] text-white md:text-7xl">
              From discovery to access
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/45">
            The MVP demonstrates the complete audience path without changing the routes behind it.
          </p>
        </div>
        <div className="mt-12 grid gap-3">
          {demoSteps.map(([title, copy], index) => (
            <article
              key={title}
              className="scroll-card group relative grid gap-4 overflow-hidden border border-white/[0.05] bg-[#030303] p-5 transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02] md:grid-cols-[120px_0.7fr_1fr] md:items-center"
              style={revealStyle(index)}
            >
              <CornerBrackets />
              <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
              <span className="font-mono text-[10px] text-white/20 transition group-hover:text-[#00FF88]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-2xl font-black uppercase leading-none text-white md:text-4xl">
                {title}
              </h3>
              <p className="text-sm leading-6 text-white/45">{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes marquee {
              from {
                transform: translateX(0);
              }
              to {
                transform: translateX(-50%);
              }
            }
            @keyframes revealLine {
              from {
                opacity: 0;
                transform: translateY(28px);
                clip-path: inset(0 0 100% 0);
              }
              to {
                opacity: 1;
                transform: translateY(0);
                clip-path: inset(0 0 0 0);
              }
            }
            @keyframes fadeUp {
              from {
                opacity: 0;
                transform: translateY(16px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes heroGlow {
              from {
                transform: translate3d(0, 0, 0) scale(1);
              }
              to {
                transform: translate3d(-6%, 4%, 0) scale(1.1);
              }
            }
            @keyframes softPulse {
              0%, 100% {
                opacity: 0.85;
                transform: scale(1);
                box-shadow: 0 0 10px rgba(0,255,136,0.45);
              }
              50% {
                opacity: 1;
                transform: scale(1.35);
                box-shadow: 0 0 18px rgba(0,255,136,0.78);
              }
            }
            @keyframes scrollFadeUp {
              from {
                opacity: 0;
                transform: translateY(22px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes scrollLineReveal {
              from {
                transform: scaleX(0);
                opacity: 0.2;
              }
              to {
                transform: scaleX(1);
                opacity: 1;
              }
            }
            @supports (animation-timeline: view()) {
              .scroll-reveal {
                opacity: 0;
                transform: translateY(22px);
                animation: scrollFadeUp 880ms cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-timeline: view();
                animation-range: entry 8% cover 30%;
              }
              .scroll-card {
                opacity: 0;
                transform: translateY(24px);
                animation: scrollFadeUp 820ms cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-timeline: view();
                animation-range: entry 6% cover 26%;
              }
              .scroll-line {
                transform: scaleX(0);
                animation: scrollLineReveal 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-timeline: view();
                animation-range: entry 10% cover 28%;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .scroll-reveal,
              .scroll-card,
              .scroll-line {
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
