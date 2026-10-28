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
 * Cleanly opens, sends, and immediately closes the channel to prevent server memory bloat.
 */
export async function broadcastSync(event: string, data?: Record<string, any>) {
  try {
    const supabase = createClient();
    const ch = supabase.channel(`broadcast-${Date.now()}`);
    await ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.send({
          type: "broadcast",
          event: "sync",
          payload: {
            event,
            data,
            timestamp: Date.now(),
          },
        });
        // Immediately clean up ephemeral channel
        supabase.removeChannel(ch);
      }
    });
  } catch (err) {
    console.warn("[Realtime] broadcastSync error (handled):", err);
  }
}

/**
 * Optimized Realtime sync component:
 * - Subscribes only to core tables: tasks, task_completions, notifications
 * - Batches rapid updates with an 800ms debounce
 * - Releases channel subscriptions cleanly on unmount to minimize Supabase RAM usage
 */
export function RealtimeSync({ currentUserId, userRole }: RealtimeSyncProps) {
  const router = useRouter();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Debounce to batch rapid events and prevent excessive database re-fetching
    const triggerRefresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        router.refresh();
      }, 800);
    };

    const channel = supabase.channel(GLOBAL_SYNC_CHANNEL, {
      config: {
        broadcast: { ack: false },
      },
    });

    // 1. Peer-to-Peer Broadcast
    channel.on("broadcast", { event: "sync" }, () => {
      triggerRefresh();
    });

    // 2. PostgreSQL CDC - Only the 3 essential tables (minimizes PostgreSQL WAL / RAM overhead)
    const essentialTables = ["tasks", "task_completions", "notifications"];

    essentialTables.forEach((table) => {
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

    channel.subscribe();

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, [router, currentUserId, userRole]);

  return null;
}
