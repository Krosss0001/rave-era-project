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
    languageSaved: "Мову збережено.",
    welcome:
      "Привіт! Я бот Rave'era Group Concerts & Marketing Agency.\nДопоможу знайти подію, зареєструватися та зберегти квиток.\n\nОберіть дію:",
    search: "🔍 Знайти подію",
    myTickets: "🎟 Мої квитки",
    openSite: "🌐 Відкрити сайт",
    openApp: "📱 Додаток",
    appSoon: "Додаток Rave'era скоро буде доступний. Поки що ви можете користуватись сайтом.",
    noEvents: "Поки що немає доступних подій. Перевірте сайт трохи пізніше.",
    registerButton: "Зареєструватись",
    openOnSite: "Відкрити на сайті",
    showQr: "Показати QR",
    confirmEvent: "Це та подія, на яку ви хочете зареєструватися?",
    yes: "Так",
    cancel: "Скасувати",
    askName: "Крок 1/4\nЯк вас звати?",
    askPhone: "Крок 2/4\nВкажіть номер телефону.",
    shareContact: "Надати контакт",
    askPositionCompany: "Крок 3/4\nВкажіть вашу посаду та компанію.",
    askIndustry: "Крок 4/4\nУ якій сфері ви працюєте? Чим займається ваша компанія?",
    summaryQuestion: "Перевірте дані перед підтвердженням:",
    payLaterButton: "Все правильно",
    confirmFreeButton: "Все правильно",
    restartButton: "🔁 Почати спочатку",
    paymentPending: "Реєстрацію створено. Оплата буде підключена наступним етапом.",
    freeConfirmed: "Ця подія безкоштовна. Вашу реєстрацію підтверджено.",
    cancelled: "Реєстрацію скасовано. Можете почати знову зі сторінки події або меню бота.",
    eventMissing: "Не вдалося знайти подію. Перевірте посилання або відкрийте список подій на сайті.",
    soldOut: "На цю подію вже немає вільних місць.",
    genericError: "Не вдалося обробити запит. Спробуйте ще раз трохи пізніше.",
    ticketsMissing: "Поки що у вас немає квитків. Знайдіть подію та зареєструйтесь за кілька кроків.",
    unknownCommand: "Я не зовсім зрозумів команду. Оберіть дію з меню.",
    free: "БЕЗКОШТОВНО",
    qrPayload: "QR payload",
    eventFallback: "Подія",
    locationFallback: "Локація уточнюється",
    dateFallback: "Дата уточнюється",
    descriptionFallback: "Організатор скоро додасть більше деталей події.",
    dateLabel: "Дата і час",
    locationLabel: "Місто / місце",
    priceLabel: "Вартість",
    statusLabel: "Статус",
    pageLabel: "Сторінка події",
    ticketLabel: "Квиток",
    paymentLabel: "Оплата",
    summaryTitle: "Ваші відповіді:",
    eventLabel: "Подія",
    nameLabel: "Ім'я",
    phoneLabel: "Телефон",
    positionLabel: "Посада та компанія",
    industryLabel: "Сфера",
    notProvided: "не вказано"
  },
  en: {
    chooseLanguage: "Оберіть мову / Choose language:",
    languageSaved: "Language saved.",
    welcome:
      "Hi! I'm the Rave'era Group Concerts & Marketing Agency bot.\nI can help you find events, register, and keep your ticket.\n\nChoose an action:",
    search: "🔍 Find event",
    myTickets: "🎟 My tickets",
    openSite: "🌐 Open website",
    openApp: "📱 App",
    appSoon: "The Rave'era app is coming soon. For now, you can use the website.",
    noEvents: "No public events are available yet. Check the website a little later.",
    registerButton: "Register",
    openOnSite: "Open on website",
    showQr: "Show QR",
    confirmEvent: "Is this the event you want to register for?",
    yes: "Yes",
    cancel: "Cancel",
    askName: "Step 1/4\nWhat is your name?",
    askPhone: "Step 2/4\nEnter your phone number.",
    shareContact: "Share contact",
    askPositionCompany: "Step 3/4\nEnter your role and company.",
    askIndustry: "Step 4/4\nWhat industry do you work in? What does your company do?",
    summaryQuestion: "Review your details before confirmation:",
    payLaterButton: "Looks good",
    confirmFreeButton: "Looks good",
    restartButton: "🔁 Start over",
    paymentPending: "Registration created. Payment will be connected in the next phase.",
    freeConfirmed: "This event is free. Your registration is confirmed.",
    cancelled: "Registration cancelled. You can start again from the event page or bot menu.",
    eventMissing: "Event could not be found. Check the link or open the event list on the website.",
    soldOut: "This event has no available spots left.",
    genericError: "The request could not be processed. Try again a little later.",
    ticketsMissing: "You do not have tickets yet. Find an event and register in a few steps.",
    unknownCommand: "I didn't quite understand that. Please choose an action from the menu.",
    free: "FREE",
    qrPayload: "QR payload",
    eventFallback: "Event",
    locationFallback: "Location TBA",
    dateFallback: "Date TBA",
    descriptionFallback: "The organizer will add more event details soon.",
    dateLabel: "Date and time",
    locationLabel: "City / venue",
    priceLabel: "Price",
    statusLabel: "Status",
    pageLabel: "Event page",
    ticketLabel: "Ticket",
    paymentLabel: "Payment",
    summaryTitle: "Your answers:",
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
  const description = event.description || event.subtitle || copy.descriptionFallback;
  const location = [event.city, event.venue].filter(Boolean).join(" / ") || event.address || copy.locationFallback;

  return [
    `<b>${escapeHtml(event.title)}</b>`,
    "",
    `${copy.dateLabel}: ${escapeHtml(formatTelegramDate(event.date, language))}`,
    `${copy.locationLabel}: ${escapeHtml(location)}`,
    `${copy.priceLabel}: ${escapeHtml(formatTelegramPrice(Number(event.price), event.currency, language))}`,
    `${copy.statusLabel}: ${escapeHtml(formatStatus(event.status, language))}`,
    "",
    escapeHtml(description),
    "",
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
    `${copy.eventLabel}: ${escapeHtml(input.eventTitle)}`,
    `${copy.nameLabel}: ${escapeHtml(input.name)}`,
    `${copy.phoneLabel}: ${escapeHtml(input.phone)}`,
    `${copy.positionLabel}: ${escapeHtml(input.positionCompany)}`,
    `${copy.industryLabel}: ${escapeHtml(input.industry)}`,
    `Telegram: ${escapeHtml(input.telegramUsername || copy.notProvided)}`,
    `${copy.priceLabel}: ${escapeHtml(input.price)}`
  ].join("\n");
}
