"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

export async function createStudentAction(data: {
  full_name: string;
  email: string;
  password?: string;
  preferred_language?: "fr" | "ar";
  group_ids?: string[];
}) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();

  let studentId: string | null = null;

  // 1. If service role admin is available, create auth user
  if (adminClient) {
    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password || "StudentPassword123!",
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        role: "student",
        preferred_language: data.preferred_language || "fr",
      },
    });

    if (authError || !newUser?.user) {
      return { success: false, error: authError?.message || "Erreur lors de la création du compte auth" };
    }

    studentId = newUser.user.id;
  } else {
    // Fallback: Generate a random UUID and insert directly into public.profiles
    const tempId = crypto.randomUUID();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: tempId,
        full_name: data.full_name,
        email: data.email,
        role: "student",
        preferred_language: data.preferred_language || "fr",
        is_active: true,
      })
      .select()
      .single();

    if (profileError || !profile) {
      return { success: false, error: profileError?.message || "Erreur de création du profil" };
    }

    studentId = profile.id;
  }

  // 2. Assign to selected groups
  if (studentId && data.group_ids && data.group_ids.length > 0) {
    const memberRows = data.group_ids.map((gid) => ({
      group_id: gid,
      student_id: studentId!,
    }));
    await supabase.from("group_members").insert(memberRows);
  }

  // 3. Activity Log
  await supabase.from("activity_logs").insert({
    actor_id: authData.profile.id,
    action: "student_created",
    entity_type: "student",
    entity_id: studentId,
    metadata: {
      full_name: data.full_name,
      email: data.email,
    },
  });

  revalidatePath("/[locale]/students", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true, studentId };
}

export async function toggleStudentStatusAction(studentId: string, currentStatus: boolean) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: !currentStatus })
    .eq("id", studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/students", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true };
}
