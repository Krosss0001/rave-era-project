import type { Database } from "@/lib/supabase/types";

export type BotLanguage = "uk" | "en";

type EventRow = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  | "slug"
  | "title"
  | "date"
  | "city"
  | "venue"
  | "address"
  | "price"
  | "currency"
  | "capacity"
  | "status"
>;

type SummaryInput = {
  eventTitle: string;
  name: string | null;
  phone: string | null;
  positionCompany: string | null;
  industry: string | null;
  telegramUsername: string | null;
  price: string;
};

export const TELEGRAM_COPY = {
  uk: {
    chooseLanguage: "Оберіть мову / Choose language:",
    languageSaved: "Мову збережено.",
    welcome: "Привіт! Я бот Rave'era.\nЯ допоможу знайти подію та отримати квиток.",
    search: "🔍 Знайти подію",
    myTickets: "🎟 Мої квитки",
    openSite: "🌐 Open website",
    openApp: "📱 App",
    appSoon: "Додаток Rave'era скоро буде доступний. Поки що скористайтесь сайтом.",
    noEvents: "Поки що немає доступних подій.\n\nМожете відкрити сайт або повернутись трохи пізніше.",
    registerButton: "Register",
    openOnSite: "Open website",
    shareButton: "Share",
    showQr: "Show QR",
    confirmEvent: "Підтвердити реєстрацію на цю подію?",
    yes: "Так",
    cancel: "Скасувати",
    askName: "<b>Step 1/4</b>\nName",
    askPhone: "<b>Step 2/4</b>\nPhone",
    shareContact: "Надати контакт",
    askPositionCompany: "<b>Step 3/4</b>\nCompany",
    askIndustry: "<b>Step 4/4</b>\nField",
    summaryQuestion: "<b>Перевірте реєстрацію</b>",
    payLaterButton: "Підтвердити",
    confirmFreeButton: "Підтвердити",
    restartButton: "Почати спочатку",
    paymentPending: "⏳ Реєстрацію створено.\nСтатус оплати: pending.",
    freeConfirmed: "✅ Реєстрацію підтверджено.\nКвиток активний.",
    cancelled: "Реєстрацію скасовано. Можете почати знову зі сторінки події або меню бота.",
    eventMissing: "Не вдалося знайти подію. Перевірте посилання або відкрийте список подій на сайті.",
    soldOut: "На цю подію вже немає вільних місць.",
    genericError: "Не вдалося обробити запит. Спробуйте ще раз трохи пізніше.",
    ticketsMissing: "У вас поки немає квитків.\n\nЗнайдіть подію і зареєструйтесь. Квиток з'явиться тут після реєстрації.",
    unknownCommand: "Не вдалося розпізнати повідомлення.\n\nОберіть дію з меню нижче.",
    free: "FREE",
    qrPayload: "QR / ticket code",
    eventFallback: "Подія",
    locationFallback: "Локація уточнюється",
    dateFallback: "Дата уточнюється",
    dateLabel: "Date",
    locationLabel: "Location",
    priceLabel: "Price",
    capacityLabel: "Capacity",
    statusLabel: "Status",
    pageLabel: "Event page",
    ticketLabel: "Code",
    paymentLabel: "Payment",
    summaryTitle: "Дані:",
    eventLabel: "Подія",
    nameLabel: "Name",
    phoneLabel: "Phone",
    positionLabel: "Company",
    industryLabel: "Field",
    notProvided: "не вказано"
  },
  en: {
    chooseLanguage: "Оберіть мову / Choose language:",
    languageSaved: "Language saved.",
    welcome: "Hi! I'm the Rave'era bot.\nI help you find events and get tickets.",
    search: "🔍 Find event",
    myTickets: "🎟 My tickets",
    openSite: "🌐 Open website",
    openApp: "📱 App",
    appSoon: "The Rave'era app is coming soon. For now, you can use the website.",
    noEvents: "No public events are available yet.\n\nOpen the website or come back a little later.",
    registerButton: "Register",
    openOnSite: "Open website",
    shareButton: "Share",
    showQr: "Show QR",
    confirmEvent: "Confirm registration for this event?",
    yes: "Yes",
    cancel: "Cancel",
    askName: "<b>Step 1/4</b>\nName",
    askPhone: "<b>Step 2/4</b>\nPhone",
    shareContact: "Share contact",
    askPositionCompany: "<b>Step 3/4</b>\nCompany",
    askIndustry: "<b>Step 4/4</b>\nField",
    summaryQuestion: "<b>Review registration</b>",
    payLaterButton: "Confirm",
    confirmFreeButton: "Confirm",
    restartButton: "Start over",
    paymentPending: "⏳ Registration created.\nPayment status: pending.",
    freeConfirmed: "✅ Registration confirmed.\nTicket active.",
    cancelled: "Registration cancelled. You can start again from the event page or bot menu.",
    eventMissing: "Event could not be found. Check the link or open the event list on the website.",
    soldOut: "This event has no available spots left.",
    genericError: "The request could not be processed. Try again a little later.",
    ticketsMissing: "You do not have tickets yet.\n\nFind an event and register. Your ticket will appear here after that.",
    unknownCommand: "I could not recognize that message.\n\nChoose an action from the menu below.",
    free: "FREE",
    qrPayload: "QR / ticket code",
    eventFallback: "Event",
    locationFallback: "Location TBA",
    dateFallback: "Date TBA",
    dateLabel: "Date",
    locationLabel: "Location",
    priceLabel: "Price",
    capacityLabel: "Capacity",
    statusLabel: "Status",
    pageLabel: "Event page",
    ticketLabel: "Code",
    paymentLabel: "Payment",
    summaryTitle: "Details:",
    eventLabel: "Event",
    nameLabel: "Name",
    phoneLabel: "Phone",
    positionLabel: "Company",
    industryLabel: "Field",
    notProvided: "not provided"
  }
} as const;

export function getTelegramCopy(language: BotLanguage) {
  return TELEGRAM_COPY[language];
}

export function escapeHtml(value: string | null | undefined) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatTelegramPrice(price: number, currency: string | null, language: BotLanguage) {
  const copy = getTelegramCopy(language);

  if (Number.isFinite(price) && price <= 0) {
    return copy.free;
  }

  const locale = language === "uk" ? "uk-UA" : "en-US";
  return `${new Intl.NumberFormat(locale).format(Number.isFinite(price) ? price : 0)} ${currency || "UAH"}`;
}

export function formatTelegramDate(value: string | null, language: BotLanguage) {
  const copy = getTelegramCopy(language);

  if (!value) {
    return copy.dateFallback;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "uk" ? "uk-UA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function formatCapacity(capacity: number | null) {
  return Number.isFinite(capacity) && Number(capacity) > 0 ? `${capacity}` : "TBA";
}

export function buildEventCardMessage(event: EventRow, _eventUrl: string, language: BotLanguage) {
  const copy = getTelegramCopy(language);
  const location = [event.city, event.venue].filter(Boolean).join(" / ") || event.address || copy.locationFallback;

  return [
    `🎟 <b>${escapeHtml(event.title)}</b>`,
    "",
    `📅 ${copy.dateLabel}: ${escapeHtml(formatTelegramDate(event.date, language))}`,
    `📍 ${copy.locationLabel}: ${escapeHtml(location)}`,
    `💰 ${copy.priceLabel}: ${escapeHtml(formatTelegramPrice(Number(event.price), event.currency, language))}`,
    `👥 ${copy.capacityLabel}: ${escapeHtml(formatCapacity(event.capacity))}`
  ].join("\n");
}

export function buildEventConfirmationMessage(event: EventRow, eventUrl: string, language: BotLanguage) {
  const copy = getTelegramCopy(language);
  return [buildEventCardMessage(event, eventUrl, language), "", copy.confirmEvent].join("\n");
}

export function buildSummaryMessage(input: SummaryInput, language: BotLanguage) {
  const copy = getTelegramCopy(language);

  return [
    copy.summaryQuestion,
    "",
    copy.summaryTitle,
    `${copy.eventLabel}: ${escapeHtml(input.eventTitle || copy.notProvided)}`,
    `${copy.nameLabel}: ${escapeHtml(input.name || copy.notProvided)}`,
    `${copy.phoneLabel}: ${escapeHtml(input.phone || copy.notProvided)}`,
    `${copy.positionLabel}: ${escapeHtml(input.positionCompany || copy.notProvided)}`,
    `${copy.industryLabel}: ${escapeHtml(input.industry || copy.notProvided)}`,
    `Telegram: ${escapeHtml(input.telegramUsername || copy.notProvided)}`,
    `${copy.priceLabel}: ${escapeHtml(input.price)}`
  ].join("\n");
}
