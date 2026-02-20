import Link from "next/link";
import { Eye, Search, Trophy } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listHonorCategories, listHonors, type Honor, type HonorCategory } from "@/lib/api/honors";
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

type HonorStatusFilter = "all" | "active" | "inactive";

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

function parseNumericFilter(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? String(Math.floor(parsed)) : "all";
}

function normalizeStatusFilter(value: string | undefined): HonorStatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function getLabel(value: string) {
  return value.length > 0 ? value : "Sin etiqueta";
}

function getCategoryId(honor: Honor) {
  return honor.category_id ?? honor.honors_category_id;
}

function getCategoryName(categoryMap: Map<number, string>, honor: Honor) {
  const categoryId = getCategoryId(honor);
  if (typeof categoryId !== "number") {
    return "N/A";
  }

  return categoryMap.get(categoryId) ?? `#${categoryId}`;
}

function getCategoryKey(category: HonorCategory, index: number) {
  const id = category.honor_category_id ?? category.category_id;
  return typeof id === "number" ? id : index + 1;
}

function createBaseQueryParams({
  searchText,
  statusFilter,
  categoryFilter,
  clubTypeFilter,
  skillLevelFilter,
  perPage,
}: {
  searchText: string;
  statusFilter: HonorStatusFilter;
  categoryFilter: string;
  clubTypeFilter: string;
  skillLevelFilter: string;
  perPage: number;
}) {
  const params = new URLSearchParams();

  if (searchText) {
    params.set("q", searchText);
  }

  if (statusFilter !== "all") {
    params.set("status", statusFilter);
  }

  if (categoryFilter !== "all") {
    params.set("categoryId", categoryFilter);
  }

  if (clubTypeFilter !== "all") {
    params.set("clubTypeId", clubTypeFilter);
  }

  if (skillLevelFilter !== "all") {
    params.set("skillLevel", skillLevelFilter);
  }

  if (perPage !== 12) {
    params.set("perPage", String(perPage));
  }

  return params;
}

export default async function HonorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const searchText = readParam(params, "q")?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(readParam(params, "status"));
  const categoryFilter = parseNumericFilter(readParam(params, "categoryId"));
  const clubTypeFilter = parseNumericFilter(readParam(params, "clubTypeId"));
  const skillLevelFilter = parseNumericFilter(readParam(params, "skillLevel"));
  const perPage = parsePositiveInteger(readParam(params, "perPage"), 12);
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1);

  let honorsEndpointAvailable = true;
  let honorsEndpointState: "available" | "forbidden" | "missing" | "rate-limited" = "available";
  let honorsEndpointDetail = "";
  let honors: Honor[] = [];
  try {
    const honorsResponse = await listHonors({
      page: 1,
      limit: 500,
      categoryId: categoryFilter === "all" ? undefined : Number(categoryFilter),
      clubTypeId: clubTypeFilter === "all" ? undefined : Number(clubTypeFilter),
      skillLevel: skillLevelFilter === "all" ? undefined : Number(skillLevelFilter),
    });
    honors = unwrapList<Honor>(honorsResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      honorsEndpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        honorsEndpointState = "forbidden";
        honorsEndpointDetail = "No tienes permisos para consultar honores en este entorno.";
      } else if (error.status === 429) {
        honorsEndpointState = "rate-limited";
        honorsEndpointDetail = "Rate limit alcanzado al consultar honores. Reintenta en unos segundos.";
      } else if (error.status >= 500) {
        honorsEndpointState = "missing";
        honorsEndpointDetail = "Backend no disponible temporalmente para consultar honores.";
      } else {
        honorsEndpointState = "missing";
        honorsEndpointDetail = "Endpoint de honores no publicado o sin metodo habilitado.";
      }
    } else {
      throw error;
    }
  }

  let categories: HonorCategory[] = [];
  let categoriesEndpointAvailable = true;
  let categoriesEndpointDetail = "";
  try {
    const categoriesResponse = await listHonorCategories();
    categories = unwrapList<HonorCategory>(categoriesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      categoriesEndpointAvailable = false;
      if (error.status === 429) {
        categoriesEndpointDetail = "Rate limit alcanzado al consultar categorias de honores.";
      } else if (error.status >= 500) {
        categoriesEndpointDetail = "Backend no disponible temporalmente para consultar categorias.";
      } else {
        categoriesEndpointDetail = "No fue posible consultar categorias de honores en este entorno.";
      }
    } else {
      throw error;
    }
  }

  const categoryMap = new Map<number, string>(
    categories
      .map((category, index) => {
        const id = getCategoryKey(category, index);
        return [id, category.name] as const;
      })
      .filter((entry) => Boolean(entry[1])),
  );

  const clubTypeOptions = Array.from(
    new Set(
      honors
        .map((honor) => honor.club_type_id)
        .filter((value): value is number => typeof value === "number"),
    ),
  ).sort((a, b) => a - b);

  const skillLevelOptions = Array.from(
    new Set(
      honors
        .map((honor) => honor.skill_level)
        .filter((value): value is number => typeof value === "number"),
    ),
  ).sort((a, b) => a - b);

  const filteredHonors = honors.filter((honor) => {
    if (statusFilter === "active" && !Boolean(honor.active)) {
      return false;
    }

    if (statusFilter === "inactive" && Boolean(honor.active)) {
      return false;
    }

    if (categoryFilter !== "all" && String(getCategoryId(honor)) !== categoryFilter) {
      return false;
    }

    if (clubTypeFilter !== "all" && String(honor.club_type_id) !== clubTypeFilter) {
      return false;
    }

    if (skillLevelFilter !== "all" && String(honor.skill_level) !== skillLevelFilter) {
      return false;
    }

    if (searchText.length > 0) {
      const needle = searchText.toLowerCase();
      const haystack = [
        honor.name,
        honor.title,
        honor.description,
        String(honor.honor_id),
        getCategoryName(categoryMap, honor),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredHonors.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginatedHonors = filteredHonors.slice(start, start + perPage);

  const countsByCategory = new Map<number, number>();
  for (const honor of honors) {
    const categoryId = getCategoryId(honor);
    if (typeof categoryId !== "number") {
      continue;
    }

    countsByCategory.set(categoryId, (countsByCategory.get(categoryId) ?? 0) + 1);
  }

  const categoryCards = categories
    .map((category, index) => {
      const id = getCategoryKey(category, index);
      return {
        id,
        name: category.name,
        count: countsByCategory.get(id) ?? category.honors_count ?? 0,
      };
    })
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);

  const baseParams = createBaseQueryParams({
    searchText,
    statusFilter,
    categoryFilter,
    clubTypeFilter,
    skillLevelFilter,
    perPage,
  });
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, currentPage - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, currentPage + 1)));

  const prevHref = `/dashboard/honors?${prevParams.toString()}`;
  const nextHref = `/dashboard/honors?${nextParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trophy}
        title="Honores"
        description="Catalogo de honores, categorias y filtros operativos."
      />

      {!honorsEndpointAvailable ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant={honorsEndpointState === "missing" ? "secondary" : "warning"}>
              {honorsEndpointState === "forbidden"
                ? "Sin acceso"
                : honorsEndpointState === "rate-limited"
                  ? "Rate limitado"
                  : "No publicado"}
            </Badge>
            <p className="text-sm text-muted-foreground">{honorsEndpointDetail}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <form action="/dashboard/honors" className="grid gap-3 md:grid-cols-6">
              <div className="md:col-span-2">
                <Input
                  name="q"
                  defaultValue={searchText}
                  placeholder="Buscar por honor, ID, descripcion o categoria"
                />
              </div>

              <Select name="status" defaultValue={statusFilter}>
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Select>

              <Select name="categoryId" defaultValue={categoryFilter}>
                <option value="all">Todas las categorias</option>
                {categories.map((category, index) => {
                  const categoryId = getCategoryKey(category, index);
                  return (
                    <option key={`category-${categoryId}`} value={String(categoryId)}>
                      {category.name}
                    </option>
                  );
                })}
              </Select>

              <Select name="clubTypeId" defaultValue={clubTypeFilter}>
                <option value="all">Todos los tipos de club</option>
                {clubTypeOptions.map((clubTypeId) => (
                  <option key={`club-type-${clubTypeId}`} value={String(clubTypeId)}>
                    Tipo {clubTypeId}
                  </option>
                ))}
              </Select>

              <div className="flex items-center gap-2">
                <Select name="skillLevel" defaultValue={skillLevelFilter}>
                  <option value="all">Todos los niveles</option>
                  {skillLevelOptions.map((skillLevel) => (
                    <option key={`skill-${skillLevel}`} value={String(skillLevel)}>
                      Nivel {skillLevel}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="md:col-span-6 flex flex-wrap items-center gap-2">
                <Select name="perPage" defaultValue={String(perPage)}>
                  <option value="12">12 por pagina</option>
                  <option value="24">24 por pagina</option>
                  <option value="48">48 por pagina</option>
                </Select>
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                  Filtrar
                </Button>
                <Link href="/dashboard/honors">
                  <Button type="button" size="sm" variant="outline">
                    Limpiar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!categoriesEndpointAvailable ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{categoriesEndpointDetail}</CardContent>
        </Card>
      ) : categoryCards.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {categoryCards.map((categoryCard) => (
            <Card key={`category-card-${categoryCard.id}`}>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground">Categoria</p>
                <p className="mt-1 text-sm font-semibold">{getLabel(categoryCard.name)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {categoryCard.count} honor{categoryCard.count === 1 ? "" : "es"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!honorsEndpointAvailable ? (
        <EmptyState
          icon={Trophy}
          title="Modulo de honores no disponible"
          description={honorsEndpointDetail}
        />
      ) : totalItems === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Sin honores disponibles"
          description="No hay honores para mostrar con los filtros actuales."
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando {start + 1} - {Math.min(start + perPage, totalItems)} de {totalItems} honores
            </span>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Honor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo club</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Requisitos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHonors.map((honor) => (
                  <TableRow key={honor.honor_id}>
                    <TableCell className="font-medium">{honor.name || honor.title || `Honor #${honor.honor_id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(categoryMap, honor)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{honor.club_type_id ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{honor.skill_level ?? "—"}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{honor.requirements_count ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge active={honor.active} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Link href={`/dashboard/honors/${honor.honor_id}`}>
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
            {paginatedHonors.map((honor) => (
              <Card key={honor.honor_id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{honor.name || honor.title || `Honor #${honor.honor_id}`}</p>
                    <StatusBadge active={honor.active} />
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{getCategoryName(categoryMap, honor)}</Badge>
                    <Badge variant="outline">Tipo {honor.club_type_id ?? "—"}</Badge>
                    <Badge variant="outline">Nivel {honor.skill_level ?? "—"}</Badge>
                  </div>
                  <Link href={`/dashboard/honors/${honor.honor_id}`}>
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
