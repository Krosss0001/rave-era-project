import type { SupabaseClient } from "@supabase/supabase-js";
import { buildQrPayload, generateTicketCode } from "@/lib/tickets";
import { cleanReferralCode, incrementReferralCounters } from "@/lib/referral-tracking";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { BotLanguage } from "@/lib/telegram/messages";
import type { Database } from "@/lib/supabase/types";

export type TelegramStep =
  | "started"
  | "confirm_event"
  | "ask_phone"
  | "ask_name"
  | "ask_instagram"
  | "ask_email"
  | "summary"
  | "registered"
  | "cancelled";

export type TelegramSession = Database["public"]["Tables"]["telegram_registration_sessions"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];

type TelegramUserInput = {
  telegramUserId: string;
  chatId: string;
  telegramUsername: string | null;
  firstName?: string | null;
  lastName?: string | null;
  language?: BotLanguage;
};

function isMissingRow(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

function isUniqueCollision(error: { code?: string } | null) {
  return error?.code === "23505";
}

function isTicketCodeCollision(error: { code?: string; message?: string } | null) {
  return error?.code === "23505" || Boolean(error?.message?.toLowerCase().includes("ticket_code"));
}

function isUndefinedColumn(error: { code?: string } | null) {
  return error?.code === "42703";
}

function logTelegramStateIssue(message: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, details);
  }
}

function logTelegramStateInfo(message: string, details: Record<string, unknown> = {}) {
  console.info(message, details);
}

export function getTelegramSupabaseClient() {
  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service role client is not configured.");
  }

  return supabase;
}

export function parseStartPayloadDetails(value: string | undefined) {
  if (!value) {
    return null;
  }

  const payload = value.trim();
  const eventPayload = payload.startsWith("event_") ? payload.slice("event_".length) : payload;
  const referralMarker = "_ref_";
  const referralIndex = eventPayload.indexOf(referralMarker);
  const slug = (referralIndex >= 0 ? eventPayload.slice(0, referralIndex) : eventPayload).trim();
  const referralCode = referralIndex >= 0 ? eventPayload.slice(referralIndex + referralMarker.length) : null;

  if (!slug) {
    return null;
  }

  return {
    payload,
    slug,
    referralCode: referralCode?.trim() || null
  };
}

export function parseStartPayload(value: string | undefined) {
  return parseStartPayloadDetails(value)?.slug ?? null;
}

export async function getEventBySlug(supabase: SupabaseClient<Database>, slug: string) {
  const { data, error } = await supabase
    .from("events")
    .select("id,slug,title,subtitle,description,date,city,venue,address,price,currency,capacity,status,image_url,organizer_id,organizer_name,organizer_description,organizer_contact,telegram_url,lineup,tags,age_limit,dress_code,doors_open,event_type,ticket_wave_label,urgency_note,referral_enabled,wallet_enabled,created_at")
    .eq("slug", slug)
    .in("status", ["published", "live", "limited", "soon"])
    .maybeSingle();

  if (error && !isMissingRow(error)) {
    throw error;
  }

  return data;
}

export async function getPublicTelegramEvents(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("events")
    .select("id,slug,title,subtitle,description,date,city,venue,address,price,currency,capacity,status,image_url")
    .in("status", ["published", "live", "limited", "soon"])
    .order("date", { ascending: true, nullsFirst: false })
    .limit(8);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function upsertTelegramUser(supabase: SupabaseClient<Database>, user: TelegramUserInput) {
  const { error } = await supabase
    .from("telegram_users")
    .upsert(
      {
        telegram_user_id: user.telegramUserId,
        chat_id: user.chatId,
        username: user.telegramUsername,
        first_name: user.firstName ?? null,
        last_name: user.lastName ?? null,
        ...(user.language ? { language: user.language } : {}),
        updated_at: new Date().toISOString()
      },
      { onConflict: "telegram_user_id" }
    );

  if (error && error.code !== "42P01") {
    if (isUndefinedColumn(error)) {
      const fallback = await supabase
        .from("telegram_users")
        .upsert(
          {
            telegram_user_id: user.telegramUserId,
            chat_id: user.chatId,
            username: user.telegramUsername,
            first_name: user.firstName ?? null,
            last_name: user.lastName ?? null,
            updated_at: new Date().toISOString()
          },
          { onConflict: "telegram_user_id" }
        );

      if (!fallback.error || fallback.error.code === "42P01") {
        return;
      }
    }

    throw error;
  }
}

export async function unsubscribeTelegramUser(supabase: SupabaseClient<Database>, telegramUserId: string) {
  const { error } = await supabase
    .from("telegram_users")
    .update({ is_subscribed: false, updated_at: new Date().toISOString() })
    .eq("telegram_user_id", telegramUserId);

  if (error && error.code !== "42P01" && !isUndefinedColumn(error)) {
    throw error;
  }
}

export async function subscribeTelegramUser(supabase: SupabaseClient<Database>, telegramUserId: string) {
  const { error } = await supabase
    .from("telegram_users")
    .update({ is_subscribed: true, updated_at: new Date().toISOString() })
    .eq("telegram_user_id", telegramUserId);

  if (error && error.code !== "42P01" && !isUndefinedColumn(error)) {
    throw error;
  }
}

export async function getLatestSession(supabase: SupabaseClient<Database>, telegramUserId: string, chatId: string) {
  const { data, error } = await supabase
    .from("telegram_registration_sessions")
    .select("*")
    .eq("telegram_user_id", telegramUserId)
    .eq("chat_id", chatId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && !isMissingRow(error)) {
    throw error;
  }

  return data;
}

export async function startSession(
  supabase: SupabaseClient<Database>,
  user: TelegramUserInput,
  eventSlug: string,
  referralCode?: string | null
) {
  const event = await getEventBySlug(supabase, eventSlug);

  const existing = event
    ? await getSessionByEvent(supabase, user.telegramUserId, user.chatId, event.id)
    : null;

  if (existing) {
    return updateSession(supabase, existing.id, {
      event_id: event?.id ?? existing.event_id,
      event_slug: eventSlug,
      step: "started",
      telegram_username: user.telegramUsername,
      referral_code: referralCode ?? existing.referral_code ?? null,
      ...(user.language ? { language: user.language } : {})
    });
  }

  const { data, error } = await supabase
    .from("telegram_registration_sessions")
    .insert({
      telegram_user_id: user.telegramUserId,
      chat_id: user.chatId,
      event_id: event?.id ?? null,
      event_slug: eventSlug,
      step: "started",
      telegram_username: user.telegramUsername,
      referral_code: referralCode ?? null,
      ...(user.language ? { language: user.language } : {})
    })
    .select("*")
    .single();

  if (error && isUndefinedColumn(error)) {
    const { data: languageFallbackData, error: languageFallbackError } = await supabase
      .from("telegram_registration_sessions")
      .insert({
        telegram_user_id: user.telegramUserId,
        chat_id: user.chatId,
        event_id: event?.id ?? null,
        event_slug: eventSlug,
        step: "started",
        telegram_username: user.telegramUsername,
        referral_code: referralCode ?? null
      })
      .select("*")
      .single();

    if (!languageFallbackError && languageFallbackData) {
      return languageFallbackData;
    }

    if (isUndefinedColumn(languageFallbackError)) {
      const fallback = await supabase
        .from("telegram_registration_sessions")
        .insert({
          telegram_user_id: user.telegramUserId,
          chat_id: user.chatId,
          event_id: event?.id ?? null,
          event_slug: eventSlug,
          step: "started",
          telegram_username: user.telegramUsername
        })
        .select("*")
        .single();

      if (!fallback.error && fallback.data) {
        return fallback.data;
      }
    }
  }

  if (error || !data) {
    throw error || new Error("Telegram session could not be created.");
  }

  return data;
}

export async function getSessionByEvent(
  supabase: SupabaseClient<Database>,
  telegramUserId: string,
  chatId: string,
  eventId: string
) {
  const { data, error } = await supabase
    .from("telegram_registration_sessions")
    .select("*")
    .eq("telegram_user_id", telegramUserId)
    .eq("chat_id", chatId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error && !isMissingRow(error)) {
    throw error;
  }

  return data;
}

export async function updateSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  values: Database["public"]["Tables"]["telegram_registration_sessions"]["Update"]
) {
  const { data, error } = await supabase
    .from("telegram_registration_sessions")
    .update({
      ...values,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error && isUndefinedColumn(error)) {
    const { language: _language, ...languageFallbackValues } = values;
    const languageFallback = await supabase
      .from("telegram_registration_sessions")
      .update({
        ...languageFallbackValues,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .select("*")
      .single();

    if (!languageFallback.error && languageFallback.data) {
      return languageFallback.data;
    }

    if (isUndefinedColumn(languageFallback.error)) {
      const { referral_code: _referralCode, ...fallbackValues } = languageFallbackValues;
      const fallback = await supabase
        .from("telegram_registration_sessions")
        .update({
          ...fallbackValues,
          updated_at: new Date().toISOString()
        })
        .eq("id", sessionId)
        .select("*")
        .single();

      if (!fallback.error && fallback.data) {
        return fallback.data;
      }
    }
  }

  if (error || !data) {
    throw error || new Error("Telegram session could not be updated.");
  }

  return data;
}

async function getRegistrationForSession(supabase: SupabaseClient<Database>, session: TelegramSession) {
  if (session.registration_id) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id,event_id,user_id,status,referral_code")
      .eq("id", session.registration_id)
      .maybeSingle();

    if (data || !error || isMissingRow(error)) {
      return data;
    }
  }

  if (session.event_id && session.telegram_user_id) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id,event_id,user_id,status,referral_code")
      .eq("event_id", session.event_id)
      .eq("telegram_user_id", session.telegram_user_id)
      .maybeSingle();

    if (error && !isMissingRow(error) && !isUndefinedColumn(error)) {
      throw error;
    }

    if (data || !isUndefinedColumn(error)) {
      return data;
    }
  }

  if (session.event_id && session.telegram_username) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id,event_id,user_id,status,referral_code")
      .eq("event_id", session.event_id)
      .eq("telegram_username", session.telegram_username)
      .maybeSingle();

    if (error && !isMissingRow(error)) {
      throw error;
    }

    return data;
  }

  return null;
}

async function getTicketForRegistration(supabase: SupabaseClient<Database>, registrationId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("id,ticket_code,qr_payload,status,payment_status")
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (error && !isMissingRow(error)) {
    throw error;
  }

  return data;
}

type TelegramRegistration = Pick<
  Database["public"]["Tables"]["registrations"]["Row"],
  "id" | "event_id" | "user_id" | "status" | "referral_code"
>;

async function saveRegistrationReferralFromSession(
  supabase: SupabaseClient<Database>,
  registration: TelegramRegistration,
  session: TelegramSession
) {
  const referralCode = cleanReferralCode(session.referral_code);

  if (!session.event_id || !referralCode || registration.referral_code?.trim()) {
    return { registration, saved: false };
  }

  const { data, error } = await supabase
    .from("registrations")
    .update({ referral_code: referralCode })
    .eq("id", registration.id)
    .or("referral_code.is.null,referral_code.eq.")
    .select("id,event_id,user_id,status,referral_code")
    .maybeSingle();

  if (error) {
    if (!isUndefinedColumn(error)) {
      throw error;
    }

    logTelegramStateIssue("Telegram registration referral save skipped because column is missing", {
      eventId: session.event_id,
      referralCode,
      code: error.code
    });
    return { registration, saved: false };
  }

  if (!data) {
    logTelegramStateInfo("Telegram registration referral not overwritten", {
      eventSlug: session.event_slug,
      eventId: session.event_id,
      referralCode,
      registrationId: registration.id
    });
    return { registration, saved: false };
  }

  logTelegramStateInfo("Telegram registration referral saved", {
    eventSlug: session.event_slug,
    eventId: session.event_id,
    referralCode,
    registrationId: data.id
  });

  return { registration: data, saved: true };
}

async function createTicket(supabase: SupabaseClient<Database>, registrationId: string, eventId: string) {
  const existing = await getTicketForRegistration(supabase, registrationId);

  if (existing) {
    return existing;
  }

  let lastError: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ticketCode = generateTicketCode();
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        registration_id: registrationId,
        event_id: eventId,
        user_id: null,
        ticket_code: ticketCode,
        qr_payload: buildQrPayload(ticketCode, eventId, null),
        status: "reserved",
        payment_status: "pending"
      })
      .select("id,ticket_code,qr_payload,status,payment_status")
      .single();

    if (!error && data) {
      return data;
    }

    lastError = error;

    if (isUniqueCollision(error) && !isTicketCodeCollision(error)) {
      const recovered = await getTicketForRegistration(supabase, registrationId);

      if (recovered) {
        logTelegramStateIssue("Telegram ticket insert hit existing registration ticket", {
          registrationId,
          eventId,
          attempt
        });
        return recovered;
      }
    }

    if (!isTicketCodeCollision(error)) {
      logTelegramStateIssue("Telegram ticket insert failed", {
        registrationId,
        eventId,
        attempt,
        code: error?.code,
        reason: error?.message
      });
      break;
    }

    logTelegramStateIssue("Telegram ticket code collision", {
      registrationId,
      eventId,
      attempt
    });
  }

  throw new Error(lastError?.message || "Ticket could not be created.");
}

export async function createPendingRegistrationAndTicket(
  supabase: SupabaseClient<Database>,
  session: TelegramSession
) {
  if (!session.event_id) {
    throw new Error("Telegram session is missing event_id.");
  }

  const existingRegistration = await getRegistrationForSession(supabase, session);
  const insertedRegistration = existingRegistration ? null : await insertRegistration(supabase, session);
  const referralResult = await saveRegistrationReferralFromSession(
    supabase,
    (existingRegistration || insertedRegistration)!,
    session
  );
  const registration = referralResult.registration;
  const ticket = await createTicket(supabase, registration.id, session.event_id);

  if ((!existingRegistration || referralResult.saved) && session.referral_code) {
    await incrementReferralCounters(supabase, session.event_id, session.referral_code, { registrations: 1 }, "telegram_registration");
  }

  await updateSession(supabase, session.id, {
    registration_id: registration.id,
    ticket_id: ticket.id,
    step: "registered"
  });

  return { registration, ticket };
}

export async function confirmFreeRegistrationAndTicket(
  supabase: SupabaseClient<Database>,
  session: TelegramSession
) {
  const { registration, ticket } = await createPendingRegistrationAndTicket(supabase, session);

  const [registrationResult, ticketResult] = await Promise.all([
    supabase
      .from("registrations")
      .update({ status: "confirmed" })
      .eq("id", registration.id)
      .select("id,event_id,user_id,status")
      .single(),
    supabase
      .from("tickets")
      .update({ status: "active", payment_status: "paid" })
      .eq("id", ticket.id)
      .select("id,ticket_code,qr_payload,status,payment_status")
      .single()
  ]);

  if (registrationResult.error) {
    throw registrationResult.error;
  }

  if (ticketResult.error || !ticketResult.data) {
    throw ticketResult.error || new Error("Ticket could not be confirmed.");
  }

  if (session.event_id && session.referral_code) {
    await incrementReferralCounters(
      supabase,
      session.event_id,
      session.referral_code,
      {
        confirmed: registration.status !== "confirmed" ? 1 : 0,
        paid: ticket.payment_status !== "paid" ? 1 : 0
      },
      "telegram_free_registration"
    );
  }

  return {
    registration: registrationResult.data,
    ticket: ticketResult.data
  };
}

async function insertRegistration(supabase: SupabaseClient<Database>, session: TelegramSession) {
  const email = session.industry;
  const instagram = session.position_company;
  const { data, error } = await supabase
    .from("registrations")
    .insert({
      event_id: session.event_id!,
      user_id: null,
      name: session.name,
      email,
      phone: session.phone,
      instagram_nickname: instagram,
      telegram_username: session.telegram_username,
      telegram_user_id: session.telegram_user_id,
      referral_code: session.referral_code ?? null,
      status: "pending"
    })
    .select("id,event_id,user_id,status,referral_code")
    .single();

  if (!error && data) {
    if (data.referral_code) {
      logTelegramStateInfo("Telegram registration referral saved", {
        eventSlug: session.event_slug,
        eventId: session.event_id,
        referralCode: data.referral_code,
        registrationId: data.id
      });
    }

    return data;
  }

  if (isUndefinedColumn(error)) {
    logTelegramStateIssue("Telegram registration insert missing optional contact columns", {
      telegramUserId: session.telegram_user_id,
      eventId: session.event_id,
      code: error?.code
    });

    const fallback = await supabase
      .from("registrations")
      .insert({
        event_id: session.event_id!,
        user_id: null,
        name: session.name,
        email,
        telegram_username: session.telegram_username,
        telegram_user_id: session.telegram_user_id,
        referral_code: session.referral_code ?? null,
        status: "pending"
      })
      .select("id,event_id,user_id,status,referral_code")
      .single();

    if (!fallback.error && fallback.data) {
      if (fallback.data.referral_code) {
        logTelegramStateInfo("Telegram registration referral saved", {
          eventSlug: session.event_slug,
          eventId: session.event_id,
          referralCode: fallback.data.referral_code,
          registrationId: fallback.data.id
        });
      }

      return fallback.data;
    }

    if (isUndefinedColumn(fallback.error)) {
      const referralFallback = await supabase
        .from("registrations")
        .insert({
          event_id: session.event_id!,
          user_id: null,
          name: session.name,
          email,
          telegram_username: session.telegram_username,
          telegram_user_id: session.telegram_user_id,
          status: "pending"
        })
        .select("id,event_id,user_id,status")
        .single();

      if (!referralFallback.error && referralFallback.data) {
        return { ...referralFallback.data, referral_code: null };
      }
    }

    logTelegramStateIssue("Telegram registration fallback insert failed", {
      telegramUserId: session.telegram_user_id,
      eventId: session.event_id,
      code: fallback.error?.code,
      reason: fallback.error?.message
    });
  }

  if (isUniqueCollision(error)) {
    const recovered = await getRegistrationForSession(supabase, session);

    if (recovered) {
      logTelegramStateIssue("Telegram registration insert reused existing registration", {
        telegramUserId: session.telegram_user_id,
        eventId: session.event_id,
        registrationId: recovered.id
      });
      return recovered;
    }
  }

  logTelegramStateIssue("Telegram registration insert failed", {
    telegramUserId: session.telegram_user_id,
    eventId: session.event_id,
    code: error?.code,
    reason: error?.message
  });

  throw new Error(error?.message || "Registration could not be created.");
}

export async function recordTelegramReferralStart(
  supabase: SupabaseClient<Database>,
  eventId: string,
  referralCode: string | null | undefined
) {
  if (!referralCode) {
    return;
  }

  await incrementReferralCounters(supabase, eventId, referralCode, { telegramStarts: 1 }, "telegram");
}

export async function getTicketsForTelegramUser(
  supabase: SupabaseClient<Database>,
  telegramUserId: string,
  telegramUsername: string | null
) {
  const filters = [`telegram_user_id.eq.${telegramUserId}`];

  if (telegramUsername) {
    filters.push(`telegram_username.eq.${telegramUsername}`);
  }

  const linkedProfile = await supabase
    .from("telegram_users")
    .select("profile_id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (!linkedProfile.error && linkedProfile.data?.profile_id) {
    filters.push(`user_id.eq.${linkedProfile.data.profile_id}`);
  }

  const { data, error } = await supabase
    .from("registrations")
    .select(`
      id,
      telegram_user_id,
      telegram_username,
      status,
      events(id,slug,title,date,city,venue),
      tickets(id,ticket_code,qr_payload,status,payment_status,checked_in)
    `)
    .or(filters.join(","))
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getTelegramTicketByCode(
  supabase: SupabaseClient<Database>,
  telegramUserId: string,
  telegramUsername: string | null,
  ticketCode: string
) {
  const rows = await getTicketsForTelegramUser(supabase, telegramUserId, telegramUsername);
  const normalizedCode = ticketCode.trim().toUpperCase();

  for (const row of rows) {
    const tickets = Array.isArray(row.tickets) ? row.tickets : row.tickets ? [row.tickets] : [];
    const ticket = tickets.find((item) => item.ticket_code.toUpperCase() === normalizedCode);

    if (ticket) {
      const event = Array.isArray(row.events) ? row.events[0] : row.events;
      return { registration: row, ticket, event };
    }
  }

  return null;
}
