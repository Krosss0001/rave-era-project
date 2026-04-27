import { events as mockEvents, type RaveeraEvent } from "@/data/events";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EVENT_SELECT_FIELDS } from "@/lib/supabase/event-fields";
import { mapDatabaseEvent } from "@/lib/supabase/event-mapper";
import type { Database, EventStatus } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const PUBLIC_EVENT_STATUSES: EventStatus[] = ["live", "limited", "soon"];

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

  return (data as unknown as EventRow[]).map(mapDatabaseEvent);
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
