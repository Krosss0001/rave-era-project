import { AdminPanel } from "@/components/admin/admin-panel";
import { RoleGate } from "@/components/shared/role-gate";
import { LocalizedText } from "@/components/shared/localized-text";

export default function AdminPage() {
  return (
    <RoleGate allowedRoles={["admin", "superadmin"]}>
      <div className="relative mx-auto max-w-7xl overflow-hidden bg-[#000000] px-3 py-12 sm:px-6 sm:py-20 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:80px_80px]" />
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
      </div>
    </RoleGate>
  );
}
