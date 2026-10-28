"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Users,
  Users2,
  CheckSquare,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import { DashboardCharts } from "./DashboardCharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatDate } from "@/lib/utils";

interface AdminDashboardProps {
  stats: {
    totalStudents: number;
    activeGroups: number;
    totalTasks: number;
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    overdueCount: number;
    overallRate: number;
  };
  groupChartData: { name: string; completionRate: number; totalTasks: number }[];
  statusChartData: { name: string; value: number; color: string }[];
  recentCompletions: any[];
  dueSoonTasks: any[];
  recentActivity: any[];
}

export function AdminDashboard({
  stats,
  groupChartData,
  statusChartData,
  recentCompletions,
  dueSoonTasks,
  recentActivity,
}: AdminDashboardProps) {
  const t = useTranslations("dashboard");
  const tTasks = useTranslations("tasks");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      {/* Top greeting and quick action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("adminTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("adminSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 shadow-sm">
            <Link href="/tasks?create=true">
              <Plus className="h-4 w-4" />
              <span>{t("quickActions.createTask")}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/groups?create=true">
              <Users2 className="h-4 w-4" />
              <span>{t("quickActions.createGroup")}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/students?create=true">
              <Users className="h-4 w-4" />
              <span>{t("quickActions.addStudent")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title={t("stats.totalStudents")}
          value={stats.totalStudents}
          icon={Users}
          color="indigo"
        />
        <StatsCard
          title={t("stats.activeGroups")}
          value={stats.activeGroups}
          icon={Users2}
          color="primary"
        />
        <StatsCard
          title={t("stats.totalTasks")}
          value={stats.totalTasks}
          icon={CheckSquare}
          color="primary"
        />
        <StatsCard
          title={t("stats.overallCompletionRate")}
          value={`${stats.overallRate}%`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatsCard
          title={t("stats.pendingTasks")}
          value={stats.pendingCount}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title={t("stats.inProgressTasks")}
          value={stats.inProgressCount}
          icon={PlayCircle}
          color="primary"
        />
        <StatsCard
          title={t("stats.completedAssignments")}
          value={stats.completedCount}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title={t("stats.overdueAssignments")}
          value={stats.overdueCount}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Analytics Charts */}
      <DashboardCharts
        groupData={groupChartData}
        statusData={statusChartData}
      />

      {/* Detail Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Task Completions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("sections.recentCompletions")}
              </CardTitle>
              <CardDescription className="text-xs">
                {recentCompletions.length} dernière(s) validation(s)
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
              <Link href="/tasks">
                <span>{tTasks("title")}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y">
            {recentCompletions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {t("sections.emptyCompletions")}
              </div>
            ) : (
              recentCompletions.slice(0, 5).map((comp: any) => (
                <div key={comp.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-tight text-foreground">
                      {comp.student?.full_name || "Étudiant"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span>{comp.task?.title || "Tâche"}</span>
                    </p>
                    {comp.completion_note && (
                      <p className="text-xs italic bg-muted/40 p-2 rounded text-muted-foreground border-s-2 border-primary">
                        « {comp.completion_note} »
                      </p>
                    )}
                  </div>
                  <div className="text-end shrink-0">
                    <Badge variant="success" className="text-[10px]">
                      {tTasks("statuses.completed")}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {comp.completed_at ? formatDateTime(comp.completed_at, locale) : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tasks Approaching Deadline & Overdue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("sections.tasksDueSoon")}
              </CardTitle>
              <CardDescription className="text-xs">
                Surveillance des échéances prioritaires
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
              <Link href="/tasks">
                <span>{tTasks("title")}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y">
            {dueSoonTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {t("sections.emptyDueSoon")}
              </div>
            ) : (
              dueSoonTasks.slice(0, 5).map((task: any) => {
                const isOverdue = new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {task.title}
                        </p>
                        <Badge
                          variant={
                            task.priority === "urgent"
                              ? "urgent"
                              : task.priority === "high"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px] uppercase"
                        >
                          {tTasks(`priorities.${task.priority}`)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tTasks("fields.deadline")}: {formatDate(task.due_date, locale)}
                      </p>
                    </div>

                    <div className="shrink-0 text-end">
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-[10px]">
                          {tTasks("statuses.overdue")}
                        </Badge>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          Échéance proche
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
