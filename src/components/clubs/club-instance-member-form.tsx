"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import type { ClubActionState } from "@/lib/clubs/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: ClubActionState = {};

export type EcclesiasticalYearOption = {
  id: number;
  name: string;
  active?: boolean;
};

export function ClubInstanceMemberForm({
  action,
  years,
  defaultYearId,
}: {
  action: (state: ClubActionState, payload: FormData) => Promise<ClubActionState>;
  years: EcclesiasticalYearOption[];
  defaultYearId?: number;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="user_id">ID del usuario</Label>
            <Input id="user_id" name="user_id" placeholder="UUID del usuario" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role_id">Rol</Label>
            <Input id="role_id" name="role_id" type="number" min={1} placeholder="ID del rol" required />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ecclesiastical_year_id">Año eclesiástico</Label>
            <Select
              id="ecclesiastical_year_id"
              name="ecclesiastical_year_id"
              defaultValue={defaultYearId ? String(defaultYearId) : years[0] ? String(years[0].id) : ""}
              required
            >
              {years.length === 0 ? (
                <option value="">Sin años disponibles</option>
              ) : (
                years.map((year) => (
                  <option key={year.id} value={String(year.id)}>
                    {year.name}
                    {year.active ? " (activo)" : ""}
                  </option>
                ))
              )}
            </Select>
          </div>

          {state.error ? (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          ) : null}

          {state.success ? (
            <div className="rounded-md bg-success/10 px-3 py-2 text-sm text-success sm:col-span-3">
              {state.success}
            </div>
          ) : null}

          <div className="sm:col-span-3">
            <Button type="submit" disabled={pending || years.length === 0}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {pending ? "Agregando..." : "Agregar miembro"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
