"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { Plus, Pencil, Ban, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  entityConfigs,
  type EntityConfig,
  type EntityKey,
} from "@/lib/catalogs/entities";
import type { CatalogItem } from "@/lib/catalogs/service";
import {
  fetchCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "@/lib/catalogs/actions-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CatalogFormDialog } from "@/components/catalogs/catalog-form-dialog";
import { CatalogDeleteDialog } from "@/components/catalogs/catalog-delete-dialog";

/* ─── Helpers ─── */
function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = parseISO(value);
    if (isValid(date)) return <span className="tabular-nums">{format(date, "dd/MM/yyyy")}</span>;
  }
  return String(value);
}

/* ─── Main Component ─── */
export function CatalogCrudPage({ entityKey }: { entityKey: EntityKey }) {
  const config: EntityConfig = entityConfigs[entityKey];
  const visibleFields = config.fields.filter((f) => f.name !== "active");

  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["catalog-items", entityKey],
    queryFn: () => fetchCatalogItems(entityKey),
  });
  const items = data;

  /* ─── Filtrado ─── */
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return visibleFields.some((field) => {
      const val = item[field.name];
      return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
    });
  });

  /* ─── Handlers ─── */
  function handleCreate() {
    setEditItem(null);
    setFormOpen(true);
  }

  function handleEdit(item: CatalogItem) {
    setEditItem(item);
    setFormOpen(true);
  }

  function handleDeleteClick(item: CatalogItem) {
    setDeleteTarget(item);
    setDeleteOpen(true);
  }

  async function handleFormSubmit(payload: Record<string, unknown>) {
    if (editItem) {
      const id = Number(editItem[config.idField]);
      await updateCatalogItem(entityKey, id, payload);
      toast.success(`${config.singularTitle} actualizado correctamente`);
    } else {
      await createCatalogItem(entityKey, payload);
      toast.success(`${config.singularTitle} creado correctamente`);
    }
    await queryClient.invalidateQueries({ queryKey: ["catalog-items", entityKey] });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = Number(deleteTarget[config.idField]);
    await deleteCatalogItem(entityKey, id);
    toast.success(`${config.singularTitle} desactivado correctamente`);
    setDeleteTarget(null);
    await queryClient.invalidateQueries({ queryKey: ["catalog-items", entityKey] });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo {config.singularTitle}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
        <Input
          placeholder={`Buscar ${config.title.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center animate-in fade-in duration-300">
          <p className="mb-1 text-lg font-semibold text-foreground">Sin registros</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {searchQuery
              ? "No se encontraron resultados para tu búsqueda."
              : `No hay ${config.title.toLowerCase()} registrados aún.`}
          </p>
          {!searchQuery && (
            <Button variant="outline" size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Crear {config.singularTitle}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block animate-in fade-in duration-300">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleFields.map((field) => (
                    <TableHead key={field.name}>{field.label}</TableHead>
                  ))}
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => {
                  const idValue = Number(item[config.idField]);
                  return (
                    <TableRow
                      key={idValue}
                      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                    >
                      {visibleFields.map((field) => (
                        <TableCell key={field.name}>{formatValue(item[field.name])}</TableCell>
                      ))}
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            Boolean(item.active ?? true)
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {Boolean(item.active ?? true) ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteClick(item)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Desactivar</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-2 md:hidden">
            {filteredItems.map((item, index) => {
              const idValue = Number(item[config.idField]);
              return (
                <div
                  key={idValue}
                  className="rounded-xl border border-border bg-card p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        Boolean(item.active ?? true)
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {Boolean(item.active ?? true) ? "Activo" : "Inactivo"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                        className="h-7 px-2 text-xs"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(item)}
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        <Ban className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <dl className="space-y-1.5">
                    {visibleFields.slice(0, 4).map((field) => (
                      <div key={field.name} className="flex items-baseline justify-between gap-2">
                        <dt className="shrink-0 text-xs text-muted-foreground">{field.label}</dt>
                        <dd className="truncate text-right text-sm">{formatValue(item[field.name])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{filteredItems.length}</span>{" "}
              de <span className="font-medium text-foreground">{items.length}</span> registros
            </p>
          </div>
        </>
      )}

      {/* Dialogs */}
      <CatalogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={config.singularTitle}
        fields={config.fields}
        item={editItem}
        onSubmit={handleFormSubmit}
      />
      <CatalogDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deleteTarget ? String(deleteTarget[config.nameField] ?? "") : ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
