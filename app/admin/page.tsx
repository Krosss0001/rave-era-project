import { AdminPanel } from "@/components/admin/admin-panel";
import { RoleGate } from "@/components/shared/role-gate";
import { LocalizedText } from "@/components/shared/localized-text";
import { BackgroundGrid, GlowField, VisualSystemStyles } from "@/components/shared/visual-system";

export default function AdminPage() {
  return (
    <RoleGate allowedRoles={["admin", "superadmin"]}>
      <div className="relative mx-auto max-w-7xl overflow-hidden bg-[#000000] px-3 py-12 sm:px-6 sm:py-20 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <BackgroundGrid />
        <GlowField />
        <div className="border-b border-white/[0.05] pb-14">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary sm:tracking-[0.28em]"><LocalizedText ua="01. / Адмін система" en="01. / Admin System" /></p>
          <h1 className="mt-6 text-[clamp(2.4rem,13vw,5rem)] font-black uppercase leading-[0.94] text-white sm:mt-7">
            <LocalizedText ua="Адмін" en="Admin" />
          </h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-7 text-white/[0.64] sm:mt-8 sm:text-lg sm:leading-8">
            <LocalizedText
              ua="Основа для керування профілями, ролями та операційним доступом платформи."
              en="Profile visibility and role escalation foundation for the platform operator layer."
            />
          </p>
        </div>
        <div className="mt-12">
          <AdminPanel />
        </div>
        <VisualSystemStyles />
      </div>
    </RoleGate>
  );
}
