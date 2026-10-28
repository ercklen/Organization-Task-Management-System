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

  const adminClient = createAdminClient();
  const supabase = await createClient();
  const newStatus = !currentStatus;

  // 1. Update Supabase Auth user ban status if service role is available
  if (adminClient) {
    try {
      await adminClient.auth.admin.updateUserById(studentId, {
        ban_duration: newStatus ? "none" : "876000h",
        app_metadata: { is_active: newStatus },
      });
    } catch (authErr) {
      console.warn("auth.admin.updateUserById ban warning:", authErr);
    }
  }

  // 2. Update profiles table
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/students", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true };
}

export async function updateStudentAction(data: {
  id: string;
  full_name: string;
  email: string;
  password?: string;
  preferred_language?: "fr" | "ar";
  is_active?: boolean;
  group_ids?: string[];
}) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 1. Update Auth user if service role is available
  if (adminClient) {
    try {
      const authUpdates: {
        email?: string;
        password?: string;
        ban_duration?: string;
        app_metadata?: Record<string, any>;
        user_metadata?: Record<string, any>;
      } = {
        email: data.email,
        user_metadata: {
          full_name: data.full_name,
          preferred_language: data.preferred_language || "fr",
        },
      };

      if (typeof data.is_active === "boolean") {
        authUpdates.ban_duration = data.is_active ? "none" : "876000h";
        authUpdates.app_metadata = { is_active: data.is_active };
      }

      if (data.password && data.password.trim().length > 0) {
        authUpdates.password = data.password.trim();
      }

      await adminClient.auth.admin.updateUserById(data.id, authUpdates);
    } catch (authErr) {
      console.warn("auth.admin.updateUserById warning:", authErr);
    }
  }

  // 2. Update profiles table
  const profileUpdates: Record<string, any> = {
    full_name: data.full_name,
    email: data.email,
    preferred_language: data.preferred_language || "fr",
    updated_at: new Date().toISOString(),
  };

  if (typeof data.is_active === "boolean") {
    profileUpdates.is_active = data.is_active;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdates)
    .eq("id", data.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 3. Update Group Memberships if provided
  if (data.group_ids !== undefined) {
    // Delete existing active memberships
    await supabase.from("group_members").delete().eq("student_id", data.id);

    // Insert new selected groups
    if (data.group_ids.length > 0) {
      const memberRows = data.group_ids.map((gid) => ({
        group_id: gid,
        student_id: data.id,
      }));
      await supabase.from("group_members").insert(memberRows);
    }
  }

  // 4. Activity Log
  await supabase.from("activity_logs").insert({
    actor_id: authData.profile.id,
    action: "student_updated",
    entity_type: "student",
    entity_id: data.id,
    metadata: {
      full_name: data.full_name,
      email: data.email,
      assigned_groups_count: data.group_ids?.length || 0,
    },
  });

  revalidatePath("/[locale]/students", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true };
}

export async function deleteStudentAction(studentId: string) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  if (studentId === authData.profile.id) {
    return { success: false, error: "Vous ne pouvez pas supprimer votre propre compte administrateur." };
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();

  // Verify target is a student
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", studentId)
    .single();

  if (!targetProfile) {
    return { success: false, error: "Étudiant introuvable" };
  }

  if (targetProfile.role === "admin") {
    return { success: false, error: "Impossible de supprimer un compte administrateur." };
  }

  // 1. Delete from Supabase Auth if available
  if (adminClient) {
    try {
      await adminClient.auth.admin.deleteUser(studentId);
    } catch (authErr) {
      console.warn("auth.admin.deleteUser error (proceeding with DB deletion):", authErr);
    }
  }

  // 2. Cascade delete from tables
  await supabase.from("task_completions").delete().eq("student_id", studentId);
  await supabase.from("task_individual_assignments").delete().eq("student_id", studentId);
  await supabase.from("group_members").delete().eq("student_id", studentId);
  await supabase.from("notifications").delete().eq("recipient_id", studentId);
  await supabase.from("groups").update({ leader_id: null }).eq("leader_id", studentId);

  const { error: profileDeleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", studentId);

  if (profileDeleteError) {
    return { success: false, error: profileDeleteError.message };
  }

  // 3. Activity Log
  await supabase.from("activity_logs").insert({
    actor_id: authData.profile.id,
    action: "student_deleted",
    entity_type: "student",
    entity_id: studentId,
    metadata: {
      full_name: targetProfile.full_name,
      email: targetProfile.email,
    },
  });

  revalidatePath("/[locale]/students", "page");
  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/tasks", "page");

  return { success: true };
}
