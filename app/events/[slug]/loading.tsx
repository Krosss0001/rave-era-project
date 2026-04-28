export default function EventDetailLoading() {
  return (
    <div className="bg-[#000000]">
      <section className="relative min-h-[90vh] overflow-hidden border-b border-white/[0.05]">
        <div className="absolute inset-0 bg-[#020202]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:80px_80px] opacity-45" />
        <div className="relative mx-auto flex min-h-[90vh] max-w-7xl items-end px-4 pb-14 pt-32 sm:px-6 md:px-10 lg:px-12 2xl:max-w-[1500px]">
          <div className="w-full max-w-4xl">
            <div className="h-8 w-44 border border-[#00FF88]/20 bg-[#00FF88]/5 motion-safe:animate-pulse" />
            <div className="mt-8 h-40 w-full max-w-3xl bg-white/[0.04] motion-safe:animate-pulse md:h-56" />
            <div className="mt-7 h-5 w-full max-w-2xl bg-white/[0.04] motion-safe:animate-pulse" />
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-14 border border-white/[0.05] bg-[#020202]/85 motion-safe:animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 md:px-10 md:py-32 lg:grid-cols-[1fr_400px] lg:px-12 2xl:max-w-[1500px]">
        <div className="space-y-10">
          {[0, 1, 2].map((item) => (
            <article key={item} className="border-y border-white/[0.05] bg-[#020202] py-8 md:px-8">
              <div className="h-4 w-48 bg-[#00FF88]/20 motion-safe:animate-pulse" />
              <div className="mt-5 h-20 w-full max-w-2xl bg-white/[0.04] motion-safe:animate-pulse" />
              <div className="mt-7 h-24 w-full bg-white/[0.035] motion-safe:animate-pulse" />
            </article>
          ))}
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-56 border border-white/[0.05] bg-[#020202] motion-safe:animate-pulse" />
          ))}
        </aside>
      </section>
    </div>
  );
}
