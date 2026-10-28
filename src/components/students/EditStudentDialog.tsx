"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { updateStudentAction } from "@/actions/students";
import { broadcastSync } from "@/components/realtime/RealtimeSync";
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
import { Input } from "@/components/ui/input";
import { Pencil, Mail, Lock, User, Globe, Users2, Check } from "lucide-react";
import { toast } from "sonner";

interface StudentWithStats extends Profile {
  group_names?: string[];
  group_ids?: string[];
  total_assigned?: number;
  completed_count?: number;
}

interface EditStudentDialogProps {
  student: StudentWithStats | null;
  groups: Group[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({
  student,
  groups,
  open,
  onOpenChange,
}: EditStudentDialogProps) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<"fr" | "ar">("fr");
  const [isActive, setIsActive] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFullName(student.full_name || "");
      setEmail(student.email || "");
      setPassword("");
      setLanguage((student.preferred_language as "fr" | "ar") || "fr");
      setIsActive(student.is_active ?? true);
      setSelectedGroupIds(student.group_ids || []);
    }
  }, [student]);

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await updateStudentAction({
        id: student.id,
        full_name: fullName.trim(),
        email: email.trim(),
        password: password.trim() ? password.trim() : undefined,
        preferred_language: language,
        is_active: isActive,
        group_ids: selectedGroupIds,
      });

      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        setIsSubmitting(false);
        return;
      }

      toast.success(tCommon("success"));
      onOpenChange(false);
      broadcastSync("student_updated", { studentId: student.id });
      router.refresh();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2 text-primary">
              <Pencil className="h-5 w-5" />
              <DialogTitle className="text-lg">
                {t("editStudent")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {t("editStudentSubtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Full Name */}
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

            {/* Email */}
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

            {/* New Password (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                {t("fields.newPassword")}
              </label>
              <Input
                type="password"
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="ltr-only text-sm font-mono"
              />
            </div>

            {/* Preferred Language & Account Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("fields.preferredLanguage")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage("fr")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-colors ${
                      language === "fr"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span>🇫🇷 Français</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("ar")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-colors ${
                      language === "ar"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span>🇲🇦 العربية</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("fields.status")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`flex items-center justify-center p-2 rounded-lg border text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span>{t("fields.active")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={`flex items-center justify-center p-2 rounded-lg border text-xs font-medium transition-colors ${
                      !isActive
                        ? "bg-destructive text-white border-destructive"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span>{t("fields.inactive")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Groups Selection */}
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5 text-primary" />
                {t("fields.assignedGroups")}
              </label>
              {groups.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Aucun groupe actif disponible.
                </p>
              ) : (
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
              )}
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
              <Pencil className="h-3.5 w-3.5" />
              <span>{isSubmitting ? tCommon("loading") : tCommon("save")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
