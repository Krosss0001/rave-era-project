import { RoleGate } from "@/components/shared/role-gate";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { LocalizedText } from "@/components/shared/localized-text";
import { BackgroundGrid, GlowField, VisualSystemStyles } from "@/components/shared/visual-system";

export default function DashboardPage() {
  return (
    <RoleGate allowedRoles={["user", "organizer", "admin", "superadmin"]}>
      <div className="relative mx-auto max-w-7xl overflow-hidden bg-[#000000] px-3 py-8 sm:px-6 sm:py-20 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <BackgroundGrid />
        <GlowField />
        <div className="border-b border-white/[0.05] pb-8 sm:pb-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary sm:text-xs sm:tracking-[0.28em]">
            <LocalizedText ua="01. / Кабінет користувача" en="01. / User dashboard" />
          </p>
          <h1 className="mobile-hero-title mt-5 max-w-full text-[clamp(2.1rem,10vw,5rem)] font-black uppercase leading-[0.98] text-white sm:mt-7 md:leading-[0.9]">
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
        <VisualSystemStyles />
      </div>
    </RoleGate>
  );
}
