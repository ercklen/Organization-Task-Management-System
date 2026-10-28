"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";

interface RealtimeSyncProps {
  currentUserId?: string;
  userRole?: "admin" | "student";
}

const GLOBAL_SYNC_CHANNEL = "global-org-sync";

/**
 * Broadcast an instant sync event to all active clients on this organization.
 * Bypasses database replication latency so updates appear in < 50ms.
 */
export async function broadcastSync(event: string, data?: Record<string, any>) {
  try {
    const supabase = createClient();
    const ch = supabase.channel(GLOBAL_SYNC_CHANNEL);
    await ch.send({
      type: "broadcast",
      event: "sync",
      payload: {
        event,
        data,
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    // Non-fatal — postgres_changes will still trigger synchronization
    console.warn("broadcastSync error (handled):", err);
  }
}

/**
 * Invisible component mounted at the authenticated layout level.
 * Keeps an open Realtime subscription that automatically calls router.refresh()
 * whenever tasks, completions, groups or notifications change anywhere.
 */
export function RealtimeSync({ currentUserId, userRole }: RealtimeSyncProps) {
  const router = useRouter();
  const supabase = createClient();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounce to batch rapid-fire events (e.g. bulk assignments)
    const triggerRefresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        router.refresh();
      }, 350);
    };

    const channel = supabase.channel(GLOBAL_SYNC_CHANNEL, {
      config: {
        broadcast: { ack: false },
      },
    });

    // 1. Instant Peer-to-Peer Broadcast
    channel.on("broadcast", { event: "sync" }, () => {
      triggerRefresh();
    });

    // 2. PostgreSQL CDC (Change Data Capture)
    const tablesToWatch = [
      "tasks",
      "task_completions",
      "task_group_assignments",
      "task_individual_assignments",
      "notifications",
      "groups",
      "group_members",
      "activity_logs",
    ];

    tablesToWatch.forEach((table) => {
      channel.on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table,
        },
        (payload: any) => {
          // If student, filter out task_completions for other students
          if (userRole === "student" && currentUserId && table === "task_completions") {
            const row = payload.new || payload.old;
            if (row?.student_id && row.student_id !== currentUserId) {
              return;
            }
          }

          // If student, filter out notifications for other users
          if (userRole === "student" && currentUserId && table === "notifications") {
            const row = payload.new || payload.old;
            if (row?.recipient_id && row.recipient_id !== currentUserId) {
              return;
            }
          }

          triggerRefresh();
        }
      );
    });

    // 3. Subscribe with reconnect handling
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Realtime sync active");
      }
    });

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, [router, supabase, currentUserId, userRole]);

  return null;
}
