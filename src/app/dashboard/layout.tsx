import { headers } from "next/headers";
import { AuthProvider } from "@/lib/auth/auth-context";
import { QueryProvider } from "@/lib/providers/query-provider";
import { requireAdminUser } from "@/lib/auth/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  const pathname = (await headers()).get("x-pathname") ?? "/dashboard";

  return (
    <AuthProvider>
      <QueryProvider>
        <div className="min-h-screen bg-background md:flex">
          <div className="hidden md:sticky md:top-0 md:block md:h-screen">
            <AppSidebar />
          </div>
          <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
            <Header user={user} pathname={pathname} />
            <main className="custom-scrollbar flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </QueryProvider>
    </AuthProvider>
  );
}
