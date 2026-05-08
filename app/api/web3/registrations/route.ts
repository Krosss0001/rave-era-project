import { NextResponse } from "next/server";
import { incrementReferralCounters } from "@/lib/referral-tracking";
import { requireApiUser, apiErrorResponse } from "@/lib/supabase/api-auth";
import { buildQrPayload, generateTicketCode } from "@/lib/tickets";
import { isValidEmail } from "@/lib/validation";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];

type Web3RegistrationBody = {
  event_id?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  instagram?: unknown;
  telegram_username?: unknown;
  referral_code?: unknown;
};

function cleanText(value: unknown, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isUniqueCollision(error: { code?: string } | null | undefined) {
  return error?.code === "23505";
}

async function createTicket(input: {
  supabase: Awaited<ReturnType<typeof requireApiUser>>["supabase"];
  eventId: string;
  userId: string;
  registrationId: string;
  isFreeEvent: boolean;
}) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const ticketCode = generateTicketCode();
    const { data, error } = await input.supabase
      .from("tickets")
      .insert({
        registration_id: input.registrationId,
        event_id: input.eventId,
        user_id: input.userId,
        ticket_code: ticketCode,
        qr_payload: buildQrPayload(ticketCode, input.eventId, input.userId),
        payment_status: input.isFreeEvent ? "paid" : "pending",
        status: input.isFreeEvent ? "active" : "reserved"
      })
      .select("id,registration_id,event_id,user_id,ticket_code,qr_payload,status,payment_status,checked_in,checked_in_at,checked_in_by,created_at")
      .single();

    if (!error) {
      return data;
    }

    if (!isUniqueCollision(error)) {
      throw error;
    }
  }

  throw new Error("Could not create a unique ticket code.");
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireApiUser(request);
    const body = (await request.json()) as Web3RegistrationBody;
    const eventId = cleanText(body.event_id, 80);
    const name = cleanText(body.name);
    const email = cleanText(body.email, 240).toLowerCase();
    const phone = cleanText(body.phone, 80);
    const instagram = cleanText(body.instagram, 80);
    const telegramUsername = cleanText(body.telegram_username, 80) || null;
    const referralCode = cleanText(body.referral_code, 80) || null;

    if (!eventId) {
      throw new Error("Event id is required.");
    }

    if (!name) {
      throw new Error("Full name is required.");
    }

    if (!email || !isValidEmail(email)) {
      throw new Error("Valid email is required.");
    }

    if (!phone) {
      throw new Error("Phone is required.");
    }

    if (!instagram) {
      throw new Error("Instagram nickname is required.");
    }

    const [{ data: event, error: eventError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from("events")
        .select("id,price")
        .eq("id", eventId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id,email,wallet_address")
        .eq("id", user.id)
        .maybeSingle()
    ]);

    if (eventError) {
      throw eventError;
    }

    if (profileError) {
      throw profileError;
    }

    if (!event) {
      throw new Error("Event not found.");
    }

    const isFreeEvent = Number(event.price) <= 0;

    if (!isFreeEvent && !profile?.wallet_address?.trim()) {
      throw new Error("Connect and save Phantom before paid on-site registration.");
    }

    let createdRegistration = false;

    const existingRegistrationResult = await supabase
      .from("registrations")
      .select("id,event_id,user_id,name,email,phone,instagram_nickname,telegram_username,telegram_user_id,referral_code,status,created_at")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRegistrationResult.error) {
      throw existingRegistrationResult.error;
    }

    let registration: RegistrationRow | null = existingRegistrationResult.data;

    if (!registration) {
      const { data, error } = await supabase
        .from("registrations")
        .insert({
          event_id: eventId,
          user_id: user.id,
          name,
          email,
          phone,
          instagram_nickname: instagram,
          telegram_username: telegramUsername,
          referral_code: referralCode,
          status: isFreeEvent ? "confirmed" : "pending"
        })
        .select("id,event_id,user_id,name,email,phone,instagram_nickname,telegram_username,telegram_user_id,referral_code,status,created_at")
        .single();

      if (error) {
        if (!isUniqueCollision(error)) {
          throw error;
        }

        const retryResult = await supabase
          .from("registrations")
          .select("id,event_id,user_id,name,email,phone,instagram_nickname,telegram_username,telegram_user_id,referral_code,status,created_at")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (retryResult.error) {
          throw retryResult.error;
        }

        registration = retryResult.data;
      } else {
        registration = data;
        createdRegistration = true;
      }
    }

    if (!registration) {
      throw new Error("Registration could not be created.");
    }

    const existingTicketResult = await supabase
      .from("tickets")
      .select("id,registration_id,event_id,user_id,ticket_code,qr_payload,status,payment_status,checked_in,checked_in_at,checked_in_by,created_at")
      .eq("registration_id", registration.id)
      .maybeSingle();

    if (existingTicketResult.error) {
      throw existingTicketResult.error;
    }

    let ticket: TicketRow | null = existingTicketResult.data;

    if (!ticket) {
      ticket = await createTicket({
        supabase,
        eventId,
        userId: user.id,
        registrationId: registration.id,
        isFreeEvent
      });
    }

    if (createdRegistration) {
      await incrementReferralCounters(
        supabase,
        eventId,
        registration.referral_code,
        {
          registrations: 1,
          confirmed: registration.status === "confirmed" ? 1 : 0,
          paid: ticket.payment_status === "paid" ? 1 : 0
        },
        "web3_site_registration"
      );
    }

    return NextResponse.json({
      ok: true,
      registration,
      ticket,
      reused: !createdRegistration
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
