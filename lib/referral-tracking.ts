import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];

export type ReferralCounterIncrements = {
  clicks?: number;
  telegramStarts?: number;
  registrations?: number;
  confirmed?: number;
  paid?: number;
  checkedIn?: number;
};

function isUndefinedColumn(error: { code?: string } | null) {
  return error?.code === "42703";
}

function isUniqueCollision(error: { code?: string } | null) {
  return error?.code === "23505";
}

export function cleanReferralCode(value: string | null | undefined) {
  const code = value?.trim().slice(0, 80);
  return code ? code : null;
}

function hasIncrements(increments: ReferralCounterIncrements) {
  return Object.values(increments).some((value) => Boolean(value));
}

function getNextCounters(referral: ReferralRow | null, increments: ReferralCounterIncrements) {
  return {
    clicks: (referral?.clicks ?? 0) + (increments.clicks ?? 0),
    telegram_starts: (referral?.telegram_starts ?? 0) + (increments.telegramStarts ?? 0),
    registrations: (referral?.registrations ?? 0) + (increments.registrations ?? 0),
    confirmed: (referral?.confirmed ?? 0) + (increments.confirmed ?? 0),
    paid: (referral?.paid ?? 0) + (increments.paid ?? 0),
    checked_in: (referral?.checked_in ?? 0) + (increments.checkedIn ?? 0)
  };
}

async function syncReferralConversionCounters(
  supabase: SupabaseClient<Database>,
  eventId: string,
  referralCode: string
) {
  const { data: registrations, error: registrationError } = await supabase
    .from("registrations")
    .select("id,status")
    .eq("event_id", eventId)
    .eq("referral_code", referralCode);

  if (registrationError) {
    throw registrationError;
  }

  const registrationIds = (registrations ?? []).map((registration) => registration.id);
  let paid = 0;
  let checkedIn = 0;

  if (registrationIds.length > 0) {
    const { data: tickets, error: ticketError } = await supabase
      .from("tickets")
      .select("payment_status,status,checked_in,checked_in_at")
      .in("registration_id", registrationIds);

    if (ticketError) {
      throw ticketError;
    }

    paid = (tickets ?? []).filter((ticket) => ticket.payment_status === "paid").length;
    checkedIn = (tickets ?? []).filter((ticket) => ticket.checked_in || ticket.status === "used" || ticket.checked_in_at !== null).length;
  }

  const { error } = await supabase
    .from("referrals")
    .update({
      registrations: registrations?.length ?? 0,
      confirmed: (registrations ?? []).filter((registration) => registration.status === "confirmed").length,
      paid,
      checked_in: checkedIn,
      updated_at: new Date().toISOString()
    })
    .eq("event_id", eventId)
    .eq("code", referralCode);

  if (error && !isUndefinedColumn(error)) {
    throw error;
  }
}

export async function incrementReferralCounters(
  supabase: SupabaseClient<Database>,
  eventId: string,
  referralCode: string | null | undefined,
  increments: ReferralCounterIncrements,
  source?: string | null
) {
  const code = cleanReferralCode(referralCode);

  if (!eventId || !code || !hasIncrements(increments)) {
    return;
  }

  const existingResult = await supabase
    .from("referrals")
    .select("*")
    .eq("event_id", eventId)
    .eq("code", code)
    .maybeSingle();

  if (existingResult.error) {
    if (isUndefinedColumn(existingResult.error)) {
      return;
    }

    throw existingResult.error;
  }

  const existing = existingResult.data;
  const counters = getNextCounters(existing, increments);

  const shouldSyncConversions = Boolean(
    increments.registrations || increments.confirmed || increments.paid || increments.checkedIn
  );

  if (existing) {
    const { error } = await supabase
      .from("referrals")
      .update({
        ...counters,
        updated_at: new Date().toISOString(),
        ...(source && !existing.source ? { source } : {})
      })
      .eq("id", existing.id);

    if (error && !isUndefinedColumn(error)) {
      throw error;
    }

    if (shouldSyncConversions) {
      await syncReferralConversionCounters(supabase, eventId, code);
    }

    return;
  }

  const { error } = await supabase
    .from("referrals")
    .insert({
      event_id: eventId,
      code,
      source: source ?? null,
      ...counters
    });

  if (error && !isUniqueCollision(error) && !isUndefinedColumn(error)) {
    throw error;
  }

  if ((!error || isUniqueCollision(error)) && shouldSyncConversions) {
    await syncReferralConversionCounters(supabase, eventId, code);
  }
}

export async function incrementReferralCountersForRegistration(
  supabase: SupabaseClient<Database>,
  registrationId: string,
  increments: ReferralCounterIncrements,
  source?: string | null
) {
  const { data, error } = await supabase
    .from("registrations")
    .select("id,event_id,referral_code")
    .eq("id", registrationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.referral_code) {
    return;
  }

  await incrementReferralCounters(supabase, data.event_id, data.referral_code, increments, source);
}

export async function incrementReferralCountersForTicket(
  supabase: SupabaseClient<Database>,
  ticketId: string,
  increments: ReferralCounterIncrements,
  source?: string | null
) {
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id,event_id,registration_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) {
    throw ticketError;
  }

  if (!ticket?.registration_id) {
    return;
  }

  await incrementReferralCountersForRegistration(supabase, ticket.registration_id, increments, source);
}
