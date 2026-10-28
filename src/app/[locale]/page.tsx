import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";

export default async function LocaleIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authData = await getCurrentUser();

  if (authData && authData.profile) {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/login`);
  }
}
