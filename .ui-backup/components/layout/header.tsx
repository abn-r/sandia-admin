import { UserNav } from "@/components/layout/user-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import type { AuthUser } from "@/lib/auth/types";

export function Header({ user, pathname }: { user: AuthUser; pathname: string }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-2.5 backdrop-blur-sm md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MobileSidebar />
          <Breadcrumbs pathname={pathname} />
        </div>
        <UserNav user={user} />
      </div>
    </header>
  );
}
