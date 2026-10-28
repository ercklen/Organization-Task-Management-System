"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createStudentAction } from "@/actions/students";
import { Group } from "@/types";
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
import { UserPlus, Mail, Lock, User, Globe, Users2 } from "lucide-react";
import { toast } from "sonner";

interface CreateStudentDialogProps {
  groups: Group[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStudentDialog({
  groups,
  open,
  onOpenChange,
}: CreateStudentDialogProps) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("StudentPassword123!");
  const [language, setLanguage] = useState<"fr" | "ar">("fr");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await createStudentAction({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        preferred_language: language,
        group_ids: selectedGroupIds,
      });

      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        setIsSubmitting(false);
        return;
      }

      toast.success(tCommon("success"));
      onOpenChange(false);
      setFullName("");
      setEmail("");
      setSelectedGroupIds([]);
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
              <UserPlus className="h-5 w-5" />
              <DialogTitle className="text-lg">
                {t("addStudent")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {t("subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {t("fields.fullName")} *
              </label>
              <Input
                placeholder="Ex: Ahmed Mansouri"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isSubmitting}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {t("fields.email")} *
              </label>
              <Input
                type="email"
                dir="ltr"
                placeholder="etudiant@taskflow.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="ltr-only text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                {t("fields.password")}
              </label>
              <Input
                type="text"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="ltr-only text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {t("fields.preferredLanguage")}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="fr">Français (LTR)</option>
                <option value="ar">العربية (RTL)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5 text-primary" />
                {t("fields.assignedGroups")}
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1">
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
              <UserPlus className="h-4 w-4" />
              <span>{isSubmitting ? tCommon("loading") : tCommon("create")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
