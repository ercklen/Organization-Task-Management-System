"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { reopenTaskAction, archiveTaskAction } from "@/actions/tasks";
import { TaskWithDetails, Profile } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  RotateCcw,
  Archive,
  ExternalLink,
  Users,
  Calendar,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface TaskDetailDialogProps {
  task: TaskWithDetails | null;
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({
  task,
  isAdmin,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);

  if (!task) return null;

  const completions = task.completions || [];
  const totalAssigned = completions.length;
  const completedCount = completions.filter((c) => c.status === "completed").length;
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
  const isOverdue = new Date(task.due_date) < new Date();

  const handleReopen = async (studentId: string) => {
    if (!confirm(t("reopenConfirm"))) return;
    setIsProcessing(true);

    try {
      const res = await reopenTaskAction(task.id, studentId);
      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        return;
      }
      toast.success(tCommon("success"));
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Voulez-vous archiver cette tâche ?")) return;
    setIsProcessing(true);

    try {
      const res = await archiveTaskAction(task.id);
      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        return;
      }
      toast.success(tCommon("success"));
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant={
                task.priority === "urgent"
                  ? "urgent"
                  : task.priority === "high"
                  ? "destructive"
                  : "secondary"
              }
              className="text-xs uppercase"
            >
              {t(`priorities.${task.priority}`)}
            </Badge>

            {isOverdue && completedCount < totalAssigned && (
              <Badge variant="destructive" className="text-xs">
                {t("statuses.overdue")}
              </Badge>
            )}
          </div>

          <DialogTitle className="text-xl font-bold leading-tight">
            {task.title}
          </DialogTitle>
          {task.description && (
            <DialogDescription className="text-xs text-foreground/80 whitespace-pre-wrap">
              {task.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Task Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-y border-border text-xs">
          <div>
            <span className="text-muted-foreground block">{t("fields.deadline")}</span>
            <strong className="text-foreground">{formatDate(task.due_date, locale)}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block">Taux d&apos;achèvement</span>
            <strong className="text-emerald-600 font-bold">{completionRate}% ({completedCount}/{totalAssigned})</strong>
          </div>
          {task.assigned_groups && task.assigned_groups.length > 0 && (
            <div className="col-span-2 sm:col-span-1">
              <span className="text-muted-foreground block">{t("fields.assignedGroups")}</span>
              <strong className="text-foreground truncate block">
                {task.assigned_groups.map((g) => g.name).join(", ")}
              </strong>
            </div>
          )}
        </div>

        {/* Individual Student Progress Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>{t("progress.studentsProgress")}</span>
            </h4>
            <span className="text-xs font-medium text-muted-foreground">
              {t("progress.ratio", { completed: completedCount, total: totalAssigned })}
            </span>
          </div>

          <div className="divide-y border rounded-xl overflow-hidden bg-card">
            {completions.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {t("progress.noAssignedStudents")}
              </div>
            ) : (
              completions.map((comp) => {
                const isCompleted = comp.status === "completed";
                const isInProgress = comp.status === "in_progress";

                return (
                  <div key={comp.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {comp.student?.full_name || "Étudiant"}
                        </span>
                        <Badge
                          variant={
                            isCompleted
                              ? "success"
                              : isInProgress
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {t(`statuses.${comp.status}`)}
                        </Badge>
                      </div>

                      {comp.completion_note && (
                        <p className="italic text-muted-foreground bg-muted/40 p-2 rounded border-s-2 border-emerald-500">
                          « {comp.completion_note} »
                        </p>
                      )}

                      {comp.evidence_url && (
                        <a
                          href={comp.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Voir le justificatif</span>
                        </a>
                      )}

                      {comp.completed_at && (
                        <p className="text-[10px] text-muted-foreground">
                          Validé le : {formatDateTime(comp.completed_at, locale)}
                        </p>
                      )}
                    </div>

                    {/* Admin Action: Reopen task for this student */}
                    {isAdmin && isCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(comp.student_id)}
                        disabled={isProcessing}
                        className="text-xs h-7 gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>{t("reopenTask")}</span>
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between pt-4 border-t gap-2">
          {isAdmin && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleArchive}
              disabled={isProcessing}
              className="gap-1.5 text-xs"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>{tCommon("archive")}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
