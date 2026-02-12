import { UserNav } from "@/components/layout/user-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Bell } from "lucide-react";
import type { AuthUser } from "@/lib/auth/types";

export function Header({ user, pathname }: { user: AuthUser; pathname: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <Breadcrumbs pathname={pathname} />
      </div>
      <div className="flex items-center gap-4">
        {/* Buscador */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          <input
            className="w-64 rounded-lg border border-border bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Buscar registros..."
            type="text"
          />
        </div>
        {/* Cambiar tema */}
        <ThemeToggle />
        {/* Campana de notificaciones */}
        <button
          type="button"
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-background bg-red-500" />
        </button>
        <UserNav user={user} />
      </div>
    </header>
  );
}
