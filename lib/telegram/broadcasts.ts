import { createClient } from "@supabase/supabase-js";
import { escapeHtml, type BotLanguage } from "@/lib/telegram/messages";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { BroadcastAudience, Database, UserRole } from "@/lib/supabase/types";

export const EVENT_BROADCAST_AUDIENCES: BroadcastAudience[] = [
  "event_registered",
  "event_confirmed",
  "event_pending_payment",
  "event_paid",
  "event_checked_in"
];

export const BROADCAST_AUDIENCE_LABELS: Record<BroadcastAudience, string> = {
  all_telegram_users: "All Telegram users",
  event_registered: "Event registrations",
  event_confirmed: "Confirmed event registrations",
  event_pending_payment: "Pending payment",
  event_paid: "Paid attendees",
  event_checked_in: "Checked-in attendees",
  bot_interacted_not_registered: "Bot users without registration"
};

export type BroadcastRequest = {
  audience: BroadcastAudience;
  eventId: string | null;
  language: BotLanguage;
  message: string;
};

export type BroadcastEvent = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  "id" | "slug" | "title" | "organizer_id"
>;

export function isEventBroadcastAudience(audience: string): audience is BroadcastAudience {
  return EVENT_BROADCAST_AUDIENCES.includes(audience as BroadcastAudience);
}

function isBroadcastAudience(value: unknown): value is BroadcastAudience {
  return typeof value === "string" && value in BROADCAST_AUDIENCE_LABELS;
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://rave-era-project.vercel.app").replace(/\/+$/, "");
}

export function getEventUrl(event: BroadcastEvent | null) {
  return event ? `${getAppUrl()}/events/${event.slug}` : `${getAppUrl()}/events`;
}

export function parseBroadcastRequest(body: unknown): BroadcastRequest {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const audience = input.audience;
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const language = input.language === "en" ? "en" : "uk";
  const eventId = typeof input.eventId === "string" && input.eventId.trim() ? input.eventId.trim() : null;

  if (!isBroadcastAudience(audience)) {
    throw new Error("audience is required.");
  }

  if (!message) {
    throw new Error("message is required.");
  }

  if (isEventBroadcastAudience(audience) && !eventId) {
    throw new Error("eventId is required for this audience.");
  }

  return {
    audience,
    eventId,
    language,
    message
  };
}

export async function requireBroadcastActor(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw new Error("unauthorized");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }

  const authClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    throw new Error("unauthorized");
  }

  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service role client is not configured.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const role = profile?.role as UserRole | undefined;

  if (role !== "organizer" && role !== "admin" && role !== "superadmin") {
    throw new Error("forbidden");
  }

  return { userId: user.id, role, supabase };
}

export function assertBroadcastAccess(input: {
  userId: string;
  role: UserRole;
  audience: BroadcastAudience;
  event: BroadcastEvent | null;
}) {
  if (input.role === "admin" || input.role === "superadmin") {
    return;
  }

  if (!isEventBroadcastAudience(input.audience) || !input.event) {
    throw new Error("forbidden");
  }

  if (input.event.organizer_id !== input.userId) {
    throw new Error("forbidden");
  }
}

export async function getBroadcastEvent(eventId: string | null) {
  if (!eventId) {
    return null;
  }

  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service role client is not configured.");
  }

  const { data, error } = await supabase
    .from("events")
    .select("id,slug,title,organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("event not found.");
  }

  return data;
}

export function formatBroadcastMessage(input: {
  language: BotLanguage;
  message: string;
  event: BroadcastEvent | null;
}) {
  const title = input.language === "en" ? "Message from Rave'era Group" : "Повідомлення від Rave'era Group";
  const footer = input.language === "en" ? "/stop to unsubscribe" : "/stop щоб відписатися";
  const eventUrl = getEventUrl(input.event);
  const eventLines = input.event
    ? [`<b>${escapeHtml(input.event.title)}</b>`, eventUrl]
    : [eventUrl];

  return [
    `<b>${escapeHtml(title)}</b>`,
    "",
    ...eventLines,
    "",
    escapeHtml(input.message),
    "",
    footer
  ].join("\n");
}

export function getBroadcastAudienceLabel(audience: BroadcastAudience) {
  return BROADCAST_AUDIENCE_LABELS[audience];
}
