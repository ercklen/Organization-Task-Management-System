"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { addGroupMemberAction, removeGroupMemberAction, archiveGroupAction } from "@/actions/groups";
import { Group, Profile } from "@/types";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users2, UserPlus, Trash2, Archive, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface GroupDetailDialogProps {
  group: Group | null;
  allStudents: Profile[];
  groupTasks: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupDetailDialog({
  group,
  allStudents,
  groupTasks,
  open,
  onOpenChange,
}: GroupDetailDialogProps) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!group) return null;

  const activeMembers = (group.members || []).filter((m) => !m.left_at);
  const currentMemberStudentIds = activeMembers.map((m) => m.student_id);
  const nonMembers = allStudents.filter((s) => !currentMemberStudentIds.includes(s.id));

  const handleAddMember = async () => {
    if (!selectedStudentToAdd) return;
    setIsProcessing(true);

    try {
      const res = await addGroupMemberAction(group.id, selectedStudentToAdd);
      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        return;
      }
      toast.success(tCommon("success"));
      setSelectedStudentToAdd("");
      router.refresh();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMember = async (studentId: string) => {
    if (!confirm(t("members.confirmRemove"))) return;
    setIsProcessing(true);

    try {
      const res = await removeGroupMemberAction(group.id, studentId);
      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        return;
      }
      toast.success(tCommon("success"));
      router.refresh();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Voulez-vous archiver ce groupe ?")) return;
    setIsProcessing(true);

    try {
      const res = await archiveGroupAction(group.id);
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
      <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-primary">
            <Users2 className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">
              {group.name}
            </DialogTitle>
          </div>
          {group.description && (
            <DialogDescription className="text-xs text-foreground/80">
              {group.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Group Leader Indicator */}
        <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg text-xs">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="font-semibold">{t("leader")}:</span>
          <span className="text-muted-foreground">
            {group.leader?.full_name || t("noLeader")}
          </span>
        </div>

        {/* Add Member form */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-xs font-semibold text-foreground">
            {t("members.addMember")}
          </h4>
          <div className="flex items-center gap-2">
            <select
              value={selectedStudentToAdd}
              onChange={(e) => setSelectedStudentToAdd(e.target.value)}
              disabled={isProcessing}
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">{t("members.selectStudent")}</option>
              {nonMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.email})
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleAddMember}
              disabled={!selectedStudentToAdd || isProcessing}
              className="h-9 gap-1 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{tCommon("create")}</span>
            </Button>
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-semibold text-foreground">
              {t("members.title")}
            </h4>
            <span className="text-muted-foreground font-medium">
              {t("membersCount", { count: activeMembers.length })}
            </span>
          </div>

          <div className="divide-y border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {activeMembers.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {t("members.noMembers")}
              </div>
            ) : (
              activeMembers.map((m) => {
                const initials = m.student?.full_name
                  ? m.student.full_name.slice(0, 2).toUpperCase()
                  : "ST";
                const isLeader = group.leader_id === m.student_id;

                return (
                  <div
                    key={m.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 text-[10px]">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">
                            {m.student?.full_name}
                          </span>
                          {isLeader && (
                            <Badge variant="default" className="text-[9px] px-1 py-0">
                              Responsable
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {m.student?.email}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(m.student_id)}
                      disabled={isProcessing}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assigned Tasks Summary */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-xs font-semibold text-foreground">
            Tâches assignées à ce groupe ({groupTasks.length})
          </h4>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {groupTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune tâche assignée à ce groupe.</p>
            ) : (
              groupTasks.map((t) => (
                <div key={t.id} className="p-2 rounded border bg-card text-xs flex items-center justify-between">
                  <span className="font-medium text-foreground truncate">{t.title}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0 ms-2">
                    {t.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between pt-4 border-t gap-2">
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
