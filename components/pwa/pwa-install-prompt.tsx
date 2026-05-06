"use client";

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

  useEffect(() => {
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

    if (choice.outcome !== "accepted") {
      setInstallPrompt(null);
    }
  };

  if (!installPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 pb-[env(safe-area-inset-bottom)] sm:bottom-5 sm:right-5">
      <button
        type="button"
        onClick={handleInstall}
        className="focus-ring min-h-11 border border-primary/70 bg-black/90 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary shadow-[0_0_30px_rgb(0_255_136/0.14)] backdrop-blur-xl motion-safe:transition-colors motion-safe:duration-200 hover:bg-primary hover:text-black sm:px-4 sm:text-[11px]"
      >
        Install app / Встановити додаток
      </button>
    </div>
  );
}
