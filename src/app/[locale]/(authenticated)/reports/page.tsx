import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { ReportsView } from "@/components/reports/ReportsView";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authData = await getCurrentUser();

  if (!authData || !authData.profile) {
    redirect(`/${locale}/login`);
  }

  if (authData.profile.role !== "admin") {
    redirect(`/${locale}/dashboard`);
  }

  const supabase = await createClient();

  // 1. Fetch tasks
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select(`
      *,
      task_group_assignments(
        group:groups(name)
      ),
      completions:task_completions(status)
    `)
    .is("archived_at", null);

  const tasks = (rawTasks || []).map((t: any) => ({
    ...t,
    assigned_groups: t.task_group_assignments?.map((g: any) => g.group) || [],
  }));

  // 2. Fetch students
  const { data: rawStudents } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student");

  const { data: memberships } = await supabase
    .from("group_members")
    .select("student_id, group:groups(name)")
    .is("left_at", null);

  const { data: completions } = await supabase
    .from("task_completions")
    .select("student_id, status");

  const students = (rawStudents || []).map((s) => {
    const sGroups = (memberships || [])
      .filter((m) => m.student_id === s.id && m.group)
      .map((m) => (m.group as any).name);
    const sCompletions = (completions || []).filter((c) => c.student_id === s.id);
    return {
      ...s,
      group_names: sGroups,
      total_assigned: sCompletions.length,
      completed_count: sCompletions.filter((c) => c.status === "completed").length,
    };
  });

  // 3. Fetch groups
  const { data: rawGroups } = await supabase
    .from("groups")
    .select(`
      *,
      leader:profiles!leader_id(full_name),
      members:group_members(left_at)
    `)
    .eq("is_active", true);

  const { data: groupAssignments } = await supabase
    .from("task_group_assignments")
    .select("group_id");

  const groupTaskCounts = new Map<string, number>();
  (groupAssignments || []).forEach((ga) => {
    groupTaskCounts.set(ga.group_id, (groupTaskCounts.get(ga.group_id) || 0) + 1);
  });

  const groups = (rawGroups || []).map((g) => ({
    ...g,
    tasks_count: groupTaskCounts.get(g.id) || 0,
  }));

  return <ReportsView tasks={tasks} students={students} groups={groups} />;
}
