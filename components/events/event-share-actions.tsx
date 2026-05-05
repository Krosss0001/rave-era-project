"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Copy, Share2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import { buildReferralUrl } from "@/lib/referral";

type EventShareActionsProps = {
  title: string;
  path: string;
  startsAt: string | null;
  location: string;
  referralCode?: string | null;
};

function toCalendarDate(value: string | null) {
  if (!value) {
    return "";
  }

  const start = new Date(value);

  if (Number.isNaN(start.getTime())) {
    return "";
  }

  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  return `${format(start)}/${format(end)}`;
}

export function EventShareActions({ title, path, startsAt, location, referralCode }: EventShareActionsProps) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => buildReferralUrl(path, referralCode || "RAVE-CREW"), [path, referralCode]);
  const calendarDates = toCalendarDate(startsAt);
  const calendarUrl = calendarDates
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${encodeURIComponent(calendarDates)}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(shareUrl)}`
    : "";
  const copy =
    language === "ua"
      ? {
          share: "Поділитися подією",
          copied: "Посилання скопійовано",
          calendar: "Додати в календар"
        }
      : {
          share: "Share event",
          copied: "Link copied",
          calendar: "Add to calendar"
        };

  async function shareEvent() {
    const payload = { title, text: title, url: shareUrl };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-2 min-[420px]:grid-cols-2 sm:flex sm:items-center">
      <button
        type="button"
        onClick={shareEvent}
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 border border-white/[0.1] bg-black/70 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/70 transition duration-200 hover:border-[#00FF88]/40 hover:bg-[#00FF88]/[0.035] hover:text-[#00FF88] active:scale-[0.99]"
      >
        {copied ? <Copy className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
        <span>{copied ? copy.copied : copy.share}</span>
      </button>
      {calendarUrl ? (
        <Link
          href={calendarUrl}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 border border-white/[0.1] bg-black/70 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/70 transition duration-200 hover:border-[#00FF88]/40 hover:bg-[#00FF88]/[0.035] hover:text-[#00FF88] active:scale-[0.99]"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          <span>{copy.calendar}</span>
        </Link>
      ) : null}
    </div>
  );
}
