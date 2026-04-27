export function buildTelegramUrl(eventSlug: string, referralCode?: string | null) {
  const baseUrl = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/RaveeraBot").replace(/\/+$/, "");
  const payload = referralCode
    ? `event_${eventSlug}_ref_${referralCode}`
    : `event_${eventSlug}`;

  return `${baseUrl}?start=${encodeURIComponent(payload)}`;
}
