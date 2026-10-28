"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Group, Profile } from "@/types";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupDetailDialog } from "./GroupDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users2,
  Plus,
  Search,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Layers,
} from "lucide-react";

interface GroupsListProps {
  groups: Group[];
  allStudents: Profile[];
  groupTasksMap: Record<string, any[]>;
  initialCreateOpen?: boolean;
}

export function GroupsList({
  groups,
  allStudents,
  groupTasksMap,
  initialCreateOpen = false,
}: GroupsListProps) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");

  const [createOpen, setCreateOpen] = useState(initialCreateOpen);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    });
  }, [groups, searchQuery]);

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
          <Plus className="h-4 w-4" />
          <span>{t("createGroup")}</span>
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un groupe..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9 h-10 text-sm"
        />
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Layers className="h-10 w-10 text-muted-foreground opacity-50" />
            <h3 className="text-base font-semibold text-foreground">
              {t("empty.title")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t("empty.description")}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const activeMembers = (group.members || []).filter((m) => !m.left_at);
            const tasks = groupTasksMap[group.id] || [];

            return (
              <Card
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <Users2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-foreground line-clamp-1">
                          {group.name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="h-3 w-3 text-primary" />
                          <span>{group.leader?.full_name || t("noLeader")}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  {/* Group stats summary */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t text-xs">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <span className="text-[11px] text-muted-foreground block">
                        Membres actifs
                      </span>
                      <strong className="text-base font-bold text-foreground">
                        {activeMembers.length}
                      </strong>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <span className="text-[11px] text-muted-foreground block">
                        Tâches assignées
                      </span>
                      <strong className="text-base font-bold text-primary">
                        {tasks.length}
                      </strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Group Dialog */}
      <CreateGroupDialog
        students={allStudents}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Group Detail & Member Management Dialog */}
      <GroupDetailDialog
        group={selectedGroup}
        allStudents={allStudents}
        groupTasks={selectedGroup ? groupTasksMap[selectedGroup.id] || [] : []}
        open={!!selectedGroup}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
      />
    </div>
  );
}
