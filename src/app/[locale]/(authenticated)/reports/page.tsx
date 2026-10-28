import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getReportDataAction } from "@/actions/reports";
import { ReportsView } from "@/components/reports/ReportsView";

export default async function ReportsPage({
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

  const result = await getReportDataAction();
  const tasks = result.data?.tasks || [];
  const students = result.data?.students || [];
  const groups = result.data?.groups || [];

  return <ReportsView tasks={tasks} students={students} groups={groups} />;
}
