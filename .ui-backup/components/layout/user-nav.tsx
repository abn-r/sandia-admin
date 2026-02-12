import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";

function getInitials(user: AuthUser) {
  const name = user.name ?? "";
  const last = user.paternal_last_name ?? "";
  if (name && last) return `${name[0]}${last[0]}`.toUpperCase();
  if (name) return name.slice(0, 2).toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

function getDisplayName(user: AuthUser) {
  const fullName = [user.name, user.paternal_last_name, user.maternal_last_name].filter(Boolean).join(" ");
  if (fullName) {
    return fullName;
  }

  return user.email;
}

export function UserNav({ user }: { user: AuthUser }) {
  return (
    <form action={logoutAction} className="flex items-center gap-3 bg-white p-2">
      <div className="hidden text-right md:block">
        <p className="text-[13px] font-medium leading-tight">{getDisplayName(user)}</p>
        <p className="text-[11px] text-muted-foreground">{user.email}</p>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(user)}
      </div>
      <Button variant="ghost" size="icon" type="submit" title="Cerrar sesion">
        <LogOut className="h-4 w-4" />
      </Button>
    </form>
  );
}
