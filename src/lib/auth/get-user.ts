import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types";

export async function getCurrentUser(): Promise<{ user: any; profile: Profile | null } | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      user,
      profile: {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email || "Utilisateur",
        email: user.email || "",
        role: (user.user_metadata?.role as any) || "student",
        preferred_language: (user.user_metadata?.preferred_language as any) || "fr",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  // Deactivated accounts are blocked from accessing the system
  if (!profile.is_active) {
    return null;
  }

  return { user, profile };
}

export async function requireAuth(allowedRoles?: ("admin" | "student")[]) {
  const authData = await getCurrentUser();

  if (!authData || !authData.profile || !authData.profile.is_active) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(authData.profile.role)) {
    return null;
  }

  return authData;
}
