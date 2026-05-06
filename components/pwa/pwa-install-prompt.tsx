"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    setPlatform(isiOS ? "ios" : isAndroid ? "android" : "desktop");
    setIsDismissed(window.localStorage.getItem("raveera-pwa-install-dismissed") === "true");

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA installation remains optional if service worker registration is unavailable.
      });
    }

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(standaloneQuery.matches || Boolean((navigator as NavigatorWithStandalone).standalone));

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setIsInstalled(event.matches);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    standaloneQuery.addEventListener("change", handleDisplayModeChange);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    setInstallPrompt(null);

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
  };

  const dismissInstallCard = () => {
    window.localStorage.setItem("raveera-pwa-install-dismissed", "true");
    setIsDismissed(true);
  };

  const canShowPlatformHelp = platform === "ios" || platform === "android";

  if (isInstalled || isDismissed || (!installPrompt && !canShowPlatformHelp)) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-[5.25rem] z-50 mx-auto max-w-md pb-[env(safe-area-inset-bottom)] md:bottom-5 md:left-auto md:right-5 md:mx-0">
      <div className="border border-primary/30 bg-black/95 p-3 shadow-[0_0_48px_rgb(0_255_136/0.12)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Rave&apos;era PWA
            </p>
            <p className="mt-2 text-sm leading-5 text-white/68">
              {platform === "ios"
                ? "На iPhone: Поділитися -> На екран Додому"
                : platform === "android"
                  ? "На Android: Install app / Встановити додаток"
                  : "Install Rave'era as a standalone app."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissInstallCard}
            aria-label="Hide install prompt"
            className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center border border-white/[0.08] text-white/52 motion-safe:transition-colors motion-safe:duration-200 hover:border-primary/35 hover:text-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {installPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            className="focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center border border-primary/70 bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black motion-safe:transition-[filter,transform] motion-safe:duration-200 hover:brightness-110 active:scale-[0.98] sm:text-[11px]"
          >
            Install app / Встановити додаток
          </button>
        ) : null}
      </div>
    </div>
  );
}
