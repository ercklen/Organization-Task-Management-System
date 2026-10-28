"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TaskWithDetails, Group, Profile } from "@/types";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { MarkCompletedDialog } from "./MarkCompletedDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Users2,
  LayoutGrid,
  List,
  Eye,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TasksListProps {
  tasks: TaskWithDetails[];
  groups: Group[];
  students: Profile[];
  currentUserId: string;
  isAdmin: boolean;
  initialCreateOpen?: boolean;
}

export function TasksList({
  tasks,
  groups,
  students,
  currentUserId,
  isAdmin,
  initialCreateOpen = false,
}: TasksListProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [createOpen, setCreateOpen] = useState(initialCreateOpen);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [completeTaskId, setCompleteTaskId] = useState<{ id: string; title: string } | null>(null);

  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadlineAsc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = task.description?.toLowerCase().includes(q) || false;
          if (!matchesTitle && !matchesDesc) return false;
        }

        // Priority filter
        if (priorityFilter !== "all" && task.priority !== priorityFilter) {
          return false;
        }

        // Group filter
        if (groupFilter !== "all") {
          const inGroup = task.assigned_groups?.some((g) => g.id === groupFilter);
          if (!inGroup) return false;
        }

        // Status filter
        if (statusFilter !== "all") {
          const total = task.completions?.length || 0;
          const completed = task.completions?.filter((c) => c.status === "completed").length || 0;
          const isOverdue = new Date(task.due_date) < new Date();

          if (statusFilter === "completed" && completed < total) return false;
          if (statusFilter === "overdue" && (!isOverdue || completed === total)) return false;
          if (statusFilter === "pending" && (completed === total || isOverdue)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadlineAsc") {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (sortBy === "deadlineDesc") {
          return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        }
        if (sortBy === "createdDesc") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
  }, [tasks, searchQuery, priorityFilter, statusFilter, groupFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isAdmin ? t("title") : t("myTasksTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? t("subtitle") : t("myTasksSubtitle")}
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>{t("createTask")}</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("filters.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 h-10 text-sm"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-1 shrink-0 self-end sm:self-auto bg-muted/40">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 w-8 p-0"
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Dropdowns Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
            >
              <option value="all">{t("filters.allPriorities")}</option>
              <option value="urgent">{t("priorities.urgent")}</option>
              <option value="high">{t("priorities.high")}</option>
              <option value="medium">{t("priorities.medium")}</option>
              <option value="low">{t("priorities.low")}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
            >
              <option value="all">{t("filters.allStatuses")}</option>
              <option value="pending">{t("statuses.pending")}</option>
              <option value="completed">{t("statuses.completed")}</option>
              <option value="overdue">{t("statuses.overdue")}</option>
            </select>

            {/* Group Filter */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
            >
              <option value="all">{t("filters.allGroups")}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
            >
              <option value="deadlineAsc">{t("filters.sortDeadlineAsc")}</option>
              <option value="deadlineDesc">{t("filters.sortDeadlineDesc")}</option>
              <option value="createdDesc">{t("filters.sortCreatedDesc")}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Task Content */}
      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Clock className="h-10 w-10 text-muted-foreground opacity-50" />
            <h3 className="text-base font-semibold text-foreground">
              {t("empty.title")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t("empty.description")}
            </p>
          </div>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid / Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const completions = task.completions || [];
            const total = completions.length;
            const completed = completions.filter((c) => c.status === "completed").length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isOverdue = new Date(task.due_date) < new Date();
            const myComp = completions.find((c) => c.student_id === currentUserId);
            const myStatus = myComp?.status || "pending";

            return (
              <Card
                key={task.id}
                className="flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="p-5 space-y-3">
                  {/* Card Header badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        task.priority === "urgent"
                          ? "urgent"
                          : task.priority === "high"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {t(`priorities.${task.priority}`)}
                    </Badge>

                    {isOverdue && completed < total && (
                      <Badge variant="destructive" className="text-[10px]">
                        {t("statuses.overdue")}
                      </Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base text-foreground line-clamp-1 leading-snug">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Assigned Groups Chips */}
                  {task.assigned_groups && task.assigned_groups.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {task.assigned_groups.map((g) => (
                        <span
                          key={g.id}
                          className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-foreground truncate max-w-[200px]"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Progress Bar (Individual tracking) */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {t("progress.ratio", { completed, total })}
                      </span>
                      <span className="font-semibold text-foreground">{percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline & Footer */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(task.due_date, locale)}</span>
                    </div>

                    {!isAdmin && (
                      <div onClick={(e) => e.stopPropagation()}>
                        {myStatus === "completed" ? (
                          <Badge variant="success" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{t("statuses.completed")}</span>
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            className="h-7 text-xs gap-1"
                            onClick={() =>
                              setCompleteTaskId({ id: task.id, title: task.title })
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{t("markCompleted")}</span>
                          </Button>
                        )}
                      </div>
                    )}

                    {isAdmin && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{tCommon("viewDetails")}</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View — horizontal scroll on mobile */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.title")}</TableHead>
                <TableHead>{t("fields.priority")}</TableHead>
                <TableHead>{t("fields.assignedGroups")}</TableHead>
                <TableHead>{t("fields.deadline")}</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const completions = task.completions || [];
                const total = completions.length;
                const completed = completions.filter((c) => c.status === "completed").length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isOverdue = new Date(task.due_date) < new Date();

                return (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell className="font-semibold">
                      <div className="flex flex-col">
                        <span>{task.title}</span>
                        {isOverdue && completed < total && (
                          <span className="text-[10px] text-destructive font-bold">
                            {t("statuses.overdue")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          task.priority === "urgent"
                            ? "urgent"
                            : task.priority === "high"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {t(`priorities.${task.priority}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {task.assigned_groups?.map((g) => g.name).join(", ") || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(task.due_date, locale)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-medium text-muted-foreground">
                          {completed}/{total} ({percent}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                        className="h-8 text-xs gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{tCommon("viewDetails")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}

      {/* Task Creation Dialog */}
      <CreateTaskDialog
        groups={groups}
        students={students}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Task Details Dialog (Shows individual completions & admin reopen) */}
      <TaskDetailDialog
        task={selectedTask}
        isAdmin={isAdmin}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />

      {/* Mark As Completed Dialog for Student */}
      {completeTaskId && (
        <MarkCompletedDialog
          taskId={completeTaskId.id}
          taskTitle={completeTaskId.title}
          studentId={currentUserId}
          open={!!completeTaskId}
          onOpenChange={(open) => !open && setCompleteTaskId(null)}
        />
      )}
    </div>
  );
}
