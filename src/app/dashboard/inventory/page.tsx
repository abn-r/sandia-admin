import Link from "next/link";
import { Boxes, Pencil, Plus, Search } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  listClubInventory,
  listInventoryCategories,
  type InventoryCategory,
  type InventoryItem,
} from "@/lib/api/inventory";
import { listClubs, type Club } from "@/lib/api/clubs";
import { unwrapList } from "@/lib/api/response";
import { InventoryDeleteAction } from "@/components/inventory/inventory-delete-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type InventoryStatusFilter = "all" | "active" | "inactive";
type InventoryInstanceFilter = "all" | "adventurers" | "pathfinders" | "master_guilds";

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parsePositiveIntegerOrNull(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return Math.floor(parsed);
}

function normalizeStatusFilter(value: string | undefined): InventoryStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function normalizeInstanceFilter(value: string | undefined): InventoryInstanceFilter {
  if (value === "adventurers" || value === "pathfinders" || value === "master_guilds") {
    return value;
  }

  return "all";
}

function getCategoryLabel(categoryMap: Map<number, string>, categoryId: number | null | undefined) {
  if (typeof categoryId !== "number") {
    return "N/A";
  }

  return categoryMap.get(categoryId) ?? `#${categoryId}`;
}

function getInstanceType(item: InventoryItem): InventoryInstanceFilter {
  if (typeof item.club_adv_id === "number") {
    return "adventurers";
  }

  if (typeof item.club_mg_id === "number") {
    return "master_guilds";
  }

  if (typeof item.club_pathf_id === "number") {
    return "pathfinders";
  }

  return "all";
}

function getInstanceLabel(instanceType: InventoryInstanceFilter) {
  if (instanceType === "adventurers") {
    return "Aventureros";
  }

  if (instanceType === "pathfinders") {
    return "Conquistadores";
  }

  if (instanceType === "master_guilds") {
    return "Guias Mayores";
  }

  return "N/A";
}

function mapInstanceQueryFilter(instanceType: InventoryInstanceFilter) {
  if (instanceType === "adventurers") {
    return "adv" as const;
  }

  if (instanceType === "pathfinders") {
    return "pathf" as const;
  }

  if (instanceType === "master_guilds") {
    return "mg" as const;
  }

  return undefined;
}

function createBaseQueryParams({
  clubId,
  searchText,
  statusFilter,
  instanceFilter,
  categoryFilter,
  perPage,
}: {
  clubId: number | null;
  searchText: string;
  statusFilter: InventoryStatusFilter;
  instanceFilter: InventoryInstanceFilter;
  categoryFilter: number | null;
  perPage: number;
}) {
  const params = new URLSearchParams();

  if (clubId) {
    params.set("clubId", String(clubId));
  }

  if (searchText) {
    params.set("q", searchText);
  }

  if (statusFilter !== "all") {
    params.set("status", statusFilter);
  }

  if (instanceFilter !== "all") {
    params.set("instanceType", instanceFilter);
  }

  if (categoryFilter) {
    params.set("categoryId", String(categoryFilter));
  }

  if (perPage !== 12) {
    params.set("perPage", String(perPage));
  }

  return params;
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedClubId = parsePositiveIntegerOrNull(readParam(params, "clubId"));
  const searchText = readParam(params, "q")?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(readParam(params, "status"));
  const instanceFilter = normalizeInstanceFilter(readParam(params, "instanceType"));
  const categoryFilter = parsePositiveIntegerOrNull(readParam(params, "categoryId"));
  const perPage = parsePositiveInteger(readParam(params, "perPage"), 12);
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1);

  let clubsEndpointAvailable = true;
  let categoriesEndpointAvailable = true;
  let inventoryEndpointAvailable = true;
  let clubsEndpointDetail = "";
  let categoriesEndpointDetail = "";
  let inventoryEndpointDetail = "";

  let clubs: Club[] = [];
  let categories: InventoryCategory[] = [];

  try {
    const clubsResponse = await listClubs({ page: 1, limit: 200 });
    clubs = unwrapList<Club>(clubsResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      clubsEndpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        clubsEndpointDetail = "Sin permisos para consultar clubes.";
      } else if (error.status === 429) {
        clubsEndpointDetail = "Rate limit alcanzado al consultar clubes.";
      } else if (error.status >= 500) {
        clubsEndpointDetail = "Backend no disponible temporalmente para consultar clubes.";
      } else {
        clubsEndpointDetail = "Endpoint de clubes no disponible.";
      }
    } else {
      throw error;
    }
  }

  try {
    const categoriesResponse = await listInventoryCategories();
    categories = unwrapList<InventoryCategory>(categoriesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      categoriesEndpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        categoriesEndpointDetail = "Sin permisos para consultar categorias de inventario.";
      } else if (error.status === 429) {
        categoriesEndpointDetail = "Rate limit alcanzado al consultar categorias de inventario.";
      } else if (error.status >= 500) {
        categoriesEndpointDetail = "Backend no disponible temporalmente para consultar categorias de inventario.";
      } else {
        categoriesEndpointDetail = "Endpoint de categorias de inventario no disponible.";
      }
    } else {
      throw error;
    }
  }

  const selectedClub = clubs.find((club) => club.club_id === requestedClubId) ?? clubs[0] ?? null;

  let items: InventoryItem[] = [];
  if (selectedClub) {
    try {
      const inventoryResponse = await listClubInventory(selectedClub.club_id, {
        instanceType: mapInstanceQueryFilter(instanceFilter),
        includeInactive: statusFilter === "all" || statusFilter === "inactive" ? true : undefined,
      });
      items = unwrapList<InventoryItem>(inventoryResponse);
    } catch (error) {
      if (
        error instanceof ApiError &&
        ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
      ) {
        inventoryEndpointAvailable = false;
        if (error.status === 401 || error.status === 403) {
          inventoryEndpointDetail = "Sin permisos para consultar inventario del club.";
        } else if (error.status === 429) {
          inventoryEndpointDetail = "Rate limit alcanzado al consultar inventario.";
        } else if (error.status >= 500) {
          inventoryEndpointDetail = "Backend no disponible temporalmente para consultar inventario.";
        } else {
          inventoryEndpointDetail = "Endpoint de inventario no disponible.";
        }
      } else {
        throw error;
      }
    }
  }

  const filteredItems = items.filter((item) => {
    if (statusFilter === "active" && !Boolean(item.active ?? true)) {
      return false;
    }

    if (statusFilter === "inactive" && Boolean(item.active ?? true)) {
      return false;
    }

    if (instanceFilter !== "all" && getInstanceType(item) !== instanceFilter) {
      return false;
    }

    if (categoryFilter !== null && item.inventory_category_id !== categoryFilter) {
      return false;
    }

    if (searchText.length > 0) {
      const needle = searchText.toLowerCase();
      const haystack = [item.name, item.description, String(item.inventory_id), String(item.amount)]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedItems = filteredItems.slice(start, start + perPage);

  const categoryMap = new Map(categories.map((category) => [category.category_id, category.name]));
  const createHref = selectedClub ? `/dashboard/inventory/new?clubId=${selectedClub.club_id}` : "/dashboard/clubs/new";

  const baseParams = createBaseQueryParams({
    clubId: selectedClub?.club_id ?? null,
    searchText,
    statusFilter,
    instanceFilter,
    categoryFilter,
    perPage,
  });
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));

  const prevHref = `/dashboard/inventory?${prevParams.toString()}`;
  const nextHref = `/dashboard/inventory?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title="Inventario"
        description="Items de inventario por club, instancia y categoria."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/inventory/categories">
              <Button variant="outline">Categorías</Button>
            </Link>
            {selectedClub ? (
              <Link href={createHref}>
                <Button>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo Item</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      {!clubsEndpointAvailable ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant="warning">Sin acceso a clubes</Badge>
            <p className="text-sm text-muted-foreground">{clubsEndpointDetail}</p>
          </CardContent>
        </Card>
      ) : null}

      {clubsEndpointAvailable && selectedClub ? (
        <Card>
          <CardContent className="p-4">
            <form action="/dashboard/inventory" className="grid gap-3 md:grid-cols-5">
              <Select name="clubId" defaultValue={String(selectedClub.club_id)}>
                {clubs.map((club) => (
                  <option key={club.club_id} value={String(club.club_id)}>
                    {club.name}
                  </option>
                ))}
              </Select>

              <div className="md:col-span-2">
                <Input
                  name="q"
                  defaultValue={searchText}
                  placeholder="Buscar por item, descripcion o cantidad"
                />
              </div>

              <Select name="status" defaultValue={statusFilter}>
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Select>

              <Select name="instanceType" defaultValue={instanceFilter}>
                <option value="all">Todas las instancias</option>
                <option value="adventurers">Aventureros</option>
                <option value="pathfinders">Conquistadores</option>
                <option value="master_guilds">Guias Mayores</option>
              </Select>

              <Select name="categoryId" defaultValue={categoryFilter ? String(categoryFilter) : "all"}>
                <option value="all">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={String(category.category_id)}>
                    {category.name}
                  </option>
                ))}
              </Select>

              <div className="md:col-span-2 flex items-center gap-2">
                <Select name="perPage" defaultValue={String(perPage)}>
                  <option value="12">12 por pagina</option>
                  <option value="24">24 por pagina</option>
                  <option value="48">48 por pagina</option>
                </Select>
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                  Filtrar
                </Button>
                <Link href="/dashboard/inventory">
                  <Button type="button" size="sm" variant="outline">
                    Limpiar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!selectedClub ? (
        <EmptyState
          icon={Boxes}
          title="Sin club de referencia"
          description="No hay clubes disponibles para consultar o registrar inventario."
          action={
            <Link href="/dashboard/clubs/new">
              <Button variant="outline" size="sm">
                Crear Club
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">
              Club actual: <strong className="text-foreground">{selectedClub.name}</strong>
            </p>
            {!categoriesEndpointAvailable ? (
              <p className="text-xs text-warning-foreground">{categoriesEndpointDetail}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Categorias de inventario disponibles: {categories.length}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedClub && !inventoryEndpointAvailable ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant="warning">Sin acceso a inventario</Badge>
            <p className="text-sm text-muted-foreground">{inventoryEndpointDetail}</p>
          </CardContent>
        </Card>
      ) : null}

      {selectedClub && inventoryEndpointAvailable && totalItems === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Sin items de inventario"
          description="No hay items para mostrar con los filtros actuales."
          action={
            <Link href={createHref}>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Registrar Item
              </Button>
            </Link>
          }
        />
      ) : null}

      {selectedClub && inventoryEndpointAvailable && totalItems > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} items
            </span>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Instancia</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow key={item.inventory_id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(categoryMap, item.inventory_category_id)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{getInstanceLabel(getInstanceType(item))}</TableCell>
                    <TableCell className="tabular-nums">{item.amount}</TableCell>
                    <TableCell>
                      <StatusBadge active={Boolean(item.active ?? true)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/dashboard/inventory/${item.inventory_id}`}>
                              <Button size="icon-sm" variant="ghost">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <InventoryDeleteAction inventoryId={item.inventory_id} name={item.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {paginatedItems.map((item) => (
              <Card key={item.inventory_id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <StatusBadge active={Boolean(item.active ?? true)} />
                  </div>
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{getCategoryLabel(categoryMap, item.inventory_category_id)}</Badge>
                    <Badge variant="outline">{getInstanceLabel(getInstanceType(item))}</Badge>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">Cantidad: {item.amount}</p>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/inventory/${item.inventory_id}`}>
                      <Button size="xs" variant="ghost">
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                    </Link>
                    <InventoryDeleteAction inventoryId={item.inventory_id} name={item.name} compact={false} />
                  </div>
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
      ) : null}
    </div>
  );
}
