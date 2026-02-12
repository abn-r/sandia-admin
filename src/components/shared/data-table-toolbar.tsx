"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type DataTableToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  actions?: React.ReactNode;
};

export function DataTableToolbar({ value, onChange, placeholder = "Buscar...", actions }: DataTableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
