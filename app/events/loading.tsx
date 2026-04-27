function EventCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`overflow-hidden border border-white/[0.05] bg-[#020202] ${featured ? "lg:grid lg:grid-cols-[1.08fr_0.92fr]" : ""}`}>
      <div className={`bg-white/[0.035] motion-safe:animate-pulse ${featured ? "min-h-[420px]" : "aspect-[16/11]"}`} />
      <div className={`border-t border-white/[0.05] p-5 ${featured ? "lg:border-l lg:border-t-0 lg:p-7" : ""}`}>
        <div className="h-3 w-2/3 bg-white/[0.04] motion-safe:animate-pulse" />
        <div className="mt-4 h-12 w-4/5 bg-white/[0.04] motion-safe:animate-pulse" />
        <div className="mt-3 h-4 w-full bg-white/[0.035] motion-safe:animate-pulse" />
        <div className="mt-2 h-4 w-3/4 bg-white/[0.035] motion-safe:animate-pulse" />
        <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-5">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 border border-white/[0.05] bg-[#030303] motion-safe:animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EventsLoading() {
  return (
    <div className="relative overflow-hidden bg-[#000000]">
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:px-10 md:py-32 lg:px-12 2xl:max-w-[1500px]">
        <div className="max-w-3xl">
          <div className="h-4 w-56 bg-[#00FF88]/20 motion-safe:animate-pulse" />
          <div className="mt-6 h-28 w-full max-w-2xl bg-white/[0.04] motion-safe:animate-pulse md:h-40" />
          <div className="mt-7 h-5 w-full max-w-lg bg-white/[0.035] motion-safe:animate-pulse" />
        </div>
        <div className="mt-14 h-12 border-y border-white/[0.05] bg-[#020202]/70 motion-safe:animate-pulse" />
      </section>
      <section className="mx-auto max-w-7xl border-t border-white/[0.05] px-4 py-20 sm:px-6 md:px-10 md:py-28 lg:px-12 2xl:max-w-[1500px]">
        <div className="h-4 w-48 bg-[#00FF88]/20 motion-safe:animate-pulse" />
        <div className="mt-10">
          <EventCardSkeleton featured />
        </div>
      </section>
      <section className="mx-auto max-w-7xl border-t border-white/[0.05] px-4 py-20 sm:px-6 md:px-10 md:py-28 lg:px-12 2xl:max-w-[1500px]">
        <div className="h-20 w-full max-w-2xl bg-white/[0.04] motion-safe:animate-pulse" />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      </section>
    </div>
  );
}
