"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { ActivityActionState } from "@/lib/activities/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActivityActionState = {};

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

export type ActivityFormValues = {
  name?: string;
  title?: string;
  description?: string | null;
  activity_type?: string | number;
  activity_date?: string;
  start_date?: string;
  end_date?: string;
  location?: string | null;
  instance_type?: "adventurers" | "pathfinders" | "master_guilds";
  instance_id?: number;
  active?: boolean;
};

export function ActivityForm({
  action,
  submitLabel,
  defaultValues,
}: {
  action: (state: ActivityActionState, payload: FormData) => Promise<ActivityActionState>;
  submitLabel: string;
  defaultValues?: ActivityFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = defaultValues !== undefined;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre de la actividad</Label>
              <Input
                id="name"
                name="name"
                defaultValue={defaultValues?.name ?? defaultValues?.title ?? ""}
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ""} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activity_type">Tipo de actividad</Label>
              <Input
                id="activity_type"
                name="activity_type"
                defaultValue={defaultValues?.activity_type ? String(defaultValues.activity_type) : ""}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Ubicacion</Label>
              <Input id="location" name="location" defaultValue={defaultValues?.location ?? ""} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activity_date">Fecha actividad</Label>
              <Input
                id="activity_date"
                name="activity_date"
                type="datetime-local"
                defaultValue={toDateTimeLocal(defaultValues?.activity_date ?? defaultValues?.start_date)}
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
              <Label htmlFor="instance_type">Tipo de instancia</Label>
              <Select
                id="instance_type"
                name="instance_type"
                defaultValue={defaultValues?.instance_type ?? "pathfinders"}
                required={!isEdit}
              >
                <option value="adventurers">Aventureros</option>
                <option value="pathfinders">Conquistadores</option>
                <option value="master_guilds">Guias Mayores</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instance_id">Instancia</Label>
              <Input
                id="instance_id"
                name="instance_id"
                type="number"
                defaultValue={defaultValues?.instance_id ? String(defaultValues.instance_id) : ""}
                required={!isEdit}
              />
            </div>

            {isEdit ? (
              <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={defaultValues?.active ?? true}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Activa
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
