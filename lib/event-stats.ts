import type { RaveeraEvent } from "@/data/events";
import type { Database } from "@/lib/supabase/types";

export type EventStatsRegistrationRow = Pick<Database["public"]["Tables"]["registrations"]["Row"], "status">;
export type EventStatsTicketRow = Pick<
  Database["public"]["Tables"]["tickets"]["Row"],
  "status" | "payment_status" | "checked_in" | "checked_in_at"
>;

export type EventDetailStats = {
  total_registrations: number;
  confirmed_registrations: number;
  pending_registrations: number;
  paid_tickets: number;
  reserved_tickets: number;
  active_tickets: number;
  used_tickets: number;
  checked_in_count: number;
  remaining_capacity: number;
  fill_percent: number;
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

export type EventStatsCounts = EventStatsCountInput;
export type EventStatsCountInput = {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  paidTickets: number;
  reservedTickets: number;
  activeTickets: number;
  usedTickets: number;
  checkedInCount: number;
};
export type RpcEventStatsRow = Partial<{
  event_id: string;
  eventId: string;
  total_registrations: number | string | null;
  confirmed_registrations: number | string | null;
  pending_registrations: number | string | null;
  paid_tickets: number | string | null;
  reserved_tickets: number | string | null;
  active_tickets: number | string | null;
  used_tickets: number | string | null;
  checked_in_count: number | string | null;
  remaining_capacity: number | string | null;
  fill_percent: number | string | null;
  totalRegistrations: number | string | null;
  confirmedRegistrations: number | string | null;
  pendingRegistrations: number | string | null;
  paidTickets: number | string | null;
  reservedTickets: number | string | null;
  activeTickets: number | string | null;
  usedTickets: number | string | null;
  checkedInCount: number | string | null;
  remainingCapacity: number | string | null;
  fillPercent: number | string | null;
}>;

function isFreeEvent(event: Pick<RaveeraEvent, "price">) {
  return Number(event.price) <= 0;
}

export function calculateEventStats(
  event: Pick<RaveeraEvent, "capacity">,
  counts: EventStatsCountInput
): EventDetailStats {
  const remainingCapacity = Math.max(0, event.capacity - counts.totalRegistrations);
  const fillPercent = event.capacity > 0
    ? Math.min(100, Math.round((counts.totalRegistrations / event.capacity) * 100))
    : 0;

  return {
    total_registrations: counts.totalRegistrations,
    confirmed_registrations: counts.confirmedRegistrations,
    pending_registrations: counts.pendingRegistrations,
    paid_tickets: counts.paidTickets,
    reserved_tickets: counts.reservedTickets,
    active_tickets: counts.activeTickets,
    used_tickets: counts.usedTickets,
    checked_in_count: counts.checkedInCount,
    remaining_capacity: remainingCapacity,
    fill_percent: fillPercent,
    totalRegistrations: counts.totalRegistrations,
    confirmedRegistrations: counts.confirmedRegistrations,
    pendingRegistrations: counts.pendingRegistrations,
    paidTickets: counts.paidTickets,
    reservedTickets: counts.reservedTickets,
    activeTickets: counts.activeTickets,
    usedTickets: counts.usedTickets,
    checkedInCount: counts.checkedInCount,
    remainingCapacity,
    fillPercent
  };
}

function toCount(value: number | string | null | undefined) {
  const count = Number(value ?? 0);

  return Number.isFinite(count) ? count : 0;
}

export function normalizeRpcEventStats(
  event: Pick<RaveeraEvent, "capacity">,
  row: RpcEventStatsRow
): EventDetailStats {
  const totalRegistrations = toCount(row.total_registrations ?? row.totalRegistrations);
  const remainingCapacity = row.remaining_capacity ?? row.remainingCapacity;
  const fillPercent = row.fill_percent ?? row.fillPercent;

  if (remainingCapacity !== null && remainingCapacity !== undefined && fillPercent !== null && fillPercent !== undefined) {
    const normalizedRemainingCapacity = toCount(remainingCapacity);
    const normalizedFillPercent = Math.max(0, Math.min(100, toCount(fillPercent)));
    const counts = {
      totalRegistrations,
      confirmedRegistrations: toCount(row.confirmed_registrations ?? row.confirmedRegistrations),
      pendingRegistrations: toCount(row.pending_registrations ?? row.pendingRegistrations),
      paidTickets: toCount(row.paid_tickets ?? row.paidTickets),
      reservedTickets: toCount(row.reserved_tickets ?? row.reservedTickets),
      activeTickets: toCount(row.active_tickets ?? row.activeTickets),
      usedTickets: toCount(row.used_tickets ?? row.usedTickets),
      checkedInCount: toCount(row.checked_in_count ?? row.checkedInCount)
    };

    return {
      total_registrations: counts.totalRegistrations,
      confirmed_registrations: counts.confirmedRegistrations,
      pending_registrations: counts.pendingRegistrations,
      paid_tickets: counts.paidTickets,
      reserved_tickets: counts.reservedTickets,
      active_tickets: counts.activeTickets,
      used_tickets: counts.usedTickets,
      checked_in_count: counts.checkedInCount,
      remaining_capacity: normalizedRemainingCapacity,
      fill_percent: normalizedFillPercent,
      totalRegistrations: counts.totalRegistrations,
      confirmedRegistrations: counts.confirmedRegistrations,
      pendingRegistrations: counts.pendingRegistrations,
      paidTickets: counts.paidTickets,
      reservedTickets: counts.reservedTickets,
      activeTickets: counts.activeTickets,
      usedTickets: counts.usedTickets,
      checkedInCount: counts.checkedInCount,
      remainingCapacity: normalizedRemainingCapacity,
      fillPercent: normalizedFillPercent
    };
  }

  return calculateEventStats(event, {
    totalRegistrations,
    confirmedRegistrations: toCount(row.confirmed_registrations ?? row.confirmedRegistrations),
    pendingRegistrations: toCount(row.pending_registrations ?? row.pendingRegistrations),
    paidTickets: toCount(row.paid_tickets ?? row.paidTickets),
    reservedTickets: toCount(row.reserved_tickets ?? row.reservedTickets),
    activeTickets: toCount(row.active_tickets ?? row.activeTickets),
    usedTickets: toCount(row.used_tickets ?? row.usedTickets),
    checkedInCount: toCount(row.checked_in_count ?? row.checkedInCount)
  });
}

export function getFallbackEventStats(event: Pick<RaveeraEvent, "registered" | "capacity">): EventDetailStats {
  const totalRegistrations = Math.max(0, event.registered);

  return calculateEventStats(event, {
    totalRegistrations,
    confirmedRegistrations: totalRegistrations,
    pendingRegistrations: 0,
    paidTickets: 0,
    reservedTickets: 0,
    activeTickets: 0,
    usedTickets: 0,
    checkedInCount: 0
  });
}

export function calculateEventStatsFromRows(
  event: Pick<RaveeraEvent, "price" | "capacity">,
  registrations: EventStatsRegistrationRow[],
  tickets: EventStatsTicketRow[]
): EventDetailStats {
  const activeRegistrations = registrations.filter((registration) => registration.status !== "cancelled");
  const totalRegistrations = activeRegistrations.length;
  const freeEvent = isFreeEvent(event);
  const usedTickets = tickets.filter((ticket) => ticket.status === "used").length;
  const checkedInCount = tickets.filter((ticket) => ticket.checked_in || ticket.checked_in_at || ticket.status === "used").length;
  const paidTickets = tickets.filter((ticket) => ticket.payment_status === "paid").length;
  const activeTickets = tickets.filter((ticket) => ticket.status === "active").length;

  return calculateEventStats(event, {
    totalRegistrations,
    confirmedRegistrations: freeEvent
      ? totalRegistrations
      : activeRegistrations.filter((registration) => registration.status === "confirmed").length,
    pendingRegistrations: freeEvent
      ? 0
      : activeRegistrations.filter((registration) => registration.status === "pending").length,
    paidTickets: freeEvent ? Math.max(paidTickets, totalRegistrations) : paidTickets,
    reservedTickets: freeEvent
      ? 0
      : tickets.filter((ticket) => ticket.status === "reserved" || (ticket.payment_status === "pending" && ticket.status !== "used")).length,
    activeTickets: freeEvent ? Math.max(activeTickets, Math.max(0, totalRegistrations - usedTickets)) : activeTickets,
    usedTickets,
    checkedInCount
  });
}
