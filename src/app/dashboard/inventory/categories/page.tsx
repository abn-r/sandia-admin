import Link from "next/link";
import { Boxes, Search, Tags } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listInventoryCategories, type InventoryCategory } from "@/lib/api/inventory";
import { unwrapList } from "@/lib/api/response";
import { AutoSubmitFiltersForm } from "@/components/shared/auto-submit-filters-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CategoryStatusFilter = "all" | "active" | "inactive";

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: string | undefined, fallback: number, max = 1000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

function normalizeStatusFilter(value: string | undefined): CategoryStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function createBaseQueryParams({
  searchText,
  statusFilter,
  perPage,
}: {
  searchText: string;
  statusFilter: CategoryStatusFilter;
  perPage: number;
}) {
  const params = new URLSearchParams();

  if (searchText) {
    params.set("q", searchText);
  }

  if (statusFilter !== "all") {
    params.set("status", statusFilter);
  }

  if (perPage !== 20) {
    params.set("perPage", String(perPage));
  }

  return params;
}

export default async function InventoryCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const searchText = readParam(params, "q")?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(readParam(params, "status"));
  const perPage = parsePositiveInteger(readParam(params, "perPage"), 20, 100);
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1, 9999);

  let endpointAvailable = true;
  let endpointState: "forbidden" | "missing" | "rate-limited" | "unavailable" | null = null;
  let endpointDetail = "";

  let categories: InventoryCategory[] = [];
  try {
    const response = await listInventoryCategories();
    categories = unwrapList<InventoryCategory>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      endpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        endpointState = "forbidden";
        endpointDetail = "No tienes permisos para consultar categorías de inventario.";
      } else if (error.status === 429) {
        endpointState = "rate-limited";
        endpointDetail = "Rate limit alcanzado. Intenta nuevamente en unos segundos.";
      } else if (error.status === 404 || error.status === 405) {
        endpointState = "missing";
        endpointDetail = "Endpoint de categorías de inventario no publicado o sin método habilitado.";
      } else {
        endpointState = "unavailable";
        endpointDetail = "Backend no disponible temporalmente para categorías de inventario.";
      }
    } else {
      throw error;
    }
  }

  const filteredCategories = categories
    .filter((category) => {
      if (statusFilter === "active" && !Boolean(category.active ?? true)) {
        return false;
      }

      if (statusFilter === "inactive" && Boolean(category.active ?? true)) {
        return false;
      }

      if (searchText.length > 0) {
        const needle = searchText.toLowerCase();
        const haystack = [category.name, category.description ?? "", String(category.category_id)]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(needle)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name, "es"));

  const totalItems = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedCategories = filteredCategories.slice(start, start + perPage);

  const baseParams = createBaseQueryParams({ searchText, statusFilter, perPage });
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));
  const prevHref = `/dashboard/inventory/categories?${prevParams.toString()}`;
  const nextHref = `/dashboard/inventory/categories?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Tags}
        title="Categorías de inventario"
        description="Catálogo de categorías para clasificar los ítems de inventario."
        actions={
          <Link href="/dashboard/inventory">
            <Button variant="outline">Volver a Inventario</Button>
          </Link>
        }
      />

      {!endpointAvailable ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge
              variant={
                endpointState === "forbidden" || endpointState === "rate-limited"
                  ? "warning"
                  : endpointState === "missing"
                    ? "secondary"
                    : "destructive"
              }
            >
              {endpointState === "forbidden"
                ? "Sin acceso"
                : endpointState === "rate-limited"
                  ? "Rate limitado"
                  : endpointState === "missing"
                    ? "No publicado"
                    : "No disponible"}
            </Badge>
            <p className="text-sm text-muted-foreground">{endpointDetail}</p>
          </CardContent>
        </Card>
      ) : null}

      {endpointAvailable ? (
        <Card>
          <CardContent className="p-4">
            <AutoSubmitFiltersForm action="/dashboard/inventory/categories" className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <Input name="q" defaultValue={searchText} placeholder="Buscar por nombre, descripción o ID" />
              </div>

              <Select name="status" defaultValue={statusFilter}>
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </Select>

              <div className="flex items-center gap-2">
                <Select name="perPage" defaultValue={String(perPage)}>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                  Filtrar
                </Button>
                <Link href="/dashboard/inventory/categories">
                  <Button type="button" size="sm" variant="outline">
                    Limpiar
                  </Button>
                </Link>
              </div>
            </AutoSubmitFiltersForm>
          </CardContent>
        </Card>
      ) : null}

      {!endpointAvailable ? (
        <EmptyState icon={Boxes} title="Categorías no disponibles" description={endpointDetail} />
      ) : totalItems === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Sin categorías para mostrar"
          description="No hay categorías de inventario con los filtros actuales."
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} categorías
            </span>
            <span>
              Página {currentPage} de {totalPages}
            </span>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.map((category) => (
                  <TableRow key={category.category_id}>
                    <TableCell className="pl-5 font-mono text-xs text-muted-foreground">
                      {category.category_id}
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.description || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge active={Boolean(category.active ?? true)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {paginatedCategories.map((category) => (
              <Card key={category.category_id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{category.name}</p>
                    <StatusBadge active={Boolean(category.active ?? true)} />
                  </div>
                  <Badge variant="outline" className="mb-2">
                    ID {category.category_id}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{category.description || "Sin descripción"}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Link href={prevHref} aria-disabled={currentPage <= 1}>
              <Button size="sm" variant="outline" disabled={currentPage <= 1}>
                Anterior
              </Button>
            </Link>

            <Link href={nextHref} aria-disabled={currentPage >= totalPages}>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages}>
                Siguiente
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
