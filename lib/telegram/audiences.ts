import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type BroadcastAudience =
  | "all_telegram_users"
  | "event_registered"
  | "event_confirmed"
  | "event_pending_payment"
  | "event_paid"
  | "event_checked_in"
  | "bot_interacted_not_registered";

export type BroadcastRecipient = {
  telegram_user_id: string;
  chat_id: string;
};

export type BroadcastSkippedCounts = {
  emptyChatId: number;
  unsubscribed: number;
  missingTelegramUser: number;
};

export type BroadcastAudienceResolution = {
  recipients: BroadcastRecipient[];
  skipped: BroadcastSkippedCounts;
};

type ResolveBroadcastAudienceInput = {
  audience: BroadcastAudience;
  eventId?: string | null;
};

type TelegramUserRow = Pick<Database["public"]["Tables"]["telegram_users"]["Row"], "telegram_user_id" | "chat_id" | "is_subscribed">;

type RegistrationAudienceRow = Pick<
  Database["public"]["Tables"]["registrations"]["Row"],
  "id" | "event_id" | "telegram_user_id" | "status"
>;

type TicketAudienceRow = Pick<
  Database["public"]["Tables"]["tickets"]["Row"],
  "registration_id" | "event_id" | "payment_status" | "status" | "checked_in" | "checked_in_at"
>;

const PAGE_SIZE = 1000;
const EVENT_AUDIENCES: BroadcastAudience[] = [
  "event_registered",
  "event_confirmed",
  "event_pending_payment",
  "event_paid",
  "event_checked_in"
];

function getBroadcastSupabaseClient() {
  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service role client is not configured.");
  }

  return supabase;
}

function requireEventId(audience: BroadcastAudience, eventId: string | null | undefined) {
  if (EVENT_AUDIENCES.includes(audience) && !eventId) {
    throw new Error(`eventId is required for ${audience}.`);
  }
}

async function getTelegramUsers(supabase: SupabaseClient<Database>) {
  const rows: TelegramUserRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("telegram_users")
      .select("telegram_user_id,chat_id,is_subscribed")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    rows.push(...((data ?? []) as TelegramUserRow[]));

    if (!data || data.length < PAGE_SIZE) {
      return rows;
    }
  }
}

async function getRegistrations(
  supabase: SupabaseClient<Database>,
  eventId: string | null | undefined
) {
  const rows: RegistrationAudienceRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from("registrations")
      .select("id,event_id,telegram_user_id,status")
      .not("telegram_user_id", "is", null)
      .range(from, from + PAGE_SIZE - 1);

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    rows.push(...((data ?? []) as RegistrationAudienceRow[]));

    if (!data || data.length < PAGE_SIZE) {
      return rows;
    }
  }
}

async function getEventTickets(supabase: SupabaseClient<Database>, eventId: string) {
  const rows: TicketAudienceRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("tickets")
      .select("registration_id,event_id,payment_status,status,checked_in,checked_in_at")
      .eq("event_id", eventId)
      .not("registration_id", "is", null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    rows.push(...((data ?? []) as TicketAudienceRow[]));

    if (!data || data.length < PAGE_SIZE) {
      return rows;
    }
  }
}

function dedupeByChatId(users: TelegramUserRow[], allowedTelegramUserIds: Set<string> | null): BroadcastAudienceResolution {
  const recipients = new Map<string, BroadcastRecipient>();
  const seenTelegramUserIds = new Set<string>();
  const skipped: BroadcastSkippedCounts = {
    emptyChatId: 0,
    unsubscribed: 0,
    missingTelegramUser: 0
  };

  for (const user of users) {
    if (allowedTelegramUserIds && !allowedTelegramUserIds.has(user.telegram_user_id)) {
      continue;
    }

    seenTelegramUserIds.add(user.telegram_user_id);

    if (!user.is_subscribed) {
      skipped.unsubscribed += 1;
      continue;
    }

    const chatId = user.chat_id?.trim();

    if (!chatId) {
      skipped.emptyChatId += 1;
      continue;
    }

    if (!recipients.has(chatId)) {
      recipients.set(chatId, {
        telegram_user_id: user.telegram_user_id,
        chat_id: chatId
      });
    }
  }

  if (allowedTelegramUserIds) {
    for (const telegramUserId of Array.from(allowedTelegramUserIds)) {
      if (!seenTelegramUserIds.has(telegramUserId)) {
        skipped.missingTelegramUser += 1;
      }
    }
  }

  return {
    recipients: Array.from(recipients.values()),
    skipped
  };
}

function getTicketMatchedRegistrationIds(
  tickets: TicketAudienceRow[],
  predicate: (ticket: TicketAudienceRow) => boolean
) {
  return new Set(
    tickets
      .filter((ticket) => ticket.registration_id && predicate(ticket))
      .map((ticket) => ticket.registration_id!)
  );
}

export async function resolveBroadcastAudience({
  audience,
  eventId
}: ResolveBroadcastAudienceInput): Promise<BroadcastAudienceResolution> {
  requireEventId(audience, eventId);

  const supabase = getBroadcastSupabaseClient();
  const users = await getTelegramUsers(supabase);

  if (audience === "all_telegram_users") {
    return dedupeByChatId(users, null);
  }

  const registrations = await getRegistrations(
    supabase,
    audience === "bot_interacted_not_registered" ? eventId : eventId!
  );

  if (audience === "bot_interacted_not_registered") {
    const registeredTelegramUserIds = new Set(
      registrations
        .filter((registration) => registration.status !== "cancelled")
        .map((registration) => registration.telegram_user_id)
        .filter(Boolean) as string[]
    );

    return dedupeByChatId(users, new Set(users.map((user) => user.telegram_user_id).filter((id) => !registeredTelegramUserIds.has(id))));
  }

  const activeRegistrations = registrations.filter((registration) => registration.status !== "cancelled");
  let allowedTelegramUserIds: Set<string>;

  if (audience === "event_registered") {
    allowedTelegramUserIds = new Set(
      activeRegistrations.map((registration) => registration.telegram_user_id).filter(Boolean) as string[]
    );
    return dedupeByChatId(users, allowedTelegramUserIds);
  }

  if (audience === "event_confirmed") {
    allowedTelegramUserIds = new Set(
      activeRegistrations
        .filter((registration) => registration.status === "confirmed")
        .map((registration) => registration.telegram_user_id)
        .filter(Boolean) as string[]
    );
    return dedupeByChatId(users, allowedTelegramUserIds);
  }

  const tickets = await getEventTickets(supabase, eventId!);
  const registrationById = new Map(activeRegistrations.map((registration) => [registration.id, registration]));
  let matchedRegistrationIds: Set<string>;

  if (audience === "event_pending_payment") {
    matchedRegistrationIds = getTicketMatchedRegistrationIds(
      tickets,
      (ticket) => ticket.payment_status === "pending"
    );

    allowedTelegramUserIds = new Set(
      activeRegistrations
        .filter((registration) => registration.status === "pending" || matchedRegistrationIds.has(registration.id))
        .map((registration) => registration.telegram_user_id)
        .filter(Boolean) as string[]
    );
    return dedupeByChatId(users, allowedTelegramUserIds);
  }

  matchedRegistrationIds = getTicketMatchedRegistrationIds(
    tickets,
    audience === "event_paid"
      ? (ticket) => ticket.payment_status === "paid"
      : (ticket) => ticket.checked_in || ticket.status === "used" || ticket.checked_in_at !== null
  );

  allowedTelegramUserIds = new Set(
    Array.from(matchedRegistrationIds)
      .map((registrationId) => registrationById.get(registrationId)?.telegram_user_id)
      .filter(Boolean) as string[]
  );

  return dedupeByChatId(users, allowedTelegramUserIds);
}
