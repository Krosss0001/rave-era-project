export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-[#020202]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-12 text-sm text-white/35 sm:px-6 md:flex-row md:items-center md:justify-between md:px-10 lg:px-12 2xl:max-w-[1500px]">
        <p>
          Rave<span className="text-primary">&apos;</span>era Group. Premium events, growth systems, and execution layers.
        </p>
        <p className="border-t border-white/[0.05] pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/25 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          Solana-ready demo architecture
        </p>
      </div>
    </footer>
  );
}
