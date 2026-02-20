"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { FinanceActionState } from "@/lib/finances/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: FinanceActionState = {};

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

export type FinanceFormValues = {
  description?: string;
  amount?: number | string;
  type?: 0 | 1;
  transaction_date?: string;
  finance_category_id?: number;
  instance_type?: "adventurers" | "pathfinders" | "master_guilds";
  instance_id?: number;
  ecclesiastical_year_id?: number;
  receipt_number?: string | null;
  notes?: string | null;
  active?: boolean;
};

export type FinanceCategoryOption = {
  id: number;
  name: string;
};

export function FinanceForm({
  action,
  submitLabel,
  defaultValues,
  categoryOptions,
}: {
  action: (state: FinanceActionState, payload: FormData) => Promise<FinanceActionState>;
  submitLabel: string;
  defaultValues?: FinanceFormValues;
  categoryOptions?: FinanceCategoryOption[];
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
              <Label htmlFor="description">Descripcion</Label>
              <Input id="description" name="description" defaultValue={defaultValues?.description ?? ""} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="any"
                min="0"
                defaultValue={defaultValues?.amount !== undefined ? String(defaultValues.amount) : ""}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <Select id="type" name="type" defaultValue={String(defaultValues?.type ?? 0)} required>
                <option value="0">Ingreso</option>
                <option value="1">Egreso</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transaction_date">Fecha de transaccion</Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="datetime-local"
                defaultValue={toDateTimeLocal(defaultValues?.transaction_date)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="finance_category_id">Categoria financiera</Label>
              {hasCategoryOptions ? (
                <Select
                  id="finance_category_id"
                  name="finance_category_id"
                  defaultValue={
                    defaultValues?.finance_category_id !== undefined
                      ? String(defaultValues.finance_category_id)
                      : String(categoryOptions?.[0]?.id ?? "")
                  }
                  required
                >
                  {categoryOptions?.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id="finance_category_id"
                  name="finance_category_id"
                  type="number"
                  defaultValue={
                    defaultValues?.finance_category_id !== undefined
                      ? String(defaultValues.finance_category_id)
                      : ""
                  }
                  required
                />
              )}
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

            <div className="space-y-1.5">
              <Label htmlFor="ecclesiastical_year_id">Ano eclesiastico</Label>
              <Input
                id="ecclesiastical_year_id"
                name="ecclesiastical_year_id"
                type="number"
                defaultValue={
                  defaultValues?.ecclesiastical_year_id !== undefined
                    ? String(defaultValues.ecclesiastical_year_id)
                    : ""
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="receipt_number">Numero de recibo</Label>
              <Input
                id="receipt_number"
                name="receipt_number"
                defaultValue={defaultValues?.receipt_number ?? ""}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} />
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
