import type { Database } from "@/lib/supabase/types";
import { PAYMENT_PLACEHOLDER_UA } from "@/lib/payment-placeholder";

export type BotLanguage = "uk";

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
  phone: string | null;
  name: string | null;
  instagram: string | null;
  email: string | null;
};

export const ZEEKR_FINAL_REGISTRATION_URL = "https://avtoexpo.ua/cat/registration";

export function getEventSpecificConfirmationMessage(eventSlug: string | null | undefined) {
  if (eventSlug !== "zeekr-9x") {
    return null;
  }

  return [
    "РЕЄСТРАЦІЮ ПІДТВЕРДЖЕНО🤝",
    "",
    " ЗВЕРНІТЬ УВАГУ ",
    "",
    "Реєстрація в цьому боті підтверджує вашу участь у презентації, але не є вхідним квитком на територію виставки. Щоб ви змогли потрапити до павільйону МВЦ (12-14 травня), обовязково отримайте офіційний бейдж відвідувача виставки Com Auto Trans.",
    "",
    "ПРОЙДІТЬ ОБОВʼЯЗКОВУ ФІНАЛЬНУ РЕЄСТРАЦІЮ НА САЙТІ ВИСТАВКИ",
    "",
    "За промокодом Zeekr відвідування виставки буде безкоштовним:",
    ZEEKR_FINAL_REGISTRATION_URL,
    "",
    "Без реєстрації вхід на територію експоцентру буде не можливим."
  ].join("\n");
}

export const TELEGRAM_COPY = {
  welcome:
    "Привіт! Я бот Rave'era Group.\n" +
    "Допоможу знайти подію, зареєструватися та зберегти квиток.\n\n" +
    "Оберіть дію:",
  search: "🔍 Знайти подію",
  myTickets: "🎟 Мої квитки",
  openSite: "🌐 Відкрити сайт",
  openApp: "📱 Додаток",
  appSoon: "Додаток Rave'era скоро буде доступний. Поки що скористайтеся сайтом.",
  noEvents: "Поки що немає доступних подій.\n\nВідкрийте сайт або поверніться трохи пізніше.",
  registerButton: "Зареєструватись",
  openOnSite: "Відкрити на сайті",
  openEvent: "Відкрити подію",
  shareButton: "Invite friends",
  showQr: "Показати QR",
  qrStatusLabel: "QR",
  qrAvailable: "доступний",
  qrUnavailable: "буде доступний після підтвердження оплати",
  referralLinkLabel: "Реферальне посилання",
  confirmEvent: "Підтвердити реєстрацію на цю подію?",
  yes: "Так",
  cancel: "Скасувати",
  askPhone: "<b>Крок 1/4</b>\nВаш мобільний номер?",
  askName: "<b>Крок 2/4</b>\nВаше імʼя та прізвище?",
  askInstagram: "<b>Крок 3/4</b>\nВаш Instagram нікнейм?\n\nМожна пропустити.",
  askEmail: "<b>Крок 4/4</b>\nВаша електронна пошта?",
  shareContact: "Надати контакт",
  skip: "Пропустити",
  correctButton: "Все правильно",
  restartButton: "🔁 Почати спочатку",
  registrationCreated: "Реєстрацію створено. Квиток збережено у розділі «Мої квитки».",
  dashboardPayment: "Payment can be completed in your dashboard.",
  freeConfirmed: "Реєстрацію підтверджено. Квиток активний.",
  cancelled: "Реєстрацію скасовано. Можете почати знову зі сторінки події або меню бота.",
  eventMissing: "Не вдалося знайти подію. Перевірте посилання або відкрийте список подій на сайті.",
  soldOut: "На цю подію вже немає вільних місць.",
  registrationFailed: "Не вдалося завершити реєстрацію. Перевірте дані або спробуйте ще раз пізніше.",
  genericError: "Не вдалося обробити запит. Спробуйте ще раз трохи пізніше.",
  invalidPhone: "Вкажіть мобільний номер.",
  invalidName: "Вкажіть імʼя та прізвище.",
  invalidEmail: "Вкажіть коректну електронну пошту.",
  ticketsMissing: "У вас ще немає квитків",
  unknownCommand: "Оберіть дію:",
  free: "Безкоштовно",
  qrLocked: PAYMENT_PLACEHOLDER_UA,
  qrUsed: "Цей квиток уже використано або він пройшов check-in.",
  qrInstructions: "Покажіть цей QR на вході. Організатор сканує його на сторінці Check-in.",
  qrFallback: "QR не вдалося надіслати як фото. Покажіть цей код на вході.",
  ticketNotFound: "Квиток не знайдено або він не належить цьому Telegram профілю.",
  eventFallback: "Подія",
  locationFallback: "Локація уточнюється",
  dateFallback: "Дата уточнюється",
  capacityFallback: "Уточнюється",
  dateLabel: "Дата",
  locationLabel: "Локація",
  priceLabel: "Ціна",
  capacityLabel: "Місткість",
  statusLabel: "Статус",
  pageLabel: "Сторінка події",
  ticketLabel: "Код квитка",
  paymentLabel: "Стан квитка",
  notProvided: "не вказано",
  unsubscribed: "Ви відписалися від розсилок Rave'era Group."
} as const;

export function getTelegramCopy(_language?: BotLanguage) {
  return TELEGRAM_COPY;
}

export function escapeHtml(value: string | null | undefined) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatTelegramPrice(price: number, currency: string | null, _language?: BotLanguage) {
  if (Number.isFinite(price) && price <= 0) {
    return TELEGRAM_COPY.free;
  }

  return `${new Intl.NumberFormat("uk-UA").format(Number.isFinite(price) ? price : 0)} ${currency || "UAH"}`;
}

export function formatTelegramDate(value: string | null, _language?: BotLanguage) {
  if (!value) {
    return TELEGRAM_COPY.dateFallback;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

export function formatTelegramStatus(value: string | null | undefined) {
  const statuses: Record<string, string> = {
    draft: "Чернетка",
    published: "Опубліковано",
    live: "Активна",
    limited: "Мало місць",
    soon: "Скоро",
    cancelled: "Скасовано",
    archived: "Архів",
    reserved: "Зарезервовано",
    active: "Активний",
    used: "Використано",
    pending: "Очікує підтвердження",
    paid: "Підтверджено",
    failed: "Помилка"
  };

  return value ? statuses[value] || value : TELEGRAM_COPY.notProvided;
}

function formatCapacity(capacity: number | null) {
  return Number.isFinite(capacity) && Number(capacity) > 0 ? `${capacity}` : TELEGRAM_COPY.capacityFallback;
}

export function buildEventCardMessage(event: EventRow, eventUrl: string, language?: BotLanguage) {
  const copy = getTelegramCopy(language);
  const location = [event.city, event.venue].filter(Boolean).join(" / ") || event.address || copy.locationFallback;

  return [
    `🎟 <b>${escapeHtml(event.title)}</b>`,
    "",
    `📅 ${copy.dateLabel}: ${escapeHtml(formatTelegramDate(event.date, language))}`,
    `📍 ${copy.locationLabel}: ${escapeHtml(location)}`,
    `💰 ${copy.priceLabel}: ${escapeHtml(formatTelegramPrice(Number(event.price), event.currency, language))}`
  ].join("\n");
}

export function buildEventConfirmationMessage(event: EventRow, eventUrl: string, language?: BotLanguage) {
  const copy = getTelegramCopy(language);
  return [buildEventCardMessage(event, eventUrl, language), "", copy.confirmEvent].join("\n");
}

export function buildSummaryMessage(input: SummaryInput, language?: BotLanguage) {
  const copy = getTelegramCopy(language);

  return [
    "Перевірте дані:",
    "",
    `Подія: ${escapeHtml(input.eventTitle || copy.notProvided)}`,
    `Телефон: ${escapeHtml(input.phone || copy.notProvided)}`,
    `Імʼя: ${escapeHtml(input.name || copy.notProvided)}`,
    `Instagram: ${escapeHtml(input.instagram || copy.notProvided)}`,
    `Email: ${escapeHtml(input.email || copy.notProvided)}`,
    "",
    "Все вірно?"
  ].join("\n");
}
