import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_SELECT_FIELDS } from "@/lib/supabase/event-fields";
import type { Database } from "@/lib/supabase/types";

export type TypedSupabaseClient = SupabaseClient<Database>;

export async function getCurrentProfile(supabase: TypedSupabaseClient) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { profile: null, error: userError };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,wallet_address,telegram_username,created_at")
    .eq("id", user.id)
    .single();

  return { profile: data, error };
}

export async function getPublishedEvents(supabase: TypedSupabaseClient) {
  return supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .in("status", ["published", "live", "limited", "soon"])
    .order("date", { ascending: true });
}

export async function getPublishedEventBySlug(supabase: TypedSupabaseClient, slug: string) {
  return supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .eq("slug", slug)
    .in("status", ["published", "live", "limited", "soon"])
    .maybeSingle();
}

export async function getMyTickets(supabase: TypedSupabaseClient) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: userError };
  }

  return supabase
    .from("tickets")
    .select("id,event_id,registration_id,ticket_code,qr_payload,status,payment_status,checked_in,checked_in_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
}

export async function getMyReferrals(supabase: TypedSupabaseClient) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: userError };
  }

  return supabase
    .from("referrals")
    .select("id,event_id,owner_user_id,created_by,code,source,label,clicks,telegram_starts,registrations,confirmed,paid,checked_in,created_at,updated_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });
}
