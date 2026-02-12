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
        <div className="min-h-screen md:flex">
          <div className="hidden md:block">
            <AppSidebar />
          </div>
          <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
            <Header user={user} pathname={pathname} />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </QueryProvider>
    </AuthProvider>
  );
}
