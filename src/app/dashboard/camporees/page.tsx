import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import { Pencil, Plus, Search, Tent } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listCamporees } from "@/lib/api/camporees";
import { unwrapList } from "@/lib/api/response";
import { CamporeeDeleteAction } from "@/components/camporees/camporee-delete-action";
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

type CamporeeItem = Record<string, unknown>;
type CamporeeStatusFilter = "all" | "active" | "inactive";
type CamporeeTypeFilter = "all" | "local" | "union";

function getCamporeeId(item: CamporeeItem) {
  const rawValue = item.camporee_id ?? item.local_camporee_id ?? item.id;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getCamporeeName(item: CamporeeItem) {
  const value = String(item.name ?? "").trim();
  return value || "Camporee";
}

function getDateLabel(value: unknown) {
  if (typeof value !== "string") {
    return "—";
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : value;
}

function getTypeLabel(item: CamporeeItem): CamporeeTypeFilter {
  const value = String(item.type ?? item.camporee_type ?? "local").toLowerCase();
  return value === "union" ? "union" : "local";
}

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

function normalizeStatusFilter(value: string | undefined): CamporeeStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function normalizeTypeFilter(value: string | undefined): CamporeeTypeFilter {
  if (value === "local" || value === "union") {
    return value;
  }

  return "all";
}

function createBaseQueryParams({
  searchText,
  statusFilter,
  typeFilter,
  perPage,
}: {
  searchText: string;
  statusFilter: CamporeeStatusFilter;
  typeFilter: CamporeeTypeFilter;
  perPage: number;
}) {
  const params = new URLSearchParams();

  if (searchText) {
    params.set("q", searchText);
  }

  if (statusFilter !== "all") {
    params.set("status", statusFilter);
  }

  if (typeFilter !== "all") {
    params.set("type", typeFilter);
  }

  if (perPage !== 12) {
    params.set("perPage", String(perPage));
  }

  return params;
}

export default async function CamporeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const searchText = readParam(params, "q")?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(readParam(params, "status"));
  const typeFilter = normalizeTypeFilter(readParam(params, "type"));
  const perPage = parsePositiveInteger(readParam(params, "perPage"), 12);
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1);

  let endpointAvailable = true;
  let endpointState: "available" | "forbidden" | "missing" | "rate-limited" = "available";
  let endpointDetail = "";
  let camporees: CamporeeItem[] = [];
  try {
    const response = await listCamporees({ page: 1, limit: 300, type: typeFilter === "all" ? undefined : typeFilter });
    camporees = unwrapList<CamporeeItem>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      endpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        endpointState = "forbidden";
        endpointDetail = "No tienes permisos para consultar camporees en este entorno.";
      } else if (error.status === 429) {
        endpointState = "rate-limited";
        endpointDetail = "Rate limit alcanzado al consultar camporees. Reintenta en unos segundos.";
      } else if (error.status >= 500) {
        endpointState = "missing";
        endpointDetail = "Backend no disponible temporalmente para consultar camporees.";
      } else {
        endpointState = "missing";
        endpointDetail = "Endpoint de camporees no publicado o sin metodo habilitado.";
      }
    } else {
      throw error;
    }
  }

  const filteredCamporees = camporees.filter((item) => {
    if (statusFilter === "active" && !Boolean(item.active ?? true)) {
      return false;
    }

    if (statusFilter === "inactive" && Boolean(item.active ?? true)) {
      return false;
    }

    if (typeFilter !== "all" && getTypeLabel(item) !== typeFilter) {
      return false;
    }

    if (searchText.length > 0) {
      const needle = searchText.toLowerCase();
      const haystack = [getCamporeeName(item), String(getCamporeeId(item) ?? ""), String(item.local_camporee_place ?? "")]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredCamporees.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedCamporees = filteredCamporees.slice(start, start + perPage);

  const baseParams = createBaseQueryParams({
    searchText,
    statusFilter,
    typeFilter,
    perPage,
  });
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));

  const prevHref = `/dashboard/camporees?${prevParams.toString()}`;
  const nextHref = `/dashboard/camporees?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Tent}
        title="Camporees"
        description="Listado de camporees registrados en el sistema."
        actions={
          <Link href="/dashboard/camporees/new">
            <Button>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Camporee</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </Link>
        }
      />

      {!endpointAvailable ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant={endpointState === "missing" ? "secondary" : "warning"}>
              {endpointState === "forbidden"
                ? "Sin acceso"
                : endpointState === "rate-limited"
                  ? "Rate limitado"
                  : "No publicado"}
            </Badge>
            <p className="text-sm text-muted-foreground">{endpointDetail}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <form action="/dashboard/camporees" className="grid gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <Input
                  name="q"
                  defaultValue={searchText}
                  placeholder="Buscar por nombre, ID o lugar"
                />
              </div>

              <Select name="status" defaultValue={statusFilter}>
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Select>

              <Select name="type" defaultValue={typeFilter}>
                <option value="all">Todos los tipos</option>
                <option value="local">Local</option>
                <option value="union">Union</option>
              </Select>

              <div className="flex items-center gap-2">
                <Select name="perPage" defaultValue={String(perPage)}>
                  <option value="12">12 por pagina</option>
                  <option value="24">24 por pagina</option>
                  <option value="48">48 por pagina</option>
                </Select>
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                  Filtrar
                </Button>
                <Link href="/dashboard/camporees">
                  <Button type="button" size="sm" variant="outline">
                    Limpiar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!endpointAvailable ? (
        <EmptyState
          icon={Tent}
          title="Modulo de camporees no disponible"
          description={endpointDetail}
        />
      ) : totalItems === 0 ? (
        <EmptyState
          icon={Tent}
          title="Sin camporees disponibles"
          description="No hay eventos para mostrar con los filtros actuales."
          action={
            <Link href="/dashboard/camporees/new">
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Crear Camporee
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} camporees
            </span>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCamporees.map((item, index) => {
                  const camporeeId = getCamporeeId(item);
                  const camporeeName = getCamporeeName(item);

                  return (
                    <TableRow key={camporeeId ?? `camporee-${index}`}>
                      <TableCell className="font-medium">{camporeeName}</TableCell>
                      <TableCell className="tabular-nums">{getDateLabel(item.start_date)}</TableCell>
                      <TableCell className="tabular-nums">{getDateLabel(item.end_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(item)}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={Boolean(item.active ?? true)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {camporeeId ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/dashboard/camporees/${camporeeId}`}>
                                    <Button size="icon-sm" variant="ghost">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <CamporeeDeleteAction
                                camporeeId={camporeeId}
                                title={camporeeName}
                              />
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin ID</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {paginatedCamporees.map((item, index) => {
              const camporeeId = getCamporeeId(item);
              const camporeeName = getCamporeeName(item);

              return (
                <Card key={camporeeId ?? `camporee-mobile-${index}`}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{camporeeName}</p>
                      <StatusBadge active={Boolean(item.active ?? true)} />
                    </div>
                    <div className="mb-1.5 text-xs text-muted-foreground">
                      {getDateLabel(item.start_date)} - {getDateLabel(item.end_date)}
                    </div>
                    <div className="mb-2">
                      <Badge variant="outline">{getTypeLabel(item)}</Badge>
                    </div>
                    {camporeeId ? (
                      <div className="flex gap-1">
                        <Link href={`/dashboard/camporees/${camporeeId}`}>
                          <Button size="xs" variant="ghost">
                            <Pencil className="h-3 w-3" />
                            Editar
                          </Button>
                        </Link>
                        <CamporeeDeleteAction camporeeId={camporeeId} title={camporeeName} compact={false} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Registro sin identificador para editar.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
