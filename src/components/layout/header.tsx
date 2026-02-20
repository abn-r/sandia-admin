import Link from "next/link";
import { UserNav } from "@/components/layout/user-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { AppLogo } from "@/components/shared/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AuthUser } from "@/lib/auth/types";

export function Header({ user, pathname }: { user: AuthUser; pathname: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <Link href="/dashboard" className="md:hidden" aria-label="Ir al inicio de SACDIA">
          <AppLogo className="h-8 w-8" />
        </Link>
        <Breadcrumbs pathname={pathname} />
      </div>
      <div className="flex items-center gap-1.5">
        {/* Buscador */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="w-64 pl-9"
            placeholder="Buscar registros..."
            type="text"
          />
        </div>

        <Separator className="mx-1.5 hidden h-6 w-px md:block" />

        {/* Cambiar tema */}
        <ThemeToggle />

        {/* Campana de notificaciones */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones" asChild>
          <Link href="/dashboard/notifications">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-card bg-destructive" />
          </Link>
        </Button>

        <Separator className="mx-1.5 h-6 w-px" />

        <UserNav user={user} />
      </div>
    </header>
  );
}
