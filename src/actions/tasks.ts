"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string;
  assigned_group_ids: string[];
  assigned_student_ids: string[];
}

export async function createTaskAction(input: CreateTaskInput) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  // 1. Insert task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      due_date: input.due_date,
      created_by: authData.profile.id,
    })
    .select()
    .single();

  if (taskError || !task) {
    return { success: false, error: taskError?.message || "Erreur de création" };
  }

  // 2. Assign Groups
  if (input.assigned_group_ids.length > 0) {
    const groupRows = input.assigned_group_ids.map((gid) => ({
      task_id: task.id,
      group_id: gid,
    }));
    await supabase.from("task_group_assignments").insert(groupRows);
  }

  // 3. Assign Individual Students
  if (input.assigned_student_ids.length > 0) {
    const studentRows = input.assigned_student_ids.map((sid) => ({
      task_id: task.id,
      student_id: sid,
    }));
    await supabase.from("task_individual_assignments").insert(studentRows);
  }

  // 4. Find all eligible unique students (from groups + individual)
  const eligibleStudentIds = new Set<string>(input.assigned_student_ids);

  if (input.assigned_group_ids.length > 0) {
    const { data: groupMembers } = await supabase
      .from("group_members")
      .select("student_id")
      .in("group_id", input.assigned_group_ids)
      .is("left_at", null);

    (groupMembers || []).forEach((gm) => {
      eligibleStudentIds.add(gm.student_id);
    });
  }

  // 5. Create task_completions records for every eligible student!
  const studentIdsArray = Array.from(eligibleStudentIds);
  if (studentIdsArray.length > 0) {
    const completionRows = studentIdsArray.map((sid) => ({
      task_id: task.id,
      student_id: sid,
      status: "pending",
    }));

    await supabase.from("task_completions").upsert(completionRows, {
      onConflict: "task_id,student_id",
      ignoreDuplicates: true,
    });

    // 6. Notify each student of assignment
    const notificationRows = studentIdsArray.map((sid) => ({
      recipient_id: sid,
      actor_id: authData.profile!.id,
      task_id: task.id,
      notification_type: "task_assigned",
      message_key: "notifications.taskAssigned",
      message_data: { task_title: task.title },
    }));

    await supabase.from("notifications").insert(notificationRows);
  }

  // 7. Insert Activity Log
  await supabase.from("activity_logs").insert({
    actor_id: authData.profile.id,
    action: "task_created",
    entity_type: "task",
    entity_id: task.id,
    metadata: {
      task_title: task.title,
      priority: task.priority,
      assigned_groups_count: input.assigned_group_ids.length,
      assigned_students_count: studentIdsArray.length,
    },
  });

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true, taskId: task.id };
}

export async function reopenTaskAction(taskId: string, studentId: string) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("task_completions")
    .update({
      status: "in_progress",
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("task_id", taskId)
    .eq("student_id", studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true };
}

export async function archiveTaskAction(taskId: string) {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true };
}
