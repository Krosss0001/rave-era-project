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

const PUBLIC_EVENT_STATUSES: EventStatus[] = ["published", "live", "limited", "soon"];

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function logPublicEventIssue(message: string, details: Record<string, unknown> = {}) {
  console.warn(message, details);
}

export async function getPublicEventsWithFallback(): Promise<RaveeraEvent[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return mockEvents;
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
      const statsByEventId = await getPublicEventStatsByEventId([event]);
      const stats = statsByEventId?.get(event.id);

      if (stats) {
        return {
          ...event,
          registered: stats.total_registrations,
          stats
        };
      }

      if (statsByEventId) {
        logPublicEventIssue("Public event detail stats map missed event id", { eventId: event.id, slug: event.slug });
      }

      return event;
    }

    return null;
  }

  return mockEvents.find((event) => event.slug === slug) ?? null;
}

async function enrichEventsWithStats(events: RaveeraEvent[]) {
  const realStatsByEventId = await getPublicEventStatsByEventId(events);

  if (realStatsByEventId) {
    return events.map((event) => {
      const stats = realStatsByEventId.get(event.id);

      if (!stats) {
        logPublicEventIssue("Public event stats map missed event id", { eventId: event.id, slug: event.slug });
      }

      const resolvedStats = stats ?? getFallbackEventStats(event);

      return {
        ...event,
        registered: resolvedStats.total_registrations,
        stats: resolvedStats
      };
    });
  }

  return Promise.all(
    events.map(async (event) => {
      const stats = await getEventDetailStatsWithFallback(event);
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

  if (!isUuid(event.id)) {
    logPublicEventIssue("Event stats skipped because event id is not a UUID", { eventId: event.id, slug: event.slug });
    return fallbackStats;
  }

  const publicStats = await getPublicEventStatsByEventId([event]);

  if (publicStats?.has(event.id)) {
    return publicStats.get(event.id)!;
  }

  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    logPublicEventIssue("Event stats fallback unavailable because service role client is not configured", { eventId: event.id, slug: event.slug });
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
    : registrationResult.data as EventStatsRegistrationRow[];
  const tickets = ticketResult.error || !ticketResult.data ? null : ticketResult.data as EventStatsTicketRow[];

  if (!registrations || !tickets) {
    logPublicEventIssue("Event stats fallback query failed", {
      eventId: event.id,
      slug: event.slug,
      registrationReason: registrationResult.error?.message,
      ticketReason: ticketResult.error?.message
    });
    return fallbackStats;
  }

  return calculateEventStatsFromRows(event, registrations, tickets);
}

function normalizeEventId(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function mapPublicStatsRow(event: RaveeraEvent, row: RpcEventStatsRow): EventDetailStats {
  return normalizeRpcEventStats(event, row);
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
    logPublicEventIssue("Public event stats RPC failed", {
      eventIds,
      reason: error?.message ?? "No data returned"
    });
    return null;
  }

  const rows = data as RpcEventStatsRow[];
  const eventById = new Map(events.map((event) => [normalizeEventId(event.id), event]));
  const statsByEventId = new Map<string, EventDetailStats>();

  for (const row of rows) {
    const rowEventId = normalizeEventId(row.event_id ?? row.eventId);
    const event = eventById.get(rowEventId);

    if (event) {
      statsByEventId.set(event.id, mapPublicStatsRow(event, row));
    } else {
      logPublicEventIssue("Public event stats RPC returned a row without a matching event", {
        eventId: row.event_id ?? row.eventId,
        knownEventIds: eventIds
      });
    }
  }

  if (rows.length > 0) {
    for (const event of events) {
      if (isUuid(event.id) && !statsByEventId.has(event.id)) {
        logPublicEventIssue("Public event stats RPC returned rows but no stats were attached to event", {
          eventId: event.id,
          slug: event.slug,
          returnedEventIds: rows.map((row) => row.event_id ?? row.eventId).filter(Boolean)
        });
      }
    }
  }

  return statsByEventId;
}
