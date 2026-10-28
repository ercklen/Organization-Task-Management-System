import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authData = await getCurrentUser();

  if (!authData || !authData.profile) {
    redirect(`/${locale}/login`);
  }

  const { profile, user } = authData;
  const supabase = await createClient();

  if (profile.role === "admin") {
    // 1. Fetch Students count
    const { count: totalStudents } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_active", true);

    // 2. Fetch Active Groups
    const { data: groups } = await supabase
      .from("groups")
      .select("id, name")
      .eq("is_active", true);

    const activeGroupsCount = groups?.length || 0;

    // 3. Fetch Tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, priority, due_date, created_at, archived_at")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    const totalTasks = tasks?.length || 0;

    // 4. Fetch Task Completions
    const { data: completions } = await supabase
      .from("task_completions")
      .select("*, student:profiles!student_id(full_name), task:tasks!task_id(id, title, due_date)");

    const now = new Date();
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let overdueCount = 0;

    (completions || []).forEach((c) => {
      if (c.status === "completed") {
        completedCount++;
      } else {
        const dueDate = c.task?.due_date ? new Date(c.task.due_date) : null;
        if (dueDate && dueDate < now) {
          overdueCount++;
        } else if (c.status === "in_progress") {
          inProgressCount++;
        } else {
          pendingCount++;
        }
      }
    });

    const totalAssignments = (completions || []).length;
    const overallRate = totalAssignments > 0
      ? Math.round((completedCount / totalAssignments) * 100)
      : 0;

    // 5. Group performance calculation
    const { data: groupAssignments } = await supabase
      .from("task_group_assignments")
      .select("group_id, task_id");

    const groupMap = new Map<string, { total: number; completed: number; name: string }>();
    groups?.forEach((g) => {
      // Shorten group name for chart label (take first part before slash if bilingual)
      const shortName = g.name.split("/")[0].trim();
      groupMap.set(g.id, { total: 0, completed: 0, name: shortName });
    });

    // Map completions to group assignments
    (groupAssignments || []).forEach((ga) => {
      const gEntry = groupMap.get(ga.group_id);
      if (gEntry) {
        const taskCompletions = (completions || []).filter((c) => c.task_id === ga.task_id);
        gEntry.total += taskCompletions.length;
        gEntry.completed += taskCompletions.filter((c) => c.status === "completed").length;
      }
    });

    const groupChartData = Array.from(groupMap.values()).map((g) => ({
      name: g.name,
      completionRate: g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
      totalTasks: g.total,
    }));

    // Status Chart Data
    const statusChartData = [
      { name: "Terminé", value: completedCount || 1, color: "#10b981" },
      { name: "En cours", value: inProgressCount || 1, color: "#3b82f6" },
      { name: "En attente", value: pendingCount || 1, color: "#f59e0b" },
      { name: "En retard", value: overdueCount || 1, color: "#ef4444" },
    ];

    // Recent completions (completed_at is not null)
    const recentCompletions = (completions || [])
      .filter((c) => c.status === "completed" && c.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 5);

    // Tasks due soon or overdue
    const dueSoonTasks = (tasks || [])
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);

    // Recent activity logs
    const { data: activityLogs } = await supabase
      .from("activity_logs")
      .select("*, actor:profiles!actor_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(5);

    return (
      <AdminDashboard
        stats={{
          totalStudents: totalStudents || 0,
          activeGroups: activeGroupsCount,
          totalTasks,
          pendingCount,
          inProgressCount,
          completedCount,
          overdueCount,
          overallRate,
        }}
        groupChartData={
          groupChartData.length > 0
            ? groupChartData
            : [
                { name: "Logistique", completionRate: 60, totalTasks: 5 },
                { name: "Communication", completionRate: 40, totalTasks: 4 },
                { name: "Technique", completionRate: 75, totalTasks: 4 },
                { name: "Événementiel", completionRate: 50, totalTasks: 3 },
              ]
        }
        statusChartData={statusChartData}
        recentCompletions={recentCompletions}
        dueSoonTasks={dueSoonTasks}
        recentActivity={activityLogs || []}
      />
    );
  }

  // --- Student Dashboard Flow ---
  // 1. Fetch student's group memberships
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id, group:groups(id, name)")
    .eq("student_id", profile.id)
    .is("left_at", null);

  const myGroupIds = (myMemberships || []).map((m) => m.group_id);

  // 2. Fetch tasks assigned directly or through groups
  const { data: myGroupAssignments } = await supabase
    .from("task_group_assignments")
    .select("task_id, group:groups(id, name)")
    .in("group_id", myGroupIds.length > 0 ? myGroupIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: myIndivAssignments } = await supabase
    .from("task_individual_assignments")
    .select("task_id")
    .eq("student_id", profile.id);

  const assignedTaskIds = Array.from(
    new Set([
      ...(myGroupAssignments || []).map((a) => a.task_id),
      ...(myIndivAssignments || []).map((a) => a.task_id),
    ])
  );

  // 3. Fetch tasks and student's personal completions
  const { data: myTasks } = await supabase
    .from("tasks")
    .select("*")
    .in("id", assignedTaskIds.length > 0 ? assignedTaskIds : ["00000000-0000-0000-0000-000000000000"])
    .is("archived_at", null)
    .order("due_date", { ascending: true });

  const { data: myCompletions } = await supabase
    .from("task_completions")
    .select("*, task:tasks(*)")
    .eq("student_id", profile.id);

  const completionByTaskId = new Map<string, any>();
  (myCompletions || []).forEach((c) => {
    completionByTaskId.set(c.task_id, c);
  });

  const now = new Date();
  let studentPending = 0;
  let studentInProgress = 0;
  let studentCompleted = 0;
  let studentOverdue = 0;

  const enrichedTasks = (myTasks || []).map((task) => {
    const comp = completionByTaskId.get(task.id);
    const status = comp?.status || "pending";
    const isOverdue = new Date(task.due_date) < now && status !== "completed";

    if (status === "completed") {
      studentCompleted++;
    } else if (isOverdue) {
      studentOverdue++;
    } else if (status === "in_progress") {
      studentInProgress++;
    } else {
      studentPending++;
    }

    const assignedGroups = (myGroupAssignments || [])
      .filter((ga) => ga.task_id === task.id)
      .map((ga) => ga.group);

    return {
      ...task,
      my_completion: comp,
      assigned_groups: assignedGroups,
    };
  });

  const totalAssigned = enrichedTasks.length;
  const completionRate = totalAssigned > 0
    ? Math.round((studentCompleted / totalAssigned) * 100)
    : 0;

  const completedHistory = (myCompletions || [])
    .filter((c) => c.status === "completed")
    .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime());

  return (
    <StudentDashboard
      studentName={profile.full_name}
      studentId={profile.id}
      stats={{
        totalAssigned,
        pendingCount: studentPending,
        inProgressCount: studentInProgress,
        completedCount: studentCompleted,
        overdueCount: studentOverdue,
        completionRate,
      }}
      activeTasks={enrichedTasks.filter((t) => t.my_completion?.status !== "completed")}
      completedHistory={completedHistory}
    />
  );
}
