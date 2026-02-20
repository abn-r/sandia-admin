import Link from "next/link";
import { Plus, Pencil, Search, Users } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listClubs, type Club } from "@/lib/api/clubs";
import { unwrapList } from "@/lib/api/response";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClubDeleteAction } from "@/components/clubs/club-delete-action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClubStatusFilter = "all" | "active" | "inactive";

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

function normalizeStatusFilter(value: string | undefined): ClubStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function getDistrictId(club: Club) {
  if (typeof club.district_id === "number") {
    return club.district_id;
  }

  if (typeof club.districlub_type_id === "number") {
    return club.districlub_type_id;
  }

  return null;
}

function createBaseQueryParams({
  searchText,
  statusFilter,
  perPage,
}: {
  searchText: string;
  statusFilter: ClubStatusFilter;
  perPage: number;
}) {
  const params = new URLSearchParams();

  if (searchText) {
    params.set("q", searchText);
  }

  if (statusFilter !== "all") {
    params.set("status", statusFilter);
  }

  if (perPage !== 12) {
    params.set("perPage", String(perPage));
  }

  return params;
}

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const searchText = readParam(params, "q")?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(readParam(params, "status"));
  const perPage = parsePositiveInteger(readParam(params, "perPage"), 12);
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1);

  let endpointAvailable = true;
  let endpointState: "available" | "forbidden" | "missing" | "rate-limited" = "available";
  let endpointDetail = "";
  let clubs: Club[] = [];

  try {
    const response = await listClubs({ page: 1, limit: 400 });
    clubs = unwrapList<Club>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      endpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        endpointState = "forbidden";
        endpointDetail = "No tienes permisos para consultar clubes en este entorno.";
      } else if (error.status === 429) {
        endpointState = "rate-limited";
        endpointDetail = "Rate limit alcanzado en backend. Reintenta en unos segundos.";
      } else if (error.status >= 500) {
        endpointState = "missing";
        endpointDetail = "Backend no disponible temporalmente para consultar clubes.";
      } else {
        endpointState = "missing";
        endpointDetail = "Endpoint de clubes no publicado o sin metodo habilitado.";
      }
    } else {
      throw error;
    }
  }

  const filteredClubs = clubs.filter((club) => {
    if (statusFilter === "active" && !Boolean(club.active)) {
      return false;
    }

    if (statusFilter === "inactive" && Boolean(club.active)) {
      return false;
    }

    if (searchText.length > 0) {
      const needle = searchText.toLowerCase();
      const haystack = [
        club.name,
        String(club.club_id),
        String(club.local_field_id),
        String(getDistrictId(club) ?? ""),
        String(club.church_id),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredClubs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedClubs = filteredClubs.slice(start, start + perPage);

  const baseParams = createBaseQueryParams({
    searchText,
    statusFilter,
    perPage,
  });
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));

  const prevHref = `/dashboard/clubs?${prevParams.toString()}`;
  const nextHref = `/dashboard/clubs?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Clubes"
        description="Gestion de clubes base del sistema."
        actions={
          <Link href="/dashboard/clubs/new">
            <Button>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Club</span>
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
            <form action="/dashboard/clubs" className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <Input
                  name="q"
                  defaultValue={searchText}
                  placeholder="Buscar por nombre, ID, campo, distrito o iglesia"
                />
              </div>

              <Select name="status" defaultValue={statusFilter}>
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
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
                <Link href="/dashboard/clubs">
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
          icon={Users}
          title="Modulo de clubes no disponible"
          description={endpointDetail}
        />
      ) : totalItems === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin clubes disponibles"
          description="No hay clubes para mostrar con los filtros aplicados."
          action={
            <Link href="/dashboard/clubs/new">
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Crear Club
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} clubes
            </span>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Campo local</TableHead>
                  <TableHead>Distrito</TableHead>
                  <TableHead>Iglesia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClubs.map((club) => (
                  <TableRow key={club.club_id}>
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{club.local_field_id}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {getDistrictId(club) ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{club.church_id}</TableCell>
                    <TableCell>
                      <StatusBadge active={club.active} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/dashboard/clubs/${club.club_id}`}>
                              <Button size="icon-sm" variant="ghost">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <ClubDeleteAction clubId={club.club_id} clubName={club.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {paginatedClubs.map((club) => (
              <Card key={club.club_id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{club.name}</p>
                    <StatusBadge active={club.active} />
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Campo {club.local_field_id} · Distrito {getDistrictId(club) ?? "—"} · Iglesia {club.church_id}
                  </p>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/clubs/${club.club_id}`}>
                      <Button size="xs" variant="ghost">
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                    </Link>
                    <ClubDeleteAction clubId={club.club_id} clubName={club.name} compact={false} />
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
      )}
    </div>
  );
}
