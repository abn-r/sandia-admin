"use client";

import { LogOut, User } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(user: AuthUser) {
  const name = user.name ?? "";
  const last = user.paternal_last_name ?? "";
  if (name && last) return `${name[0]}${last[0]}`.toUpperCase();
  if (name) return name.slice(0, 2).toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

function getDisplayName(user: AuthUser) {
  const fullName = [user.name, user.paternal_last_name, user.maternal_last_name].filter(Boolean).join(" ");
  return fullName || user.email;
}

export function UserNav({ user }: { user: AuthUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="hidden text-right md:block">
            <p className="text-[13px] font-medium leading-tight">{getDisplayName(user)}</p>
            <p className="text-[11px] text-muted-foreground">{user.email}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="px-3 py-2.5 font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold">{getDisplayName(user)}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
