export const DEFAULT_TELEGRAM_BOT_URL = "https://t.me/Rave_era_group_bot";

export function getTelegramBotBaseUrl() {
  return (process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || DEFAULT_TELEGRAM_BOT_URL).replace(/\/+$/, "");
}

export function getTelegramBotDisplayName() {
  try {
    const url = new URL(getTelegramBotBaseUrl());
    const handle = url.pathname.replace(/^\/+/, "").split("/")[0];

    return handle ? `@${handle}` : "the Telegram bot";
  } catch {
    return "the Telegram bot";
  }
}

export function buildTelegramUrl(eventSlug: string, referralCode?: string | null) {
  const payload = referralCode
    ? `event_${eventSlug}_ref_${referralCode}`
    : `event_${eventSlug}`;

  return `${getTelegramBotBaseUrl()}?start=${encodeURIComponent(payload)}`;
}
