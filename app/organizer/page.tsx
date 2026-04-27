import { organizer } from "@/data/organizers";
import { metrics } from "@/data/dashboard";
import { AiAssistant } from "@/components/organizer/ai-assistant";
import { OrganizerEventPortfolio } from "@/components/organizer/organizer-event-portfolio";
import {
  MetricGrid,
  ReferralPanel,
  RegistrationTable,
  SystemStatusRow,
  SolanaReadinessPanel,
  TelegramStatusPanel
} from "@/components/organizer/dashboard-panels";
import { RoleGate } from "@/components/shared/role-gate";

export default function OrganizerPage() {
  return (
    <RoleGate allowedRoles={["organizer", "admin", "superadmin"]}>
      <div className="relative mx-auto max-w-7xl overflow-hidden bg-[#000] px-4 py-24 sm:px-6 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="border-b border-white/[0.05] pb-16">
          <div className="max-w-5xl">
            <p className="org-reveal font-mono text-xs uppercase tracking-[0.28em] text-primary">
              01. / Organizer System
            </p>
            <h1 className="org-reveal mt-7 text-6xl font-black uppercase leading-[0.82] text-white sm:text-7xl md:text-8xl lg:text-[8.5rem]">
              {organizer.name}
            </h1>
            <p className="org-reveal mt-8 max-w-2xl text-lg font-light leading-8 text-white/[0.55]">
              Premium growth control for ticket velocity, community signals, Telegram execution, and on-chain readiness.
            </p>
            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/[0.05] pt-6">
              {[
                ["Community", organizer.communitySize.toLocaleString("en-US")],
                ["Events", organizer.totalEvents.toString()],
                ["Conversion", metrics.conversionRate]
              ].map(([label, value]) => (
                <div key={label} className="min-w-32">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-white">{value}</p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-white/[0.35]">{label}</p>
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

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <OrganizerEventPortfolio />
          <AiAssistant />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.85fr]">
          <RegistrationTable />
          <div className="grid gap-8">
            <ReferralPanel />
            <TelegramStatusPanel />
            <SolanaReadinessPanel />
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
      </div>
    </RoleGate>
  );
}
