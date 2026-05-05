import type { ReactNode } from "react";

type VisualProps = {
  className?: string;
};

type DepthFrameProps = VisualProps & {
  children: ReactNode;
};

export function BackgroundGrid({ className = "" }: VisualProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="visual-grid-drift absolute inset-0 opacity-70" />
    </div>
  );
}

export function GlowField({ className = "" }: VisualProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute right-[-14rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#00FF88]/[0.06] blur-[130px]" />
      <div className="absolute bottom-[-18rem] left-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#00FF88]/[0.045] blur-[140px]" />
    </div>
  );
}

export function ScanLine({ className = "" }: VisualProps) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden ${className}`} aria-hidden="true">
      <span className="visual-scan-line block h-full w-full" />
    </div>
  );
}

export function CornerBrackets({ className = "" }: VisualProps) {
  return (
    <span className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-[#00FF88]/45" />
      <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-[#00FF88]/20" />
      <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[#00FF88]/20" />
      <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#00FF88]/45" />
    </span>
  );
}

export function DepthFrame({ children, className = "" }: DepthFrameProps) {
  return (
    <div className={`group relative overflow-hidden border border-white/[0.06] bg-[#020202] ${className}`}>
      <span className="absolute left-0 top-0 z-10 h-px w-0 bg-[#00FF88] transition-[width] duration-500 group-hover:w-full" aria-hidden="true" />
      <CornerBrackets className="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {children}
    </div>
  );
}

export function VisualSystemStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes visualGridDrift {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(80px, 80px, 0); }
          }
          @keyframes visualScan {
            from { transform: translateY(-100%); opacity: 0; }
            20% { opacity: 0.42; }
            to { transform: translateY(120%); opacity: 0; }
          }
          .visual-grid-drift {
            background-image:
              linear-gradient(rgba(0,255,136,0.055) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,136,0.055) 1px, transparent 1px);
            background-size: 80px 80px;
            animation: visualGridDrift 34s linear infinite;
            mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
          }
          .visual-scan-line {
            background: linear-gradient(180deg, transparent, rgba(0,255,136,0.12), transparent);
            animation: visualScan 8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .visual-grid-drift,
            .visual-scan-line {
              animation: none;
              transform: none;
            }
          }
        `
      }}
    />
  );
}
