"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Profile, Group } from "@/types";
import { CreateStudentDialog } from "./CreateStudentDialog";
import { toggleStudentStatusAction } from "@/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  UserX,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface StudentWithStats extends Profile {
  group_names?: string[];
  total_assigned?: number;
  completed_count?: number;
}

interface StudentsListProps {
  students: StudentWithStats[];
  groups: Group[];
  initialCreateOpen?: boolean;
}

export function StudentsList({
  students,
  groups,
  initialCreateOpen = false,
}: StudentsListProps) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");

  const [createOpen, setCreateOpen] = useState(initialCreateOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.full_name.toLowerCase().includes(q);
        const matchesEmail = s.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }

      if (selectedGroup !== "all") {
        if (!s.group_names?.some((gn) => gn.includes(selectedGroup))) {
          return false;
        }
      }

      return true;
    });
  }, [students, searchQuery, selectedGroup]);

  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    setIsToggling(studentId);
    try {
      const res = await toggleStudentStatusAction(studentId, currentStatus);
      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        return;
      }
      toast.success(tCommon("success"));
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm">
          <UserPlus className="h-4 w-4" />
          <span>{t("addStudent")}</span>
        </Button>
      </div>

      {/* Filter toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-10 text-sm"
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-xs w-full sm:w-56"
          >
            <option value="all">Tous les groupes</option>
            {groups.map((g) => (
              <option key={g.id} value={g.name.split("/")[0].trim()}>
                {g.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Users className="h-10 w-10 text-muted-foreground opacity-50" />
            <h3 className="text-base font-semibold text-foreground">
              {t("empty.title")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t("empty.description")}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.fullName")}</TableHead>
                <TableHead>{t("fields.assignedGroups")}</TableHead>
                <TableHead>{t("fields.preferredLanguage")}</TableHead>
                <TableHead>Tâches terminées</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const initials = student.full_name
                  ? student.full_name.slice(0, 2).toUpperCase()
                  : "ST";
                const total = student.total_assigned || 0;
                const completed = student.completed_count || 0;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 text-xs font-semibold">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {student.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {student.group_names && student.group_names.length > 0 ? (
                          student.group_names.map((gn, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] font-normal"
                            >
                              {gn.split("/")[0].trim()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Aucun groupe
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs uppercase font-mono">
                      {student.preferred_language === "ar" ? "🇲🇦 AR" : "🇫🇷 FR"}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-medium text-foreground">
                          {completed}/{total} ({percent}%)
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={student.is_active ? "success" : "destructive"}
                        className="text-[10px]"
                      >
                        {student.is_active ? t("fields.active") : t("fields.inactive")}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(student.id, student.is_active)}
                        disabled={isToggling === student.id}
                        className={`text-xs h-8 gap-1 ${
                          student.is_active
                            ? "text-destructive hover:bg-destructive/10"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {student.is_active ? (
                          <>
                            <UserX className="h-3.5 w-3.5" />
                            <span>{t("deactivateStudent")}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>{t("activateStudent")}</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Student Dialog */}
      <CreateStudentDialog
        groups={groups}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
