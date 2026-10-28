"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createGroupAction } from "@/actions/groups";
import { broadcastSync } from "@/components/realtime/RealtimeSync";
import { Profile } from "@/types";
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
import { Users2, Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  students: Profile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({
  students,
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await createGroupAction({
        name: name.trim(),
        description: description.trim() || undefined,
        leader_id: leaderId || undefined,
        member_ids: selectedMemberIds,
      });

      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        setIsSubmitting(false);
        return;
      }

      toast.success(tCommon("success"));
      onOpenChange(false);
      setName("");
      setDescription("");
      setLeaderId("");
      setSelectedMemberIds([]);
      broadcastSync("group_created");
      router.refresh();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2 text-primary">
              <Users2 className="h-5 w-5" />
              <DialogTitle className="text-lg">
                {t("createGroup")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {t("subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("fields.name")} *
              </label>
              <Input
                placeholder="Ex: Logistique / الخدمات اللوجستية"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("fields.description")}
              </label>
              <Textarea
                placeholder="Missions et responsabilités du pôle..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("fields.leaderId")}
              </label>
              <select
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t("noLeader")}</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-semibold text-foreground">
                {t("fields.members")}
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1">
                {students.map((student) => {
                  const isChecked = selectedMemberIds.includes(student.id);
                  return (
                    <button
                      type="button"
                      key={student.id}
                      onClick={() => toggleMember(student.id)}
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
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? tCommon("loading") : tCommon("create")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
