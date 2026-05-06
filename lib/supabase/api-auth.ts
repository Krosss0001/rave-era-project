import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

export async function requireApiUser(request: Request) {
  const token = getBearerToken(request);

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
    error
  } = await authClient.auth.getUser(token);

  if (error || !user) {
    throw new Error("unauthorized");
  }

  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service role client is not configured.");
  }

  return { user, supabase };
}

export function apiErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const status = message === "unauthorized" ? 401 : message === "forbidden" ? 403 : 400;

  return Response.json({ ok: false, error: message }, { status });
}
