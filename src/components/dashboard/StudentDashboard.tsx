"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  CheckSquare,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  FileCheck2,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkCompletedDialog } from "@/components/tasks/MarkCompletedDialog";
import { formatDate, formatDateTime } from "@/lib/utils";

interface StudentDashboardProps {
  studentName: string;
  studentId: string;
  stats: {
    totalAssigned: number;
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    overdueCount: number;
    completionRate: number;
  };
  activeTasks: any[];
  completedHistory: any[];
}

export function StudentDashboard({
  studentName,
  studentId,
  stats,
  activeTasks,
  completedHistory,
}: StudentDashboardProps) {
  const t = useTranslations("dashboard");
  const tTasks = useTranslations("tasks");
  const locale = useLocale();

  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("welcome")} {studentName} !
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {t("studentSubtitle")}
        </p>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard
          title={t("stats.myTotalTasks")}
          value={stats.totalAssigned}
          icon={CheckSquare}
          color="primary"
        />
        <StatsCard
          title={t("stats.myPending")}
          value={stats.pendingCount}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title={t("stats.myInProgress")}
          value={stats.inProgressCount}
          icon={PlayCircle}
          color="indigo"
        />
        <StatsCard
          title={t("stats.myCompleted")}
          value={stats.completedCount}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title={t("stats.myOverdue")}
          value={stats.overdueCount}
          icon={AlertTriangle}
          color="rose"
        />
        <StatsCard
          title={t("stats.myCompletionRate")}
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {tTasks("myTasksTitle")}
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/tasks">
                <span>{tTasks("title")}</span>
                <ArrowRight className={`h-3.5 w-3.5 ms-1 ${locale === "ar" ? "rotate-180" : ""}`} />
              </Link>
            </Button>
          </div>

          {activeTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                <FileCheck2 className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-80" />
                <p className="font-medium text-foreground">Bravo ! Toutes vos tâches sont terminées.</p>
                <p className="text-xs mt-1">Vous n&apos;avez aucune tâche en attente pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task: any) => {
                const isOverdue = new Date(task.due_date) < new Date();
                const completion = task.my_completion || task.completions?.[0];
                const status = completion?.status || "pending";

                return (
                  <Card key={task.id} className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-base text-foreground">
                              {task.title}
                            </span>
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
                            {isOverdue && status !== "completed" && (
                              <Badge variant="destructive" className="text-[10px]">
                                {tTasks("statuses.overdue")}
                              </Badge>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                            <span>
                              {tTasks("fields.deadline")}:{" "}
                              <strong className="text-foreground">
                                {formatDate(task.due_date, locale)}
                              </strong>
                            </span>
                            {task.assigned_groups && task.assigned_groups.length > 0 && (
                              <span className="bg-muted px-2 py-0.5 rounded text-[11px]">
                                {task.assigned_groups.map((g: any) => g.name).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="shrink-0 flex items-center gap-2">
                          {status === "completed" ? (
                            <Badge variant="success" className="gap-1 py-1 px-3">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{tTasks("statuses.completed")}</span>
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                setSelectedTask({ id: task.id, title: task.title })
                              }
                              className="gap-1.5 shadow-sm text-xs"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>{tTasks("markCompleted")}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Completion History */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            {t("sections.recentCompletions")}
          </h2>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Historique personnel</CardTitle>
              <CardDescription className="text-xs">Vos dernières validations validées</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {completedHistory.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Aucun historique de tâche terminée.
                </div>
              ) : (
                completedHistory.slice(0, 5).map((comp: any) => (
                  <div key={comp.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground line-clamp-1">
                        {comp.task?.title || "Tâche"}
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 ms-2" />
                    </div>
                    {comp.completion_note && (
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                        « {comp.completion_note} »
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {comp.completed_at ? formatDateTime(comp.completed_at, locale) : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark As Completed Modal */}
      {selectedTask && (
        <MarkCompletedDialog
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          studentId={studentId}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </div>
  );
}
