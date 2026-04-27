import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/supabase/types";
import { isUserRole } from "@/lib/auth/roles";

export type AuthProfile = Database["public"]["Tables"]["profiles"]["Row"];

export type RoleState = {
  user: User | null;
  profile: AuthProfile | null;
  role: UserRole | null;
};

export async function getCurrentRole(supabase: SupabaseClient<Database>): Promise<RoleState> {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,wallet_address,telegram_username,created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile && !profileError) {
    const { data: repairedProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        role: "user"
      })
      .select("id,email,full_name,role,wallet_address,telegram_username,created_at")
      .maybeSingle();

    if (repairedProfile) {
      return {
        user,
        profile: repairedProfile,
        role: repairedProfile.role
      };
    }
  }

  const role = isUserRole(profile?.role) ? profile.role : "user";

  return {
    user,
    profile: profile ?? null,
    role
  };
}
