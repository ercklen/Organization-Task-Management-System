"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ReportsViewProps {
  tasks: any[];
  students: any[];
  groups: any[];
}

export function ReportsView({ tasks, students, groups }: ReportsViewProps) {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");

  const downloadCsv = (filename: string, content: string) => {
    // Add BOM for proper UTF-8 handling in Excel for French and Arabic characters
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} téléchargé avec succès !`);
  };

  const exportTasksCsv = () => {
    const headers = ["ID", "Titre", "Priorite", "Date Limite", "Groupes Assignes", "Total Assignes", "Termines", "Taux Achevement (%)"];
    const rows = tasks.map((t) => {
      const completions = t.completions || [];
      const total = completions.length;
      const completed = completions.filter((c: any) => c.status === "completed").length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const groupNames = (t.assigned_groups || []).map((g: any) => g.name).join("; ");

      return [
        `"${t.id}"`,
        `"${(t.title || "").replace(/"/g, '""')}"`,
        `"${t.priority}"`,
        `"${t.due_date}"`,
        `"${groupNames.replace(/"/g, '""')}"`,
        total,
        completed,
        `${percent}%`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    downloadCsv(`taches_rapport_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  const exportStudentsCsv = () => {
    const headers = ["ID", "Nom Complet", "Email", "Groupes", "Taches Assignees", "Taches Terminees", "Taux Achevement (%)", "Statut"];
    const rows = students.map((s) => {
      const total = s.total_assigned || 0;
      const completed = s.completed_count || 0;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const groupNames = (s.group_names || []).join("; ");

      return [
        `"${s.id}"`,
        `"${(s.full_name || "").replace(/"/g, '""')}"`,
        `"${s.email}"`,
        `"${groupNames.replace(/"/g, '""')}"`,
        total,
        completed,
        `${percent}%`,
        s.is_active ? "Actif" : "Inactif",
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    downloadCsv(`etudiants_rapport_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  const exportGroupsCsv = () => {
    const headers = ["ID", "Nom du Groupe", "Responsable", "Nombre Membres", "Nombre Taches"];
    const rows = groups.map((g) => {
      const activeMembers = (g.members || []).filter((m: any) => !m.left_at).length;
      return [
        `"${g.id}"`,
        `"${(g.name || "").replace(/"/g, '""')}"`,
        `"${(g.leader?.full_name || "Aucun").replace(/"/g, '""')}"`,
        activeMembers,
        g.tasks_count || 0,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    downloadCsv(`groupes_rapport_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tasks Report Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">
              Rapport des Tâches
            </CardTitle>
            <CardDescription className="text-xs">
              Exportez l&apos;ensemble des tâches avec statuts et progressions individuelles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportTasksCsv} className="w-full gap-2 text-xs" variant="outline">
              <Download className="h-4 w-4" />
              <span>{t("exportTasks")}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Students Report Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">
              Rapport des Étudiants
            </CardTitle>
            <CardDescription className="text-xs">
              Exportez le suivi individuel, les taux d&apos;achèvement et appartenances aux groupes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportStudentsCsv} className="w-full gap-2 text-xs" variant="outline">
              <Download className="h-4 w-4" />
              <span>{t("exportStudents")}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Groups Report Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-2">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">
              Rapport des Groupes
            </CardTitle>
            <CardDescription className="text-xs">
              Exportez la structure des pôles, leaders et volumes de tâches associées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportGroupsCsv} className="w-full gap-2 text-xs" variant="outline">
              <Download className="h-4 w-4" />
              <span>{t("exportGroups")}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
