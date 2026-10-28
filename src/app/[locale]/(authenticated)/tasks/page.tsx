import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { TasksList } from "@/components/tasks/TasksList";
import { TaskWithDetails, Group, Profile } from "@/types";

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { locale } = await params;
  const { create } = await searchParams;

  const authData = await getCurrentUser();
  if (!authData || !authData.profile) {
    redirect(`/${locale}/login`);
  }

  const { profile } = authData;
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();

  // Fetch groups and students for filter and assignment options
  const { data: rawGroups } = await supabase
    .from("groups")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: rawStudents } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  const groups: Group[] = (rawGroups || []) as Group[];
  const students: Profile[] = (rawStudents || []) as Profile[];

  // Fetch tasks
  let tasksQuery = supabase
    .from("tasks")
    .select(`
      *,
      task_group_assignments(
        group:groups(id, name)
      ),
      task_completions(
        id,
        task_id,
        student_id,
        status,
        completion_note,
        evidence_url,
        completed_at,
        student:profiles(id, full_name, email)
      )
    `)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  // If not admin, RLS automatically restricts or we filter tasks
  const { data: rawTasks } = await tasksQuery;

  // Format tasks with assigned groups
  const tasks: TaskWithDetails[] = (rawTasks || []).map((t: any) => ({
    ...t,
    assigned_groups: t.task_group_assignments?.map((tga: any) => tga.group) || [],
    completions: t.task_completions || [],
  }));

  return (
    <TasksList
      tasks={tasks}
      groups={groups}
      students={students}
      currentUserId={profile.id}
      isAdmin={isAdmin}
      initialCreateOpen={create === "true" && isAdmin}
    />
  );
}
