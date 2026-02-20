import Link from "next/link";
import { Activity, Eye, Search } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listCertifications } from "@/lib/api/certifications";
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

type CertificationItem = Record<string, unknown>;
type CertificationStatusFilter = "all" | "active" | "inactive";

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

function normalizeStatusFilter(value: string | undefined): CertificationStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function getCertificationId(item: CertificationItem) {
  const value = item.certification_id ?? item.id;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function createBaseQueryParams({
  searchText,
  statusFilter,
  perPage,
}: {
  searchText: string;
  statusFilter: CertificationStatusFilter;
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

export default async function CertificationsPage({
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
  let certifications: CertificationItem[] = [];

  try {
    const response = await listCertifications({ page: 1, limit: 300 });
    certifications = unwrapList<CertificationItem>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      endpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        endpointState = "forbidden";
        endpointDetail = "No tienes permisos para consultar certificaciones en este entorno.";
      } else if (error.status === 429) {
        endpointState = "rate-limited";
        endpointDetail = "Rate limit alcanzado al consultar certificaciones. Reintenta en unos segundos.";
      } else if (error.status >= 500) {
        endpointState = "missing";
        endpointDetail = "Backend no disponible temporalmente para consultar certificaciones.";
      } else {
        endpointState = "missing";
        endpointDetail = "Endpoint de certificaciones no publicado o sin metodo habilitado.";
      }
    } else {
      throw error;
    }
  }

  const filteredCertifications = certifications.filter((item) => {
    if (statusFilter === "active" && !Boolean(item.active ?? true)) {
      return false;
    }

    if (statusFilter === "inactive" && Boolean(item.active ?? true)) {
      return false;
    }

    if (searchText.length > 0) {
      const needle = searchText.toLowerCase();
      const haystack = [
        String(item.name ?? ""),
        String(item.description ?? ""),
        String(getCertificationId(item) ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredCertifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedCertifications = filteredCertifications.slice(start, start + perPage);

  const baseParams = createBaseQueryParams({
    searchText,
    statusFilter,
    perPage,
  });
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));

  const prevHref = `/dashboard/certifications?${prevParams.toString()}`;
  const nextHref = `/dashboard/certifications?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Certificaciones"
        description="Catalogo de certificaciones disponibles."
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
            <form action="/dashboard/certifications" className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <Input
                  name="q"
                  defaultValue={searchText}
                  placeholder="Buscar por nombre, descripcion o ID"
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
                <Link href="/dashboard/certifications">
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
          icon={Activity}
          title="Modulo de certificaciones no disponible"
          description={endpointDetail}
        />
      ) : totalItems === 0 ? (
        <EmptyState
          icon={Activity}
          title="Sin certificaciones disponibles"
          description="No hay certificaciones para mostrar con los filtros actuales."
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} certificaciones
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
                  <TableHead>Duracion</TableHead>
                  <TableHead>Modulos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCertifications.map((item, index) => {
                  const certificationId = getCertificationId(item);
                  return (
                    <TableRow key={certificationId ?? `cert-${index}`}>
                      <TableCell className="font-medium">{String(item.name ?? "Certificacion")}</TableCell>
                      <TableCell className="tabular-nums">{String(item.duration_hours ?? "—")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{String(item.modules_count ?? "—")}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={Boolean(item.active ?? true)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {certificationId ? (
                            <Link href={`/dashboard/certifications/${certificationId}`}>
                              <Button size="icon-sm" variant="ghost">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
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
            {paginatedCertifications.map((item, index) => {
              const certificationId = getCertificationId(item);
              return (
                <Card key={certificationId ?? `cert-mobile-${index}`}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{String(item.name ?? "Certificacion")}</p>
                      <StatusBadge active={Boolean(item.active ?? true)} />
                    </div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{String(item.duration_hours ?? "—")} hrs</span>
                      <Badge variant="outline">{String(item.modules_count ?? "—")} modulos</Badge>
                    </div>
                    {certificationId ? (
                      <Link href={`/dashboard/certifications/${certificationId}`}>
                        <Button size="xs" variant="ghost">
                          <Eye className="h-3 w-3" />
                          Ver detalle
                        </Button>
                      </Link>
                    ) : (
                      <p className="text-xs text-muted-foreground">Registro sin identificador para detalle.</p>
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
