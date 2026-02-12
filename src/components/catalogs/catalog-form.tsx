"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { CatalogActionState } from "@/lib/catalogs/actions";
import { entityConfigs, type EntityKey } from "@/lib/catalogs/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type CatalogFormValues = Record<string, string | number | boolean | null | undefined>;

type SelectOptionsMap = Partial<Record<EntityKey, Array<{ label: string; value: number }>>>;
const initialState: CatalogActionState = {};

export function CatalogForm({
  entityKey,
  action,
  defaultValues,
  selectOptions,
  submitLabel,
}: {
  entityKey: EntityKey;
  action: (
    state: CatalogActionState,
    payload: FormData,
  ) => Promise<CatalogActionState>;
  defaultValues?: CatalogFormValues;
  selectOptions?: SelectOptionsMap;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const config = entityConfigs[entityKey];

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action={formAction} className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            {config.fields.map((field) => {
              const defaultValue = defaultValues?.[field.name];

              if (field.type === "checkbox") {
                return (
                  <label key={field.name} className="flex items-center gap-2.5 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      name={field.name}
                      defaultChecked={
                        typeof defaultValue === "boolean" ? defaultValue : defaultValue === undefined ? true : false
                      }
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    {field.label}
                  </label>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div key={field.name} className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  </div>
                );
              }

              if (field.type === "select" && field.optionsEntityKey) {
                const options = selectOptions?.[field.optionsEntityKey] ?? [];

                return (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Select
                      id={field.name}
                      name={field.name}
                      defaultValue={defaultValue !== undefined && defaultValue !== null ? String(defaultValue) : ""}
                      required={field.required}
                    >
                      <option value="">Selecciona una opcion</option>
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                );
              }

              const inputType = field.type === "date" ? "date" : field.type === "number" ? "number" : "text";

              return (
                <div key={field.name} className="space-y-1.5">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type={inputType}
                    defaultValue={defaultValue !== undefined && defaultValue !== null ? String(defaultValue) : ""}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                </div>
              );
            })}
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
