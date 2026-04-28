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
    welcome:
      "Привіт! Я бот Rave'era Group.\nДопоможу знайти подію, зареєструватися та зберегти квиток.",
    search: "🔍 Знайти подію",
    myTickets: "🎟 Мої квитки",
    openSite: "🌐 Відкрити сайт",
    openApp: "📱 Додаток",
    changeLanguage: "🌐 Змінити мову",
    appSoon: "Додаток Rave'era скоро буде доступний. Поки що скористайтеся сайтом.",
    noEvents: "Поки що немає доступних подій.\n\nВідкрийте сайт або поверніться трохи пізніше.",
    registerButton: "Зареєструватися",
    openOnSite: "Відкрити сайт",
    shareButton: "Поділитися",
    showQr: "Показати QR",
    confirmEvent: "Підтвердити реєстрацію на цю подію?",
    yes: "Так",
    cancel: "Скасувати",
    askName: "<b>Крок 1/4</b>\nЯк вас звати?",
    askPhone: "<b>Крок 2/4</b>\nВаш номер телефону",
    shareContact: "Надати контакт",
    askPositionCompany: "<b>Крок 3/4</b>\nКомпанія / роль",
    askIndustry: "<b>Крок 4/4</b>\nСфера або контекст",
    summaryQuestion: "<b>Перевірте реєстрацію</b>",
    payLaterButton: "Підтвердити",
    confirmFreeButton: "Підтвердити",
    restartButton: "Почати спочатку",
    paymentPending:
      "⏳ Реєстрацію створено.\nСтатус оплати: pending.\nQR відкриється після підтвердження оплати.",
    freeConfirmed: "✅ Реєстрацію підтверджено.\nКвиток активний.",
    cancelled: "Реєстрацію скасовано. Можете почати знову зі сторінки події або меню бота.",
    eventMissing: "Не вдалося знайти подію. Перевірте посилання або відкрийте список подій на сайті.",
    soldOut: "На цю подію вже немає вільних місць.",
    genericError: "Не вдалося обробити запит. Спробуйте ще раз трохи пізніше.",
    ticketsMissing:
      "У вас поки що немає квитків.\n\nЗнайдіть подію і зареєструйтеся. Квиток з'явиться тут після реєстрації.",
    unknownCommand: "Не вдалося розпізнати повідомлення.\n\nОберіть дію з меню нижче.",
    free: "БЕЗКОШТОВНО",
    qrPayload: "QR / код квитка",
    qrLocked: "QR заблоковано до підтвердження оплати.",
    qrUsed: "Цей квиток уже використано або пройшов check-in.",
    qrInstructions: "Покажіть цей QR на вході. Організатор сканує його на сторінці Check-in.",
    qrFallback: "QR не вдалося надіслати як фото. Покажіть цей код на вході.",
    ticketNotFound: "Квиток не знайдено або він не належить цьому Telegram профілю.",
    eventFallback: "Подія",
    locationFallback: "Локація уточнюється",
    dateFallback: "Дата уточнюється",
    dateLabel: "Дата",
    locationLabel: "Локація",
    priceLabel: "Ціна",
    capacityLabel: "Місткість",
    statusLabel: "Статус",
    pageLabel: "Сторінка події",
    ticketLabel: "Код",
    paymentLabel: "Оплата",
    summaryTitle: "Дані:",
    eventLabel: "Подія",
    nameLabel: "Ім'я",
    phoneLabel: "Телефон",
    positionLabel: "Компанія / роль",
    industryLabel: "Сфера",
    notProvided: "не вказано",
    unsubscribed: "Ви відписалися від розсилок Rave'era Group."
  },
  en: {
    chooseLanguage: "Оберіть мову / Choose language:",
    languageSaved: "Language saved.",
    welcome:
      "Hi! I'm the Rave'era Group bot.\nI can help you find events, register, and keep your ticket.",
    search: "🔍 Find event",
    myTickets: "🎟 My tickets",
    openSite: "🌐 Open website",
    openApp: "📱 App",
    changeLanguage: "🌐 Change language",
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
    askPositionCompany: "<b>Step 3/4</b>\nCompany / role",
    askIndustry: "<b>Step 4/4</b>\nField / context",
    summaryQuestion: "<b>Review registration</b>",
    payLaterButton: "Confirm",
    confirmFreeButton: "Confirm",
    restartButton: "Start over",
    paymentPending:
      "⏳ Registration created.\nPayment status: pending.\nQR unlocks after payment is confirmed.",
    freeConfirmed: "✅ Registration confirmed.\nTicket active.",
    cancelled: "Registration cancelled. You can start again from the event page or bot menu.",
    eventMissing: "Event could not be found. Check the link or open the event list on the website.",
    soldOut: "This event has no available spots left.",
    genericError: "The request could not be processed. Try again a little later.",
    ticketsMissing:
      "You do not have tickets yet.\n\nFind an event and register. Your ticket will appear here after that.",
    unknownCommand: "I could not recognize that message.\n\nChoose an action from the menu below.",
    free: "FREE",
    qrPayload: "QR / ticket code",
    qrLocked: "QR is locked until payment is confirmed.",
    qrUsed: "This ticket has already been used or checked in.",
    qrInstructions: "Show this QR at the entrance. Organizer scans it on the Check-in page.",
    qrFallback: "QR could not be sent as a photo. Show this ticket code at the entrance.",
    ticketNotFound: "Ticket was not found or does not belong to this Telegram profile.",
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
    positionLabel: "Company / role",
    industryLabel: "Field",
    notProvided: "not provided",
    unsubscribed: "You have unsubscribed from Rave'era Group broadcasts."
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

export function buildEventCardMessage(event: EventRow, eventUrl: string, language: BotLanguage) {
  const copy = getTelegramCopy(language);
  const location = [event.city, event.venue].filter(Boolean).join(" / ") || event.address || copy.locationFallback;

  return [
    `🎟 <b>${escapeHtml(event.title)}</b>`,
    "",
    `📅 ${copy.dateLabel}: ${escapeHtml(formatTelegramDate(event.date, language))}`,
    `📍 ${copy.locationLabel}: ${escapeHtml(location)}`,
    `💰 ${copy.priceLabel}: ${escapeHtml(formatTelegramPrice(Number(event.price), event.currency, language))}`,
    `📌 ${copy.statusLabel}: ${escapeHtml(event.status)}`,
    `👥 ${copy.capacityLabel}: ${escapeHtml(formatCapacity(event.capacity))}`,
    `🌐 ${copy.pageLabel}: ${escapeHtml(eventUrl)}`
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
