import { events as mockEvents, type RaveeraEvent } from "@/data/events";
import type { Database, EventStatus } from "@/lib/supabase/types";

type EventRowBase = Database["public"]["Tables"]["events"]["Row"];
type EventRow = Omit<EventRowBase, "manual_registered_override" | "manual_remaining_override" | "stats_note"> &
  Partial<Pick<EventRowBase, "manual_registered_override" | "manual_remaining_override" | "stats_note">>;

function getDateParts(value: string | null) {
  if (!value) {
    return { date: "", time: "TBA" };
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return { date: value.slice(0, 10), time: "TBA" };
  }

  return {
    date: parsed.toISOString().slice(0, 10),
    time: parsed.toISOString().slice(11, 16)
  };
}

function normalizeStatus(status: EventStatus): RaveeraEvent["status"] {
  if (status === "limited" || status === "soon") {
    return status;
  }

  return "live";
}

function parseList(value: string | null | undefined, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

export function mapDatabaseEvent(row: EventRow): RaveeraEvent {
  const fallback = mockEvents.find((event) => event.slug === row.slug);
  const dateParts = getDateParts(row.date);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || fallback?.subtitle || "A curated Rave'era event with Telegram-supported access.",
    description: row.description || fallback?.description || "Premium event experience powered by Rave'era's ticketing, growth, and operations system.",
    date: dateParts.date || fallback?.date || new Date().toISOString().slice(0, 10),
    time: dateParts.time !== "TBA" ? dateParts.time : fallback?.time || "TBA",
    city: row.city || fallback?.city || "TBA",
    venue: row.venue || fallback?.venue || "Location pending",
    address: row.address || fallback?.address || "Location revealed after confirmation",
    image: row.image_url || fallback?.image || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=85",
    price: Number(row.price),
    currency: row.currency || fallback?.currency || "UAH",
    capacity: Math.max(row.capacity, fallback?.capacity ?? 1),
    registered: fallback?.registered ?? 0,
    manualRegisteredOverride: row.manual_registered_override ?? null,
    manualRemainingOverride: row.manual_remaining_override ?? null,
    statsNote: row.stats_note ?? null,
    status: normalizeStatus(row.status),
    tags: parseList(row.tags, fallback?.tags || ["Event", "Telegram", "Rave'era"]),
    lineup: parseList(row.lineup, fallback?.lineup || ["Rave'era Residents"]),
    organizerId: row.organizer_id || fallback?.organizerId || "org-raveera",
    featured: fallback?.featured ?? false,
    referralBaseUrl: `/events/${row.slug}`,
    organizerName: row.organizer_name || fallback?.organizerName,
    organizerDescription: row.organizer_description || fallback?.organizerDescription,
    organizerContact: row.organizer_contact || fallback?.organizerContact,
    telegramUrl: row.telegram_url || fallback?.telegramUrl,
    ageLimit: row.age_limit || fallback?.ageLimit,
    dressCode: row.dress_code || fallback?.dressCode,
    doorsOpen: row.doors_open || fallback?.doorsOpen,
    eventType: row.event_type || fallback?.eventType,
    ticketWaveLabel: row.ticket_wave_label || fallback?.ticketWaveLabel,
    urgencyNote: row.urgency_note || fallback?.urgencyNote,
    referralEnabled: row.referral_enabled ?? fallback?.referralEnabled ?? true,
    walletEnabled: row.wallet_enabled ?? fallback?.walletEnabled ?? true
  };
}
