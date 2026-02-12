import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import { Plus, Pencil, Ban } from "lucide-react";
import { deleteCatalogItemAction } from "@/lib/catalogs/actions";
import { entityConfigs, type EntityKey } from "@/lib/catalogs/entities";
import { listEntityItems } from "@/lib/catalogs/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = parseISO(value);
    if (isValid(date)) {
      return <span className="tabular-nums">{format(date, "dd/MM/yyyy")}</span>;
    }
  }

  return String(value);
}

export async function CatalogListPage({
  entityKey,
  searchParams,
}: {
  entityKey: EntityKey;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const config = entityConfigs[entityKey];
  const resolvedParams = (await searchParams) ?? {};

  const parsedParams = Object.fromEntries(
    Object.entries(resolvedParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );

  const items = await listEntityItems(entityKey, parsedParams);
  const visibleFields = config.fields.filter((field) => field.name !== "active");

  return (
    <div className="space-y-5">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <Link href={`${config.routeBase}/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo {config.singularTitle}</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title={`No hay ${config.title.toLowerCase()} registradas`}
          description="Cuando el backend exponga el endpoint admin, aqui se mostraran los registros activos e inactivos."
          action={
            <Link href={`${config.routeBase}/new`}>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Crear {config.singularTitle}
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Vista tabla — desktop */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
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
                {items.map((item) => {
                  const idValue = Number(item[config.idField]);

                  return (
                    <TableRow key={idValue}>
                      {visibleFields.map((field) => (
                        <TableCell key={field.name}>{formatValue(item[field.name])}</TableCell>
                      ))}
                      <TableCell>
                        <StatusBadge active={Boolean(item.active ?? true)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`${config.routeBase}/${idValue}`}>
                                <Button size="icon-sm" variant="ghost">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <form action={deleteCatalogItemAction}>
                                <input type="hidden" name="entityKey" value={entityKey} />
                                <input type="hidden" name="id" value={idValue} />
                                <input type="hidden" name="returnPath" value={config.routeBase} />
                                <Button size="icon-sm" variant="ghost" type="submit" className="text-destructive hover:text-destructive">
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                              </form>
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

          {/* Vista cards — mobile */}
          <div className="space-y-2 md:hidden">
            {items.map((item) => {
              const idValue = Number(item[config.idField]);
              return (
                <Card key={idValue}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <StatusBadge active={Boolean(item.active ?? true)} />
                      <div className="flex gap-1">
                        <Link href={`${config.routeBase}/${idValue}`}>
                          <Button size="xs" variant="ghost">
                            <Pencil className="h-3 w-3" />
                            Editar
                          </Button>
                        </Link>
                        <form action={deleteCatalogItemAction}>
                          <input type="hidden" name="entityKey" value={entityKey} />
                          <input type="hidden" name="id" value={idValue} />
                          <input type="hidden" name="returnPath" value={config.routeBase} />
                          <Button size="xs" variant="ghost" type="submit" className="text-destructive hover:text-destructive">
                            <Ban className="h-3 w-3" />
                          </Button>
                        </form>
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
