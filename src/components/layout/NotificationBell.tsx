"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { NotificationItem } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

interface NotificationBellProps {
  initialNotifications?: NotificationItem[];
  userId: string;
}

export function NotificationBell({
  initialNotifications = [],
  userId,
}: NotificationBellProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [, startTransition] = useTransition();

  const supabase = createClient();

  // Compute unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    // Fetch latest notifications on mount
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*, actor:profiles!actor_id(*), task:tasks(*)")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data as NotificationItem[]);
      }
    };

    fetchLatest();

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotif = payload.new as NotificationItem;

          // Fetch full notification with relations
          const { data: fullNotif } = await supabase
            .from("notifications")
            .select("*, actor:profiles!actor_id(*), task:tasks(*)")
            .eq("id", newNotif.id)
            .single();

          const notifToAdd = (fullNotif as NotificationItem) || newNotif;

          setNotifications((prev) => [notifToAdd, ...prev.filter((n) => n.id !== notifToAdd.id)]);

          // Show in-app toast
          const message = renderNotificationText(notifToAdd, t);
          toast.info(message, {
            description: formatDateTime(newNotif.created_at, locale),
          });

          // Refresh current page so new task or completed status appears immediately
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as NotificationItem;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, t, locale]);

  const handleMarkAsRead = async (id: string, taskId?: string | null) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    if (taskId) {
      setIsOpen(false);
      startTransition(() => {
        router.push(`/tasks`);
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={t("title")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(96vw,24rem)] p-0 shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{t("title")}</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {t("unreadCount", { count: unreadCount })}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7 text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>{t("markAllRead")}</span>
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.slice(0, 6).map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.task_id)}
                className={`p-3.5 text-start cursor-pointer transition-colors hover:bg-muted/50 flex items-start gap-3 ${
                  !notif.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    !notif.is_read ? "bg-primary" : "bg-transparent"
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-tight">
                    {renderNotificationText(notif, t)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(notif.created_at, locale)}
                  </p>
                </div>
                {notif.task_id && (
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                )}
              </div>
            ))
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 text-center bg-muted/20">
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="text-xs font-medium text-primary hover:underline block py-1"
          >
            {t("viewAll")}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function renderNotificationText(
  notif: NotificationItem,
  t: (key: string, values?: any) => string
): string {
  const data = notif.message_data || {};
  switch (notif.notification_type) {
    case "task_completed":
      return t("taskCompleted", {
        student_name: data.student_name || "Un étudiant",
        task_title: data.task_title || "Tâche",
      });
    case "task_assigned":
      return t("taskAssigned", {
        task_title: data.task_title || "Tâche",
      });
    case "task_reopened":
      return t("taskReopened", {
        task_title: data.task_title || "Tâche",
      });
    case "deadline_approaching":
      return t("deadlineApproaching", {
        task_title: data.task_title || "Tâche",
      });
    default:
      return notif.message_key
        ? t(notif.message_key, data)
        : data.task_title || "Notification";
  }
}
