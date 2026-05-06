import { NextResponse } from "next/server";
import { canManageEvents, canManagePlatform } from "@/lib/auth/roles";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { requireApiUser } from "@/lib/supabase/api-auth";
import { cleanReferralCode, incrementReferralCounters, incrementReferralCountersForTicket } from "@/lib/referral-tracking";
import type { UserRole } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReferralAction = "click" | "registration" | "telegram_start" | "confirmed" | "paid" | "checked_in";

type ReferralTrackBody = {
  eventId?: unknown;
  code?: unknown;
  source?: unknown;
  action?: unknown;
  confirmed?: unknown;
  ticketId?: unknown;
};

function cleanSource(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const source = value.trim().slice(0, 120);
  return source.length > 0 ? source : null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isReferralAction(value: unknown): value is ReferralAction {
  return value === "click" || value === "registration" || value === "telegram_start" || value === "confirmed" || value === "paid" || value === "checked_in";
}

async function requireTicketCounterAccess(request: Request, ticketId: string) {
  const { user, supabase } = await requireApiUser(request);

  const [{ data: profile, error: profileError }, { data: ticket, error: ticketError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("tickets")
      .select("id,event_id,events(id,organizer_id)")
      .eq("id", ticketId)
      .maybeSingle()
  ]);

  if (profileError) {
    throw profileError;
  }

  if (ticketError) {
    throw ticketError;
  }

  const role = profile?.role as UserRole | undefined;
  const event = Array.isArray(ticket?.events) ? ticket?.events[0] : ticket?.events;

  if (!ticket || !event || !canManageEvents(role)) {
    throw new Error("forbidden");
  }

  if (!canManagePlatform(role) && event.organizer_id !== user.id) {
    throw new Error("forbidden");
  }

  return supabase;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReferralTrackBody;
    const eventId = isUuid(body.eventId) ? body.eventId : null;
    const code = typeof body.code === "string" ? cleanReferralCode(body.code) : null;
    const source = cleanSource(body.source);
    const action = isReferralAction(body.action) ? body.action : "click";
    const confirmed = body.confirmed === true;
    const ticketId = isUuid(body.ticketId) ? body.ticketId : null;

    if ((action === "paid" || action === "checked_in") && ticketId) {
      const supabase = await requireTicketCounterAccess(request, ticketId);

      await incrementReferralCountersForTicket(
        supabase,
        ticketId,
        action === "paid" ? { paid: 1 } : { checkedIn: 1 },
        source ?? (action === "paid" ? "ticket_payment" : "ticket_check_in")
      );

      return NextResponse.json({ ok: true });
    }

    if (!eventId || !code) {
      return NextResponse.json({ ok: false, error: "eventId and code are required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();

    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase service role client is not configured." }, { status: 503 });
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,referral_enabled")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) {
      throw eventError;
    }

    if (!event || event.referral_enabled === false) {
      return NextResponse.json({ ok: false, error: "Referral tracking is not available for this event." }, { status: 404 });
    }

    await incrementReferralCounters(
      supabase,
      eventId,
      code,
      {
        clicks: action === "click" ? 1 : 0,
        telegramStarts: action === "telegram_start" ? 1 : 0,
        registrations: action === "registration" ? 1 : 0,
        confirmed: action === "confirmed" || (action === "registration" && confirmed) ? 1 : 0,
        paid: action === "paid" ? 1 : 0,
        checkedIn: action === "checked_in" ? 1 : 0
      },
      source
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Referral tracking failed.";
    const status = message === "unauthorized" ? 401 : message === "forbidden" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
