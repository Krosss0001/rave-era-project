"use client";

import { useEffect } from "react";

type ReferralClickTrackerProps = {
  eventId: string;
  referralCode?: string | null;
};

export function ReferralClickTracker({ eventId, referralCode }: ReferralClickTrackerProps) {
  useEffect(() => {
    const code = referralCode?.trim();

    if (!eventId || !code) {
      return;
    }

    const storageKey = `raveera-ref-click:${eventId}:${code}`;

    try {
      if (window.sessionStorage.getItem(storageKey)) {
        return;
      }

      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Tracking should never block the event page.
    }

    fetch("/api/referrals/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        code,
        source: "event_page",
        action: "click"
      }),
      keepalive: true
    }).catch(() => undefined);
  }, [eventId, referralCode]);

  return null;
}
