"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { updateTaskAction } from "@/actions/tasks";
import { broadcastSync } from "@/components/realtime/RealtimeSync";
import { TaskWithDetails, Group, Profile } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Users, Users2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface EditTaskDialogProps {
  task: TaskWithDetails | null;
  groups: Group[];
  students: Profile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditTaskDialog({
  task,
  groups,
  students,
  open,
  onOpenChange,
  onSuccess,
}: EditTaskDialogProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      if (task.due_date) {
        const d = new Date(task.due_date);
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDueDate(formatted);
      } else {
        setDueDate("");
      }
      setSelectedGroupIds(task.assigned_groups?.map((g) => g.id) || []);
      setSelectedStudentIds(task.assigned_students?.map((s) => s.id) || []);
    }
  }, [task]);

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!title.trim() || !dueDate) {
      toast.error("Veuillez renseigner un titre et une date limite.");
      return;
    }

    if (selectedGroupIds.length === 0 && selectedStudentIds.length === 0) {
      toast.error("Veuillez assigner au moins un groupe ou un étudiant.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateTaskAction({
        id: task.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: new Date(dueDate).toISOString(),
        assigned_group_ids: selectedGroupIds,
        assigned_student_ids: selectedStudentIds,
      });

      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        setIsSubmitting(false);
        return;
      }

      toast.success(tCommon("success"));
      onOpenChange(false);
      broadcastSync("task_updated", { taskId: task.id });
      if (onSuccess) onSuccess();
      router.refresh();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2 text-primary">
              <Pencil className="h-5 w-5" />
              <DialogTitle className="text-lg">
                {t("editTask")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {t("editTaskSubtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("fields.title")} *
              </label>
              <Input
                placeholder="Ex: Préparer la logistique de la conférence"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
                className="text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("fields.description")}
              </label>
              <Textarea
                placeholder="Description détaillée des consignes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="text-xs"
              />
            </div>

            {/* Priority & Deadline row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t("fields.priority")}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="low">{t("priorities.low")}</option>
                  <option value="medium">{t("priorities.medium")}</option>
                  <option value="high">{t("priorities.high")}</option>
                  <option value="urgent">{t("priorities.urgent")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("fields.deadline")} *
                </label>
                <Input
                  type="datetime-local"
                  dir="ltr"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="ltr-only text-xs"
                />
              </div>
            </div>

            {/* Assign Groups Section */}
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5 text-primary" />
                {t("fields.assignedGroups")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                {groups.map((group) => {
                  const isChecked = selectedGroupIds.includes(group.id);
                  return (
                    <button
                      type="button"
                      key={group.id}
                      onClick={() => toggleGroup(group.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-start transition-colors ${
                        isChecked
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="truncate">{group.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assign Individual Students Section */}
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                {t("fields.assignedStudents")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                {students.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <button
                      type="button"
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-start transition-colors ${
                        isChecked
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="truncate">{student.full_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <Pencil className="h-4 w-4" />
              <span>{isSubmitting ? tCommon("loading") : tCommon("save")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
