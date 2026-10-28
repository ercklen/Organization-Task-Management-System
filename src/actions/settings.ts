"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

export async function updateProfileSettingsAction(data: {
  full_name: string;
  preferred_language: "fr" | "ar";
}) {
  const authData = await getCurrentUser();
  if (!authData || !authData.profile) {
    return { success: false, error: "Non connecté" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name.trim(),
      preferred_language: data.preferred_language,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authData.profile.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/settings", "page");
  return { success: true };
}

export async function updateOrgSettingsAction(data: {
  org_name: string;
  timezone: string;
  default_language: "fr" | "ar";
  allow_student_evidence: boolean;
}) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  // Update or insert organization_settings
  const { data: existing } = await supabase.from("organization_settings").select("id").limit(1);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from("organization_settings")
      .update({
        org_name: data.org_name.trim(),
        timezone: data.timezone,
        default_language: data.default_language,
        allow_student_evidence: data.allow_student_evidence,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing[0].id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("organization_settings").insert({
      org_name: data.org_name.trim(),
      timezone: data.timezone,
      default_language: data.default_language,
      allow_student_evidence: data.allow_student_evidence,
    });
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/settings", "page");
  return { success: true };
}

export async function changePasswordAction(data: {
  currentPassword?: string;
  newPassword: string;
}) {
  const authData = await getCurrentUser();
  if (!authData || !authData.profile || !authData.user) {
    return { success: false, error: "Non connecté" };
  }

  if (!data.newPassword || data.newPassword.length < 6) {
    return { success: false, error: "Le mot de passe doit comporter au moins 6 caractères." };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // If current password provided, verify it first by attempting sign in with current credentials
  if (data.currentPassword && data.currentPassword.trim().length > 0) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: authData.user.email,
      password: data.currentPassword.trim(),
    });

    if (verifyError) {
      return { success: false, error: "Le mot de passe actuel est incorrect." };
    }
  }

  // Update password in Supabase Auth
  let updateError: string | null = null;

  if (adminClient) {
    const { error } = await adminClient.auth.admin.updateUserById(authData.user.id, {
      password: data.newPassword.trim(),
    });
    if (error) updateError = error.message;
  } else {
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword.trim(),
    });
    if (error) updateError = error.message;
  }

  if (updateError) {
    return { success: false, error: updateError };
  }

  // Activity Log
  await supabase.from("activity_logs").insert({
    actor_id: authData.profile.id,
    action: "password_changed",
    entity_type: "profile",
    entity_id: authData.profile.id,
    metadata: {
      email: authData.profile.email,
    },
  });

  return { success: true };
}
