import { RoleGate } from "@/components/shared/role-gate";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { LocalizedText } from "@/components/shared/localized-text";

export default function DashboardPage() {
  return (
    <RoleGate allowedRoles={["user", "organizer", "admin", "superadmin"]}>
      <div className="relative mx-auto max-w-7xl overflow-hidden bg-[#000000] px-3 py-10 sm:px-6 sm:py-20 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="border-b border-white/[0.05] pb-12 sm:pb-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary sm:text-xs sm:tracking-[0.28em]">
            <LocalizedText ua="01. / Кабінет користувача" en="01. / User dashboard" />
          </p>
          <h1 className="mt-6 max-w-full text-[clamp(2.35rem,13vw,5rem)] font-black uppercase leading-[0.95] text-white sm:mt-7 md:leading-[0.9]">
            <LocalizedText ua="Мої квитки" en="My tickets" />
          </h1>
          <p className="mt-7 max-w-2xl text-base font-light leading-7 text-white/[0.66] sm:mt-8 sm:text-lg sm:leading-8">
            <LocalizedText
              ua="Ваші події, реєстрації, квитки та реферальний контур в одному кабінеті."
              en="Your event access, registration state, tickets, and referral loop in one control surface."
            />
          </p>
        </div>
        <div className="mt-10 sm:mt-12">
          <UserDashboard />
        </div>
      </div>
    </RoleGate>
  );
}
