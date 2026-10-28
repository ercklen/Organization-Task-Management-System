import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "@/components/settings/SettingsView";
import { OrganizationSettings } from "@/types";

export default async function SettingsPage({
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

  const { data: orgSettings } = await supabase
    .from("organization_settings")
    .select("*")
    .limit(1)
    .single();

  return (
    <SettingsView
      profile={profile}
      orgSettings={(orgSettings || null) as OrganizationSettings | null}
    />
  );
}
