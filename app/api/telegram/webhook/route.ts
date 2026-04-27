import { NextResponse } from "next/server";
import { answerCallbackQuery, sendTelegramMessage } from "@/lib/telegram/bot";
import {
  TELEGRAM_COPY,
  buildEventConfirmationMessage,
  buildSummaryMessage,
  formatTelegramPrice
} from "@/lib/telegram/messages";
import {
  createPendingRegistrationAndTicket,
  getEventBySlug,
  getLatestSession,
  getTelegramSupabaseClient,
  parseStartPayload,
  startSession,
  updateSession,
  type EventRow,
  type TelegramSession
} from "@/lib/telegram/state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TelegramUser = {
  id: number;
  username?: string;
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
    telegramUsername: from.username ? `@${from.username}` : null
  };
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function getEventUrl(eventSlug: string) {
  return `${getAppUrl()}/events/${eventSlug}`;
}

async function askForEventConfirmation(chatId: string, session: TelegramSession, event: EventRow) {
  await sendTelegramMessage(chatId, buildEventConfirmationMessage(event, getEventUrl(event.slug)), {
    inlineKeyboard: [
      [{ text: TELEGRAM_COPY.yes, callback_data: "confirm_yes" }],
      [{ text: TELEGRAM_COPY.cancel, callback_data: "cancel" }]
    ]
  });
  await updateSession(getTelegramSupabaseClient(), session.id, { step: "confirm_event" });
}

async function sendSummary(chatId: string, session: TelegramSession, event: EventRow) {
  await sendTelegramMessage(
    chatId,
    buildSummaryMessage({
      eventTitle: event.title,
      name: session.name,
      phone: session.phone,
      positionCompany: session.position_company,
      industry: session.industry,
      telegramUsername: session.telegram_username,
      price: formatTelegramPrice(Number(event.price), event.currency)
    }),
    {
      inlineKeyboard: [
        [{ text: TELEGRAM_COPY.payLaterButton, callback_data: "payment_pending" }],
        [{ text: TELEGRAM_COPY.restartButton, callback_data: "restart" }]
      ],
      removeKeyboard: true
    }
  );
}

async function handleStart(message: TelegramMessage, payload: string | undefined) {
  const user = getTelegramUser(message);
  const eventSlug = parseStartPayload(payload);

  if (!user || !eventSlug) {
    await sendTelegramMessage(String(message.chat.id), TELEGRAM_COPY.eventMissing);
    return;
  }

  const supabase = getTelegramSupabaseClient();
  const session = await startSession(supabase, user, eventSlug);

  await sendTelegramMessage(user.chatId, TELEGRAM_COPY.welcome, {
    inlineKeyboard: [[{ text: TELEGRAM_COPY.registerButton, callback_data: "register" }]]
  });

  if (!session.event_id) {
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.eventMissing);
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
  const session = await getLatestSession(supabase, user.telegramUserId, user.chatId);

  if (!session) {
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.eventMissing);
    return;
  }

  if (data === "cancel") {
    await updateSession(supabase, session.id, { step: "cancelled" });
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.cancelled, { removeKeyboard: true });
    return;
  }

  if (data === "restart") {
    await updateSession(supabase, session.id, {
      step: "started",
      name: null,
      phone: null,
      position_company: null,
      industry: null,
      registration_id: null,
      ticket_id: null
    });
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.welcome, {
      inlineKeyboard: [[{ text: TELEGRAM_COPY.registerButton, callback_data: "register" }]]
    });
    return;
  }

  const event = session.event_slug ? await getEventBySlug(supabase, session.event_slug) : null;

  if (!event) {
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.eventMissing);
    return;
  }

  if (data === "register") {
    await askForEventConfirmation(user.chatId, session, event);
    return;
  }

  if (data === "confirm_yes") {
    await updateSession(supabase, session.id, { step: "ask_name" });
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.askName);
    return;
  }

  if (data === "payment_pending") {
    try {
      await createPendingRegistrationAndTicket(supabase, session);
      await sendTelegramMessage(user.chatId, TELEGRAM_COPY.paymentPending, { removeKeyboard: true });
    } catch (error) {
      const message = error instanceof Error && error.message.toLowerCase().includes("sold out")
        ? TELEGRAM_COPY.soldOut
        : TELEGRAM_COPY.genericError;
      await sendTelegramMessage(user.chatId, message);
    }
  }
}

async function handleConversationMessage(message: TelegramMessage) {
  const user = getTelegramUser(message);

  if (!user) {
    return;
  }

  const supabase = getTelegramSupabaseClient();
  const session = await getLatestSession(supabase, user.telegramUserId, user.chatId);

  if (!session) {
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.eventMissing);
    return;
  }

  const text = message.text?.trim();

  if (text === TELEGRAM_COPY.cancel) {
    await updateSession(supabase, session.id, { step: "cancelled" });
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.cancelled, { removeKeyboard: true });
    return;
  }

  if (session.step === "ask_name" && text) {
    await updateSession(supabase, session.id, { name: text, step: "ask_phone" });
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.askPhone, {
      replyKeyboard: [
        [{ text: TELEGRAM_COPY.shareContact, request_contact: true }],
        [{ text: TELEGRAM_COPY.cancel }]
      ]
    });
    return;
  }

  if (session.step === "ask_phone") {
    const phone = message.contact?.phone_number || text;

    if (phone) {
      await updateSession(supabase, session.id, { phone, step: "ask_position_company" });
      await sendTelegramMessage(user.chatId, TELEGRAM_COPY.askPositionCompany, { removeKeyboard: true });
    }
    return;
  }

  if (session.step === "ask_position_company" && text) {
    await updateSession(supabase, session.id, { position_company: text, step: "ask_industry" });
    await sendTelegramMessage(user.chatId, TELEGRAM_COPY.askIndustry);
    return;
  }

  if (session.step === "ask_industry" && text) {
    const updated = await updateSession(supabase, session.id, { industry: text, step: "summary" });
    const event = updated.event_slug ? await getEventBySlug(supabase, updated.event_slug) : null;

    if (!event) {
      await sendTelegramMessage(user.chatId, TELEGRAM_COPY.eventMissing);
      return;
    }

    await sendSummary(user.chatId, updated, event);
  }
}

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;
    const callbackQuery = update.callback_query;

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
    console.error("Telegram webhook error", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}
