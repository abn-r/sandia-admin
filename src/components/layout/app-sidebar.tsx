"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { navGroups } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/shared/app-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const isChildActive = (children: { href: string }[] | undefined) =>
    Boolean(children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-6">
        <AppLogo className="h-8 w-8 shrink-0" />
        <span className="text-lg font-bold tracking-tight text-foreground">SACDIA</span>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label || groupIndex} className={cn(groupIndex > 0 && "mt-5")}>
            {group.label ? (
              <>
                {groupIndex > 0 && <Separator className="mb-4 bg-sidebar-border" />}
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {group.label}
                </p>
              </>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const hasActiveChild = isChildActive(item.children);
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  hasActiveChild;

                if (item.children) {
                  return (
                    <Collapsible
                      key={item.href}
                      defaultOpen={hasActiveChild}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronDown
                            size={14}
                            className="text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-5 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildItemActive =
                              pathname === child.href || pathname.startsWith(`${child.href}/`);

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNavigate}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                                  isChildItemActive
                                    ? "text-sidebar-primary"
                                    : "text-muted-foreground hover:text-sidebar-accent-foreground"
                                )}
                              >
                                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                {child.title}
                              </Link>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge ? (
                      <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
