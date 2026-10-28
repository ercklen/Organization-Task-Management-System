"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

export async function createGroupAction(formData: {
  name: string;
  description?: string;
  leader_id?: string;
  member_ids?: string[];
}) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  // 1. Insert Group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      leader_id: formData.leader_id || null,
      is_active: true,
    })
    .select()
    .single();

  if (groupError || !group) {
    return { success: false, error: groupError?.message || "Erreur de création" };
  }

  // 2. Add members if provided
  if (formData.member_ids && formData.member_ids.length > 0) {
    const memberRows = formData.member_ids.map((sid) => ({
      group_id: group.id,
      student_id: sid,
    }));
    await supabase.from("group_members").insert(memberRows);
  }

  // 3. Activity Log
  await supabase.from("activity_logs").insert({
    actor_id: authData.profile.id,
    action: "group_created",
    entity_type: "group",
    entity_id: group.id,
    metadata: { name: group.name },
  });

  revalidatePath("/[locale]/groups", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true, groupId: group.id };
}

export async function updateGroupAction(
  groupId: string,
  formData: {
    name: string;
    description?: string;
    leader_id?: string;
  }
) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("groups")
    .update({
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      leader_id: formData.leader_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/groups", "page");
  return { success: true };
}

export async function archiveGroupAction(groupId: string) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("groups")
    .update({ is_active: false })
    .eq("id", groupId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/groups", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { success: true };
}

export async function addGroupMemberAction(groupId: string, studentId: string) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    student_id: studentId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/groups", "page");
  return { success: true };
}

export async function removeGroupMemberAction(groupId: string, studentId: string) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  // Set left_at so historical records are preserved!
  const { error } = await supabase
    .from("group_members")
    .update({ left_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .eq("student_id", studentId)
    .is("left_at", null);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/groups", "page");
  return { success: true };
}
