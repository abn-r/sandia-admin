import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import { BadgeCheck, ListFilter, Plus, Pencil, Rows3, Search } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { entityConfigs, type EntityField, type EntityKey } from "@/lib/catalogs/entities";
import { listEntityItems } from "@/lib/catalogs/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AutoSubmitFiltersForm } from "@/components/shared/auto-submit-filters-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CatalogDeleteAction } from "@/components/catalogs/catalog-delete-action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ActiveFilter = "all" | "true" | "false";

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: string | undefined, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

function parseOptionalPositiveInteger(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return undefined;
  }

  return Math.floor(parsed);
}

function normalizeActiveFilter(value: string | undefined): ActiveFilter {
  if (value === "true" || value === "false") {
    return value;
  }

  return "all";
}

function getItemSearchText(item: Record<string, unknown>, fieldNames: string[]) {
  return fieldNames
    .map((fieldName) => item[fieldName])
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value).toLowerCase())
    .join(" ");
}

async function safeListItems(entityKey: EntityKey) {
  try {
    return await listEntityItems(entityKey);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      return [];
    }

    throw error;
  }
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (typeof value === "string") {
    const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      return <span className="tabular-nums">{`${day}/${month}/${year}`}</span>;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = parseISO(value);
      if (isValid(date)) {
        return <span className="tabular-nums">{format(date, "dd/MM/yyyy")}</span>;
      }
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
  const searchText = (readParam(resolvedParams, "search") ?? readParam(resolvedParams, "q") ?? "").trim();
  const activeFilter = normalizeActiveFilter(readParam(resolvedParams, "active"));
  const limit = parsePositiveInteger(readParam(resolvedParams, "limit"), 20, 100);
  const requestedPage = parsePositiveInteger(readParam(resolvedParams, "page"), 1, 9999);
  const parentFilterValue = config.parentFilter
    ? parseOptionalPositiveInteger(readParam(resolvedParams, config.parentFilter.queryParam))
    : undefined;

  const backendQuery: Record<string, string | undefined> = {};
  if (config.parentFilter && typeof parentFilterValue === "number") {
    backendQuery[config.parentFilter.queryParam] = String(parentFilterValue);
  }

  const items = await listEntityItems(entityKey, backendQuery);

  const visibleFields = config.fields.filter((field) => field.name !== "active");
  const canMutate = config.allowMutations !== false;
  const relationFields = visibleFields.filter(
    (field): field is EntityField & { optionsEntityKey: EntityKey } =>
      field.type === "select" && typeof field.optionsEntityKey === "string",
  );
  const lookupEntityKeys = new Set<EntityKey>();

  if (config.parentFilter) {
    lookupEntityKeys.add(config.parentFilter.entityKey);
  }

  for (const field of relationFields) {
    lookupEntityKeys.add(field.optionsEntityKey);
  }

  const lookupEntries = await Promise.all(
    Array.from(lookupEntityKeys).map(async (lookupEntityKey) => {
      const records = await safeListItems(lookupEntityKey);
      return [lookupEntityKey, records] as const;
    }),
  );

  const relationLabelByEntity = new Map<EntityKey, Map<string, string>>();

  for (const [lookupEntityKey, records] of lookupEntries) {
    const relatedConfig = entityConfigs[lookupEntityKey];
    const labels = new Map<string, string>();

    for (const record of records) {
      const idValue = record[relatedConfig.idField];
      if (idValue === null || idValue === undefined || idValue === "") {
        continue;
      }

      labels.set(String(idValue), String(record[relatedConfig.nameField] ?? `#${String(idValue)}`));
    }

    relationLabelByEntity.set(lookupEntityKey, labels);
  }

  const parentOptions = config.parentFilter
    ? (lookupEntries
      .find(([entity]) => entity === config.parentFilter!.entityKey)?.[1] ?? []
    )
      .filter((item) => item.active !== false)
      .map((item) => {
        const parentConfig = entityConfigs[config.parentFilter!.entityKey];
        const id = Number(item[parentConfig.idField]);
        if (!Number.isFinite(id) || id < 1) {
          return null;
        }

        return {
          value: id,
          label: String(item[parentConfig.nameField] ?? `#${id}`),
        };
      })
      .filter((option): option is { value: number; label: string } => Boolean(option))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))
    : [];

  function formatFieldValue(field: EntityField, rawValue: unknown) {
    if (field.type === "select" && field.optionsEntityKey) {
      const relatedEntity = field.optionsEntityKey;
      const relatedConfig = entityConfigs[relatedEntity];
      const labels = relationLabelByEntity.get(relatedEntity);

      if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
        const nameValue = (rawValue as Record<string, unknown>).name;
        if (typeof nameValue === "string" && nameValue.trim().length > 0) {
          return nameValue.trim();
        }

        const nestedId = (rawValue as Record<string, unknown>)[relatedConfig.idField];
        if (nestedId !== null && nestedId !== undefined && labels?.has(String(nestedId))) {
          return labels.get(String(nestedId));
        }
      }

      if (rawValue !== null && rawValue !== undefined && rawValue !== "" && labels?.has(String(rawValue))) {
        return labels.get(String(rawValue));
      }
    }

    return formatValue(rawValue);
  }

  const searchFieldNames = Array.from(
    new Set([config.nameField, ...visibleFields.map((field) => field.name), config.idField]),
  );

  const filteredItems = items.filter((item) => {
    if (activeFilter === "true" && !Boolean(item.active ?? true)) {
      return false;
    }

    if (activeFilter === "false" && Boolean(item.active ?? true)) {
      return false;
    }

    if (searchText.length > 0) {
      const itemSearchText = getItemSearchText(item, searchFieldNames);
      if (!itemSearchText.includes(searchText.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * limit;
  const paginatedItems = filteredItems.slice(start, start + limit);

  const baseParams = new URLSearchParams();

  if (searchText.length > 0) {
    baseParams.set("search", searchText);
  }

  if (activeFilter !== "all") {
    baseParams.set("active", activeFilter);
  }

  if (config.parentFilter && typeof parentFilterValue === "number") {
    baseParams.set(config.parentFilter.queryParam, String(parentFilterValue));
  }

  if (limit !== 20) {
    baseParams.set("limit", String(limit));
  }

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, page - 1)));

  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, page + 1)));

  const prevHref = `${config.routeBase}?${prevParams.toString()}`;
  const nextHref = `${config.routeBase}?${nextParams.toString()}`;
  const hasFiltersApplied =
    searchText.length > 0 || activeFilter !== "all" || typeof parentFilterValue === "number";

  return (
    <div className="space-y-5">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          canMutate ? (
            <Link href={`${config.routeBase}/new`}>
              <Button>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo {config.singularTitle}</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </Link>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-4">
          <AutoSubmitFiltersForm action={config.routeBase} className="grid gap-3 md:grid-cols-12">
            {/* 
            <div className="md:col-span-12">
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ListFilter className="h-4 w-4 text-primary" />
                  Filtros de consulta
                </p>
                <p className="text-xs text-muted-foreground">
                  Refina resultados por texto, estado y relación.
                </p>
              </div>
            </div>
            */}

            <div className={config.parentFilter ? "md:col-span-4" : "md:col-span-6"}>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Search className="h-3.5 w-3.5" />
                Búsqueda
              </p>
              <Input name="search" defaultValue={searchText} placeholder="Buscar por nombre o referencia" />
            </div>

            <div className="md:col-span-3">
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <BadgeCheck className="h-3.5 w-3.5" />
                Estado
              </p>
              <Select name="active" defaultValue={activeFilter}>
                <option value="all">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>
            </div>

            {config.parentFilter ? (
              <div className="md:col-span-3">
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <ListFilter className="h-3.5 w-3.5" />
                  {config.parentFilter.label}
                </p>
                <Select
                  name={config.parentFilter.queryParam}
                  defaultValue={typeof parentFilterValue === "number" ? String(parentFilterValue) : "all"}
                >
                  <option value="all">Todos los {config.parentFilter.label.toLowerCase()}</option>
                  {parentOptions.map((option) => (
                    <option key={option.value} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="md:col-span-12 flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Rows3 className="h-3.5 w-3.5" />
                  Elementos por página
                </p>
                <Select name="limit" defaultValue={String(limit)} className="w-44">
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                  Filtrar
                </Button>
                <Link href={config.routeBase}>
                  <Button type="button" size="sm" variant="outline">
                    Limpiar
                  </Button>
                </Link>
              </div>
            </div>
          </AutoSubmitFiltersForm>
        </CardContent>
      </Card>

      {paginatedItems.length === 0 ? (
        <EmptyState
          title={`No hay ${config.title.toLowerCase()} registradas`}
          description={
            hasFiltersApplied
              ? "No hay resultados con los filtros aplicados. Ajusta los criterios e intenta de nuevo."
              : canMutate
                ? "Ajusta tus filtros o agrega un nuevo registro para comenzar."
                : "Ajusta tus filtros o verifica que existan datos en el backend."
          }
          action={
            canMutate ? (
              <Link href={`${config.routeBase}/new`}>
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Crear {config.singularTitle}
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {start + paginatedItems.length} de {total} registros
            </span>
            <span>
              Página {page} de {totalPages}
            </span>
          </div>

          {/* Vista tabla — desktop */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">ID</TableHead>
                  {visibleFields.map((field) => (
                    <TableHead key={field.name}>{field.label}</TableHead>
                  ))}
                  <TableHead>Estado</TableHead>
                  {canMutate ? <TableHead className="text-right">Acciones</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => {
                  const idValue = Number(item[config.idField]);

                  return (
                    <TableRow key={idValue}>
                      <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{idValue}</TableCell>
                      {visibleFields.map((field) => (
                        <TableCell key={field.name}>{formatFieldValue(field, item[field.name])}</TableCell>
                      ))}
                      <TableCell>
                        <StatusBadge active={Boolean(item.active ?? true)} />
                      </TableCell>
                      {canMutate ? (
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
                            <CatalogDeleteAction
                              entityKey={entityKey}
                              idValue={idValue}
                              returnPath={config.routeBase}
                              itemName={String(item[config.nameField] ?? "")}
                            />
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Vista cards — mobile */}
          <div className="space-y-2 md:hidden">
            {paginatedItems.map((item) => {
              const idValue = Number(item[config.idField]);
              return (
                <Card key={idValue}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        ID {idValue}
                      </span>
                      <StatusBadge active={Boolean(item.active ?? true)} />
                      {canMutate ? (
                        <div className="flex gap-1">
                          <Link href={`${config.routeBase}/${idValue}`}>
                            <Button size="xs" variant="ghost">
                              <Pencil className="h-3 w-3" />
                              Editar
                            </Button>
                          </Link>
                          <CatalogDeleteAction
                            entityKey={entityKey}
                            idValue={idValue}
                            returnPath={config.routeBase}
                            itemName={String(item[config.nameField] ?? "")}
                            compact={false}
                          />
                        </div>
                      ) : null}
                    </div>
                    <dl className="space-y-1.5">
                      {visibleFields.slice(0, 4).map((field) => (
                        <div key={field.name} className="flex items-baseline justify-between gap-2">
                          <dt className="shrink-0 text-xs text-muted-foreground">{field.label}</dt>
                          <dd className="truncate text-right text-sm">{formatFieldValue(field, item[field.name])}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <Link href={prevHref} aria-disabled={page <= 1}>
              <Button size="sm" variant="outline" disabled={page <= 1}>
                Anterior
              </Button>
            </Link>

            <Link href={nextHref} aria-disabled={page >= totalPages}>
              <Button size="sm" variant="outline" disabled={page >= totalPages}>
                Siguiente
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
