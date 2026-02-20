"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { ClubActionState } from "@/lib/clubs/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ClubActionState = {};

export type ClubFormValues = {
  name?: string;
  description?: string | null;
  local_field_id?: number;
  district_id?: number;
  church_id?: number;
  address?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  active?: boolean;
};

export function ClubForm({
  action,
  submitLabel,
  defaultValues,
}: {
  action: (state: ClubActionState, payload: FormData) => Promise<ClubActionState>;
  submitLabel: string;
  defaultValues?: ClubFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = defaultValues !== undefined;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre del club</Label>
              <Input id="name" name="name" defaultValue={defaultValues?.name ?? ""} required />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ""} />
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
              <Label htmlFor="district_id">Distrito</Label>
              <Input
                id="district_id"
                name="district_id"
                type="number"
                defaultValue={defaultValues?.district_id ? String(defaultValues.district_id) : ""}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="church_id">Iglesia</Label>
              <Input
                id="church_id"
                name="church_id"
                type="number"
                defaultValue={defaultValues?.church_id ? String(defaultValues.church_id) : ""}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Direccion</Label>
              <Input id="address" name="address" defaultValue={defaultValues?.address ?? ""} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coordinates_lat">Latitud</Label>
              <Input
                id="coordinates_lat"
                name="coordinates_lat"
                type="number"
                step="any"
                defaultValue={
                  defaultValues?.coordinates?.lat !== undefined
                    ? String(defaultValues.coordinates.lat)
                    : ""
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coordinates_lng">Longitud</Label>
              <Input
                id="coordinates_lng"
                name="coordinates_lng"
                type="number"
                step="any"
                defaultValue={
                  defaultValues?.coordinates?.lng !== undefined
                    ? String(defaultValues.coordinates.lng)
                    : ""
                }
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

          {state.success ? (
            <div className="rounded-md bg-success/10 px-3 py-2.5 text-sm text-success">
              {state.success}
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
