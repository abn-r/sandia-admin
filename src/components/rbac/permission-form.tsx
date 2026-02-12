"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { RbacActionState } from "@/lib/rbac/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: RbacActionState = {};

export function PermissionForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: RbacActionState, payload: FormData) => Promise<RbacActionState>;
  defaultValues?: {
    permission_name?: string;
    description?: string | null;
    active?: boolean;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = defaultValues !== undefined;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="permission_name">Nombre del permiso</Label>
              <Input
                id="permission_name"
                name="permission_name"
                defaultValue={defaultValues?.permission_name ?? ""}
                placeholder="resource:action"
                required
              />
              <p className="text-xs text-muted-foreground">
                Formato: <code className="rounded bg-muted px-1">resource:action</code> (ej: users:read, clubs:create)
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={defaultValues?.description ?? ""}
                placeholder="Descripcion del permiso"
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
