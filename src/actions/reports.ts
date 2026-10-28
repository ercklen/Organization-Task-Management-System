"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";

export async function getReportDataAction() {
  const authData = await getCurrentUser();
  if (!authData || authData.profile?.role !== "admin") {
    return { success: false, error: "Non autorisé", data: null };
  }

  const supabase = await createClient();

  // 1. Tasks with assignments and completions
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      priority,
      due_date,
      created_at,
      task_group_assignments(group:groups(id, name)),
      task_individual_assignments(student:profiles(id, full_name, email)),
      completions:task_completions(
        id,
        status,
        completed_at,
        completion_note,
        evidence_url,
        student:profiles(id, full_name, email)
      )
    `)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const tasks = (rawTasks || []).map((t: any) => ({
    ...t,
    assigned_groups: t.task_group_assignments?.map((g: any) => g.group?.name).filter(Boolean) || [],
    assigned_students: t.task_individual_assignments?.map((s: any) => s.student?.full_name).filter(Boolean) || [],
    completions: t.completions || [],
  }));

  // 2. Students with completions and memberships
  const { data: rawStudents } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_active, created_at, preferred_language")
    .eq("role", "student")
    .order("full_name");

  const { data: memberships } = await supabase
    .from("group_members")
    .select("student_id, group:groups(name)")
    .is("left_at", null);

  const { data: completions } = await supabase
    .from("task_completions")
    .select("student_id, status, completed_at, task:tasks(title, priority, due_date)");

  const students = (rawStudents || []).map((s) => {
    const sGroups = (memberships || [])
      .filter((m) => m.student_id === s.id && m.group)
      .map((m) => (m.group as any).name);
    const sCompletions = (completions || []).filter((c) => c.student_id === s.id);
    return {
      ...s,
      group_names: sGroups,
      completions: sCompletions,
      total_assigned: sCompletions.length,
      completed_count: sCompletions.filter((c) => c.status === "completed").length,
      in_progress_count: sCompletions.filter((c) => c.status === "in_progress").length,
      pending_count: sCompletions.filter((c) => c.status === "pending").length,
    };
  });

  // 3. Groups with members and task assignments
  const { data: rawGroups } = await supabase
    .from("groups")
    .select(`
      id,
      name,
      description,
      created_at,
      is_active,
      leader:profiles!leader_id(id, full_name, email),
      members:group_members(
        id,
        student_id,
        left_at,
        student:profiles!student_id(id, full_name, email)
      )
    `)
    .eq("is_active", true)
    .order("name");

  const { data: groupAssignments } = await supabase
    .from("task_group_assignments")
    .select("group_id, task:tasks(title, priority, due_date)");

  const groups = (rawGroups || []).map((g: any) => ({
    ...g,
    active_members: (g.members || []).filter((m: any) => !m.left_at),
    task_assignments: (groupAssignments || []).filter((ga: any) => ga.group_id === g.id),
  }));

  return { success: true, data: { tasks, students, groups } };
}
