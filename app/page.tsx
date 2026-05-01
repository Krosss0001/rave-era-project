import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Bot, ChartNoAxesCombined, Sparkles, WalletCards } from "lucide-react";
import { featuredEvent } from "@/data/events";
import { getCapacityPercent } from "@/lib/format";
import { SafeEventImage } from "@/components/events/safe-event-image";
import { LocalizedText } from "@/components/shared/localized-text";
import { LocalizedPrice } from "@/components/shared/localized-price";

const platformCards = [
  {
    icon: Sparkles,
    title: { ua: "Пошук подій", en: "Event Discovery" },
    copy: {
      ua: "Преміальні сторінки подій і публічна вітрина, що допомагають перетворювати інтерес на попит.",
      en: "Premium event pages and a public discovery surface built to make demand visible."
    }
  },
  {
    icon: Bot,
    title: { ua: "Telegram-супровід", en: "Telegram Execution" },
    copy: {
      ua: "Реєстрації, статуси оплат і підтвердження продовжуються в каналі, яким аудиторія вже користується.",
      en: "Registration state, payment context, and confirmations continue inside the channel people use."
    }
  },
  {
    icon: ChartNoAxesCombined,
    title: { ua: "Реферальне зростання", en: "Referral Growth" },
    copy: {
      ua: "Кожен учасник може стати каналом дистрибуції через відстежувані посилання та джерела конверсій.",
      en: "Every attendee can become distribution through tracked shares, source signals, and conversion loops."
    }
  },
  {
    icon: WalletCards,
    title: { ua: "Solana-ready доступ", en: "Solana-ready Access" },
    copy: {
      ua: "Архітектура, готова до wallet-доступу, колекційних перепусток і майбутніх механік винагород.",
      en: "Wallet-ready architecture for gated access, collector passes, and future reward mechanics."
    }
  }
];

const growthCards = [
  {
    title: { ua: "Не просто квитки", en: "Not just ticketing" },
    copy: {
      ua: "Rave'era сприймає сторінку події як поверхню конверсії, а не просто кнопку оплати.",
      en: "Rave'era treats the event page as a conversion surface, not a checkout link."
    }
  },
  {
    title: { ua: "Реферальні петлі", en: "Referral loops" },
    copy: {
      ua: "Кожна реєстрація може створювати вимірюване охоплення ще до відкриття дверей.",
      en: "Each registration can create measurable distribution before the doors open."
    }
  },
  {
    title: { ua: "Telegram-підтвердження", en: "Telegram confirmation layer" },
    copy: {
      ua: "Операційний супровід залишається поруч з аудиторією, а не губиться в email.",
      en: "The operational handoff stays close to the audience instead of buried in email."
    }
  },
  {
    title: { ua: "Аналітика організатора", en: "Organizer growth analytics" },
    copy: {
      ua: "Місткість, джерела й сигнали учасників допомагають планувати наступний анонс.",
      en: "Capacity, source, and attendee signals shape the next announcement."
    }
  },
  {
    title: { ua: "Майбутні wallet-нагороди", en: "Future wallet rewards" },
    copy: {
      ua: "Solana-ready доступ залишає простір для лояльності, колекційних перепусток і gated utility.",
      en: "Solana-ready access keeps room for loyalty, collector passes, and gated event utility."
    }
  }
];

const demoSteps = [
  {
    title: { ua: "Знайти", en: "Discover" },
    copy: { ua: "Перегляньте публічну сторінку події.", en: "Browse the curated public event page." }
  },
  {
    title: { ua: "Запустити Telegram-бот", en: "Start Telegram bot" },
    copy: { ua: "Реєстрація проходить через Telegram-бот.", en: "Registration continues in the Telegram bot." }
  },
  {
    title: { ua: "Отримати статус квитка", en: "Get ticket status" },
    copy: {
      ua: "Отримайте статус і підтвердження там, де вже живе ком'юніті.",
      en: "Receive status and confirmation where the community already lives."
    }
  },
  {
    title: { ua: "Унікальні реферальні посилання", en: "Unique referral links" },
    copy: {
      ua: "Кожен користувач отримує персональне посилання для запрошення друзів та зростання події.",
      en: "Each user gets a personal invite link to grow the event and track conversions."
    }
  },
  {
    title: { ua: "AI-помічник для організаторів (скоро)", en: "AI assistant for organizers (coming soon)" },
    copy: {
      ua: "Рекомендації по продажах, аналітика та автоматичні повідомлення для зростання івентів.",
      en: "Sales insights, analytics, and automated messaging to scale events."
    }
  }
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

function SectionLabel({ index, label }: { index: string; label: ReactNode }) {
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
  const heroLines = [
    { ua: "СТВОРЮЄМО", en: "WE BUILD" },
    { ua: "ПОДІЇ, ЯКІ", en: "EVENTS" },
    { ua: "ПРОДАЮТЬ", en: "THAT SELL" }
  ];
  const heroStats = [
    { value: "8.4K", label: { ua: "охоплення спільноти", en: "community reach" } },
    { value: "74%", label: { ua: "заповненість Noir Signal", en: "Noir Signal capacity" } },
    { value: "76", label: { ua: "реферальних реєстрацій", en: "referral registrations" } }
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.045] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px]" />
      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-3 py-14 sm:px-6 sm:py-24 md:px-10 md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 2xl:max-w-[1500px]">
          <div className="max-w-4xl">
            <p className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 border border-white/[0.05] bg-[#020202] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/55 sm:px-4 sm:tracking-[0.24em]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88] shadow-[0_0_16px_rgba(0,255,136,0.75)]" aria-hidden="true" />
              <span className="whitespace-nowrap">Rave<span className="text-[#00FF88]">&apos;</span>era</span> Group <span className="text-[#00FF88]" aria-hidden="true">{"\u00B7"}</span> Concerts <span className="text-[#00FF88]">&amp;</span> Marketing Agency
            </p>
            <h1 className="mt-7 max-w-[980px] whitespace-normal break-normal text-[clamp(2.15rem,10.8vw,8.25rem)] font-black uppercase leading-[0.92] tracking-normal text-white [hyphens:none] [overflow-wrap:normal] [text-wrap:balance] [word-break:normal] sm:mt-8 sm:text-[clamp(3.65rem,8vw,9rem)] sm:leading-[0.82]">
              {heroLines.map((line, index) => (
                <span
                  key={line.en}
                  className={`block whitespace-normal break-normal [hyphens:none] [overflow-wrap:normal] [text-wrap:balance] [word-break:normal] motion-safe:animate-[revealLine_700ms_cubic-bezier(0.16,1,0.3,1)_both] ${
                    index === 2 ? "text-[#00FF88] [text-shadow:0_0_80px_rgba(0,255,136,0.28)]" : ""
                  }`}
                  style={revealStyle(index)}
                >
                  <LocalizedText ua={line.ua} en={line.en} />
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-xl text-base font-semibold uppercase leading-tight text-white motion-safe:animate-[fadeUp_520ms_cubic-bezier(0.16,1,0.3,1)_360ms_both] sm:text-lg md:mt-8 md:text-3xl md:leading-[1.08]">
              <LocalizedText
                ua={
                  <>
                    Ми не просто проводимо події.
                    <br />
                    Ми масштабуємо їх.
                  </>
                }
                en={
                  <>
                    We don&apos;t just run events.
                    <br />
                    We scale them.
                  </>
                }
              />
            </p>
            <div className="mt-10 flex flex-col gap-3 motion-safe:animate-[fadeUp_520ms_cubic-bezier(0.16,1,0.3,1)_460ms_both] sm:flex-row">
              <Link
                href="/events"
                className="focus-ring group relative inline-flex min-h-12 items-center justify-center overflow-hidden border border-[#00FF88] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-[#00FF88] transition duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-black hover:shadow-[0_0_30px_rgba(0,255,136,0.12)] active:scale-[0.98] sm:tracking-widest"
              >
                <span className="absolute inset-0 -translate-x-full bg-[#00FF88] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" aria-hidden="true" />
                <span className="relative z-10 inline-flex items-center">
                  <LocalizedText ua="Переглянути події" en="Browse events" />
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
              <Link
                href="/organizer"
                className="focus-ring group relative inline-flex min-h-12 items-center justify-center overflow-hidden bg-[#00FF88] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-black transition duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_0_30px_rgba(0,255,136,0.14)] active:scale-[0.98] sm:tracking-widest"
              >
                <span className="absolute inset-0 -translate-x-full bg-white transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" aria-hidden="true" />
                <span className="relative z-10"><LocalizedText ua="Панель організатора" en="Organizer OS" /></span>
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {heroStats.map(({ value, label }, index) => (
                <div
                  key={label.en}
                  className="group relative overflow-hidden border border-white/[0.05] bg-[#020202] p-4 motion-safe:animate-[fadeUp_520ms_cubic-bezier(0.16,1,0.3,1)_both] transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02]"
                  style={revealStyle(index + 6)}
                >
                  <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
                  <p className="font-mono text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                    <LocalizedText ua={label.ua} en={label.en} />
                  </p>
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
                  className="object-cover object-center opacity-70 grayscale transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] group-hover:opacity-100 group-hover:grayscale-0"
                  sizes="(min-width: 1024px) 42vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-[#00FF88]/[0.035] blur-2xl opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00FF88]">
                    <LocalizedText ua="Подія у фокусі" en="Featured event" />
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
            <p className="scroll-reveal font-mono text-[10px] uppercase tracking-[0.24em] text-[#00FF88]">
              <LocalizedText ua="Нам довіряють" en="Trusted by" />
            </p>
            <h2 className="scroll-reveal mt-3 text-3xl font-black uppercase leading-[0.9] text-white md:text-6xl">
              <LocalizedText ua="15+ брендів і партнерів" en="15+ Brands & Partners" />
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/35">
            <LocalizedText
              ua="Культура, бізнес, музика, корпоративні та crypto-аудиторії вже працюють з мережею Rave'era."
              en="Culture, commerce, music, corporate, and crypto audiences already orbit the Rave'era network."
            />
          </p>
        </div>
        <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap justify-center gap-x-6 gap-y-3 px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 sm:px-6 sm:text-xs sm:tracking-[0.22em] md:px-10 lg:px-12 2xl:max-w-[1500px]">
          {partners.map((partner) => (
            <span
              key={partner}
              className="whitespace-nowrap opacity-70 transition duration-500 hover:opacity-100 hover:text-[#00FF88] hover:[text-shadow:0_0_18px_rgba(0,255,136,0.22)]"
            >
              {partner}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] bg-[#000000] px-4 py-16 sm:px-6 md:px-10 md:py-28 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="01" label={<LocalizedText ua="Система платформи" en="Platform System" />} />
            <h2 className="scroll-reveal mt-4 max-w-3xl text-[clamp(2.25rem,12vw,4.5rem)] font-black uppercase leading-[0.92] text-white md:leading-[0.88]">
              <LocalizedText ua="Єдина система для попиту на події" en="One system for event demand" />
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-white/45">
            <LocalizedText
              ua="Rave'era поєднує пошук подій, реєстрації, Telegram-підтвердження, реферали та майбутній wallet-доступ без відчуття generic ticketing software."
              en="Rave'era connects discovery, registration, Telegram execution, referral growth, and Solana-ready access without turning the experience into generic ticketing software."
            />
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformCards.map((card, index) => (
            <article
              key={card.title.en}
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
                <LocalizedText ua={card.title.ua} en={card.title.en} />
              </h3>
              <p className="mt-3 text-xs leading-6 text-white/35">
                <LocalizedText ua={card.copy.ua} en={card.copy.en} />
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] bg-[#020202] px-4 py-16 sm:px-6 md:px-10 md:py-28 lg:px-12 2xl:max-w-[1500px]">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionLabel index="02" label={<LocalizedText ua="Подія у фокусі" en="Featured Event" />} />
            <h2 className="scroll-reveal mt-4 text-[clamp(2.25rem,12vw,4.5rem)] font-black uppercase leading-[0.92] text-white md:leading-[0.88]">
              <LocalizedText ua="Сторінки подій як доказ продукту" en="Event pages as product proof" />
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/45">
              <LocalizedText
                ua="Подія у фокусі показує платформений цикл в одному місці: сторінка пошуку, конверсія, сигнали місткості, продовження в Telegram і атрибуція для організатора."
                en="The featured event shows the platform loop in one place: discovery page, conversion mechanics, capacity signals, Telegram continuation, and organizer-ready attribution."
              />
            </p>
            <div className="mt-8">
              <Link
                href={`/events/${featuredEvent.slug}`}
                className="focus-ring inline-flex font-mono text-[11px] font-bold uppercase tracking-widest text-white/55 underline decoration-white/20 underline-offset-8 transition hover:text-[#00FF88] hover:decoration-[#00FF88]"
              >
                <LocalizedText ua="Відкрити сторінку події" en="View event page" />
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
                className="object-cover object-center opacity-70 grayscale transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] group-hover:opacity-100 group-hover:grayscale-0"
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
                <h3 className="mt-4 text-3xl font-black uppercase leading-[0.9] text-white md:text-5xl">
                  {featuredEvent.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-white/45">{featuredEvent.subtitle}</p>
              </div>
              <div className="mt-8 grid gap-3 border-t border-white/[0.05] pt-5 min-[420px]:grid-cols-3">
                {[
                  { value: capacityPercent + "%", label: "capacity" },
                  { value: <LocalizedPrice price={featuredEvent.price} currency={featuredEvent.currency} />, label: "price" },
                  { value: featuredEvent.city, label: "city" }
                ].map(({ value, label }) => (
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

      <section className="mx-auto max-w-7xl border-t border-white/[0.05] bg-[#000000] px-4 py-16 sm:px-6 md:px-10 md:py-28 lg:px-12 2xl:max-w-[1500px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionLabel index="03" label={<LocalizedText ua="Двигун зростання" en="Growth Engine" />} />
              <h2 className="scroll-reveal mt-4 text-[clamp(2.25rem,12vw,4rem)] font-black uppercase leading-[0.92] text-white md:leading-[0.88]">
              <LocalizedText ua="Більше, ніж квитки" en="Built beyond ticketing" />
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/45">
              <LocalizedText
                ua="Rave'era зберігає преміальну подієву поверхню та додає операційні шари для зростання: дистрибуцію, підтвердження, аналітику й майбутню wallet-утиліту."
                en="Rave'era keeps the premium event surface intact while adding the operating layers an organizer needs to grow: distribution, confirmation, analytics, and future wallet utility."
              />
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {growthCards.map((card, index) => (
              <article
                key={card.title.en}
                className={index === 0 ? "scroll-card group relative overflow-hidden border border-white/[0.05] bg-[#030303] p-5 transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02] md:col-span-2" : "scroll-card group relative overflow-hidden border border-white/[0.05] bg-[#020202] p-5 transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02]"}
                style={revealStyle(index)}
              >
                <CornerBrackets />
                <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.08em] text-white transition group-hover:text-[#00FF88]">
                    <LocalizedText ua={card.title.ua} en={card.title.en} />
                  </h3>
                  <span className="font-mono text-[10px] text-white/20 transition group-hover:text-[#00FF88]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/45">
                  <LocalizedText ua={card.copy.ua} en={card.copy.en} />
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto h-auto max-w-7xl overflow-visible border-t border-white/[0.05] bg-[#020202] px-4 pb-24 pt-16 sm:px-6 md:px-10 md:pb-32 md:pt-28 lg:px-12 2xl:max-w-[1500px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="04" label={<LocalizedText ua="Демо-флоу" en="Demo Flow" />} />
            <h2 className="scroll-reveal mt-4 max-w-4xl text-[clamp(2.25rem,12vw,4.5rem)] font-black uppercase leading-[0.92] text-white md:leading-[0.88]">
              <LocalizedText ua="Від пошуку до доступу" en="From discovery to access" />
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/45">
            <LocalizedText
              ua="MVP демонструє повний шлях аудиторії без зміни робочих маршрутів продукту."
              en="The MVP demonstrates the complete audience path without changing the routes behind it."
            />
          </p>
        </div>
        <div className="mt-12 h-auto w-full space-y-4 overflow-visible">
          {demoSteps.map((step, index) => (
            <article
              key={step.title.en}
              className="group relative grid h-auto w-full translate-y-0 gap-4 overflow-visible border border-white/[0.05] bg-[#030303] p-4 opacity-100 transition duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#00FF88]/30 hover:bg-[#00FF88]/[0.02] sm:p-5 md:grid-cols-[120px_0.7fr_1fr] md:items-center"
              style={revealStyle(index)}
            >
              <CornerBrackets />
              <span className="absolute left-0 top-0 h-px w-0 bg-[#00FF88] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out group-hover:w-full" aria-hidden="true" />
              <span className="font-mono text-[10px] text-white/20 transition group-hover:text-[#00FF88]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[clamp(1.5rem,9vw,2.25rem)] font-black uppercase leading-none text-white">
                <LocalizedText ua={step.title.ua} en={step.title.en} />
              </h3>
              <p className="text-sm leading-6 text-white/45">
                <LocalizedText ua={step.copy.ua} en={step.copy.en} />
              </p>
            </article>
          ))}
        </div>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
