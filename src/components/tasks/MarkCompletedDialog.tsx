"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { completeTaskAction } from "@/actions/tasks";
import { broadcastSync } from "@/components/realtime/RealtimeSync";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Link2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface MarkCompletedDialogProps {
  taskId: string;
  taskTitle: string;
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MarkCompletedDialog({
  taskId,
  taskTitle,
  studentId,
  open,
  onOpenChange,
  onSuccess,
}: MarkCompletedDialogProps) {
  const t = useTranslations("tasks.modal");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await completeTaskAction({
        taskId,
        studentId,
        note,
        evidenceUrl,
      });

      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        setIsSubmitting(false);
        return;
      }

      toast.success(t("successMessage"));
      onOpenChange(false);
      setNote("");
      setEvidenceUrl("");
      broadcastSync("task_completed", { taskId, studentId });
      router.refresh();
      if (onSuccess) onSuccess();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <DialogTitle className="text-lg">
                {t("markCompleteTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              « {taskTitle} »
            </DialogDescription>
            <p className="text-xs text-muted-foreground mt-1">
              {t("markCompleteDesc")}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                {t("noteLabel")}
              </label>
              <Textarea
                placeholder={t("notePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                {t("evidenceLabel")}
              </label>
              <Input
                type="url"
                dir="ltr"
                placeholder={t("evidencePlaceholder")}
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                disabled={isSubmitting}
                className="ltr-only text-xs"
              />
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
              variant="success"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? t("submitting") : tCommon("confirm")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
