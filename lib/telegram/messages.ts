import type { Database } from "@/lib/supabase/types";

export type BotLanguage = "uk" | "en";

type EventRow = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  | "slug"
  | "title"
  | "subtitle"
  | "description"
  | "date"
  | "city"
  | "venue"
  | "address"
  | "price"
  | "currency"
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
    languageSaved: "Мову збережено. Нижче доступні основні дії.",
    welcome:
      "<b>Rave'era</b>\nЗнайдіть подію, зареєструйтесь і тримайте квиток під рукою.\n\nОберіть дію нижче.",
    search: "Знайти подію",
    myTickets: "Мої квитки",
    openSite: "Відкрити сайт",
    openApp: "Додаток",
    appSoon: "Додаток Rave'era скоро буде доступний. Поки що скористайтесь сайтом.",
    noEvents: "Поки що немає доступних подій.\n\nМожете перевірити сайт або повернутись трохи пізніше.",
    registerButton: "Зареєструватись",
    openOnSite: "Відкрити на сайті",
    showQr: "Показати QR",
    confirmEvent: "Підтвердити реєстрацію на цю подію?",
    yes: "Так",
    cancel: "Скасувати",
    askName: "<b>Крок 1/4</b>\nВаше ім'я?",
    askPhone: "<b>Крок 2/4</b>\nВаш телефон?",
    shareContact: "Надати контакт",
    askPositionCompany: "<b>Крок 3/4</b>\nПосада і компанія?",
    askIndustry: "<b>Крок 4/4</b>\nСфера діяльності?",
    summaryQuestion: "<b>Перевірте реєстрацію</b>",
    payLaterButton: "Підтвердити",
    confirmFreeButton: "Підтвердити",
    restartButton: "Почати спочатку",
    paymentPending: "Реєстрацію створено.\nОплату буде підключено наступним етапом.",
    freeConfirmed: "Готово. Реєстрацію на безкоштовну подію підтверджено.",
    cancelled: "Реєстрацію скасовано. Можете почати знову зі сторінки події або меню бота.",
    eventMissing: "Не вдалося знайти подію. Перевірте посилання або відкрийте список подій на сайті.",
    soldOut: "На цю подію вже немає вільних місць.",
    genericError: "Не вдалося обробити запит. Спробуйте ще раз трохи пізніше.",
    ticketsMissing: "У вас поки немає квитків.\n\nЗнайдіть подію і зареєструйтесь. Після цього квиток з'явиться тут.",
    unknownCommand: "Не вдалося розпізнати повідомлення.\n\nОберіть дію з меню нижче.",
    free: "Безкоштовно",
    qrPayload: "QR / код квитка",
    eventFallback: "Подія",
    locationFallback: "Локація уточнюється",
    dateFallback: "Дата уточнюється",
    descriptionFallback: "Організатор скоро додасть більше деталей події.",
    dateLabel: "Дата",
    locationLabel: "Локація",
    priceLabel: "Вартість",
    statusLabel: "Статус",
    pageLabel: "Сторінка події",
    ticketLabel: "Квиток",
    paymentLabel: "Оплата",
    summaryTitle: "Дані:",
    eventLabel: "Подія",
    nameLabel: "Ім'я",
    phoneLabel: "Телефон",
    positionLabel: "Посада та компанія",
    industryLabel: "Сфера",
    notProvided: "не вказано"
  },
  en: {
    chooseLanguage: "Оберіть мову / Choose language:",
    languageSaved: "Language saved. Main actions are below.",
    welcome:
      "<b>Rave'era</b>\nFind events, register, and keep your ticket ready.\n\nChoose an action below.",
    search: "Find event",
    myTickets: "My tickets",
    openSite: "Open website",
    openApp: "App",
    appSoon: "The Rave'era app is coming soon. For now, you can use the website.",
    noEvents: "No public events are available yet.\n\nYou can check the website or come back a little later.",
    registerButton: "Register",
    openOnSite: "Open on website",
    showQr: "Show QR",
    confirmEvent: "Confirm registration for this event?",
    yes: "Yes",
    cancel: "Cancel",
    askName: "<b>Step 1/4</b>\nYour name?",
    askPhone: "<b>Step 2/4</b>\nYour phone?",
    shareContact: "Share contact",
    askPositionCompany: "<b>Step 3/4</b>\nRole and company?",
    askIndustry: "<b>Step 4/4</b>\nIndustry?",
    summaryQuestion: "<b>Review registration</b>",
    payLaterButton: "Confirm",
    confirmFreeButton: "Confirm",
    restartButton: "Start over",
    paymentPending: "Registration created.\nPayment will be connected in the next phase.",
    freeConfirmed: "Done. Your free-event registration is confirmed.",
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
    descriptionFallback: "The organizer will add more event details soon.",
    dateLabel: "Date",
    locationLabel: "Location",
    priceLabel: "Price",
    statusLabel: "Status",
    pageLabel: "Event page",
    ticketLabel: "Ticket",
    paymentLabel: "Payment",
    summaryTitle: "Details:",
    eventLabel: "Event",
    nameLabel: "Name",
    phoneLabel: "Phone",
    positionLabel: "Role and company",
    industryLabel: "Industry",
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

function formatStatus(status: string | null, language: BotLanguage) {
  const labels: Record<BotLanguage, Record<string, string>> = {
    uk: {
      live: "Квитки доступні",
      limited: "Місця обмежені",
      soon: "Скоро",
      draft: "Чернетка",
      archived: "Архів"
    },
    en: {
      live: "Tickets live",
      limited: "Limited capacity",
      soon: "Coming soon",
      draft: "Draft",
      archived: "Archived"
    }
  };

  return labels[language][status || ""] || status || labels[language].soon;
}

export function buildEventCardMessage(event: EventRow, eventUrl: string, language: BotLanguage) {
  const copy = getTelegramCopy(language);
  const location = [event.city, event.venue].filter(Boolean).join(" / ") || event.address || copy.locationFallback;

  return [
    `<b>${escapeHtml(event.title)}</b>`,
    "",
    `<b>${copy.dateLabel}</b>: ${escapeHtml(formatTelegramDate(event.date, language))}`,
    `<b>${copy.locationLabel}</b>: ${escapeHtml(location)}`,
    `<b>${copy.priceLabel}</b>: ${escapeHtml(formatTelegramPrice(Number(event.price), event.currency, language))}`,
    "",
    `${copy.statusLabel}: ${escapeHtml(formatStatus(event.status, language))}`,
    `${copy.pageLabel}: ${escapeHtml(eventUrl)}`
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
