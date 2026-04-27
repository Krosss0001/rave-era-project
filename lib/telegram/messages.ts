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
      "Привіт! Це твій друг бот Rave'era Group Concerts & Marketing Agency, який допоможе вам обрати найкрутіший івент та зареєструватись на нього.\n\nОберіть дію:",
    search: "🔍 Пошук",
    myTickets: "🎟 Мої квитки",
    openApp: "📱 Перейти у додаток",
    openSite: "🌐 Перейти на сайт",
    appSoon: "Додаток Rave'era скоро буде доступний. Поки що ви можете користуватись сайтом.",
    noEvents: "Поки що немає доступних подій. Перевірте сайт трохи пізніше.",
    registerButton: "Зареєструватись",
    openOnSite: "Відкрити на сайті",
    showQr: "Показати QR",
    confirmEvent: "Це той захід, на який ви хочете зареєструватися?",
    yes: "Так",
    cancel: "Скасувати",
    askName: "Як вас звати?",
    askPhone: "Вкажіть, будь ласка, номер телефону",
    shareContact: "Надати контакт",
    askPositionCompany: "Вкажіть вашу посаду та компанію",
    askIndustry: "У якій галузі/сфері ви працюєте? Чим займається ваша компанія?",
    summaryQuestion: "Зберегти відповіді та продовжити?",
    payLaterButton: "Перейти до оплати",
    restartButton: "Почати спочатку",
    paymentPending: "Реєстрацію створено. Оплата буде підключена наступним етапом.",
    cancelled: "Реєстрацію скасовано. Ви можете почати знову зі сторінки події або з меню бота.",
    eventMissing: "Не вдалося знайти подію. Перевірте посилання або відкрийте список подій на сайті.",
    soldOut: "На цю подію вже немає вільних місць.",
    genericError: "Не вдалося обробити запит. Спробуйте ще раз трохи пізніше.",
    ticketsMissing: "Здається, ви ще не зареєстровані на жодний захід або скасували свою участь 👀",
    qrPayload: "QR payload",
    eventFallback: "Подія",
    locationFallback: "Локація уточнюється",
    dateFallback: "Дата уточнюється",
    descriptionFallback: "Опис події буде уточнено організатором.",
    dateLabel: "Дата і час",
    locationLabel: "Місто / місце",
    priceLabel: "Вартість",
    pageLabel: "Сторінка події",
    ticketLabel: "Квиток",
    statusLabel: "Статус",
    paymentLabel: "Оплата",
    summaryTitle: "Чи все вірно? 💪",
    summaryAnswers: "Ваші відповіді:",
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
      "Hi! I'm your Rave'era Group Concerts & Marketing Agency bot. I'll help you find the right event and register for it.\n\nChoose an action:",
    search: "🔍 Search",
    myTickets: "🎟 My tickets",
    openApp: "📱 Open app",
    openSite: "🌐 Open website",
    appSoon: "The Rave'era app is coming soon. For now, you can use the website.",
    noEvents: "No public events are available yet. Check the website a little later.",
    registerButton: "Register",
    openOnSite: "Open on website",
    showQr: "Show QR",
    confirmEvent: "Is this the event you want to register for?",
    yes: "Yes",
    cancel: "Cancel",
    askName: "What is your name?",
    askPhone: "Please enter your phone number",
    shareContact: "Share contact",
    askPositionCompany: "Please enter your role and company",
    askIndustry: "What industry do you work in? What does your company do?",
    summaryQuestion: "Save answers and continue?",
    payLaterButton: "Continue to payment",
    restartButton: "Start over",
    paymentPending: "Registration created. Payment will be connected in the next phase.",
    cancelled: "Registration cancelled. You can start again from the event page or bot menu.",
    eventMissing: "Event could not be found. Check the link or open the event list on the website.",
    soldOut: "This event has no available spots left.",
    genericError: "The request could not be processed. Try again a little later.",
    ticketsMissing: "Looks like you do not have any event registrations yet 👀",
    qrPayload: "QR payload",
    eventFallback: "Event",
    locationFallback: "Location TBA",
    dateFallback: "Date TBA",
    descriptionFallback: "The organizer will add more event details soon.",
    dateLabel: "Date and time",
    locationLabel: "City / venue",
    priceLabel: "Price",
    pageLabel: "Event page",
    ticketLabel: "Ticket",
    statusLabel: "Status",
    paymentLabel: "Payment",
    summaryTitle: "Does everything look correct? 💪",
    summaryAnswers: "Your answers:",
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
    copy.summaryTitle,
    copy.summaryAnswers,
    "",
    `${copy.eventLabel}: ${escapeHtml(input.eventTitle)}`,
    `${copy.nameLabel}: ${escapeHtml(input.name)}`,
    `${copy.phoneLabel}: ${escapeHtml(input.phone)}`,
    `${copy.positionLabel}: ${escapeHtml(input.positionCompany)}`,
    `${copy.industryLabel}: ${escapeHtml(input.industry)}`,
    `Telegram: ${escapeHtml(input.telegramUsername || copy.notProvided)}`,
    `${copy.priceLabel}: ${escapeHtml(input.price)}`,
    "",
    copy.summaryQuestion
  ].join("\n");
}
