"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { navGroups } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Compass className="h-4.5 w-4.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">SACDIA</span>
          <span className="text-[11px] leading-none text-muted-foreground">Panel Administrativo</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label || groupIndex} className={cn(groupIndex > 0 && "mt-5")}>
            {group.label ? (
              <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">v0.1.0</p>
      </div>
    </aside>
  );
}
