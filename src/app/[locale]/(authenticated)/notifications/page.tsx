import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { NotificationsView } from "@/components/notifications/NotificationsView";
import { NotificationItem } from "@/types";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authData = await getCurrentUser();

  if (!authData || !authData.profile) {
    redirect(`/${locale}/login`);
  }

  const { profile } = authData;
  const supabase = await createClient();

  const { data: rawNotifications } = await supabase
    .from("notifications")
    .select("*, actor:profiles!actor_id(full_name), task:tasks(*)")
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <NotificationsView
      initialNotifications={(rawNotifications || []) as NotificationItem[]}
      userId={profile.id}
    />
  );
}
