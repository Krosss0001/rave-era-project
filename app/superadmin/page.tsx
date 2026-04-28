import { RoleGate } from "@/components/shared/role-gate";
import { SuperadminPanel } from "@/components/superadmin/superadmin-panel";
import { LocalizedText } from "@/components/shared/localized-text";

export default function SuperadminPage() {
  return (
    <RoleGate allowedRoles={["superadmin"]}>
      <div className="relative mx-auto max-w-7xl overflow-hidden bg-[#000000] px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="border-b border-white/[0.05] pb-14">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary"><LocalizedText ua="01. / Суперадмін система" en="01. / Superadmin System" /></p>
          <h1 className="mt-6 text-[clamp(2.5rem,14vw,5.5rem)] font-black uppercase leading-[0.9] text-white sm:mt-7">
            <LocalizedText ua="Суперадмін" en="Superadmin" />
          </h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-7 text-white/[0.55] sm:mt-8 sm:text-lg sm:leading-8">
            <LocalizedText
              ua="Ієрархія ролей, майбутній аудит і найвищий рівень операційного керування."
              en="Platform role hierarchy, future audit controls, and highest-trust operational surfaces."
            />
          </p>
        </div>
        <div className="mt-12">
          <SuperadminPanel />
        </div>
      </div>
    </RoleGate>
  );
}
