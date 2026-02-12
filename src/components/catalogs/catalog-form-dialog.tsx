"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { EntityField } from "@/lib/catalogs/entities";
import type { CatalogItem } from "@/lib/catalogs/service";

type CatalogFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: EntityField[];
  item?: CatalogItem | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
};

export function CatalogFormDialog({
  open,
  onOpenChange,
  title,
  fields,
  item,
  onSubmit,
}: CatalogFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!item;
  const visibleFields = fields.filter((f) => f.name !== "active" || isEdit);

  function getDefaultValue(field: EntityField): string {
    if (!item) return "";
    const val = item[field.name];
    if (val === null || val === undefined) return "";
    if (field.type === "date" && typeof val === "string") {
      const parsed = parseISO(val);
      if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
    }
    return String(val);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};

    for (const field of fields) {
      if (field.type === "checkbox") {
        payload[field.name] = formData.get(field.name) === "on";
        continue;
      }
      const raw = formData.get(field.name);
      if (raw === null || raw === "") {
        if (field.required) {
          setError(`El campo "${field.label}" es obligatorio.`);
          setLoading(false);
          return;
        }
        continue;
      }
      if (field.type === "number" || field.type === "select") {
        payload[field.name] = Number(raw);
      } else {
        payload[field.name] = String(raw).trim();
      }
    }

    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar ${title}` : `Nuevo ${title}`}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Modifica los campos del registro y presiona guardar.`
              : `Completa los campos para crear un nuevo registro.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {visibleFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="ml-0.5 text-destructive">*</span>}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  name={field.name}
                  defaultValue={getDefaultValue(field)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                />
              ) : field.type === "checkbox" ? (
                <div className="flex items-center gap-3">
                  <Switch
                    id={field.name}
                    name={field.name}
                    defaultChecked={item ? Boolean(item[field.name]) : true}
                  />
                  <Label htmlFor={field.name} className="text-sm text-muted-foreground">
                    {Boolean(item?.[field.name]) !== false ? "Activo" : "Inactivo"}
                  </Label>
                </div>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                  defaultValue={getDefaultValue(field)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>
          ))}

          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
