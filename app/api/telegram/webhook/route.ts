import { NextResponse } from "next/server";
import { generateTicketQrDataUrl } from "@/lib/qr";
import { answerCallbackQuery, sendTelegramMessage, sendTelegramPhoto, sendTelegramPhotoDataUrl } from "@/lib/telegram/bot";
import {
  buildEventCardMessage,
  buildEventConfirmationMessage,
  buildSummaryMessage,
  escapeHtml,
  formatTelegramDate,
  formatTelegramPrice,
  getTelegramCopy,
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
  getTelegramUserLanguage,
  getTicketsForTelegramUser,
  parseStartPayload,
  setTelegramUserLanguage,
  subscribeTelegramUser,
  startSession,
  unsubscribeTelegramUser,
  updateSession,
  upsertTelegramUser,
  type EventRow,
  type TelegramSession
} from "@/lib/telegram/state";

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

function languageKeyboard() {
  return {
    inlineKeyboard: [
      [
        { text: "🇺🇦 Українська", callback_data: "lang:uk" },
        { text: "🇬🇧 English", callback_data: "lang:en" }
      ]
    ]
  };
}

function mainMenuKeyboard(language: BotLanguage) {
  const copy = getTelegramCopy(language);

  return {
    replyKeyboard: [
      [{ text: copy.search }, { text: copy.myTickets }],
      [{ text: copy.openSite }, { text: copy.openApp }],
      [{ text: copy.changeLanguage }]
    ]
  };
}

async function getLanguage(userId: string): Promise<BotLanguage> {
  const language = await getTelegramUserLanguage(getTelegramSupabaseClient(), userId);
  return language ?? "uk";
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
      console.warn("Telegram image send failed", {
        eventSlug: event.slug,
        reason: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  await sendTelegramMessage(chatId, text, { inlineKeyboard });
}

async function showLanguageChoice(chatId: string) {
  await sendTelegramMessage(chatId, getTelegramCopy("uk").chooseLanguage, languageKeyboard());
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
  const isFreeEvent = Number(event.price) <= 0;

  await sendTelegramMessage(
    chatId,
    buildSummaryMessage(
      {
        eventTitle: event.title,
        name: session.name,
        phone: session.phone,
        positionCompany: session.position_company,
        industry: session.industry,
        telegramUsername: session.telegram_username,
        price: formatTelegramPrice(Number(event.price), event.currency, language)
      },
      language
    ),
    {
      inlineKeyboard: [
        [{ text: isFreeEvent ? copy.confirmFreeButton : copy.payLaterButton, callback_data: "payment_pending" }],
        [{ text: copy.restartButton, callback_data: "restart" }]
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
    const location = [event?.city, event?.venue].filter(Boolean).join(" / ") || copy.locationFallback;

    await sendTelegramMessage(
      chatId,
      [
        `<b>${escapeHtml(eventTitle)}</b>`,
        "",
        `${copy.dateLabel}: ${escapeHtml(formatTelegramDate(event?.date ?? null, language))}`,
        `${copy.locationLabel}: ${escapeHtml(location)}`,
        `${copy.ticketLabel}: ${escapeHtml(item.ticket.ticket_code)}`,
        `${copy.statusLabel}: ${escapeHtml(item.ticket.status)}`,
        `${copy.paymentLabel}: ${escapeHtml(item.ticket.payment_status)}`
      ].join("\n"),
      {
        inlineKeyboard: [
          [{ text: copy.showQr, callback_data: `qr:${item.ticket.ticket_code}` }],
          ...(event?.slug ? [[{ text: copy.openOnSite, url: getEventUrl(event.slug) }]] : [])
        ]
      }
    );
  }
}

async function finishPaymentStub(chatId: string, session: TelegramSession, language: BotLanguage) {
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
      isFreeEvent ? copy.freeConfirmed : copy.paymentPending,
      "",
      `${copy.ticketLabel}: ${escapeHtml(ticket.ticket_code)}`,
      `${copy.statusLabel}: ${escapeHtml(ticket.status)}`,
      `${copy.paymentLabel}: ${escapeHtml(ticket.payment_status)}`
    ].join("\n"),
    {
      inlineKeyboard: [
        [{ text: copy.showQr, callback_data: `qr:${ticket.ticket_code}` }],
        [{ text: copy.myTickets, callback_data: "my_tickets" }],
        [{ text: copy.openOnSite, url: eventUrl }]
      ],
      removeKeyboard: true
    }
  );
}

async function handleStart(message: TelegramMessage, payload: string | undefined) {
  const user = getTelegramUser(message);

  if (!user) {
    return;
  }

  const supabase = getTelegramSupabaseClient();
  await upsertTelegramUser(supabase, user);
  const storedLanguage = await getTelegramUserLanguage(supabase, user.telegramUserId);
  const language = storedLanguage ?? "uk";
  const eventSlug = parseStartPayload(payload);

  if (!eventSlug) {
    if (!storedLanguage) {
      await showLanguageChoice(user.chatId);
      return;
    }

    await showMainMenu(user.chatId, language);
    return;
  }

  const session = await startSession(supabase, { ...user, language }, eventSlug);

  if (!storedLanguage) {
    await showLanguageChoice(user.chatId);
    return;
  }

  const event = await getEventBySlug(supabase, eventSlug);

  if (!event || !session.event_id) {
    const copy = getTelegramCopy(language);
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
  const language = (await getTelegramUserLanguage(supabase, user.telegramUserId)) ?? "uk";
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
    console.warn("Telegram ticket lookup failed", { telegramUserId, ticketCode });
    await sendTelegramMessage(chatId, copy.ticketNotFound, mainMenuKeyboard(language));
    return;
  }

  const { ticket, event } = ticketRow;
  const eventTitle = event?.title || copy.eventFallback;
  const caption = [
    `<b>${escapeHtml(eventTitle)}</b>`,
    "",
    `${copy.ticketLabel}: ${escapeHtml(ticket.ticket_code)}`,
    `${copy.statusLabel}: ${escapeHtml(ticket.status)}`,
    `${copy.paymentLabel}: ${escapeHtml(ticket.payment_status)}`,
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
        `${copy.statusLabel}: ${escapeHtml(ticket.status)}`,
        `${copy.paymentLabel}: ${escapeHtml(ticket.payment_status)}`,
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
    console.warn("Telegram QR send failed", {
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

  if (data === "lang:uk" || data === "lang:en") {
    const language = data.endsWith("en") ? "en" : "uk";
    await setTelegramUserLanguage(supabase, user.telegramUserId, language);
    await subscribeTelegramUser(supabase, user.telegramUserId);
    await sendTelegramMessage(user.chatId, getTelegramCopy(language).languageSaved);

    const session = await getLatestSession(supabase, user.telegramUserId, user.chatId);
    const event = session?.event_slug ? await getEventBySlug(supabase, session.event_slug) : null;

    if (session && event && session.step === "started") {
      await askForEventConfirmation(user.chatId, session, event, language);
      return;
    }

    await showMainMenu(user.chatId, language);
    return;
  }

  if (data === "change_language") {
    await showLanguageChoice(user.chatId);
    return;
  }

  const language = await getLanguage(user.telegramUserId);
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
    await sendTicketQr(user.chatId, user.telegramUserId, user.telegramUsername, data.slice("qr:".length), language);
    return;
  }

  if (data.startsWith("register:")) {
    const slug = data.slice("register:".length);
    const session = await startSession(supabase, { ...user, language }, slug);
    const event = await getEventBySlug(supabase, slug);

    if (!event) {
      await sendTelegramMessage(user.chatId, copy.eventMissing);
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
      step: "ask_name",
      name: null,
      phone: null,
      position_company: null,
      industry: null,
      registration_id: null,
      ticket_id: null,
      language
    });
    await sendTelegramMessage(user.chatId, copy.askName);
    return;
  }

  const event = session.event_slug ? await getEventBySlug(supabase, session.event_slug) : null;

  if (!event) {
    await sendTelegramMessage(user.chatId, copy.eventMissing);
    return;
  }

  if (data === "confirm_yes") {
    await updateSession(supabase, session.id, { step: "ask_name", language });
    await sendTelegramMessage(user.chatId, copy.askName);
    return;
  }

  if (data === "payment_pending") {
    try {
      await finishPaymentStub(user.chatId, session, language);
    } catch (error) {
      console.warn("Telegram registration/ticket creation failed", {
        telegramUserId: user.telegramUserId,
        sessionId: session.id,
        reason: error instanceof Error ? error.message : "unknown"
      });
      const message = error instanceof Error && error.message.toLowerCase().includes("sold out")
        ? copy.soldOut
        : copy.genericError;
      await sendTelegramMessage(user.chatId, message);
    }
    return;
  }

  await sendTelegramMessage(user.chatId, copy.unknownCommand, mainMenuKeyboard(language));
}

async function handleConversationMessage(message: TelegramMessage) {
  const user = getTelegramUser(message);

  if (!user) {
    return;
  }

  const supabase = getTelegramSupabaseClient();
  await upsertTelegramUser(supabase, user);
  const language = await getLanguage(user.telegramUserId);
  const copy = getTelegramCopy(language);
  const otherCopy = getTelegramCopy(language === "uk" ? "en" : "uk");
  const text = message.text?.trim();
  const legacySearch: string[] = ["Пошук", "Search", "Find event", "Знайти подію"];
  const legacyOpenApp: string[] = ["Додаток", "App", "Open app"];
  const legacyOpenSite: string[] = ["Відкрити сайт", "Open website"];
  const searchCommands: string[] = [copy.search, otherCopy.search, ...legacySearch];
  const ticketCommands: string[] = [copy.myTickets, otherCopy.myTickets];
  const appCommands: string[] = [copy.openApp, otherCopy.openApp, ...legacyOpenApp];
  const siteCommands: string[] = [copy.openSite, otherCopy.openSite, ...legacyOpenSite];
  const languageCommands: string[] = [copy.changeLanguage, otherCopy.changeLanguage, "/language", "/lang"];

  if (text && searchCommands.includes(text)) {
    await sendEventsSearch(user.chatId, language);
    return;
  }

  if (text && ticketCommands.includes(text)) {
    await sendMyTickets(user.chatId, user.telegramUserId, user.telegramUsername, language);
    return;
  }

  if (text && appCommands.includes(text)) {
    await sendTelegramMessage(user.chatId, copy.appSoon, mainMenuKeyboard(language));
    return;
  }

  if (text && siteCommands.includes(text)) {
    await sendTelegramMessage(user.chatId, `${getAppUrl()}/events`, {
      inlineKeyboard: [[{ text: copy.openSite, url: `${getAppUrl()}/events` }]]
    });
    return;
  }

  if (text && languageCommands.includes(text)) {
    await showLanguageChoice(user.chatId);
    return;
  }

  const session = await getLatestSession(supabase, user.telegramUserId, user.chatId);

  if (!session) {
    await showMainMenu(user.chatId, language);
    return;
  }

  if (text === copy.cancel || text === otherCopy.cancel) {
    await updateSession(supabase, session.id, { step: "cancelled", language });
    await sendTelegramMessage(user.chatId, copy.cancelled, { removeKeyboard: true });
    return;
  }

  if (session.step === "ask_name" && text) {
    await updateSession(supabase, session.id, { name: text, step: "ask_phone", language });
    await sendTelegramMessage(user.chatId, copy.askPhone, {
      replyKeyboard: [
        [{ text: copy.shareContact, request_contact: true }],
        [{ text: copy.cancel }]
      ]
    });
    return;
  }

  if (session.step === "ask_phone") {
    const phone = message.contact?.phone_number || text;

    if (phone) {
      await updateSession(supabase, session.id, { phone, step: "ask_position_company", language });
      await sendTelegramMessage(user.chatId, copy.askPositionCompany, { removeKeyboard: true });
      return;
    }

    await sendTelegramMessage(user.chatId, copy.askPhone, {
      replyKeyboard: [
        [{ text: copy.shareContact, request_contact: true }],
        [{ text: copy.cancel }]
      ]
    });
    return;
  }

  if (session.step === "ask_position_company" && text) {
    await updateSession(supabase, session.id, { position_company: text, step: "ask_industry", language });
    await sendTelegramMessage(user.chatId, copy.askIndustry);
    return;
  }

  if (session.step === "ask_industry" && text) {
    const updated = await updateSession(supabase, session.id, { industry: text, step: "summary", language });
    const event = updated.event_slug ? await getEventBySlug(supabase, updated.event_slug) : null;

    if (!event) {
      await sendTelegramMessage(user.chatId, copy.eventMissing);
      return;
    }

    await sendSummary(user.chatId, updated, event, language);
    return;
  }

  await sendTelegramMessage(user.chatId, copy.unknownCommand, mainMenuKeyboard(language));
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
      await handleConversationMessage(message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}
