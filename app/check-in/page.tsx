import { CheckInPanel } from "@/components/check-in/check-in-panel";
import { RoleGate } from "@/components/shared/role-gate";
import { LocalizedText } from "@/components/shared/localized-text";
import { BackgroundGrid, GlowField, ScanLine, VisualSystemStyles } from "@/components/shared/visual-system";

export default function CheckInPage() {
  return (
    <RoleGate allowedRoles={["organizer", "admin", "superadmin"]}>
      <div className="mobile-safe-section relative mx-auto max-w-7xl overflow-hidden bg-[#000000] px-3 py-8 sm:px-6 sm:py-20 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <BackgroundGrid />
        <GlowField />
        <ScanLine className="opacity-40" />
        <div className="border-b border-white/[0.05] pb-8 sm:pb-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary sm:text-xs sm:tracking-[0.28em]">
            <LocalizedText ua="01. / Контроль входу" en="01. / Door system" />
          </p>
          <h1 className="mobile-hero-title mt-5 text-[clamp(1.9rem,9vw,5rem)] font-black uppercase leading-[0.98] text-white sm:mt-7">
            Check-in
          </h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-7 text-white/[0.64] sm:mt-8 sm:text-lg sm:leading-8">
            <LocalizedText
              ua="Скануйте QR з Telegram, перевіряйте подію та стан квитка, потім підтверджуйте активні оплачені квитки на вході."
              en="Scan the QR shown in Telegram, validate the event and ticket state, then mark active paid tickets as used at the door."
            />
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">
            <LocalizedText
              ua="Доступ до сканера мають лише organizer, admin і superadmin. Увійдіть з операторським акаунтом і дозвольте камеру на телефоні."
              en="Scanner access is limited to organizer, admin, and superadmin roles. Sign in with an operator account and allow camera access on mobile."
            />
          </p>
          <div className="mt-7 grid gap-2 min-[360px]:grid-cols-3">
            {[
              ["01", <LocalizedText key="scan" ua="Сканер" en="Scanner" />],
              ["02", <LocalizedText key="manual" ua="Ручний код" en="Manual code" />],
              ["03", <LocalizedText key="entry" ua="Вхід" en="Entry" />]
            ].map(([index, label]) => (
              <div key={String(index)} className="border border-white/[0.06] bg-[#020202] px-3 py-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/28">{index}</p>
                <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white/68 sm:tracking-[0.14em]">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 sm:mt-12">
          <CheckInPanel />
        </div>
        <VisualSystemStyles />
      </div>
    </RoleGate>
  );
}
