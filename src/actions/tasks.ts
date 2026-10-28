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

export async function completeTaskAction(input: {
  taskId: string;
  studentId: string;
  note?: string;
  evidenceUrl?: string;
}) {
  const authData = await getCurrentUser();
  if (!authData || !authData.profile) {
    return { success: false, error: "Non connecté" };
  }

  // Security check: Only the student themselves or an admin can mark it complete
  if (authData.profile.role !== "admin" && authData.profile.id !== input.studentId) {
    return { success: false, error: "Non autorisé à modifier la tâche d'un autre étudiant" };
  }

  const supabase = await createClient();

  // Upsert completion record
  const { error } = await supabase
    .from("task_completions")
    .upsert(
      {
        task_id: input.taskId,
        student_id: input.studentId,
        status: "completed",
        completion_note: input.note?.trim() || null,
        evidence_url: input.evidenceUrl?.trim() || null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "task_id,student_id" }
    );

  if (error) {
    console.error("completeTaskAction error:", error);
    return { success: false, error: error.message };
  }

  // Fetch task title for notification message
  const { data: taskData } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", input.taskId)
    .single();

  const taskTitle = taskData?.title || "Tâche";
  const studentName = authData.profile.full_name || "Un étudiant";

  // Notify all admins of the completion
  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (adminProfiles && adminProfiles.length > 0) {
    const notifRows = adminProfiles.map((admin) => ({
      recipient_id: admin.id,
      actor_id: input.studentId,
      task_id: input.taskId,
      notification_type: "task_completed",
      message_key: "notifications.taskCompleted",
      message_data: {
        student_name: studentName,
        task_title: taskTitle,
      },
    }));
    await supabase.from("notifications").insert(notifRows);
  }

  // Record activity log
  await supabase.from("activity_logs").insert({
    actor_id: input.studentId,
    action: "task_completed",
    entity_type: "task",
    entity_id: input.taskId,
    metadata: {
      task_title: taskTitle,
      student_name: studentName,
      completion_note: input.note?.trim() || null,
    },
  });

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/dashboard", "page");

  return { success: true };
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
