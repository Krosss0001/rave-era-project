import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { canManagePlatform, canManageEvents } from "@/lib/auth/roles";
import { incrementReferralCounters } from "@/lib/referral-tracking";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RegistrationAction =
  | "confirm_registration"
  | "cancel_registration"
  | "mark_payment_paid"
  | "mark_ticket_active"
  | "reset_check_in";

type ActionBody = {
  action?: unknown;
  registrationId?: unknown;
};

const actionMessages: Record<RegistrationAction, string> = {
  confirm_registration: "Registration confirmed.",
  cancel_registration: "Registration cancelled.",
  mark_payment_paid: "Payment marked paid.",
  mark_ticket_active: "Ticket marked active.",
  reset_check_in: "Check-in reset."
};

function isRegistrationAction(value: unknown): value is RegistrationAction {
  return (
    value === "confirm_registration" ||
    value === "cancel_registration" ||
    value === "mark_payment_paid" ||
    value === "mark_ticket_active" ||
    value === "reset_check_in"
  );
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const status = message === "unauthorized" ? 401 : message === "forbidden" ? 403 : 400;

  return NextResponse.json({ ok: false, error: message }, { status });
}

async function requireActor(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw new Error("unauthorized");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }

  const authClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    throw new Error("unauthorized");
  }

  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service role client is not configured.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const role = profile?.role as UserRole | undefined;

  if (!canManageEvents(role)) {
    throw new Error("forbidden");
  }

  return { userId: user.id, role, supabase };
}

async function getRegistrationForAction(
  supabase: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
  registrationId: string
) {
  const { data, error } = await supabase
    .from("registrations")
    .select("id,event_id,referral_code,status,events(id,organizer_id)")
    .eq("id", registrationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Registration not found.");
  }

  const events = Array.isArray(data.events) ? data.events[0] : data.events;

  if (!events) {
    throw new Error("Event not found.");
  }

  return {
    id: data.id,
    eventId: data.event_id,
    referralCode: data.referral_code,
    status: data.status,
    organizerId: events.organizer_id
  };
}

async function getRegistrationTickets(
  supabase: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
  registrationId: string
) {
  const { data, error } = await supabase
    .from("tickets")
    .select("id,registration_id,event_id,status,payment_status,checked_in,checked_in_at")
    .eq("registration_id", registrationId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function POST(request: Request) {
  try {
    const { userId, role, supabase } = await requireActor(request);
    const body = (await request.json()) as ActionBody;

    if (!isRegistrationAction(body.action)) {
      throw new Error("Invalid registration action.");
    }

    if (typeof body.registrationId !== "string" || !body.registrationId.trim()) {
      throw new Error("Registration id is required.");
    }

    const registrationId = body.registrationId.trim();
    const registration = await getRegistrationForAction(supabase, registrationId);

    if (!canManagePlatform(role) && registration.organizerId !== userId) {
      throw new Error("forbidden");
    }

    if (body.action === "reset_check_in" && role !== "admin" && role !== "superadmin") {
      throw new Error("forbidden");
    }

    if (body.action === "confirm_registration" || body.action === "cancel_registration") {
      const nextStatus = body.action === "confirm_registration" ? "confirmed" : "cancelled";
      const { error } = await supabase
        .from("registrations")
        .update({ status: nextStatus })
        .eq("id", registrationId);

      if (error) {
        throw error;
      }

      if (nextStatus === "confirmed" && registration.status !== "confirmed") {
        await incrementReferralCounters(
          supabase,
          registration.eventId,
          registration.referralCode,
          { confirmed: 1 },
          "organizer_confirmation"
        );
      }
    } else {
      const existingTickets = await getRegistrationTickets(supabase, registrationId);

      if (existingTickets.length === 0) {
        throw new Error("No ticket exists for this registration.");
      }

      if (body.action === "mark_payment_paid") {
        const newlyPaidCount = existingTickets.filter((ticket) => ticket.payment_status !== "paid").length;
        const { error } = await supabase
          .from("tickets")
          .update({ payment_status: "paid" })
          .eq("registration_id", registrationId);

        if (error) {
          throw error;
        }

        if (newlyPaidCount > 0) {
          await incrementReferralCounters(
            supabase,
            registration.eventId,
            registration.referralCode,
            { paid: newlyPaidCount },
            "organizer_payment"
          );
        }
      }

      if (body.action === "mark_ticket_active") {
        if (existingTickets.some((ticket) => ticket.checked_in || ticket.checked_in_at || ticket.status === "used")) {
          throw new Error("Used tickets cannot be reactivated here.");
        }

        const { error } = await supabase
          .from("tickets")
          .update({ status: "active" })
          .eq("registration_id", registrationId);

        if (error) {
          throw error;
        }
      }

      if (body.action === "reset_check_in") {
        if (existingTickets.some((ticket) => ticket.payment_status !== "paid")) {
          throw new Error("Check-in can only be reset for paid tickets.");
        }

        const { error } = await supabase
          .from("tickets")
          .update({
            status: "active",
            checked_in: false,
            checked_in_at: null,
            checked_in_by: null
          })
          .eq("registration_id", registrationId)
          .or("checked_in.eq.true,status.eq.used,checked_in_at.not.is.null");

        if (error) {
          throw error;
        }
      }
    }

    const { data: updatedRegistration, error: registrationError } = await supabase
      .from("registrations")
      .select("id,event_id,name,email,phone,instagram_nickname,telegram_username,referral_code,status,created_at")
      .eq("id", registrationId)
      .single();

    if (registrationError) {
      throw registrationError;
    }

    const updatedTickets = await getRegistrationTickets(supabase, registrationId);

    return NextResponse.json({
      ok: true,
      message: actionMessages[body.action],
      registration: updatedRegistration,
      tickets: updatedTickets
    });
  } catch (error) {
    return errorResponse(error);
  }
}
