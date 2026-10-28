import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { StudentsList } from "@/components/students/StudentsList";
import { Group } from "@/types";

export default async function StudentsPage({
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

  // 1. Fetch Students
  const { data: rawStudents } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  // 2. Fetch Groups
  const { data: rawGroups } = await supabase
    .from("groups")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // 3. Fetch Group Memberships
  const { data: memberships } = await supabase
    .from("group_members")
    .select("student_id, group:groups(id, name)")
    .is("left_at", null);

  // 4. Fetch Task Completions for students
  const { data: completions } = await supabase
    .from("task_completions")
    .select("student_id, status");

  const studentsWithStats = (rawStudents || []).map((student) => {
    const studentMemberships = (memberships || []).filter(
      (m) => m.student_id === student.id && m.group
    );
    const studentGroups = studentMemberships.map((m) => (m.group as any).name);
    const studentGroupIds = studentMemberships.map((m) => (m.group as any).id);

    const studentCompletions = (completions || []).filter((c) => c.student_id === student.id);
    const total = studentCompletions.length;
    const completed = studentCompletions.filter((c) => c.status === "completed").length;

    return {
      ...student,
      group_names: studentGroups,
      group_ids: studentGroupIds,
      total_assigned: total,
      completed_count: completed,
    };
  });

  return (
    <StudentsList
      students={studentsWithStats}
      groups={(rawGroups || []) as Group[]}
      initialCreateOpen={create === "true"}
    />
  );
}
