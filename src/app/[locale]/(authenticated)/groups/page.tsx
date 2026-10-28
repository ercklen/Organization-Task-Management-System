import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { GroupsList } from "@/components/groups/GroupsList";
import { Group, Profile } from "@/types";

export default async function GroupsPage({
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

  // Restrict to admin
  if (authData.profile.role !== "admin") {
    redirect(`/${locale}/dashboard`);
  }

  const supabase = await createClient();

  // 1. Fetch groups with leader and members
  const { data: rawGroups } = await supabase
    .from("groups")
    .select(`
      *,
      leader:profiles!leader_id(id, full_name, email),
      members:group_members(
        id,
        student_id,
        joined_at,
        left_at,
        student:profiles!student_id(id, full_name, email)
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // 2. Fetch all active students
  const { data: rawStudents } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  // 3. Fetch task assignments for groups
  const { data: groupTaskAssignments } = await supabase
    .from("task_group_assignments")
    .select("group_id, task:tasks(id, title, priority, due_date)");

  const groupTasksMap: Record<string, any[]> = {};
  (groupTaskAssignments || []).forEach((gta: any) => {
    if (!groupTasksMap[gta.group_id]) {
      groupTasksMap[gta.group_id] = [];
    }
    if (gta.task) {
      groupTasksMap[gta.group_id].push(gta.task);
    }
  });

  return (
    <GroupsList
      groups={(rawGroups || []) as Group[]}
      allStudents={(rawStudents || []) as Profile[]}
      groupTasksMap={groupTasksMap}
      initialCreateOpen={create === "true"}
    />
  );
}
