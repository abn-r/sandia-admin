"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LogOut, ChevronDown } from "lucide-react";
import { navGroups } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const isChildActive = (children: { href: string }[] | undefined) =>
    children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card text-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          S
        </div>
        <span className="text-lg font-bold tracking-tight">SACDIA</span>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label || groupIndex} className={cn(groupIndex > 0 && "mt-6")}>
            {group.label ? (
              <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  isChildActive(item.children);
                const isExpanded =
                  expandedItems.includes(item.href) || isChildActive(item.children);

                return (
                  <div key={item.href}>
                    {item.children ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1 text-left">{item.title}</span>
                        <ChevronDown
                          size={14}
                          className={cn(
                            "transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    )}

                    {/* Submenu */}
                    {item.children && isExpanded ? (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildItemActive =
                            pathname === child.href || pathname.startsWith(`${child.href}/`);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-2 text-xs font-medium transition-colors",
                                isChildItemActive
                                  ? "text-primary"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" />
                              {child.title}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
