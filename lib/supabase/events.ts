import { events as mockEvents, type RaveeraEvent } from "@/data/events";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { EVENT_SELECT_FIELDS } from "@/lib/supabase/event-fields";
import { mapDatabaseEvent } from "@/lib/supabase/event-mapper";
import type { Database, EventStatus } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type RegistrationStatsRow = Pick<Database["public"]["Tables"]["registrations"]["Row"], "status">;
type TicketStatsRow = Pick<Database["public"]["Tables"]["tickets"]["Row"], "status" | "payment_status" | "checked_in">;

export type EventDetailStats = {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  paidTickets: number;
  reservedTickets: number;
  activeTickets: number;
  usedTickets: number;
  checkedInCount: number;
  capacityFillPercent: number;
};

const PUBLIC_EVENT_STATUSES: EventStatus[] = ["published", "live", "limited", "soon"];

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
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

  if (error || !data || data.length === 0) {
    return mockEvents;
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

    if (!error && data) {
      return mapDatabaseEvent(data as unknown as EventRow);
    }
  }

  return mockEvents.find((event) => event.slug === slug) ?? null;
}

async function enrichEventsWithStats(events: RaveeraEvent[]) {
  return Promise.all(
    events.map(async (event) => {
      const stats = await getEventDetailStatsWithFallback(event);
      return {
        ...event,
        registered: stats.totalRegistrations
      };
    })
  );
}

export async function getEventDetailStatsWithFallback(event: RaveeraEvent): Promise<EventDetailStats> {
  const fallbackStats: EventDetailStats = {
    totalRegistrations: event.registered,
    confirmedRegistrations: event.registered,
    pendingRegistrations: 0,
    paidTickets: 0,
    reservedTickets: 0,
    activeTickets: 0,
    usedTickets: 0,
    checkedInCount: 0,
    capacityFillPercent: event.capacity > 0 ? Math.min(100, Math.round((event.registered / event.capacity) * 100)) : 0
  };
  const supabase = getSupabaseServiceRoleClient() ?? getSupabaseServerClient();

  if (!supabase || !isUuid(event.id)) {
    return fallbackStats;
  }

  const [registrationResult, ticketResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("status")
      .eq("event_id", event.id),
    supabase
      .from("tickets")
      .select("status,payment_status,checked_in")
      .eq("event_id", event.id)
  ]);

  if (registrationResult.error || ticketResult.error || !registrationResult.data || !ticketResult.data) {
    return fallbackStats;
  }

  const registrations = (registrationResult.data as RegistrationStatsRow[]).filter((registration) => registration.status !== "cancelled");
  const tickets = ticketResult.data as TicketStatsRow[];
  const totalRegistrations = registrations.length;

  return {
    totalRegistrations,
    confirmedRegistrations: registrations.filter((registration) => registration.status === "confirmed").length,
    pendingRegistrations: registrations.filter((registration) => registration.status === "pending").length,
    paidTickets: tickets.filter((ticket) => ticket.payment_status === "paid").length,
    reservedTickets: tickets.filter((ticket) => ticket.status === "reserved").length,
    activeTickets: tickets.filter((ticket) => ticket.status === "active").length,
    usedTickets: tickets.filter((ticket) => ticket.status === "used").length,
    checkedInCount: tickets.filter((ticket) => ticket.checked_in || ticket.status === "used").length,
    capacityFillPercent: event.capacity > 0 ? Math.min(100, Math.round((totalRegistrations / event.capacity) * 100)) : 0
  };
}
