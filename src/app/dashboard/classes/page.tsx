import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { GraduationCap, Eye, Search } from "lucide-react";
import { listClasses, type ClassItem } from "@/lib/api/classes";
import { unwrapList } from "@/lib/api/response";
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

type ClassStatusFilter = "all" | "active" | "inactive";

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

function normalizeStatusFilter(value: string | undefined): ClassStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function parseClubTypeFilter(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? String(Math.floor(parsed)) : "all";
}

function createBaseQueryParams({
  searchText,
  statusFilter,
  clubTypeFilter,
  perPage,
}: {
  searchText: string;
  statusFilter: ClassStatusFilter;
  clubTypeFilter: string;
  perPage: number;
}) {
  const params = new URLSearchParams();

  if (searchText) {
    params.set("q", searchText);
  }

  if (statusFilter !== "all") {
    params.set("status", statusFilter);
  }

  if (clubTypeFilter !== "all") {
    params.set("clubType", clubTypeFilter);
  }

  if (perPage !== 12) {
    params.set("perPage", String(perPage));
  }

  return params;
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const searchText = readParam(params, "q")?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(readParam(params, "status"));
  const clubTypeFilter = parseClubTypeFilter(readParam(params, "clubType"));
  const perPage = parsePositiveInteger(readParam(params, "perPage"), 12);
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1);

  let endpointAvailable = true;
  let endpointState: "available" | "forbidden" | "missing" | "rate-limited" = "available";
  let endpointDetail = "";
  let classes: ClassItem[] = [];

  try {
    const response = await listClasses({ page: 1, limit: 300 });
    classes = unwrapList<ClassItem>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      endpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        endpointState = "forbidden";
        endpointDetail = "Sin permisos para consultar el catalogo de clases.";
      } else if (error.status === 429) {
        endpointState = "rate-limited";
        endpointDetail = "Rate limit alcanzado al consultar clases. Reintenta en unos segundos.";
      } else if (error.status >= 500) {
        endpointState = "missing";
        endpointDetail = "Backend no disponible temporalmente para consultar clases.";
      } else {
        endpointState = "missing";
        endpointDetail = "Endpoint de clases no disponible en este entorno.";
      }
    } else {
      throw error;
    }
  }

  const clubTypeOptions = Array.from(new Set(classes.map((item) => String(item.club_type_id)))).sort((a, b) =>
    Number(a) - Number(b),
  );

  const filteredClasses = classes.filter((item) => {
    if (statusFilter === "active" && !Boolean(item.active)) {
      return false;
    }

    if (statusFilter === "inactive" && Boolean(item.active)) {
      return false;
    }

    if (clubTypeFilter !== "all" && String(item.club_type_id) !== clubTypeFilter) {
      return false;
    }

    if (searchText.length > 0) {
      const needle = searchText.toLowerCase();
      const haystack = [item.name, String(item.class_id)].join(" ").toLowerCase();
      if (!haystack.includes(needle)) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredClasses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedClasses = filteredClasses.slice(start, start + perPage);

  const baseParams = createBaseQueryParams({
    searchText,
    statusFilter,
    clubTypeFilter,
    perPage,
  });

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));

  const prevHref = `/dashboard/classes?${prevParams.toString()}`;
  const nextHref = `/dashboard/classes?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Clases"
        description="Catalogo de clases progresivas por tipo de club."
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
            <form action="/dashboard/classes" className="grid gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <Input name="q" defaultValue={searchText} placeholder="Buscar por nombre o ID de clase" />
              </div>

              <Select name="status" defaultValue={statusFilter}>
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </Select>

              <Select name="clubType" defaultValue={clubTypeFilter}>
                <option value="all">Todos los tipos de club</option>
                {clubTypeOptions.map((clubType) => (
                  <option key={clubType} value={clubType}>
                    Tipo {clubType}
                  </option>
                ))}
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
                <Link href="/dashboard/classes">
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
          icon={GraduationCap}
          title="Modulo de clases no disponible"
          description={endpointDetail}
        />
      ) : totalItems === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Sin clases disponibles"
          description="No hay clases para mostrar con los filtros actuales."
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} clases
            </span>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Tipo de club</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClasses.map((item) => (
                  <TableRow key={item.class_id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.club_type_id}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{item.display_order}</TableCell>
                    <TableCell>
                      <StatusBadge active={item.active} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Link href={`/dashboard/classes/${item.class_id}`}>
                          <Button size="icon-sm" variant="ghost">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {paginatedClasses.map((item) => (
              <Card key={item.class_id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <StatusBadge active={item.active} />
                  </div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="outline">{item.club_type_id}</Badge>
                    <span>Orden {item.display_order}</span>
                  </div>
                  <Link href={`/dashboard/classes/${item.class_id}`}>
                    <Button size="xs" variant="ghost">
                      <Eye className="h-3 w-3" />
                      Ver detalle
                    </Button>
                  </Link>
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
