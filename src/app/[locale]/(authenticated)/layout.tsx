import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function AuthenticatedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authData = await getCurrentUser();

  if (!authData || !authData.profile) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar profile={authData.profile} />
      </div>

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header profile={authData.profile} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/20 pb-8">
          <div className="max-w-7xl mx-auto space-y-6 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
