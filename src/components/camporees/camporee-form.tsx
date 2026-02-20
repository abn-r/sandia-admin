"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { CamporeeActionState } from "@/lib/camporees/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: CamporeeActionState = {};

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

export type CamporeeFormValues = {
  name?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  local_field_id?: number;
  includes_adventurers?: boolean;
  includes_pathfinders?: boolean;
  includes_master_guides?: boolean;
  local_camporee_place?: string;
  registration_cost?: number;
  active?: boolean;
};

export function CamporeeForm({
  action,
  submitLabel,
  defaultValues,
}: {
  action: (state: CamporeeActionState, payload: FormData) => Promise<CamporeeActionState>;
  submitLabel: string;
  defaultValues?: CamporeeFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = defaultValues !== undefined;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre del camporee</Label>
              <Input id="name" name="name" defaultValue={defaultValues?.name ?? ""} required />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ""} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="start_date">Fecha inicio</Label>
              <Input
                id="start_date"
                name="start_date"
                type="datetime-local"
                defaultValue={toDateTimeLocal(defaultValues?.start_date)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="end_date">Fecha fin</Label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                defaultValue={toDateTimeLocal(defaultValues?.end_date)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="local_field_id">Campo local</Label>
              <Input
                id="local_field_id"
                name="local_field_id"
                type="number"
                defaultValue={defaultValues?.local_field_id ? String(defaultValues.local_field_id) : ""}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="registration_cost">Costo de inscripcion</Label>
              <Input
                id="registration_cost"
                name="registration_cost"
                type="number"
                step="any"
                defaultValue={defaultValues?.registration_cost ? String(defaultValues.registration_cost) : ""}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="local_camporee_place">Lugar</Label>
              <Input
                id="local_camporee_place"
                name="local_camporee_place"
                defaultValue={defaultValues?.local_camporee_place ?? ""}
                required
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="includes_adventurers"
                defaultChecked={defaultValues?.includes_adventurers ?? false}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Incluye Aventureros
            </label>

            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="includes_pathfinders"
                defaultChecked={defaultValues?.includes_pathfinders ?? true}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Incluye Conquistadores
            </label>

            <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="includes_master_guides"
                defaultChecked={defaultValues?.includes_master_guides ?? false}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Incluye Guias Mayores
            </label>

            {isEdit ? (
              <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={defaultValues?.active ?? true}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Activo
              </label>
            ) : null}
          </div>

          {state.error ? (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          ) : null}

          <div className="flex items-center gap-3 border-t pt-5">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? "Guardando..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
