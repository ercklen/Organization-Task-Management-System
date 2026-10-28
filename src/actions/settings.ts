"use server";

import { createClient } from "@/lib/supabase/server";
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
