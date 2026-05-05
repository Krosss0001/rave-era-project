import { events as mockEvents, type RaveeraEvent } from "@/data/events";
import {
  calculateEventStatsFromRows,
  getFallbackEventStats,
  normalizeRpcEventStats,
  type EventDetailStats,
  type EventStatsRegistrationRow,
  type EventStatsTicketRow,
  type RpcEventStatsRow
} from "@/lib/event-stats";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { EVENT_SELECT_FIELDS } from "@/lib/supabase/event-fields";
import { mapDatabaseEvent } from "@/lib/supabase/event-mapper";
import type { Database, EventStatus } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ServiceRegistrationStatsRow = Pick<Database["public"]["Tables"]["registrations"]["Row"], "id" | "status">;

const PUBLIC_EVENT_STATUSES: EventStatus[] = ["published", "live", "limited", "soon"];

function normalizeEventId(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEventIdKey(value: unknown) {
  return normalizeEventId(value).toLowerCase();
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizeEventId(value));
}

function logPublicEventIssue(message: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, details);
  }
}

function shouldUseMockEvents() {
  return process.env.NODE_ENV !== "production";
}

function getSupabaseProjectRef() {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "missing";
  } catch {
    return "invalid";
  }
}

export async function getPublicEventsWithFallback(): Promise<RaveeraEvent[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return shouldUseMockEvents() ? mockEvents : [];
  }

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .in("status", PUBLIC_EVENT_STATUSES)
    .order("date", { ascending: true, nullsFirst: false });

  if (error) {
    logPublicEventIssue("Public events query failed", { reason: error.message });
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const mappedEvents = (data as unknown as EventRow[]).map(mapDatabaseEvent);
  return enrichEventsWithStats(mappedEvents);
}

export async function getPublicEventBySlugWithFallback(slug: string): Promise<RaveeraEvent | null> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_SELECT_FIELDS)
      .eq("slug", slug)
      .in("status", PUBLIC_EVENT_STATUSES)
      .maybeSingle();

    if (error) {
      logPublicEventIssue("Public event detail query failed", { slug, reason: error.message });
      return null;
    }

    if (data) {
      const event = mapDatabaseEvent(data as unknown as EventRow);
      const eventId = normalizeEventId(event.id);
      const statsByEventId = await getPublicEventStatsByEventId([event]);
      const stats = statsByEventId?.get(eventId);

      if (stats) {
        return {
          ...event,
          registered: stats.total_registrations,
          stats
        };
      }

      if (statsByEventId) {
        logPublicEventIssue("Public event detail stats map missed event id", { eventId, slug: event.slug });
      }

      const fallbackStats = await getEventStatsFromServiceRole(event, "detail RPC returned no attachable stats");

      return {
        ...event,
        registered: fallbackStats.total_registrations,
        stats: fallbackStats
      };
    }

    return null;
  }

  return shouldUseMockEvents() ? mockEvents.find((event) => event.slug === slug) ?? null : null;
}

async function enrichEventsWithStats(events: RaveeraEvent[]) {
  const realStatsByEventId = await getPublicEventStatsByEventId(events);

  if (realStatsByEventId && realStatsByEventId.size > 0) {
    return Promise.all(events.map(async (event) => {
      const eventId = normalizeEventId(event.id);
      const stats = realStatsByEventId.get(eventId);

      if (!stats) {
        logPublicEventIssue("Public event stats map missed event id", { eventId, slug: event.slug });
      }

      const resolvedStats = stats ?? await getEventStatsFromServiceRole(event, "list RPC missed event id");

      return {
        ...event,
        registered: resolvedStats.total_registrations,
        stats: resolvedStats
      };
    }));
  }

  if (realStatsByEventId && realStatsByEventId.size === 0) {
    logPublicEventIssue("Public event stats RPC returned no attachable stats; using per-event server fallback", {
      eventIds: events.map((event) => normalizeEventId(event.id)),
      slugs: events.map((event) => event.slug),
      supabaseProject: getSupabaseProjectRef()
    });
  }

  return Promise.all(
    events.map(async (event) => {
      const stats = await getEventStatsFromServiceRole(event, "list RPC returned empty/error/no attachable stats");
      return {
        ...event,
        registered: stats.total_registrations,
        stats
      };
    })
  );
}

export async function getEventDetailStatsWithFallback(event: RaveeraEvent): Promise<EventDetailStats> {
  const fallbackStats = event.stats ?? getFallbackEventStats(event);
  const eventId = normalizeEventId(event.id);

  if (!isUuid(eventId)) {
    logPublicEventIssue("Event stats skipped because event id is not a UUID", { eventId, slug: event.slug });
    return fallbackStats;
  }

  const publicStats = await getPublicEventStatsByEventId([event]);

  if (publicStats?.has(eventId)) {
    return publicStats.get(eventId)!;
  }

  return getEventStatsFromServiceRole(event, "detail RPC returned empty/error/no attachable stats");
}

async function getEventStatsFromServiceRole(event: RaveeraEvent, reason: string): Promise<EventDetailStats> {
  const fallbackStats = event.stats ?? getFallbackEventStats(event);
  const eventId = normalizeEventId(event.id);

  if (!isUuid(eventId)) {
    logPublicEventIssue("Event stats service fallback skipped because event id is not a UUID", { eventId, slug: event.slug });
    return fallbackStats;
  }

  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    logPublicEventIssue("Event stats fallback unavailable because service role client is not configured", { eventId, slug: event.slug });
    return fallbackStats;
  }

  logPublicEventIssue("RPC stats failed, using service fallback", { eventId, slug: event.slug, reason });

  const registrationResult = await supabase
    .from("registrations")
    .select("id,status")
    .eq("event_id", eventId);

  const registrations = registrationResult.error || !registrationResult.data
    ? null
    : registrationResult.data as ServiceRegistrationStatsRow[];

  if (!registrations) {
    logPublicEventIssue("Event stats service fallback registration query failed", {
      eventId,
      slug: event.slug,
      registrationReason: registrationResult.error?.message
    });
    return fallbackStats;
  }

  const registrationIds = registrations.map((registration) => registration.id);
  const ticketResult = registrationIds.length > 0
    ? await supabase
        .from("tickets")
        .select("status,payment_status,checked_in,checked_in_at")
        .in("registration_id", registrationIds)
    : { data: [] };

  const ticketError = "error" in ticketResult ? ticketResult.error : null;
  const tickets = ticketError || !ticketResult.data ? null : ticketResult.data as EventStatsTicketRow[];

  if (!tickets) {
    logPublicEventIssue("Event stats fallback query failed", {
      eventId,
      slug: event.slug,
      ticketReason: ticketError?.message
    });
    return fallbackStats;
  }

  const fallbackStatsFromRows = calculateEventStatsFromRows(event, registrations as EventStatsRegistrationRow[], tickets);

  return fallbackStatsFromRows;
}

function mapPublicStatsRow(event: RaveeraEvent, row: RpcEventStatsRow): EventDetailStats {
  return normalizeRpcEventStats(event, row);
}

async function getPublicEventStatsByEventId(events: RaveeraEvent[]): Promise<Map<string, EventDetailStats> | null> {
  const eventIds = events.map((event) => normalizeEventId(event.id)).filter(isUuid);

  if (eventIds.length === 0) {
    logPublicEventIssue("Public event stats RPC skipped because no UUID event ids were available", {
      eventIds: events.map((event) => normalizeEventId(event.id)),
      slugs: events.map((event) => event.slug),
      supabaseProject: getSupabaseProjectRef()
    });
    return null;
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    logPublicEventIssue("Public event stats RPC skipped because Supabase anon client is not configured", {
      eventIds,
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    });
    return null;
  }

  const { data, error } = await supabase.rpc("get_public_event_stats", { event_ids: eventIds });

  if (error || !data) {
    logPublicEventIssue("Public event stats RPC failed", {
      eventIds,
      reason: error?.message ?? "No data returned"
    });
    return null;
  }

  const rows = data as RpcEventStatsRow[];
  const eventById = new Map(events.map((event) => [normalizeEventIdKey(event.id), event]));
  const statsByEventId = new Map<string, EventDetailStats>();

  for (const row of rows) {
    const rowEventId = normalizeEventIdKey(row.event_id ?? row.eventId);
    const event = eventById.get(rowEventId);

    if (event) {
      statsByEventId.set(normalizeEventId(event.id), mapPublicStatsRow(event, row));
    } else {
      logPublicEventIssue("Public event stats RPC returned a row without a matching event", {
        eventId: row.event_id ?? row.eventId,
        knownEventIds: eventIds
      });
    }
  }

  if (rows.length > 0) {
    for (const event of events) {
      const eventId = normalizeEventId(event.id);

      if (isUuid(eventId) && !statsByEventId.has(eventId)) {
        logPublicEventIssue("Public event stats RPC returned rows but no stats were attached to event", {
          eventId,
          slug: event.slug,
          returnedEventIds: rows.map((row) => row.event_id ?? row.eventId).filter(Boolean)
        });
      }
    }
  }

  return statsByEventId;
}
