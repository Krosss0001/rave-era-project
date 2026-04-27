import type { UserRole } from "@/lib/supabase/types";

export const USER_ROLES: UserRole[] = ["user", "organizer", "admin", "superadmin"];

const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  organizer: 1,
  admin: 2,
  superadmin: 3
};

export function isUserRole(value: string | null | undefined): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function hasMinimumRole(role: UserRole | null | undefined, minimumRole: UserRole) {
  if (!role) {
    return false;
  }

  return ROLE_RANK[role] >= ROLE_RANK[minimumRole];
}

export function canManagePlatform(role: UserRole | null | undefined) {
  return role === "admin" || role === "superadmin";
}

export function canManageEvents(role: UserRole | null | undefined) {
  return role === "organizer" || canManagePlatform(role);
}
