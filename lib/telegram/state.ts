import type { SupabaseClient } from "@supabase/supabase-js";
import { buildQrPayload, generateTicketCode } from "@/lib/tickets";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type TelegramStep =
  | "started"
  | "confirm_event"
  | "ask_name"
  | "ask_phone"
  | "ask_position_company"
  | "ask_industry"
  | "summary"
  | "payment_pending"
  | "cancelled";

export type TelegramSession = Database["public"]["Tables"]["telegram_registration_sessions"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];

type TelegramUserInput = {
  telegramUserId: string;
  chatId: string;
  telegramUsername: string | null;
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

export function getTelegramSupabaseClient() {
  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service role client is not configured.");
  }

  return supabase;
}

export function parseStartPayload(value: string | undefined) {
  if (!value) {
    return null;
  }

  const payload = value.trim();
  const eventPayload = payload.startsWith("event_") ? payload.slice("event_".length) : payload;
  const [slug] = eventPayload.split("_ref_");

  return slug || null;
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
  eventSlug: string
) {
  const event = await getEventBySlug(supabase, eventSlug);

  const existing = event
    ? await getSessionByEvent(supabase, user.telegramUserId, user.chatId, event.id)
    : null;

  if (existing) {
    return updateSession(supabase, existing.id, {
      event_slug: eventSlug,
      step: "started",
      telegram_username: user.telegramUsername
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
      telegram_username: user.telegramUsername
    })
    .select("*")
    .single();

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

  if (error || !data) {
    throw error || new Error("Telegram session could not be updated.");
  }

  return data;
}

async function getRegistrationForSession(supabase: SupabaseClient<Database>, session: TelegramSession) {
  if (session.registration_id) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id,event_id,user_id,status")
      .eq("id", session.registration_id)
      .maybeSingle();

    if (data || !error || isMissingRow(error)) {
      return data;
    }
  }

  if (session.event_id && session.telegram_username) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id,event_id,user_id,status")
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
    .select("id,ticket_code,status,payment_status")
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (error && !isMissingRow(error)) {
    throw error;
  }

  return data;
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
      .select("id,ticket_code,status,payment_status")
      .single();

    if (!error && data) {
      return data;
    }

    lastError = error;

    if (isUniqueCollision(error) && !isTicketCodeCollision(error)) {
      const recovered = await getTicketForRegistration(supabase, registrationId);

      if (recovered) {
        return recovered;
      }
    }

    if (!isTicketCodeCollision(error)) {
      break;
    }
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
  const registration = existingRegistration || (await insertRegistration(supabase, session));
  const ticket = await createTicket(supabase, registration.id, session.event_id);

  await updateSession(supabase, session.id, {
    registration_id: registration.id,
    ticket_id: ticket.id,
    step: "payment_pending"
  });

  return { registration, ticket };
}

async function insertRegistration(supabase: SupabaseClient<Database>, session: TelegramSession) {
  const { data, error } = await supabase
    .from("registrations")
    .insert({
      event_id: session.event_id!,
      user_id: null,
      name: session.name,
      email: null,
      telegram_username: session.telegram_username,
      status: "pending"
    })
    .select("id,event_id,user_id,status")
    .single();

  if (!error && data) {
    return data;
  }

  if (isUniqueCollision(error)) {
    const recovered = await getRegistrationForSession(supabase, session);

    if (recovered) {
      return recovered;
    }
  }

  throw new Error(error?.message || "Registration could not be created.");
}
