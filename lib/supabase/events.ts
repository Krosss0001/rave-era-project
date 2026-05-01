import { events as mockEvents, type RaveeraEvent } from "@/data/events";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { EVENT_BASE_SELECT_FIELDS, EVENT_SELECT_FIELDS } from "@/lib/supabase/event-fields";
import { mapDatabaseEvent } from "@/lib/supabase/event-mapper";
import type { Database, EventStatus } from "@/lib/supabase/types";

type EventRowBase = Database["public"]["Tables"]["events"]["Row"];
type EventRow = Omit<EventRowBase, "manual_registered_override" | "manual_remaining_override" | "stats_note"> &
  Partial<Pick<EventRowBase, "manual_registered_override" | "manual_remaining_override" | "stats_note">>;
type RegistrationStatsRow = Pick<Database["public"]["Tables"]["registrations"]["Row"], "status">;
type TicketStatsRow = Pick<Database["public"]["Tables"]["tickets"]["Row"], "status" | "payment_status" | "checked_in" | "checked_in_at">;

type PublicEventStatsRow = {
  event_id: string;
  total_registrations: number;
  confirmed_registrations: number;
  pending_registrations: number;
  paid_tickets: number;
  reserved_tickets: number;
  active_tickets: number;
  used_tickets: number;
  checked_in_count: number;
};

export type EventDetailStats = {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  paidTickets: number;
  reservedTickets: number;
  activeTickets: number;
  usedTickets: number;
  checkedInCount: number;
  remainingCapacity: number;
  fillPercent: number;
};

const PUBLIC_EVENT_STATUSES: EventStatus[] = ["published", "live", "limited", "soon"];

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function logSafeSupabaseIssue(message: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, details);
  }
}

function isMissingOverrideColumn(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" || message.includes("manual_registered_override") || message.includes("manual_remaining_override") || message.includes("stats_note");
}

async function queryPublicEvents(selectFields: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { data: null, error: null };
  }

  return supabase
    .from("events")
    .select(selectFields)
    .in("status", PUBLIC_EVENT_STATUSES)
    .order("date", { ascending: true, nullsFirst: false });
}

async function queryPublicEventBySlug(slug: string, selectFields: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { data: null, error: null };
  }

  return supabase
    .from("events")
    .select(selectFields)
    .eq("slug", slug)
    .in("status", PUBLIC_EVENT_STATUSES)
    .maybeSingle();
}

export async function getPublicEventsWithFallback(): Promise<RaveeraEvent[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    logSafeSupabaseIssue("Supabase public events fetch skipped: client is not configured.");
    return mockEvents;
  }

  let { data, error } = await queryPublicEvents(EVENT_SELECT_FIELDS);

  if (error && isMissingOverrideColumn(error)) {
    logSafeSupabaseIssue("Supabase public events fetch retried without optional override columns.", {
      code: error.code,
      message: error.message
    });
    const fallbackResult = await queryPublicEvents(EVENT_BASE_SELECT_FIELDS);
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    logSafeSupabaseIssue("Supabase public events fetch failed; using mock fallback.", {
      code: error.code,
      message: error.message
    });
    return mockEvents;
  }

  if (!data || data.length === 0) {
    logSafeSupabaseIssue("Supabase public events query returned zero rows; using mock fallback.");
    return mockEvents;
  }

  const mappedEvents = (data as unknown as EventRow[]).map(mapDatabaseEvent);

  try {
    return await enrichEventsWithStats(mappedEvents);
  } catch (error) {
    logSafeSupabaseIssue("Supabase event stats enrichment failed; showing events with fallback stats.", {
      message: error instanceof Error ? error.message : "unknown"
    });
    return mappedEvents.map((event) => ({
      ...event,
      stats: getFallbackStats(event)
    }));
  }
}

export async function getPublicEventBySlugWithFallback(slug: string): Promise<RaveeraEvent | null> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    let { data, error } = await queryPublicEventBySlug(slug, EVENT_SELECT_FIELDS);

    if (error && isMissingOverrideColumn(error)) {
      logSafeSupabaseIssue("Supabase event detail fetch retried without optional override columns.", {
        slug,
        code: error.code,
        message: error.message
      });
      const fallbackResult = await queryPublicEventBySlug(slug, EVENT_BASE_SELECT_FIELDS);
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (!error && data) {
      return mapDatabaseEvent(data as unknown as EventRow);
    }

    if (error) {
      logSafeSupabaseIssue("Supabase event detail fetch failed; trying mock fallback.", {
        slug,
        code: error.code,
        message: error.message
      });
    }
  }

  return mockEvents.find((event) => event.slug === slug) ?? null;
}

async function enrichEventsWithStats(events: RaveeraEvent[]) {
  const realStatsByEventId = await getPublicEventStatsByEventId(events);

  if (realStatsByEventId) {
    return events.map((event) => {
      const stats = realStatsByEventId.get(event.id) ?? getFallbackStats(event);

      return {
        ...event,
        registered: stats.totalRegistrations,
        stats
      };
    });
  }

  return Promise.all(
    events.map(async (event) => {
      const stats = await getEventDetailStatsWithFallback(event);
      return {
        ...event,
        registered: stats.totalRegistrations,
        stats
      };
    })
  );
}

function getFallbackStats(event: RaveeraEvent): EventDetailStats {
  const totalRegistrations = Math.max(0, event.registered);

  return applyManualStatsOverride(event, {
    totalRegistrations,
    confirmedRegistrations: totalRegistrations,
    pendingRegistrations: 0,
    paidTickets: 0,
    reservedTickets: 0,
    activeTickets: 0,
    usedTickets: 0,
    checkedInCount: 0,
    remainingCapacity: Math.max(0, event.capacity - totalRegistrations),
    fillPercent: event.capacity > 0 ? Math.min(100, Math.round((totalRegistrations / event.capacity) * 100)) : 0
  });
}

export async function getEventDetailStatsWithFallback(event: RaveeraEvent): Promise<EventDetailStats> {
  const fallbackStats = getFallbackStats(event);

  if (!isUuid(event.id)) {
    return fallbackStats;
  }

  const publicStats = await getPublicEventStatsByEventId([event]);

  if (publicStats?.has(event.id)) {
    return publicStats.get(event.id)!;
  }

  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    return fallbackStats;
  }

  const [registrationResult, ticketResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("status")
      .eq("event_id", event.id),
    supabase
      .from("tickets")
      .select("status,payment_status,checked_in,checked_in_at")
      .eq("event_id", event.id)
  ]);

  const registrations = registrationResult.error || !registrationResult.data
    ? null
    : registrationResult.data as RegistrationStatsRow[];
  const tickets = ticketResult.error || !ticketResult.data ? null : ticketResult.data as TicketStatsRow[];

  if (!registrations || !tickets) {
    if (registrationResult.error || ticketResult.error) {
      logSafeSupabaseIssue("Supabase event detail stats fallback query failed; using display fallback stats.", {
        eventId: event.id,
        registrationCode: registrationResult.error?.code,
        ticketCode: ticketResult.error?.code,
        registrationMessage: registrationResult.error?.message,
        ticketMessage: ticketResult.error?.message
      });
    }
    return fallbackStats;
  }

  return calculateEventStats(event, {
    totalRegistrations: registrations.length,
    confirmedRegistrations: registrations.filter((registration) => registration.status === "confirmed").length,
    pendingRegistrations: registrations.filter((registration) => registration.status === "pending").length,
    paidTickets: tickets.filter((ticket) => ticket.payment_status === "paid").length,
    reservedTickets: tickets.filter((ticket) => ticket.status === "reserved").length,
    activeTickets: tickets.filter((ticket) => ticket.status === "active").length,
    usedTickets: tickets.filter((ticket) => ticket.status === "used").length,
    checkedInCount: tickets.filter((ticket) => ticket.checked_in || ticket.checked_in_at || ticket.status === "used").length
  });
}

function calculateEventStats(
  event: RaveeraEvent,
  counts: Omit<EventDetailStats, "remainingCapacity" | "fillPercent">
): EventDetailStats {
  const remainingCapacity = Math.max(0, event.capacity - counts.totalRegistrations);
  const fillPercent = event.capacity > 0
    ? Math.min(100, Math.round((counts.totalRegistrations / event.capacity) * 100))
    : 0;

  return applyManualStatsOverride(event, {
    ...counts,
    remainingCapacity,
    fillPercent
  });
}

function applyManualStatsOverride(event: RaveeraEvent, stats: EventDetailStats): EventDetailStats {
  const hasRegisteredOverride = Number.isFinite(event.manualRegisteredOverride ?? NaN);
  const hasRemainingOverride = Number.isFinite(event.manualRemainingOverride ?? NaN);

  if (!hasRegisteredOverride && !hasRemainingOverride) {
    return stats;
  }

  const totalRegistrations = hasRegisteredOverride
    ? Math.max(0, Number(event.manualRegisteredOverride))
    : stats.totalRegistrations;
  const remainingCapacity = hasRemainingOverride
    ? Math.max(0, Number(event.manualRemainingOverride))
    : Math.max(0, event.capacity - totalRegistrations);
  const fillPercent = event.capacity > 0
    ? Math.min(100, Math.round((totalRegistrations / event.capacity) * 100))
    : 0;

  return {
    ...stats,
    totalRegistrations,
    remainingCapacity,
    fillPercent
  };
}

function mapPublicStatsRow(event: RaveeraEvent, row: PublicEventStatsRow): EventDetailStats {
  return calculateEventStats(event, {
    totalRegistrations: Number(row.total_registrations ?? 0),
    confirmedRegistrations: Number(row.confirmed_registrations ?? 0),
    pendingRegistrations: Number(row.pending_registrations ?? 0),
    paidTickets: Number(row.paid_tickets ?? 0),
    reservedTickets: Number(row.reserved_tickets ?? 0),
    activeTickets: Number(row.active_tickets ?? 0),
    usedTickets: Number(row.used_tickets ?? 0),
    checkedInCount: Number(row.checked_in_count ?? 0)
  });
}

async function getPublicEventStatsByEventId(events: RaveeraEvent[]): Promise<Map<string, EventDetailStats> | null> {
  const eventIds = events.map((event) => event.id).filter(isUuid);

  if (eventIds.length === 0) {
    return null;
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("get_public_event_stats", { event_ids: eventIds });

  if (error || !data) {
    if (error) {
      logSafeSupabaseIssue("Supabase public event stats RPC failed; stats will use fallback path.", {
        code: error.code,
        message: error.message
      });
    }
    return null;
  }

  const eventById = new Map(events.map((event) => [event.id, event]));
  const statsByEventId = new Map<string, EventDetailStats>();

  for (const row of data as PublicEventStatsRow[]) {
    const event = eventById.get(row.event_id);

    if (event) {
      statsByEventId.set(row.event_id, mapPublicStatsRow(event, row));
    }
  }

  return statsByEventId;
}
