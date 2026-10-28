"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { NotificationItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationsViewProps {
  initialNotifications: NotificationItem[];
  userId: string;
}

export function NotificationsView({
  initialNotifications,
  userId,
}: NotificationsViewProps) {
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const handleMarkAsRead = async (id: string, taskId?: string | null) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    if (taskId) {
      router.push("/tasks");
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    toast.success(tCommon("success"));
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
            {unreadCount > 0
              ? t("unreadCount", { count: unreadCount })
              : "Toutes vos notifications sont à jour."}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="gap-2 text-xs"
          >
            <CheckCheck className="h-4 w-4" />
            <span>{t("markAllRead")}</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
          className="text-xs h-8"
        >
          {tCommon("all")} ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("unread")}
          className="text-xs h-8"
        >
          {t("unreadCount", { count: unreadCount })}
        </Button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Bell className="h-10 w-10 text-muted-foreground opacity-50" />
            <h3 className="text-base font-semibold text-foreground">
              {t("noNotifications")}
            </h3>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((notif) => {
            const data = notif.message_data || {};
            let message = "";
            let Icon = Bell;
            let iconColor = "text-primary";

            switch (notif.notification_type) {
              case "task_completed":
                message = t("taskCompleted", {
                  student_name: data.student_name || "Un étudiant",
                  task_title: data.task_title || "Tâche",
                });
                Icon = CheckCircle2;
                iconColor = "text-emerald-600";
                break;
              case "task_assigned":
                message = t("taskAssigned", {
                  task_title: data.task_title || "Tâche",
                });
                Icon = Sparkles;
                iconColor = "text-primary";
                break;
              case "task_reopened":
                message = t("taskReopened", {
                  task_title: data.task_title || "Tâche",
                });
                Icon = RotateCcw;
                iconColor = "text-amber-600";
                break;
              case "deadline_approaching":
                message = t("deadlineApproaching", {
                  task_title: data.task_title || "Tâche",
                });
                Icon = Clock;
                iconColor = "text-rose-600";
                break;
              default:
                message = data.task_title || "Notification";
            }

            return (
              <Card
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.task_id)}
                className={`transition-all cursor-pointer hover:shadow-sm ${
                  !notif.is_read
                    ? "border-primary/40 bg-primary/5"
                    : "hover:bg-muted/30"
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        !notif.is_read
                          ? "bg-card border-primary/30"
                          : "bg-muted/40 border-border"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-snug text-foreground">
                        {message}
                      </p>
                      {data.note && (
                        <p className="text-xs text-muted-foreground italic bg-background/80 p-2 rounded border border-border/60">
                          « {data.note} »
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(notif.created_at, locale)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.is_read && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                    {notif.task_id && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
