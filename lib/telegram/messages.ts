import type { Database } from "@/lib/supabase/types";

type EventRow = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  "slug" | "title" | "subtitle" | "description" | "date" | "venue" | "address" | "price" | "currency"
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
  welcome: "Привіт! Це Rave'era bot. Я допоможу вам зареєструватися на подію.",
  registerButton: "Зареєструватися",
  confirmEvent: "Це той захід, на який ви хочете зареєструватися?",
  yes: "Так",
  cancel: "Скасувати",
  askName: "Як вас звати?",
  askPhone: "Вкажіть, будь ласка, номер телефону",
  shareContact: "Надати контакт",
  askPositionCompany: "Вкажіть вашу посаду та компанію",
  askIndustry: "У якій галузі/сфері ви працюєте? Чим займається ваша компанія?",
  summaryQuestion: "Все вірно?",
  payLaterButton: "Перейти до оплати",
  restartButton: "Почати спочатку",
  paymentPending: "Оплата буде підключена наступним етапом. Вашу реєстрацію створено зі статусом pending.",
  cancelled: "Реєстрацію скасовано. Ви можете почати з посилання на сторінці події.",
  eventMissing: "Не вдалося знайти подію. Перевірте посилання або відкрийте реєстрацію зі сторінки події.",
  soldOut: "На цю подію вже немає вільних місць.",
  genericError: "Не вдалося обробити запит. Спробуйте ще раз трохи пізніше."
};

function escapeHtml(value: string | null | undefined) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatTelegramPrice(price: number, currency: string | null) {
  return `${new Intl.NumberFormat("uk-UA").format(Number.isFinite(price) ? price : 0)} ${currency || "UAH"}`;
}

export function formatTelegramDate(value: string | null) {
  if (!value) {
    return "Дата уточнюється";
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

export function buildEventConfirmationMessage(event: EventRow, eventUrl: string) {
  const description = event.description || event.subtitle || "Опис події буде уточнено організатором.";
  const location = [event.venue, event.address].filter(Boolean).join(", ") || "Локація буде уточнена";

  return [
    `<b>${escapeHtml(event.title)}</b>`,
    "",
    `Дата і час: ${escapeHtml(formatTelegramDate(event.date))}`,
    `Місце: ${escapeHtml(location)}`,
    `Вартість: ${escapeHtml(formatTelegramPrice(Number(event.price), event.currency))}`,
    "",
    escapeHtml(description),
    "",
    `Сторінка події: ${escapeHtml(eventUrl)}`,
    "",
    TELEGRAM_COPY.confirmEvent
  ].join("\n");
}

export function buildSummaryMessage(input: SummaryInput) {
  return [
    "<b>Перевірте реєстрацію</b>",
    "",
    `Подія: ${escapeHtml(input.eventTitle)}`,
    `Ім'я: ${escapeHtml(input.name)}`,
    `Телефон: ${escapeHtml(input.phone)}`,
    `Посада/компанія: ${escapeHtml(input.positionCompany)}`,
    `Сфера: ${escapeHtml(input.industry)}`,
    `Telegram: ${escapeHtml(input.telegramUsername || "не вказано")}`,
    `Вартість: ${escapeHtml(input.price)}`,
    "",
    TELEGRAM_COPY.summaryQuestion
  ].join("\n");
}
