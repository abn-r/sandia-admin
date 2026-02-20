"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { InventoryActionState } from "@/lib/inventory/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: InventoryActionState = {};

export type InventoryFormValues = {
  name?: string;
  description?: string | null;
  inventory_category_id?: number;
  amount?: number;
  instance_type?: "adventurers" | "pathfinders" | "master_guilds";
  instance_id?: number;
  active?: boolean;
};

export type InventoryCategoryOption = {
  id: number;
  name: string;
};

export function InventoryForm({
  action,
  submitLabel,
  defaultValues,
  categoryOptions,
}: {
  action: (state: InventoryActionState, payload: FormData) => Promise<InventoryActionState>;
  submitLabel: string;
  defaultValues?: InventoryFormValues;
  categoryOptions?: InventoryCategoryOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = defaultValues !== undefined;
  const hasCategoryOptions = Boolean(categoryOptions && categoryOptions.length > 0);

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre del item</Label>
              <Input id="name" name="name" defaultValue={defaultValues?.name ?? ""} required />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ""} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inventory_category_id">Categoria</Label>
              {hasCategoryOptions ? (
                <Select
                  id="inventory_category_id"
                  name="inventory_category_id"
                  defaultValue={
                    defaultValues?.inventory_category_id !== undefined
                      ? String(defaultValues.inventory_category_id)
                      : ""
                  }
                >
                  <option value="">Sin categoria</option>
                  {categoryOptions?.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id="inventory_category_id"
                  name="inventory_category_id"
                  type="number"
                  defaultValue={
                    defaultValues?.inventory_category_id !== undefined
                      ? String(defaultValues.inventory_category_id)
                      : ""
                  }
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Cantidad</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                defaultValue={defaultValues?.amount !== undefined ? String(defaultValues.amount) : ""}
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
                defaultValue={defaultValues?.instance_id !== undefined ? String(defaultValues.instance_id) : ""}
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
