import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import { Pencil, Plus, Search, Wallet } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  getClubFinanceSummary,
  listClubFinances,
  listFinanceCategories,
  type Finance,
  type FinanceCategory,
  type FinanceSummary,
} from "@/lib/api/finances";
import { listClubs, type Club } from "@/lib/api/clubs";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { FinanceDeleteAction } from "@/components/finances/finance-delete-action";
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

type FinanceStatusFilter = "all" | "active" | "inactive";
type FinanceTypeFilter = "all" | "income" | "expense";

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

function parseOptionalMonth(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 12) {
    return null;
  }

  return Math.floor(parsed);
}

function normalizeStatusFilter(value: string | undefined): FinanceStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function normalizeTypeFilter(value: string | undefined): FinanceTypeFilter {
  if (value === "income" || value === "expense") {
    return value;
  }

  return "all";
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "—";
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : value;
}

function toCurrency(value: number) {
  return value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function formatAmount(value: number | string | undefined) {
  if (value === undefined) {
    return "—";
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return toCurrency(parsed);
}

function getTypeLabel(type: number | undefined) {
  if (type === 0) {
    return "Ingreso";
  }

  if (type === 1) {
    return "Egreso";
  }

  return "N/A";
}

function getTypeFromFilter(value: FinanceTypeFilter): 0 | 1 | null {
  if (value === "income") {
    return 0;
  }

  if (value === "expense") {
    return 1;
  }

  return null;
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCategoryId(finance: Finance) {
  if (typeof finance.finance_category_id === "number") {
    return finance.finance_category_id;
  }

  if ("category_id" in finance) {
    const value = (finance as { category_id?: unknown }).category_id;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function getCategoryLabel(categoryMap: Map<number, string>, finance: Finance) {
  const categoryId = getCategoryId(finance);
  if (typeof categoryId !== "number") {
    return "N/A";
  }

  return categoryMap.get(categoryId) ?? `#${categoryId}`;
}

function createBaseQueryParams({
  clubId,
  searchText,
  statusFilter,
  typeFilter,
  categoryFilter,
  yearFilter,
  monthFilter,
  perPage,
}: {
  clubId: number | null;
  searchText: string;
  statusFilter: FinanceStatusFilter;
  typeFilter: FinanceTypeFilter;
  categoryFilter: number | null;
  yearFilter: number;
  monthFilter: number | null;
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

  if (typeFilter !== "all") {
    params.set("type", typeFilter);
  }

  if (categoryFilter) {
    params.set("categoryId", String(categoryFilter));
  }

  params.set("year", String(yearFilter));

  if (monthFilter) {
    params.set("month", String(monthFilter));
  }

  if (perPage !== 12) {
    params.set("perPage", String(perPage));
  }

  return params;
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();

  const requestedClubId = parsePositiveIntegerOrNull(readParam(params, "clubId"));
  const searchText = readParam(params, "q")?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(readParam(params, "status"));
  const typeFilter = normalizeTypeFilter(readParam(params, "type"));
  const categoryFilter = parsePositiveIntegerOrNull(readParam(params, "categoryId"));
  const yearFilter = parsePositiveInteger(readParam(params, "year"), currentYear);
  const monthFilter = parseOptionalMonth(readParam(params, "month"));
  const perPage = parsePositiveInteger(readParam(params, "perPage"), 12);
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1);

  let clubsEndpointAvailable = true;
  let categoriesEndpointAvailable = true;
  let financesEndpointAvailable = true;
  let summaryEndpointAvailable = true;

  let clubsEndpointDetail = "";
  let categoriesEndpointDetail = "";
  let financesEndpointDetail = "";
  let summaryEndpointDetail = "";

  let clubs: Club[] = [];
  let categories: FinanceCategory[] = [];

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
    const categoriesResponse = await listFinanceCategories();
    categories = unwrapList<FinanceCategory>(categoriesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      categoriesEndpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        categoriesEndpointDetail = "Sin permisos para consultar categorias financieras.";
      } else if (error.status === 429) {
        categoriesEndpointDetail = "Rate limit alcanzado al consultar categorias.";
      } else if (error.status >= 500) {
        categoriesEndpointDetail = "Backend no disponible temporalmente para consultar categorias.";
      } else {
        categoriesEndpointDetail = "Endpoint de categorias financieras no disponible.";
      }
    } else {
      throw error;
    }
  }

  const selectedClub = clubs.find((club) => club.club_id === requestedClubId) ?? clubs[0] ?? null;

  let finances: Finance[] = [];
  if (selectedClub) {
    try {
      const financesResponse = await listClubFinances(selectedClub.club_id, {
        year: yearFilter,
        month: monthFilter ?? undefined,
        includeInactive: statusFilter === "all" || statusFilter === "inactive" ? true : undefined,
      });
      finances = unwrapList<Finance>(financesResponse);
    } catch (error) {
      if (
        error instanceof ApiError &&
        ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
      ) {
        financesEndpointAvailable = false;
        if (error.status === 401 || error.status === 403) {
          financesEndpointDetail = "Sin permisos para consultar movimientos del club.";
        } else if (error.status === 429) {
          financesEndpointDetail = "Rate limit alcanzado al consultar movimientos financieros.";
        } else if (error.status >= 500) {
          financesEndpointDetail = "Backend no disponible temporalmente para consultar finanzas.";
        } else {
          financesEndpointDetail = "Endpoint de finanzas no disponible.";
        }
      } else {
        throw error;
      }
    }
  }

  let summary: FinanceSummary | null = null;
  if (selectedClub) {
    try {
      const summaryResponse = await getClubFinanceSummary(selectedClub.club_id, {
        year: yearFilter,
        month: monthFilter ?? undefined,
      });
      summary = unwrapObject<FinanceSummary>(summaryResponse);
    } catch (error) {
      if (
        error instanceof ApiError &&
        ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
      ) {
        summaryEndpointAvailable = false;
        if (error.status === 429) {
          summaryEndpointDetail = "Rate limit alcanzado al consultar resumen financiero.";
        } else if (error.status >= 500) {
          summaryEndpointDetail = "Backend no disponible temporalmente para consultar resumen financiero.";
        } else {
          summaryEndpointDetail = "No fue posible consultar resumen financiero para este club.";
        }
      } else {
        throw error;
      }
    }
  }

  const categoryMap = new Map(categories.map((category) => [category.category_id, category.name]));
  const selectedType = getTypeFromFilter(typeFilter);

  const filteredFinances = finances
    .filter((item) => {
      if (statusFilter === "active" && !Boolean(item.active ?? true)) {
        return false;
      }

      if (statusFilter === "inactive" && Boolean(item.active ?? true)) {
        return false;
      }

      if (selectedType !== null && item.type !== selectedType) {
        return false;
      }

      if (categoryFilter !== null && getCategoryId(item) !== categoryFilter) {
        return false;
      }

      if (searchText.length > 0) {
        const needle = searchText.toLowerCase();
        const haystack = [
          item.description,
          item.notes,
          item.receipt_number,
          String(item.finance_id),
          getCategoryLabel(categoryMap, item),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(needle)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => {
      const leftDate = Date.parse(left.transaction_date);
      const rightDate = Date.parse(right.transaction_date);
      if (!Number.isFinite(leftDate) || !Number.isFinite(rightDate)) {
        return right.finance_id - left.finance_id;
      }

      return rightDate - leftDate;
    });

  const totalItems = filteredFinances.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedFinances = filteredFinances.slice(start, start + perPage);

  const defaultIncome = filteredFinances
    .filter((item) => item.type === 0)
    .reduce((sum, item) => sum + normalizeNumber(item.amount), 0);
  const defaultExpenses = filteredFinances
    .filter((item) => item.type === 1)
    .reduce((sum, item) => sum + normalizeNumber(item.amount), 0);
  const summaryIncome = summary ? normalizeNumber(summary.total_income) : defaultIncome;
  const summaryExpenses = summary ? normalizeNumber(summary.total_expenses) : defaultExpenses;
  const summaryBalance = summary ? normalizeNumber(summary.balance) : summaryIncome - summaryExpenses;

  const createHref = selectedClub ? `/dashboard/finances/new?clubId=${selectedClub.club_id}` : "/dashboard/clubs/new";

  const baseParams = createBaseQueryParams({
    clubId: selectedClub?.club_id ?? null,
    searchText,
    statusFilter,
    typeFilter,
    categoryFilter,
    yearFilter,
    monthFilter,
    perPage,
  });
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));

  const prevHref = `/dashboard/finances?${prevParams.toString()}`;
  const nextHref = `/dashboard/finances?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Finanzas"
        description="Movimientos financieros por club con resumen operativo."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/finances/categories">
              <Button variant="outline">Categorías</Button>
            </Link>
            {selectedClub ? (
              <Link href={createHref}>
                <Button>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo Movimiento</span>
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
            <form action="/dashboard/finances" className="grid gap-3 md:grid-cols-6">
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
                  placeholder="Buscar por descripcion, recibo o notas"
                />
              </div>

              <Select name="status" defaultValue={statusFilter}>
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Select>

              <Select name="type" defaultValue={typeFilter}>
                <option value="all">Todos los tipos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Egresos</option>
              </Select>

              <Select name="categoryId" defaultValue={categoryFilter ? String(categoryFilter) : "all"}>
                <option value="all">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={String(category.category_id)}>
                    {category.name}
                  </option>
                ))}
              </Select>

              <Select name="year" defaultValue={String(yearFilter)}>
                {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </Select>

              <Select name="month" defaultValue={monthFilter ? String(monthFilter) : "all"}>
                <option value="all">Todos los meses</option>
                {Array.from({ length: 12 }).map((_, monthIndex) => (
                  <option key={`month-${monthIndex + 1}`} value={String(monthIndex + 1)}>
                    Mes {monthIndex + 1}
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
                <Link href="/dashboard/finances">
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
          icon={Wallet}
          title="Sin club de referencia"
          description="No hay clubes disponibles para consultar o registrar movimientos."
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
                Categorias financieras disponibles: {categories.length}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedClub && !summaryEndpointAvailable ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{summaryEndpointDetail}</CardContent>
        </Card>
      ) : selectedClub ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Ingresos</p>
              <p className="mt-1 text-lg font-semibold text-success">{toCurrency(summaryIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Egresos</p>
              <p className="mt-1 text-lg font-semibold text-destructive">{toCurrency(summaryExpenses)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Balance</p>
              <p className={`mt-1 text-lg font-semibold ${summaryBalance >= 0 ? "text-success" : "text-destructive"}`}>
                {toCurrency(summaryBalance)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedClub && !financesEndpointAvailable ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant="warning">Sin acceso a finanzas</Badge>
            <p className="text-sm text-muted-foreground">{financesEndpointDetail}</p>
          </CardContent>
        </Card>
      ) : null}

      {selectedClub && financesEndpointAvailable && totalItems === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin movimientos financieros"
          description="No hay movimientos para mostrar con los filtros actuales."
          action={
            <Link href={createHref}>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Registrar Movimiento
              </Button>
            </Link>
          }
        />
      ) : null}

      {selectedClub && financesEndpointAvailable && totalItems > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} movimientos
            </span>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFinances.map((item) => (
                  <TableRow key={item.finance_id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant={item.type === 1 ? "destructive" : "secondary"}>
                        {getTypeLabel(item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatAmount(item.amount)}</TableCell>
                    <TableCell className="tabular-nums">{formatDate(item.transaction_date)}</TableCell>
                    <TableCell>{getCategoryLabel(categoryMap, item)}</TableCell>
                    <TableCell>
                      <StatusBadge active={Boolean(item.active ?? true)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/dashboard/finances/${item.finance_id}`}>
                              <Button size="icon-sm" variant="ghost">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <FinanceDeleteAction financeId={item.finance_id} description={item.description} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {paginatedFinances.map((item) => (
              <Card key={item.finance_id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{item.description}</p>
                    <StatusBadge active={Boolean(item.active ?? true)} />
                  </div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge variant={item.type === 1 ? "destructive" : "secondary"}>
                      {getTypeLabel(item.type)}
                    </Badge>
                    <span className="text-xs font-medium text-foreground">{formatAmount(item.amount)}</span>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {formatDate(item.transaction_date)} · {getCategoryLabel(categoryMap, item)}
                  </p>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/finances/${item.finance_id}`}>
                      <Button size="xs" variant="ghost">
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                    </Link>
                    <FinanceDeleteAction
                      financeId={item.finance_id}
                      description={item.description}
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
