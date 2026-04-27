import { RoleGate } from "@/components/shared/role-gate";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { LocalizedText } from "@/components/shared/localized-text";

export default function DashboardPage() {
  return (
    <RoleGate allowedRoles={["user", "organizer", "admin", "superadmin"]}>
      <div className="relative mx-auto max-w-7xl overflow-hidden bg-[#000000] px-4 py-24 sm:px-6 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="border-b border-white/[0.05] pb-14">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">01. / User System</p>
          <h1 className="mt-7 text-5xl font-black uppercase leading-[0.88] text-white sm:text-7xl md:text-8xl">
            <LocalizedText ua="Мої квитки" en="Dashboard" />
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-light leading-8 text-white/[0.55]">
            <LocalizedText
              ua="Ваші події, реєстрації, квитки та реферальний контур в одному кабінеті."
              en="Your event access, registration state, tickets, and referral loop in one control surface."
            />
          </p>
        </div>
        <div className="mt-12">
          <UserDashboard />
        </div>
      </div>
    </RoleGate>
  );
}
