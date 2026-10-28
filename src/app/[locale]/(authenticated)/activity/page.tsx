import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Activity, User, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function ActivityLogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authData = await getCurrentUser();

  if (!authData || !authData.profile) {
    redirect(`/${locale}/login`);
  }

  if (authData.profile.role !== "admin") {
    redirect(`/${locale}/dashboard`);
  }

  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*, actor:profiles!actor_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Journal d&apos;activité
        </h1>
        <p className="text-sm text-muted-foreground">
          Historique auditable de toutes les actions, créations et complétions du système.
        </p>
      </div>

      {!logs || logs.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <History className="h-10 w-10 text-muted-foreground opacity-50" />
            <h3 className="text-base font-semibold text-foreground">
              Aucune activité enregistrée
            </h3>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entité</TableHead>
                <TableHead>Détails / Métadonnées</TableHead>
                <TableHead className="text-end">Date et heure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const metadata = log.metadata || {};
                const detailString =
                  metadata.task_title ||
                  metadata.student_name ||
                  metadata.name ||
                  JSON.stringify(metadata);

                return (
                  <TableRow key={log.id} className="text-xs">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{log.actor?.full_name || "Système"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          log.action.includes("completed")
                            ? "success"
                            : log.action.includes("created")
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px] font-mono"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>

                    <TableCell className="uppercase font-mono text-[11px] text-muted-foreground">
                      {log.entity_type}
                    </TableCell>

                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {detailString}
                    </TableCell>

                    <TableCell className="text-end text-muted-foreground font-mono">
                      {formatDateTime(log.created_at, locale)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
