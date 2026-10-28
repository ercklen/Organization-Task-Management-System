"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Download,
  Users,
  ClipboardList,
  Layers,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ReportsViewProps {
  tasks: any[];
  students: any[];
  groups: any[];
}

// ---------- helpers ----------
const today = () => new Date().toISOString().slice(0, 10);

const priorityLabel: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Faible",
};

const statusLabel: Record<string, string> = {
  completed: "Terminée",
  in_progress: "En cours",
  pending: "En attente",
};

/** Apply a header style to a range of cells */
function styleHeader(ws: XLSX.WorkSheet, range: string, bgColor: string) {
  const ref = XLSX.utils.decode_range(range);
  for (let C = ref.s.c; C <= ref.e.c; C++) {
    const cellAddr = XLSX.utils.encode_cell({ r: ref.s.r, c: C });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: bgColor }, patternType: "solid" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };
  }
}

/** Style data rows (alternating) */
function styleDataRows(ws: XLSX.WorkSheet, startRow: number, endRow: number, cols: number) {
  for (let R = startRow; R <= endRow; R++) {
    for (let C = 0; C < cols; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
      const isEven = (R - startRow) % 2 === 0;
      ws[cellAddr].s = {
        fill: { fgColor: { rgb: isEven ? "F8FAFC" : "FFFFFF" }, patternType: "solid" },
        alignment: { vertical: "center", wrapText: true },
        border: {
          top: { style: "hair", color: { rgb: "E2E8F0" } },
          bottom: { style: "hair", color: { rgb: "E2E8F0" } },
          left: { style: "hair", color: { rgb: "E2E8F0" } },
          right: { style: "hair", color: { rgb: "E2E8F0" } },
        },
      };
    }
  }
}

/** Add a meta row (report title) */
function addMetaRows(ws: XLSX.WorkSheet, title: string, subtitle: string, cols: number) {
  // Row 0: title
  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[titleCell] = {
    t: "s",
    v: title,
    s: {
      font: { bold: true, sz: 14, color: { rgb: "1E3A5F" } },
      alignment: { horizontal: "left", vertical: "center" },
    },
  };
  // Row 1: generated date
  const dateCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
  ws[dateCell] = {
    t: "s",
    v: subtitle,
    s: {
      font: { italic: true, sz: 10, color: { rgb: "64748B" } },
      alignment: { horizontal: "left", vertical: "center" },
    },
  };
  // Merge title across all columns
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: cols - 1 } });
  ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: cols - 1 } });
}

/** Trigger browser download of a workbook */
function downloadXlsx(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { bookType: "xlsx", cellStyles: true });
}

// ============================================================
//  EXPORT 1: Rapport des Tâches
// ============================================================
function buildTasksWorkbook(tasks: any[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const dateStr = today();
  const genLabel = `Généré le ${dateStr} — TaskFlow`;

  /* ---- Sheet 1: Vue d'ensemble ---- */
  const summaryData: any[][] = [
    [],  // meta row 0
    [],  // meta row 1
    [
      "ID Tâche",
      "Titre",
      "Priorité",
      "Date Limite",
      "Groupes Assignés",
      "Total Assignés",
      "Terminées",
      "En Cours",
      "En Attente",
      "Taux d'Achèvement (%)",
      "Créée le",
    ],
  ];

  tasks.forEach((t: any) => {
    const comps = t.completions || [];
    const total = comps.length;
    const completed = comps.filter((c: any) => c.status === "completed").length;
    const inProgress = comps.filter((c: any) => c.status === "in_progress").length;
    const pending = comps.filter((c: any) => c.status === "pending").length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    summaryData.push([
      t.id,
      t.title || "",
      priorityLabel[t.priority] || t.priority || "",
      t.due_date || "",
      (t.assigned_groups || []).join(" | "),
      total,
      completed,
      inProgress,
      pending,
      pct,
      t.created_at ? t.created_at.slice(0, 10) : "",
    ]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(summaryData);
  addMetaRows(wsOverview, "📋 Rapport des Tâches — Vue d'ensemble", genLabel, 11);
  styleHeader(wsOverview, `A3:K3`, "2563EB");
  styleDataRows(wsOverview, 3, summaryData.length - 1, 11);
  wsOverview["!cols"] = [
    { wch: 38 }, { wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 28 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 14 },
  ];
  wsOverview["!rows"] = [{ hpx: 22 }, { hpx: 16 }, { hpx: 24 }];

  XLSX.utils.book_append_sheet(wb, wsOverview, "Vue d'ensemble");

  /* ---- Sheet 2: Détail par tâche + étudiant ---- */
  const detailData: any[][] = [
    [],
    [],
    [
      "Tâche",
      "Priorité",
      "Date Limite",
      "Étudiant",
      "Email",
      "Statut",
      "Terminé le",
    ],
  ];

  tasks.forEach((t: any) => {
    const comps = t.completions || [];
    if (comps.length === 0) {
      detailData.push([t.title, priorityLabel[t.priority] || t.priority, t.due_date, "—", "—", "Aucun assigné", ""]);
    } else {
      comps.forEach((c: any) => {
        detailData.push([
          t.title,
          priorityLabel[t.priority] || t.priority,
          t.due_date || "",
          c.student?.full_name || "—",
          c.student?.email || "—",
          statusLabel[c.status] || c.status,
          c.completed_at ? c.completed_at.slice(0, 10) : "—",
        ]);
      });
    }
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  addMetaRows(wsDetail, "📋 Rapport des Tâches — Détail par étudiant", genLabel, 7);
  styleHeader(wsDetail, "A3:G3", "7C3AED");
  styleDataRows(wsDetail, 3, detailData.length - 1, 7);
  wsDetail["!cols"] = [
    { wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 26 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, wsDetail, "Détail Étudiants");

  /* ---- Sheet 3: Statistiques résumées ---- */
  const totalTasks = tasks.length;
  const highPriority = tasks.filter((t) => t.priority === "high").length;
  const medPriority = tasks.filter((t) => t.priority === "medium").length;
  const lowPriority = tasks.filter((t) => t.priority === "low").length;
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date()).length;
  const allCompletions = tasks.flatMap((t) => t.completions || []);
  const globalCompleted = allCompletions.filter((c) => c.status === "completed").length;
  const globalRate = allCompletions.length > 0
    ? Math.round((globalCompleted / allCompletions.length) * 100) : 0;

  const statsData: any[][] = [
    [],
    [],
    ["Indicateur", "Valeur"],
    ["Total des tâches actives", totalTasks],
    ["Tâches priorité Haute", highPriority],
    ["Tâches priorité Moyenne", medPriority],
    ["Tâches priorité Faible", lowPriority],
    ["Tâches en retard (date dépassée)", overdue],
    ["Total assignations étudiants", allCompletions.length],
    ["Assignations terminées", globalCompleted],
    ["Taux d'achèvement global (%)", globalRate],
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsData);
  addMetaRows(wsStats, "📊 Statistiques Globales des Tâches", genLabel, 2);
  styleHeader(wsStats, "A3:B3", "0F766E");
  styleDataRows(wsStats, 3, statsData.length - 1, 2);
  wsStats["!cols"] = [{ wch: 38 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsStats, "Statistiques");

  return wb;
}

// ============================================================
//  EXPORT 2: Rapport des Étudiants
// ============================================================
function buildStudentsWorkbook(students: any[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const dateStr = today();
  const genLabel = `Généré le ${dateStr} — TaskFlow`;

  /* ---- Sheet 1: Suivi individuel ---- */
  const rows: any[][] = [
    [],
    [],
    [
      "Nom Complet",
      "Email",
      "Groupes",
      "Langue",
      "Statut Compte",
      "Tâches Assignées",
      "Terminées",
      "En Cours",
      "En Attente",
      "Taux d'Achèvement (%)",
      "Inscription",
    ],
  ];

  students.forEach((s: any) => {
    const total = s.total_assigned || 0;
    const completed = s.completed_count || 0;
    const inProgress = s.in_progress_count || 0;
    const pending = s.pending_count || 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    rows.push([
      s.full_name || "",
      s.email || "",
      (s.group_names || []).join(" | "),
      s.preferred_language === "ar" ? "Arabe" : "Français",
      s.is_active ? "Actif" : "Inactif",
      total,
      completed,
      inProgress,
      pending,
      pct,
      s.created_at ? s.created_at.slice(0, 10) : "",
    ]);
  });

  const wsTracking = XLSX.utils.aoa_to_sheet(rows);
  addMetaRows(wsTracking, "👥 Rapport des Étudiants — Suivi individuel", genLabel, 11);
  styleHeader(wsTracking, "A3:K3", "059669");
  styleDataRows(wsTracking, 3, rows.length - 1, 11);
  wsTracking["!cols"] = [
    { wch: 26 }, { wch: 28 }, { wch: 24 }, { wch: 10 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTracking, "Suivi individuel");

  /* ---- Sheet 2: Classement par taux d'achèvement ---- */
  const ranked = [...students]
    .filter((s) => s.total_assigned > 0)
    .sort((a, b) => {
      const pa = a.total_assigned > 0 ? (a.completed_count / a.total_assigned) : 0;
      const pb = b.total_assigned > 0 ? (b.completed_count / b.total_assigned) : 0;
      return pb - pa;
    });

  const rankRows: any[][] = [
    [],
    [],
    ["Rang", "Nom Complet", "Email", "Terminées", "Total", "Taux d'Achèvement (%)"],
  ];

  ranked.forEach((s, i) => {
    const pct = s.total_assigned > 0 ? Math.round((s.completed_count / s.total_assigned) * 100) : 0;
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
    rankRows.push([medal, s.full_name, s.email, s.completed_count, s.total_assigned, pct]);
  });

  const wsRank = XLSX.utils.aoa_to_sheet(rankRows);
  addMetaRows(wsRank, "🏆 Classement des Étudiants par Performance", genLabel, 6);
  styleHeader(wsRank, "A3:F3", "D97706");
  styleDataRows(wsRank, 3, rankRows.length - 1, 6);
  wsRank["!cols"] = [{ wch: 8 }, { wch: 26 }, { wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsRank, "Classement");

  /* ---- Sheet 3: Statistiques étudiants ---- */
  const totalStudents = students.length;
  const active = students.filter((s) => s.is_active).length;
  const inactive = totalStudents - active;
  const withTasks = students.filter((s) => s.total_assigned > 0).length;
  const noTasks = totalStudents - withTasks;
  const avgRate = students.filter((s) => s.total_assigned > 0).reduce((sum, s) => {
    return sum + Math.round((s.completed_count / s.total_assigned) * 100);
  }, 0) / (withTasks || 1);

  const statsRows: any[][] = [
    [],
    [],
    ["Indicateur", "Valeur"],
    ["Total étudiants", totalStudents],
    ["Comptes actifs", active],
    ["Comptes désactivés", inactive],
    ["Étudiants avec tâches assignées", withTasks],
    ["Étudiants sans tâche", noTasks],
    ["Taux d'achèvement moyen (%)", Math.round(avgRate)],
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
  addMetaRows(wsStats, "📊 Statistiques des Étudiants", genLabel, 2);
  styleHeader(wsStats, "A3:B3", "0F766E");
  styleDataRows(wsStats, 3, statsRows.length - 1, 2);
  wsStats["!cols"] = [{ wch: 38 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsStats, "Statistiques");

  return wb;
}

// ============================================================
//  EXPORT 3: Rapport des Groupes
// ============================================================
function buildGroupsWorkbook(groups: any[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const dateStr = today();
  const genLabel = `Généré le ${dateStr} — TaskFlow`;

  /* ---- Sheet 1: Vue d'ensemble groupes ---- */
  const rows: any[][] = [
    [],
    [],
    [
      "Nom du Groupe",
      "Description",
      "Responsable",
      "Email Responsable",
      "Membres Actifs",
      "Tâches Assignées",
    ],
  ];

  groups.forEach((g: any) => {
    rows.push([
      g.name || "",
      g.description || "",
      g.leader?.full_name || "Aucun",
      g.leader?.email || "—",
      (g.active_members || []).length,
      (g.task_assignments || []).length,
    ]);
  });

  const wsGroups = XLSX.utils.aoa_to_sheet(rows);
  addMetaRows(wsGroups, "📁 Rapport des Groupes — Vue d'ensemble", genLabel, 6);
  styleHeader(wsGroups, "A3:F3", "6D28D9");
  styleDataRows(wsGroups, 3, rows.length - 1, 6);
  wsGroups["!cols"] = [
    { wch: 24 }, { wch: 32 }, { wch: 24 }, { wch: 28 }, { wch: 14 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGroups, "Vue d'ensemble");

  /* ---- Sheet 2: Membres par groupe ---- */
  const memberRows: any[][] = [
    [],
    [],
    ["Groupe", "Membre", "Email Membre"],
  ];

  groups.forEach((g: any) => {
    const members = g.active_members || [];
    if (members.length === 0) {
      memberRows.push([g.name, "— Aucun membre —", ""]);
    } else {
      members.forEach((m: any) => {
        memberRows.push([
          g.name,
          m.student?.full_name || "—",
          m.student?.email || "—",
        ]);
      });
    }
  });

  const wsMembers = XLSX.utils.aoa_to_sheet(memberRows);
  addMetaRows(wsMembers, "📁 Rapport des Groupes — Liste des Membres", genLabel, 3);
  styleHeader(wsMembers, "A3:C3", "BE185D");
  styleDataRows(wsMembers, 3, memberRows.length - 1, 3);
  wsMembers["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsMembers, "Membres");

  /* ---- Sheet 3: Tâches par groupe ---- */
  const taskRows: any[][] = [
    [],
    [],
    ["Groupe", "Tâche", "Priorité", "Date Limite"],
  ];

  groups.forEach((g: any) => {
    const assignments = g.task_assignments || [];
    if (assignments.length === 0) {
      taskRows.push([g.name, "— Aucune tâche —", "", ""]);
    } else {
      assignments.forEach((a: any) => {
        taskRows.push([
          g.name,
          a.task?.title || "—",
          priorityLabel[a.task?.priority] || a.task?.priority || "",
          a.task?.due_date || "",
        ]);
      });
    }
  });

  const wsTasks = XLSX.utils.aoa_to_sheet(taskRows);
  addMetaRows(wsTasks, "📁 Rapport des Groupes — Tâches Assignées", genLabel, 4);
  styleHeader(wsTasks, "A3:D3", "0369A1");
  styleDataRows(wsTasks, 3, taskRows.length - 1, 4);
  wsTasks["!cols"] = [{ wch: 24 }, { wch: 32 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsTasks, "Tâches par groupe");

  return wb;
}

// ============================================================
//  EXPORT 4: Rapport Complet (tout-en-un)
// ============================================================
function buildFullWorkbook(tasks: any[], students: any[], groups: any[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const dateStr = today();
  const genLabel = `Généré le ${dateStr} — TaskFlow`;

  // Summary sheet
  const summaryRows: any[][] = [
    [],
    [],
    ["Section", "Indicateur", "Valeur"],
    ["Organisation", "Total Étudiants", students.length],
    ["Organisation", "Étudiants Actifs", students.filter((s) => s.is_active).length],
    ["Organisation", "Total Groupes", groups.length],
    ["Organisation", "Total Tâches Actives", tasks.length],
    ["Performance", "Total Assignations", tasks.flatMap((t) => t.completions || []).length],
    [
      "Performance",
      "Tâches Terminées",
      tasks.flatMap((t) => t.completions || []).filter((c) => c.status === "completed").length,
    ],
    [
      "Performance",
      "Taux Global d'Achèvement (%)",
      (() => {
        const all = tasks.flatMap((t) => t.completions || []);
        return all.length > 0
          ? Math.round((all.filter((c) => c.status === "completed").length / all.length) * 100)
          : 0;
      })(),
    ],
    ["Tâches", "Priorité Haute", tasks.filter((t) => t.priority === "high").length],
    ["Tâches", "Priorité Moyenne", tasks.filter((t) => t.priority === "medium").length],
    ["Tâches", "Priorité Faible", tasks.filter((t) => t.priority === "low").length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  addMetaRows(wsSummary, "📊 Rapport Complet — Tableau de Bord", genLabel, 3);
  styleHeader(wsSummary, "A3:C3", "1E3A5F");
  styleDataRows(wsSummary, 3, summaryRows.length - 1, 3);
  wsSummary["!cols"] = [{ wch: 18 }, { wch: 34 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Tableau de Bord");

  // Quick copy of tasks overview sheet
  const taskRows: any[][] = [
    [],
    [],
    ["Titre", "Priorité", "Date Limite", "Groupes", "Total", "Terminées", "Taux (%)"],
  ];
  tasks.forEach((t: any) => {
    const comps = t.completions || [];
    const total = comps.length;
    const completed = comps.filter((c: any) => c.status === "completed").length;
    taskRows.push([
      t.title,
      priorityLabel[t.priority] || t.priority,
      t.due_date || "",
      (t.assigned_groups || []).join(" | "),
      total,
      completed,
      total > 0 ? Math.round((completed / total) * 100) : 0,
    ]);
  });

  const wsTasks = XLSX.utils.aoa_to_sheet(taskRows);
  addMetaRows(wsTasks, "📋 Tâches", genLabel, 7);
  styleHeader(wsTasks, "A3:G3", "2563EB");
  styleDataRows(wsTasks, 3, taskRows.length - 1, 7);
  wsTasks["!cols"] = [
    { wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTasks, "Tâches");

  // Students overview
  const stuRows: any[][] = [
    [],
    [],
    ["Nom", "Email", "Groupes", "Statut", "Terminées", "Total", "Taux (%)"],
  ];
  students.forEach((s: any) => {
    const pct = s.total_assigned > 0 ? Math.round((s.completed_count / s.total_assigned) * 100) : 0;
    stuRows.push([
      s.full_name,
      s.email,
      (s.group_names || []).join(" | "),
      s.is_active ? "Actif" : "Inactif",
      s.completed_count,
      s.total_assigned,
      pct,
    ]);
  });

  const wsStu = XLSX.utils.aoa_to_sheet(stuRows);
  addMetaRows(wsStu, "👥 Étudiants", genLabel, 7);
  styleHeader(wsStu, "A3:G3", "059669");
  styleDataRows(wsStu, 3, stuRows.length - 1, 7);
  wsStu["!cols"] = [
    { wch: 26 }, { wch: 28 }, { wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStu, "Étudiants");

  // Groups overview
  const grpRows: any[][] = [
    [],
    [],
    ["Groupe", "Responsable", "Membres", "Tâches"],
  ];
  groups.forEach((g: any) => {
    grpRows.push([
      g.name,
      g.leader?.full_name || "Aucun",
      (g.active_members || []).length,
      (g.task_assignments || []).length,
    ]);
  });

  const wsGrp = XLSX.utils.aoa_to_sheet(grpRows);
  addMetaRows(wsGrp, "📁 Groupes", genLabel, 4);
  styleHeader(wsGrp, "A3:D3", "6D28D9");
  styleDataRows(wsGrp, 3, grpRows.length - 1, 4);
  wsGrp["!cols"] = [{ wch: 24 }, { wch: 26 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsGrp, "Groupes");

  return wb;
}

// ============================================================
//  UI COMPONENT
// ============================================================
export function ReportsView({ tasks, students, groups }: ReportsViewProps) {
  const t = useTranslations("reports");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const run = async (id: string, fn: () => void) => {
    setLoadingId(id);
    // let the UI update first
    await new Promise((r) => setTimeout(r, 50));
    try {
      fn();
      toast.success(t("downloadSuccess"));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du rapport.");
    } finally {
      setLoadingId(null);
    }
  };

  // KPI stats
  const totalTasks = tasks.length;
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.is_active).length;
  const allComps = tasks.flatMap((t) => t.completions || []);
  const globalRate =
    allComps.length > 0
      ? Math.round((allComps.filter((c) => c.status === "completed").length / allComps.length) * 100)
      : 0;

  const cards = [
    {
      id: "tasks",
      title: t("cardTasks"),
      description: t("cardTasksDesc"),
      icon: ClipboardList,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      btnColor: "border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      stat: `${totalTasks} tâches`,
      filename: `taches_rapport_${today()}.xlsx`,
      onExport: () => {
        const wb = buildTasksWorkbook(tasks);
        downloadXlsx(wb, `taches_rapport_${today()}.xlsx`);
      },
    },
    {
      id: "students",
      title: t("cardStudents"),
      description: t("cardStudentsDesc"),
      icon: Users,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      btnColor: "border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      stat: `${totalStudents} étudiants`,
      filename: `etudiants_rapport_${today()}.xlsx`,
      onExport: () => {
        const wb = buildStudentsWorkbook(students);
        downloadXlsx(wb, `etudiants_rapport_${today()}.xlsx`);
      },
    },
    {
      id: "groups",
      title: t("cardGroups"),
      description: t("cardGroupsDesc"),
      icon: Layers,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600 dark:text-violet-400",
      badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
      btnColor: "border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-300",
      stat: `${groups.length} groupes`,
      filename: `groupes_rapport_${today()}.xlsx`,
      onExport: () => {
        const wb = buildGroupsWorkbook(groups);
        downloadXlsx(wb, `groupes_rapport_${today()}.xlsx`);
      },
    },
    {
      id: "full",
      title: t("cardFull"),
      description: t("cardFullDesc"),
      icon: BarChart3,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600 dark:text-orange-400",
      badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
      btnColor: "border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300",
      stat: "4 feuilles",
      filename: `rapport_complet_${today()}.xlsx`,
      onExport: () => {
        const wb = buildFullWorkbook(tasks, students, groups);
        downloadXlsx(wb, `rapport_complet_${today()}.xlsx`);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* KPI Band */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tâches actives", value: totalTasks, icon: ClipboardList, color: "text-blue-600 dark:text-blue-400" },
          { label: "Étudiants actifs", value: activeStudents, icon: Users, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Groupes", value: groups.length, icon: Layers, color: "text-violet-600 dark:text-violet-400" },
          { label: "Taux global", value: `${globalRate}%`, icon: TrendingUp, color: "text-orange-600 dark:text-orange-400" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4 flex items-center gap-3">
            <div className={`shrink-0 ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none">{kpi.label}</p>
              <p className="text-lg font-bold text-foreground leading-tight mt-0.5">{kpi.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Répartition des statuts (toutes tâches)</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Terminées",
              count: allComps.filter((c) => c.status === "completed").length,
              icon: CheckCircle2,
              color: "text-emerald-600",
            },
            {
              label: "En cours",
              count: allComps.filter((c) => c.status === "in_progress").length,
              icon: Clock,
              color: "text-blue-500",
            },
            {
              label: "En attente",
              count: allComps.filter((c) => c.status === "pending").length,
              icon: AlertCircle,
              color: "text-amber-500",
            },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-sm">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="font-semibold text-foreground">{s.count}</span>
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          const isLoading = loadingId === card.id;
          return (
            <Card key={card.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className={`h-10 w-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center mb-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-snug">{card.title}</CardTitle>
                  <Badge variant="secondary" className={`text-[10px] shrink-0 ${card.badgeColor}`}>
                    {card.stat}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex-1" />
              <CardFooter className="pt-0 border-t">
                <Button
                  onClick={() => run(card.id, card.onExport)}
                  disabled={!!loadingId}
                  variant="outline"
                  className={`w-full gap-2 text-xs mt-3 ${card.btnColor}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  <span>{isLoading ? "Génération..." : t("exportXlsx")}</span>
                  {!isLoading && <Download className="h-3 w-3 ms-auto" />}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        {t("xlsxNote")}
      </p>
    </div>
  );
}
