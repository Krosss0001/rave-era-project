import { organizer } from "@/data/organizers";
import { metrics } from "@/data/dashboard";
import { AiAssistant } from "@/components/organizer/ai-assistant";
import { OrganizerEventPortfolio } from "@/components/organizer/organizer-event-portfolio";
import {
  MetricGrid,
  ReferralPanel,
  RegistrationTable,
  SystemStatusRow,
  TelegramStatusPanel
} from "@/components/organizer/dashboard-panels";
import { RoleGate } from "@/components/shared/role-gate";
import { LocalizedText } from "@/components/shared/localized-text";
import { BackgroundGrid, GlowField, VisualSystemStyles } from "@/components/shared/visual-system";

export default function OrganizerPage() {
  return (
    <RoleGate allowedRoles={["organizer", "admin", "superadmin"]}>
      <div className="relative mx-auto max-w-7xl overflow-hidden bg-[#000] px-3 py-12 sm:px-6 sm:py-20 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <BackgroundGrid />
        <GlowField />
        <div className="border-b border-white/[0.05] pb-10 sm:pb-14">
          <div className="max-w-5xl">
            <p className="org-reveal font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.28em]">
              <LocalizedText ua="01. / Система організатора" en="01. / Organizer System" />
            </p>
            <h1 className="org-reveal mt-6 max-w-full text-[clamp(2.4rem,13vw,7.5rem)] font-black uppercase leading-[0.94] text-white sm:mt-7 lg:leading-[0.86]">
              {organizer.name}
            </h1>
            <p className="org-reveal mt-6 max-w-2xl text-base font-light leading-7 text-white/[0.64] sm:mt-8 sm:text-lg sm:leading-8">
              <LocalizedText
                ua="Преміальна панель для продажу квитків, реєстрацій, Telegram-підтверджень, рефералів і аналітики."
                en="Premium growth control for ticket velocity, community signals, Telegram execution, referrals, and analytics."
              />
            </p>
            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/[0.05] pt-6">
              {[
                ["Community", organizer.communitySize.toLocaleString("en-US")],
                ["Events", organizer.totalEvents.toString()],
                ["Conversion", metrics.conversionRate]
              ].map(([label, value]) => (
                <div key={label} className="min-w-32">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-white">{value}</p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-white/[0.45] sm:tracking-[0.22em]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <MetricGrid />
        </div>
        <div className="mt-4">
          <SystemStatusRow />
        </div>
        <div className="mt-4 border border-white/[0.05] bg-[#020202] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Web3 readiness</p>
          <p className="mt-2 text-sm leading-6 text-white/48">
            Wallet-based loyalty and Solana Pay are prepared for next stage.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <OrganizerEventPortfolio />
          <AiAssistant />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.85fr]">
          <RegistrationTable />
          <div className="grid gap-8">
            <ReferralPanel />
            <TelegramStatusPanel />
          </div>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes barFill {
                from { width: 0; }
                to { width: var(--bar-width); }
              }
              @keyframes orgFadeUp {
                from { opacity: 0; transform: translateY(18px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @supports (animation-timeline: view()) {
                .org-reveal {
                  opacity: 0;
                  animation: orgFadeUp 780ms cubic-bezier(0.16, 1, 0.3, 1) both;
                  animation-timeline: view();
                  animation-range: entry 8% cover 28%;
                }
              }
              @media (prefers-reduced-motion: reduce) {
                .org-reveal {
                  opacity: 1;
                  transform: none;
                  animation: none;
                }
              }
            `
          }}
        />
        <VisualSystemStyles />
      </div>
    </RoleGate>
  );
}
