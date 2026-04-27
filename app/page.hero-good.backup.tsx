import { ArrowRight, Bot, ChartNoAxesCombined, Sparkles, WalletCards } from "lucide-react";
import { featuredEvent } from "@/data/events";
import { organizer } from "@/data/organizers";
import { ButtonLink } from "@/components/shared/button-link";
import { EventCard } from "@/components/events/event-card";
import { SafeEventImage } from "@/components/events/safe-event-image";

const pillars = [
  {
    icon: Sparkles,
    title: "Premium event layer",
    copy: "Curated event pages, ticketing flows, and a brand surface that feels worth paying for."
  },
  {
    icon: ChartNoAxesCombined,
    title: "Organizer growth engine",
    copy: "Referral loops, conversion metrics, attendee signals, and AI-led campaign suggestions."
  },
  {
    icon: Bot,
    title: "Telegram execution",
    copy: "Registration, payment status, and confirmations stay lightweight inside the channel people use."
  },
  {
    icon: WalletCards,
    title: "Solana-ready architecture",
    copy: "Phantom placeholder now, collector passes and gated community mechanics later."
  }
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute right-[-18%] top-[4%] -z-10 h-[55vw] w-[55vw] bg-[#20e68a]/10 blur-[150px]" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-28 sm:px-6 md:px-10 md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 2xl:max-w-[1500px]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 border border-[#20e68a]/35 bg-[#20e68a]/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#20e68a]">
              <span className="h-1.5 w-1.5 bg-[#20e68a]" aria-hidden="true" />
              Rave&apos;era Group <span aria-hidden="true">{"\u00B7"}</span> Concerts &amp; Marketing Agency
            </p>
            <h1 className="mt-8 text-[clamp(4.5rem,9.1vw,9.75rem)] font-black uppercase leading-[0.72] tracking-[-0.085em] text-white [font-family:'Times_New_Roman',Georgia,serif]">
              Events that sell
            </h1>
            <p className="mt-6 max-w-2xl text-base font-light leading-8 text-white/45 md:text-lg">
              A high-end event discovery platform and organizer growth engine with Telegram
              execution and Solana-ready community infrastructure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/events" className="bg-[#20e68a]">
                Explore events
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/organizer" variant="secondary">
                Open organizer dashboard
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["8.4K", "community reach"],
                ["74%", "Noir Signal capacity"],
                ["76", "referral registrations"]
              ].map(([value, label]) => (
                <div key={label} className="glass-panel p-4">
                  <p className="font-mono text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="glass-panel overflow-hidden shadow-glow">
              <div className="relative aspect-[4/5]">
                <SafeEventImage
                  src={featuredEvent.image}
                  alt="Rave'era featured event crowd"
                  priority
                  className="object-cover opacity-75 grayscale"
                  sizes="(min-width: 1024px) 42vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#20e68a]">
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

      <section className="mx-auto max-w-7xl border-t border-white/[0.04] px-4 py-24 sm:px-6 md:px-10 md:py-36 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              Platform pillars
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-[0.88] tracking-tighter md:text-6xl">
              Built for culture operators
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/45">
            Rave&apos;era keeps the premium web experience at the center while support layers handle
            execution, attribution, and future on-chain utility.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="glass-panel p-5">
              <pillar.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mt-5 text-[11px] font-black uppercase tracking-[0.07em] group-hover:text-primary">
                {pillar.title}
              </h3>
              <p className="mt-3 text-xs leading-6 text-white/35">{pillar.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.04] px-4 py-24 sm:px-6 md:px-10 md:py-36 lg:px-12 2xl:max-w-[1500px]">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              Next public event
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-[0.88] tracking-tighter md:text-6xl">
              A demo that feels alive
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/45">
              The first MVP slice connects discovery, event conversion, referral mechanics, Telegram
              handoff, and organizer intelligence without a heavy backend.
            </p>
            <div className="mt-6">
              <ButtonLink href={`/events/${featuredEvent.slug}`} variant="secondary">
                View event page
              </ButtonLink>
            </div>
          </div>
          <EventCard event={featuredEvent} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.04] px-4 py-24 sm:px-6 md:px-10 md:py-36 lg:px-12 2xl:max-w-[1500px]">
        <div className="glass-panel grid gap-8 p-6 md:grid-cols-[1fr_0.8fr] md:p-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              Organizer view
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-[0.88] tracking-tighter">
              Growth dashboard for {organizer.name}
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/45">
              Track registrations, referral sources, Telegram confirmations, and AI suggestions from
              one operational surface.
            </p>
          </div>
          <div className="grid gap-3">
            {["Referral leaderboard", "AI announcement draft", "Phantom placeholder", "Telegram confirmation status"].map(
              (item) => (
                <div key={item} className="border border-white/[0.05] bg-black/20 p-4 text-sm text-white/55 transition hover:border-primary/30">
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
