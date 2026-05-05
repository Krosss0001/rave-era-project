import { events as mockEvents, type RaveeraEvent } from "@/data/events";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { EVENT_SELECT_FIELDS } from "@/lib/supabase/event-fields";
import { mapDatabaseEvent } from "@/lib/supabase/event-mapper";
import type { Database, EventStatus } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
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

function logPublicEventIssue(message: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, details);
  }
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
      return mapDatabaseEvent(data as unknown as EventRow);
    }

    return null;
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

  return {
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
  };
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

  return {
    ...counts,
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
