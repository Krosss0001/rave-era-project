import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReferralAction = "click" | "registration";

type ReferralTrackBody = {
  eventId?: unknown;
  code?: unknown;
  source?: unknown;
  action?: unknown;
  confirmed?: unknown;
};

type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];

function cleanReferralCode(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const code = value.trim().slice(0, 80);
  return code.length > 0 ? code : null;
}

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
  return value === "click" || value === "registration";
}

function getNextCounters(referral: ReferralRow | null, action: ReferralAction, confirmed: boolean) {
  return {
    clicks: (referral?.clicks ?? 0) + (action === "click" ? 1 : 0),
    registrations: (referral?.registrations ?? 0) + (action === "registration" ? 1 : 0),
    confirmed: (referral?.confirmed ?? 0) + (action === "registration" && confirmed ? 1 : 0)
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReferralTrackBody;
    const eventId = isUuid(body.eventId) ? body.eventId : null;
    const code = cleanReferralCode(body.code);
    const source = cleanSource(body.source);
    const action = isReferralAction(body.action) ? body.action : "click";
    const confirmed = body.confirmed === true;

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

    const { data: existing, error: existingError } = await supabase
      .from("referrals")
      .select("id,event_id,code,source,owner_user_id,clicks,registrations,confirmed,created_at")
      .eq("event_id", eventId)
      .eq("code", code)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const counters = getNextCounters(existing, action, confirmed);

    if (existing) {
      const { error: updateError } = await supabase
        .from("referrals")
        .update({
          clicks: counters.clicks,
          registrations: counters.registrations,
          confirmed: counters.confirmed,
          ...(source && !existing.source ? { source } : {})
        })
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ ok: true });
    }

    const { error: insertError } = await supabase
      .from("referrals")
      .insert({
        event_id: eventId,
        code,
        source,
        clicks: counters.clicks,
        registrations: counters.registrations,
        confirmed: counters.confirmed
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ ok: true, deduped: true });
      }

      throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Referral tracking failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
