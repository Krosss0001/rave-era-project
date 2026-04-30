import { NextResponse } from "next/server";
import { generateTicketQrDataUrl } from "@/lib/qr";
import { answerCallbackQuery, sendTelegramMessage, sendTelegramPhoto, sendTelegramPhotoDataUrl } from "@/lib/telegram/bot";
import {
  buildEventCardMessage,
  buildEventConfirmationMessage,
  buildSummaryMessage,
  escapeHtml,
  formatTelegramStatus,
  getEventSpecificConfirmationMessage,
  getTelegramCopy,
  ZEEKR_FINAL_REGISTRATION_URL,
  type BotLanguage
} from "@/lib/telegram/messages";
import {
  confirmFreeRegistrationAndTicket,
  createPendingRegistrationAndTicket,
  getEventBySlug,
  getLatestSession,
  getPublicTelegramEvents,
  getTelegramSupabaseClient,
  getTelegramTicketByCode,
  getTicketsForTelegramUser,
  parseStartPayload,
  subscribeTelegramUser,
  startSession,
  unsubscribeTelegramUser,
  updateSession,
  upsertTelegramUser,
  type EventRow,
  type TelegramSession
} from "@/lib/telegram/state";
import { isValidEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  contact?: {
    phone_number?: string;
  };
  chat: {
    id: number;
  };
  from?: TelegramUser;
};

type TelegramCallbackQuery = {
  id: string;
  data?: string;
  message?: TelegramMessage;
  from: TelegramUser;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

function getTelegramUser(input: TelegramMessage | TelegramCallbackQuery) {
  const from = "from" in input ? input.from : undefined;

  if (!from) {
    return null;
  }

  const chatId = "chat" in input ? input.chat.id : input.message?.chat.id;

  if (!chatId) {
    return null;
  }

  return {
    telegramUserId: String(from.id),
    chatId: String(chatId),
    telegramUsername: from.username ? `@${from.username}` : null,
    firstName: from.first_name ?? null,
    lastName: from.last_name ?? null
  };
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://rave-era-project.vercel.app").replace(/\/+$/, "");
}

function getEventUrl(eventSlug: string) {
  return `${getAppUrl()}/events/${eventSlug}`;
}

function getEventShareUrl(eventSlug: string, title: string) {
  const eventUrl = getEventUrl(eventSlug);
  return `https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(title)}`;
}

function logTelegramIssue(message: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, details);
  }
}

function normalizeInstagramNickname(value: string | undefined) {
  const normalized = value?.trim();

  if (!normalized || normalized === "-" || normalized.toLowerCase() === "skip" || normalized.toLowerCase() === "пропустити") {
    return null;
  }

  return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function mainMenuKeyboard(language: BotLanguage) {
  const copy = getTelegramCopy(language);

  return {
    replyKeyboard: [
      [{ text: copy.search }, { text: copy.myTickets }],
      [{ text: copy.openSite }, { text: copy.openApp }]
    ]
  };
}

function normalizeTelegramImageUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (
      url.protocol !== "https:" ||
      Boolean(url.username || url.password) ||
      !url.hostname.includes(".") ||
      url.hostname.includes("_") ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".local")
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

async function sendEventPreview(chatId: string, event: EventRow, language: BotLanguage, askConfirm = false) {
  const copy = getTelegramCopy(language);
  const eventUrl = getEventUrl(event.slug);
  const text = askConfirm
    ? buildEventConfirmationMessage(event, eventUrl, language)
    : buildEventCardMessage(event, eventUrl, language);
  const inlineKeyboard = askConfirm
    ? [[{ text: copy.yes, callback_data: "confirm_yes" }], [{ text: copy.cancel, callback_data: "cancel" }]]
    : [
        [{ text: copy.registerButton, callback_data: `register:${event.slug}` }],
        [{ text: copy.openOnSite, url: eventUrl }],
        [{ text: copy.shareButton, url: getEventShareUrl(event.slug, event.title) }]
      ];

  const imageUrl = normalizeTelegramImageUrl(event.image_url);

  if (imageUrl) {
    try {
      await sendTelegramPhoto(chatId, imageUrl, {
        caption: text,
        inlineKeyboard
      });
      return;
    } catch (error) {
      logTelegramIssue("Telegram sendPhoto failed for event preview", {
        eventSlug: event.slug,
        reason: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  await sendTelegramMessage(chatId, text, { inlineKeyboard });
}

async function showMainMenu(chatId: string, language: BotLanguage) {
  await sendTelegramMessage(chatId, getTelegramCopy(language).welcome, mainMenuKeyboard(language));
}

async function askForEventConfirmation(
  chatId: string,
  session: TelegramSession,
  event: EventRow,
  language: BotLanguage
) {
  await sendEventPreview(chatId, event, language, true);
  await updateSession(getTelegramSupabaseClient(), session.id, { step: "confirm_event", language });
}

async function sendSummary(chatId: string, session: TelegramSession, event: EventRow, language: BotLanguage) {
  const copy = getTelegramCopy(language);

  await sendTelegramMessage(
    chatId,
    buildSummaryMessage(
      {
        eventTitle: event.title,
        phone: session.phone,
        name: session.name,
        instagram: session.position_company,
        email: session.industry
      },
      language
    ),
    {
      inlineKeyboard: [
        [{ text: copy.correctButton, callback_data: "confirm_registration" }],
        [{ text: copy.restartButton, callback_data: "restart" }],
        [{ text: copy.cancel, callback_data: "cancel" }]
      ],
      removeKeyboard: true
    }
  );
}

async function sendEventsSearch(chatId: string, language: BotLanguage) {
  const copy = getTelegramCopy(language);
  const events = await getPublicTelegramEvents(getTelegramSupabaseClient());

  if (events.length === 0) {
    await sendTelegramMessage(chatId, copy.noEvents, {
      inlineKeyboard: [[{ text: copy.openSite, url: `${getAppUrl()}/events` }]]
    });
    return;
  }

  for (const event of events) {
    await sendEventPreview(chatId, event as EventRow, language);
  }
}

async function sendMyTickets(
  chatId: string,
  telegramUserId: string,
  telegramUsername: string | null,
  language: BotLanguage
) {
  const copy = getTelegramCopy(language);
  const rows = await getTicketsForTelegramUser(getTelegramSupabaseClient(), telegramUserId, telegramUsername);
  const ticketRows = rows.flatMap((row) => {
    const tickets = Array.isArray(row.tickets) ? row.tickets : row.tickets ? [row.tickets] : [];
    return tickets.map((ticket) => ({ registration: row, ticket }));
  });

  if (ticketRows.length === 0) {
    await sendTelegramMessage(chatId, copy.ticketsMissing, {
      inlineKeyboard: [
        [{ text: copy.search, callback_data: "search_events" }],
        [{ text: copy.openSite, url: `${getAppUrl()}/events` }]
      ]
    });
    return;
  }

  for (const item of ticketRows) {
    const event = Array.isArray(item.registration.events) ? item.registration.events[0] : item.registration.events;
    const eventTitle = event?.title || copy.eventFallback;

    await sendTelegramMessage(
      chatId,
      [
        `<b>${escapeHtml(eventTitle)}</b>`,
        "",
        `${copy.ticketLabel}: ${escapeHtml(item.ticket.ticket_code)}`,
        `${copy.statusLabel}: ${escapeHtml(formatTelegramStatus(item.ticket.status))}`
      ].join("\n"),
      {
        inlineKeyboard: [
          [{ text: copy.showQr, callback_data: `qr:${item.ticket.ticket_code}` }],
          ...(event?.slug ? [[{ text: copy.openEvent, url: getEventUrl(event.slug) }]] : [])
        ]
      }
    );
  }
}

async function finishRegistration(chatId: string, session: TelegramSession, language: BotLanguage) {
  const copy = getTelegramCopy(language);
  const supabase = getTelegramSupabaseClient();
  const event = session.event_slug ? await getEventBySlug(supabase, session.event_slug) : null;
  const isFreeEvent = Number(event?.price ?? 0) <= 0;
  const eventUrl = event?.slug ? getEventUrl(event.slug) : `${getAppUrl()}/events`;
  const { ticket } = isFreeEvent
    ? await confirmFreeRegistrationAndTicket(supabase, session)
    : await createPendingRegistrationAndTicket(supabase, session);

  await sendTelegramMessage(
    chatId,
    [
      isFreeEvent ? copy.freeConfirmed : copy.registrationCreated,
      "",
      `${copy.ticketLabel}: ${escapeHtml(ticket.ticket_code)}`,
      `${copy.statusLabel}: ${escapeHtml(formatTelegramStatus(ticket.status))}`,
      `${copy.paymentLabel}: ${escapeHtml(formatTelegramStatus(ticket.payment_status))}`
    ].join("\n"),
    {
      inlineKeyboard: isFreeEvent
        ? [
            [{ text: copy.showQr, callback_data: `qr:${ticket.ticket_code}` }],
            [{ text: copy.myTickets, callback_data: "my_tickets" }],
            [{ text: copy.openOnSite, url: eventUrl }]
          ]
        : [
            [{ text: copy.myTickets, callback_data: "my_tickets" }],
            [{ text: copy.openOnSite, url: eventUrl }]
          ],
      removeKeyboard: true
    }
  );

  const eventSpecificConfirmation = getEventSpecificConfirmationMessage(event?.slug);

  if (eventSpecificConfirmation) {
    await sendTelegramMessage(chatId, eventSpecificConfirmation, {
      inlineKeyboard: [[{ text: "Пройти фінальну реєстрацію", url: ZEEKR_FINAL_REGISTRATION_URL }]],
      parseMode: null
    });
  }
}

async function handleStart(message: TelegramMessage, payload: string | undefined) {
  const user = getTelegramUser(message);

  if (!user) {
    return;
  }

  const supabase = getTelegramSupabaseClient();
  await upsertTelegramUser(supabase, user);
  await subscribeTelegramUser(supabase, user.telegramUserId);
  const language: BotLanguage = "uk";
  const eventSlug = parseStartPayload(payload);

  if (!eventSlug) {
    await showMainMenu(user.chatId, language);
    return;
  }

  const event = await getEventBySlug(supabase, eventSlug);

  if (!event) {
    const copy = getTelegramCopy(language);
    logTelegramIssue("Telegram start payload event not found", {
      telegramUserId: user.telegramUserId,
      eventSlug
    });
    await sendTelegramMessage(user.chatId, copy.eventMissing, {
      inlineKeyboard: [[{ text: copy.openSite, url: `${getAppUrl()}/events` }]]
    });
    return;
  }

  const session = await startSession(supabase, { ...user, language }, eventSlug);

  if (!session.event_id) {
    const copy = getTelegramCopy(language);
    logTelegramIssue("Telegram start payload session missing event", {
      telegramUserId: user.telegramUserId,
      eventSlug
    });
    await sendTelegramMessage(user.chatId, copy.eventMissing, {
      inlineKeyboard: [[{ text: copy.openSite, url: `${getAppUrl()}/events` }]]
    });
    return;
  }

  await askForEventConfirmation(user.chatId, session, event, language);
}

async function handleStop(message: TelegramMessage) {
  const user = getTelegramUser(message);

  if (!user) {
    return;
  }

  const supabase = getTelegramSupabaseClient();
  await upsertTelegramUser(supabase, user);
  const language: BotLanguage = "uk";
  const copy = getTelegramCopy(language);

  await unsubscribeTelegramUser(supabase, user.telegramUserId);
  await sendTelegramMessage(user.chatId, copy.unsubscribed);
}

async function sendTicketQr(
  chatId: string,
  telegramUserId: string,
  telegramUsername: string | null,
  ticketCode: string,
  language: BotLanguage
) {
  const copy = getTelegramCopy(language);
  const ticketRow = await getTelegramTicketByCode(
    getTelegramSupabaseClient(),
    telegramUserId,
    telegramUsername,
    ticketCode
  );

  if (!ticketRow) {
    logTelegramIssue("Telegram ticket lookup failed", { telegramUserId, ticketCode });
    await sendTelegramMessage(chatId, copy.ticketNotFound, mainMenuKeyboard(language));
    return;
  }

  const { ticket, event } = ticketRow;
  const eventTitle = event?.title || copy.eventFallback;
  const caption = [
    `<b>${escapeHtml(eventTitle)}</b>`,
    "",
    `${copy.ticketLabel}: ${escapeHtml(ticket.ticket_code)}`,
    `${copy.statusLabel}: ${escapeHtml(formatTelegramStatus(ticket.status))}`,
    `${copy.paymentLabel}: ${escapeHtml(formatTelegramStatus(ticket.payment_status))}`,
    "",
    copy.qrInstructions
  ].join("\n");

  if (ticket.status === "used" || ticket.checked_in) {
    await sendTelegramMessage(
      chatId,
      [`<b>${escapeHtml(eventTitle)}</b>`, "", `${copy.ticketLabel}: ${escapeHtml(ticket.ticket_code)}`, copy.qrUsed].join("\n"),
      mainMenuKeyboard(language)
    );
    return;
  }

  if (ticket.status !== "active" || ticket.payment_status !== "paid") {
    await sendTelegramMessage(
      chatId,
      [
        `<b>${escapeHtml(eventTitle)}</b>`,
        "",
        `${copy.ticketLabel}: ${escapeHtml(ticket.ticket_code)}`,
        `${copy.statusLabel}: ${escapeHtml(formatTelegramStatus(ticket.status))}`,
        `${copy.paymentLabel}: ${escapeHtml(formatTelegramStatus(ticket.payment_status))}`,
        "",
        copy.qrLocked
      ].join("\n"),
      mainMenuKeyboard(language)
    );
    return;
  }

  try {
    const qrDataUrl = await generateTicketQrDataUrl(ticket);
    await sendTelegramPhotoDataUrl(chatId, qrDataUrl, { caption });
  } catch (error) {
    logTelegramIssue("Telegram QR generation or send failed", {
      telegramUserId,
      ticketCode: ticket.ticket_code,
      reason: error instanceof Error ? error.message : "unknown"
    });
    await sendTelegramMessage(chatId, [caption, "", copy.qrFallback, ticket.ticket_code].join("\n"), mainMenuKeyboard(language));
  }
}

async function handleCallback(callbackQuery: TelegramCallbackQuery) {
  const data = callbackQuery.data;
  const user = getTelegramUser(callbackQuery);

  await answerCallbackQuery(callbackQuery.id);

  if (!user || !data) {
    return;
  }

  const supabase = getTelegramSupabaseClient();
  await upsertTelegramUser(supabase, user);
  await subscribeTelegramUser(supabase, user.telegramUserId);

  const language: BotLanguage = "uk";
  const copy = getTelegramCopy(language);

  if (data === "my_tickets") {
    await sendMyTickets(user.chatId, user.telegramUserId, user.telegramUsername, language);
    return;
  }

  if (data === "search_events") {
    await sendEventsSearch(user.chatId, language);
    return;
  }

  if (data.startsWith("qr:")) {
    const ticketCode = data.slice("qr:".length).trim();

    if (!ticketCode) {
      logTelegramIssue("Telegram QR callback missing ticket code", { telegramUserId: user.telegramUserId });
      await sendTelegramMessage(user.chatId, copy.ticketNotFound, mainMenuKeyboard(language));
      return;
    }

    await sendTicketQr(user.chatId, user.telegramUserId, user.telegramUsername, ticketCode, language);
    return;
  }

  if (data.startsWith("register:")) {
    const slug = data.slice("register:".length).trim();

    if (!slug) {
      logTelegramIssue("Telegram registration callback missing event slug", { telegramUserId: user.telegramUserId });
      await sendTelegramMessage(user.chatId, copy.eventMissing, mainMenuKeyboard(language));
      return;
    }

    const event = await getEventBySlug(supabase, slug);

    if (!event) {
      logTelegramIssue("Telegram registration callback event not found", {
        telegramUserId: user.telegramUserId,
        eventSlug: slug
      });
      await sendTelegramMessage(user.chatId, copy.eventMissing, mainMenuKeyboard(language));
      return;
    }

    const session = await startSession(supabase, { ...user, language }, slug);

    if (!session.event_id) {
      logTelegramIssue("Telegram registration callback session missing event", {
        telegramUserId: user.telegramUserId,
        eventSlug: slug
      });
      await sendTelegramMessage(user.chatId, copy.eventMissing, mainMenuKeyboard(language));
      return;
    }

    await askForEventConfirmation(user.chatId, session, event, language);
    return;
  }

  const session = await getLatestSession(supabase, user.telegramUserId, user.chatId);

  if (!session) {
    await showMainMenu(user.chatId, language);
    return;
  }

  if (data === "cancel") {
    await updateSession(supabase, session.id, { step: "cancelled", language });
    await sendTelegramMessage(user.chatId, copy.cancelled, { removeKeyboard: true });
    return;
  }

  if (data === "restart") {
    await updateSession(supabase, session.id, {
      step: "ask_phone",
      name: null,
      phone: null,
      position_company: null,
      industry: null,
      registration_id: null,
      ticket_id: null,
      language
    });
    await sendTelegramMessage(user.chatId, copy.askPhone, {
      replyKeyboard: [
        [{ text: copy.shareContact, request_contact: true }],
        [{ text: copy.cancel }]
      ]
    });
    return;
  }

  const event = session.event_slug ? await getEventBySlug(supabase, session.event_slug) : null;

  if (!event) {
    await sendTelegramMessage(user.chatId, copy.eventMissing);
    return;
  }

  if (data === "confirm_yes") {
    await updateSession(supabase, session.id, { step: "ask_phone", language });
    await sendTelegramMessage(user.chatId, copy.askPhone, {
      replyKeyboard: [
        [{ text: copy.shareContact, request_contact: true }],
        [{ text: copy.cancel }]
      ]
    });
    return;
  }

  if (data === "confirm_registration") {
    try {
      await finishRegistration(user.chatId, session, language);
    } catch (error) {
      logTelegramIssue("Telegram registration or ticket creation failed", {
        telegramUserId: user.telegramUserId,
        sessionId: session.id,
        eventSlug: session.event_slug,
        reason: error instanceof Error ? error.message : "unknown"
      });
      const message = error instanceof Error && error.message.toLowerCase().includes("sold out")
        ? copy.soldOut
        : copy.genericError;
      await sendTelegramMessage(user.chatId, message);
    }
    return;
  }

  await showMainMenu(user.chatId, language);
}

async function handleUkrainianConversationMessage(message: TelegramMessage) {
  const user = getTelegramUser(message);

  if (!user) {
    return;
  }

  const supabase = getTelegramSupabaseClient();
  await upsertTelegramUser(supabase, user);
  await subscribeTelegramUser(supabase, user.telegramUserId);

  const language: BotLanguage = "uk";
  const copy = getTelegramCopy(language);
  const text = message.text?.trim();

  if (text === copy.search) {
    await sendEventsSearch(user.chatId, language);
    return;
  }

  if (text === copy.myTickets) {
    await sendMyTickets(user.chatId, user.telegramUserId, user.telegramUsername, language);
    return;
  }

  if (text === copy.openApp) {
    await sendTelegramMessage(user.chatId, copy.appSoon, mainMenuKeyboard(language));
    return;
  }

  if (text === copy.openSite) {
    await sendTelegramMessage(user.chatId, `${getAppUrl()}/events`, {
      inlineKeyboard: [[{ text: copy.openSite, url: `${getAppUrl()}/events` }]]
    });
    return;
  }

  const session = await getLatestSession(supabase, user.telegramUserId, user.chatId);

  if (!session) {
    await showMainMenu(user.chatId, language);
    return;
  }

  if (text === copy.cancel) {
    await updateSession(supabase, session.id, { step: "cancelled", language });
    await sendTelegramMessage(user.chatId, copy.cancelled, { removeKeyboard: true });
    return;
  }

  if (session.step === "ask_phone") {
    const phone = (message.contact?.phone_number || text || "").trim();

    if (!phone) {
      await sendTelegramMessage(user.chatId, copy.invalidPhone);
      return;
    }

    await updateSession(supabase, session.id, { phone, step: "ask_name", language });
    await sendTelegramMessage(user.chatId, copy.askName, { removeKeyboard: true });
    return;
  }

  if (session.step === "ask_name") {
    if (!text) {
      await sendTelegramMessage(user.chatId, copy.invalidName);
      return;
    }

    await updateSession(supabase, session.id, { name: text, step: "ask_instagram", language });
    await sendTelegramMessage(user.chatId, copy.askInstagram, {
      replyKeyboard: [
        [{ text: copy.skip }],
        [{ text: copy.cancel }]
      ]
    });
    return;
  }

  if (session.step === "ask_instagram") {
    await updateSession(supabase, session.id, {
      position_company: normalizeInstagramNickname(text),
      step: "ask_email",
      language
    });
    await sendTelegramMessage(user.chatId, copy.askEmail, { removeKeyboard: true });
    return;
  }

  if (session.step === "ask_email") {
    if (!text || !isValidEmail(text)) {
      await sendTelegramMessage(user.chatId, copy.invalidEmail);
      return;
    }

    const updated = await updateSession(supabase, session.id, { industry: text, step: "summary", language });
    const event = updated.event_slug ? await getEventBySlug(supabase, updated.event_slug) : null;

    if (!event) {
      await sendTelegramMessage(user.chatId, copy.eventMissing);
      return;
    }

    await sendSummary(user.chatId, updated, event, language);
    return;
  }

  await showMainMenu(user.chatId, language);
}

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;
    const callbackQuery = update.callback_query;

    if (message?.text?.trim() === "/stop") {
      await handleStop(message);
      return NextResponse.json({ ok: true });
    }

    if (message?.text?.startsWith("/start")) {
      const [, payload] = message.text.split(/\s+/, 2);
      await handleStart(message, payload);
      return NextResponse.json({ ok: true });
    }

    if (callbackQuery) {
      await handleCallback(callbackQuery);
      return NextResponse.json({ ok: true });
    }

    if (message) {
      await handleUkrainianConversationMessage(message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Telegram webhook error", error instanceof Error ? error.message : error);
    }
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}
