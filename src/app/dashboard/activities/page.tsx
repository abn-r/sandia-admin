import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import { CalendarCheck, Pencil, Plus, Search } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listClubActivities } from "@/lib/api/activities";
import { listClubs, type Club } from "@/lib/api/clubs";
import { unwrapList } from "@/lib/api/response";
import { ActivityDeleteAction } from "@/components/activities/activity-delete-action";
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

type ActivityItem = {
  activity_id: number;
  title?: string;
  name?: string;
  activity_type?: string | number;
  activity_date?: string;
  start_date?: string;
  end_date?: string;
  attendance_count?: number;
  active?: boolean;
};

type ActivityStatusFilter = "all" | "active" | "inactive";

function formatDate(value: string | undefined) {
  if (!value) {
    return "—";
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : value;
}

function getActivityName(activity: ActivityItem) {
  const value = activity.name ?? activity.title;
  return value?.trim() ? value : "Actividad";
}

function getActivityDate(activity: ActivityItem) {
  return activity.activity_date ?? activity.start_date;
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

function normalizeStatusFilter(value: string | undefined): ActivityStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function createBaseQueryParams({
  clubId,
  searchText,
  statusFilter,
  perPage,
}: {
  clubId: number | null;
  searchText: string;
  statusFilter: ActivityStatusFilter;
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

  if (perPage !== 12) {
    params.set("perPage", String(perPage));
  }

  return params;
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedClubId = parsePositiveInteger(readParam(params, "clubId"), 0);
  const searchText = readParam(params, "q")?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(readParam(params, "status"));
  const perPage = parsePositiveInteger(readParam(params, "perPage"), 12);
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1);

  let clubsEndpointAvailable = true;
  let clubsEndpointDetail = "";
  let activitiesEndpointAvailable = true;
  let activitiesEndpointDetail = "";
  let clubs: Club[] = [];

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

  const selectedClub =
    clubs.find((club) => club.club_id === requestedClubId) ??
    clubs[0] ??
    null;

  let activities: ActivityItem[] = [];

  if (selectedClub) {
    try {
      const activitiesResponse = await listClubActivities(selectedClub.club_id, { page: 1, limit: 300 });
      activities = unwrapList<ActivityItem>(activitiesResponse);
    } catch (error) {
      if (
        error instanceof ApiError &&
        ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
      ) {
        activitiesEndpointAvailable = false;
        if (error.status === 401 || error.status === 403) {
          activitiesEndpointDetail = "Sin permisos para consultar actividades de este club.";
        } else if (error.status === 429) {
          activitiesEndpointDetail = "Rate limit alcanzado al consultar actividades.";
        } else if (error.status >= 500) {
          activitiesEndpointDetail = "Backend no disponible temporalmente para consultar actividades.";
        } else {
          activitiesEndpointDetail = "Endpoint de actividades no disponible.";
        }
      } else {
        throw error;
      }
    }
  }

  const filteredActivities = activities.filter((activity) => {
    if (statusFilter === "active" && !Boolean(activity.active ?? true)) {
      return false;
    }

    if (statusFilter === "inactive" && Boolean(activity.active ?? true)) {
      return false;
    }

    if (searchText.length > 0) {
      const needle = searchText.toLowerCase();
      const haystack = [
        getActivityName(activity),
        String(activity.activity_id),
        String(activity.activity_type ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedActivities = filteredActivities.slice(start, start + perPage);

  const createHref = selectedClub
    ? `/dashboard/activities/new?clubId=${selectedClub.club_id}`
    : "/dashboard/clubs/new";

  const baseParams = createBaseQueryParams({
    clubId: selectedClub?.club_id ?? null,
    searchText,
    statusFilter,
    perPage,
  });
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));

  const prevHref = `/dashboard/activities?${prevParams.toString()}`;
  const nextHref = `/dashboard/activities?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarCheck}
        title="Actividades"
        description="Actividades registradas por club."
        actions={
          selectedClub ? (
            <Link href={createHref}>
              <Button>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva Actividad</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            </Link>
          ) : null
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

      {clubsEndpointAvailable && clubs.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <form action="/dashboard/activities" className="grid gap-3 md:grid-cols-5">
              <Select name="clubId" defaultValue={String(selectedClub?.club_id ?? clubs[0]?.club_id)}>
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
                  placeholder="Buscar por actividad, tipo o identificador"
                />
              </div>

              <Select name="status" defaultValue={statusFilter}>
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
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
                <Link href="/dashboard/activities">
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
          icon={CalendarCheck}
          title="Sin club de referencia"
          description="No hay clubes disponibles para consultar o registrar actividades."
          action={
            <Link href="/dashboard/clubs/new">
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Crear Club
              </Button>
            </Link>
          }
        />
      ) : null}

      {selectedClub && !activitiesEndpointAvailable ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant="warning">Sin acceso a actividades</Badge>
            <p className="text-sm text-muted-foreground">{activitiesEndpointDetail}</p>
          </CardContent>
        </Card>
      ) : null}

      {selectedClub && activitiesEndpointAvailable && totalItems === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Sin actividades disponibles"
          description="No hay actividades para mostrar con los filtros actuales."
          action={
            <Link href={createHref}>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Crear Actividad
              </Button>
            </Link>
          }
        />
      ) : null}

      {selectedClub && activitiesEndpointAvailable && totalItems > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} actividades
            </span>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Asistencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.map((activity) => (
                  <TableRow key={activity.activity_id}>
                    <TableCell className="font-medium">{getActivityName(activity)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{String(activity.activity_type ?? "N/A")}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatDate(getActivityDate(activity))}</TableCell>
                    <TableCell className="tabular-nums">{formatDate(activity.end_date)}</TableCell>
                    <TableCell className="tabular-nums">{activity.attendance_count ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge active={Boolean(activity.active ?? true)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/dashboard/activities/${activity.activity_id}`}>
                              <Button size="icon-sm" variant="ghost">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <ActivityDeleteAction
                          activityId={activity.activity_id}
                          title={getActivityName(activity)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {paginatedActivities.map((activity) => (
              <Card key={activity.activity_id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{getActivityName(activity)}</p>
                    <StatusBadge active={Boolean(activity.active ?? true)} />
                  </div>
                  <div className="mb-1.5">
                    <Badge variant="outline">{String(activity.activity_type ?? "N/A")}</Badge>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {formatDate(getActivityDate(activity))} - {formatDate(activity.end_date)}
                  </p>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/activities/${activity.activity_id}`}>
                      <Button size="xs" variant="ghost">
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                    </Link>
                    <ActivityDeleteAction
                      activityId={activity.activity_id}
                      title={getActivityName(activity)}
                      compact={false}
                    />
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
