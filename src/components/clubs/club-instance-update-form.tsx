"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Save } from "lucide-react";
import type { ClubActionState } from "@/lib/clubs/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: ClubActionState = {};

export type ClubInstanceUpdateFormValues = {
  name: string;
  active: boolean;
};

export function ClubInstanceUpdateForm({
  action,
  defaultValues,
}: {
  action: (state: ClubActionState, payload: FormData) => Promise<ClubActionState>;
  defaultValues: ClubInstanceUpdateFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Nombre de la instancia</Label>
            <Input id="name" name="name" defaultValue={defaultValues.name} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="active">Estado</Label>
            <Select id="active" name="active" defaultValue={String(defaultValues.active)}>
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
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
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {pending ? "Guardando..." : "Guardar instancia"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
