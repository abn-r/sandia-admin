import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  Search,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listEntityItems, type CatalogItem } from "@/lib/catalogs/service";
import { listAdminUsers, type AdminUser, type AdminUsersQuery, type ScopeMeta } from "@/lib/api/admin-users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/empty-state";
import { AutoSubmitFiltersForm } from "@/components/shared/auto-submit-filters-form";
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

type ActiveFilter = "all" | "true" | "false";

type SelectOption = {
  value: number;
  label: string;
};

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

function normalizeActiveFilter(
  activeValue: string | undefined,
  legacyStatus: string | undefined,
): ActiveFilter {
  if (activeValue === "true" || activeValue === "false") {
    return activeValue;
  }

  if (legacyStatus === "active") {
    return "true";
  }

  if (legacyStatus === "inactive") {
    return "false";
  }

  return "all";
}

function getUserName(user: AdminUser) {
  if (typeof user.full_name === "string" && user.full_name.trim().length > 0) {
    return user.full_name.trim();
  }

  const parts = [user.name, user.paternal_last_name, user.maternal_last_name]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return user.email || user.user_id;
}

/** Genera las iniciales del usuario para el avatar (máximo 2 caracteres) */
function getUserInitials(user: AdminUser) {
  const name = getUserName(user);

  // Si es un email o ID, usar las primeras 2 letras
  if (name.includes("@") || name.length <= 3) {
    return name.slice(0, 2).toUpperCase();
  }

  const words = name.split(/\s+/).filter((w) => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function getRoles(user: AdminUser) {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles;
  }

  if (!Array.isArray(user.users_roles)) {
    return [];
  }

  return user.users_roles
    .map((item) => item?.roles?.role_name)
    .filter((role): role is string => typeof role === "string" && role.trim().length > 0);
}

function getLocationText(user: AdminUser) {
  const country = user.country?.name || "País no definido";
  const union = user.union?.name || "Unión no definida";
  const localField = user.local_field?.name || "Campo local no definido";
  return `${country} / ${union} / ${localField}`;
}

function getPostRegistrationLabel(user: AdminUser) {
  if (user.post_registration?.complete) {
    return "Completo";
  }

  return "Pendiente";
}

function formatCreatedAt(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Sin fecha";
  }

  return parsed.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getEndpointBadgeVariant(state: "available" | "forbidden" | "missing" | "rate-limited") {
  if (state === "available") {
    return "success";
  }

  if (state === "forbidden" || state === "rate-limited") {
    return "warning";
  }

  return "secondary";
}

function getEndpointLabel(state: "available" | "forbidden" | "missing" | "rate-limited") {
  if (state === "available") {
    return "Disponible";
  }

  if (state === "forbidden") {
    return "Sin acceso";
  }

  if (state === "rate-limited") {
    return "Rate limitado";
  }

  return "No publicado";
}

function getScopeLabel(scope: ScopeMeta | null | undefined) {
  if (!scope) {
    return "No reportado";
  }

  if (scope.type === "ALL") {
    return "Global";
  }

  if (scope.type === "UNION") {
    return `Unión (${scope.union_id ?? "N/A"})`;
  }

  return `Campo local (${scope.local_field_id ?? "N/A"})`;
}

function getHelpMessage(scope: ScopeMeta | null | undefined) {
  if (!scope) {
    return "El backend controla automáticamente el alcance de usuarios según tu rol administrativo.";
  }

  if (scope.type === "ALL") {
    return "Con tu rol actual puedes consultar usuarios de cualquier unión y campo local.";
  }

  if (scope.type === "UNION") {
    return "Tu consulta está limitada a una unión. Aunque filtres por otros valores, el backend no amplía tu alcance.";
  }

  return "Tu consulta está limitada a un campo local específico. Solo verás usuarios dentro de ese alcance.";
}

function createBaseQueryParams({
  search,
  role,
  active,
  unionId,
  localFieldId,
  limit,
}: {
  search: string;
  role: string;
  active: ActiveFilter;
  unionId?: number;
  localFieldId?: number;
  limit: number;
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (role && role !== "all") {
    params.set("role", role);
  }

  if (active !== "all") {
    params.set("active", active);
  }

  if (typeof unionId === "number") {
    params.set("unionId", String(unionId));
  }

  if (typeof localFieldId === "number") {
    params.set("localFieldId", String(localFieldId));
  }

  if (limit !== 20) {
    params.set("limit", String(limit));
  }

  return params;
}

function getNumberField(record: CatalogItem, key: string) {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getStringField(record: CatalogItem, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function mapSelectOptions(items: CatalogItem[], idKey: string, nameKey: string): SelectOption[] {
  return items
    .filter((item) => item.active !== false)
    .map((item) => {
      const id = getNumberField(item, idKey);
      if (!id) {
        return null;
      }

      const name = getStringField(item, nameKey) ?? `#${id}`;
      return {
        value: id,
        label: name,
      };
    })
    .filter((item): item is SelectOption => Boolean(item))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

async function safeListCatalog(
  entityKey: "unions" | "local-fields",
  query: Record<string, string | undefined> = {},
) {
  try {
    return await listEntityItems(entityKey, query);
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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const searchText = (readParam(params, "search") ?? readParam(params, "q") ?? "").trim();
  const roleFilter = (readParam(params, "role") ?? "all").trim() || "all";
  const activeFilter = normalizeActiveFilter(readParam(params, "active"), readParam(params, "status"));
  const unionId = parseOptionalPositiveInteger(readParam(params, "unionId"));
  const localFieldId = parseOptionalPositiveInteger(readParam(params, "localFieldId"));
  const requestedPage = parsePositiveInteger(readParam(params, "page"), 1, 9999);
  const limit = parsePositiveInteger(readParam(params, "limit"), 20, 100);

  const apiQuery: AdminUsersQuery = {
    search: searchText || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    active: activeFilter === "all" ? undefined : activeFilter === "true",
    unionId,
    localFieldId,
    page: requestedPage,
    limit,
  };

  const result = await listAdminUsers(apiQuery);
  const { items, endpointAvailable, endpointState, endpointPath, endpointDetail } = result;

  const roleOptions = Array.from(
    new Set(
      items
        .flatMap((user) => getRoles(user))
        .map((role) => role.trim())
        .filter((role) => role.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const meta =
    result.meta ?? {
      page: requestedPage,
      limit,
      total: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      scope: null,
    };

  const scope = meta.scope;
  const activeUsers = items.filter((user) => Boolean(user.active ?? true)).length;

  const unionLocked = scope?.type === "UNION" && typeof scope.union_id === "number";
  const localFieldLocked = scope?.type === "LOCAL_FIELD" && typeof scope.local_field_id === "number";

  const effectiveUnionId = unionLocked ? scope?.union_id ?? undefined : unionId;
  const effectiveLocalFieldId = localFieldLocked ? scope?.local_field_id ?? undefined : localFieldId;

  const [unionsCatalog, localFieldsCatalog] = await Promise.all([
    safeListCatalog("unions"),
    safeListCatalog("local-fields", {
      unionId: typeof effectiveUnionId === "number" ? String(effectiveUnionId) : undefined,
    }),
  ]);

  const unionOptions = mapSelectOptions(unionsCatalog, "union_id", "name");
  const localFieldOptions = mapSelectOptions(localFieldsCatalog, "local_field_id", "name");

  const unionSelectValue = typeof effectiveUnionId === "number" ? String(effectiveUnionId) : "all";
  const localFieldSelectValue =
    typeof effectiveLocalFieldId === "number" ? String(effectiveLocalFieldId) : "all";

  const baseParams = createBaseQueryParams({
    search: searchText,
    role: roleFilter,
    active: activeFilter,
    unionId: effectiveUnionId,
    localFieldId: effectiveLocalFieldId,
    limit,
  });

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, meta.page - 1)));

  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(meta.totalPages, meta.page + 1)));

  const prevHref = `/dashboard/users?${prevParams.toString()}`;
  const nextHref = `/dashboard/users?${nextParams.toString()}`;

  const unauthorizedSession =
    endpointState === "forbidden" &&
    (endpointDetail.toLowerCase().includes("sesion") || endpointDetail.toLowerCase().includes("sesión"));

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <PageHeader
        icon={UserRound}
        title="Usuarios"
        description="Gestión de usuarios, roles, accesos y alcance administrativo."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="icon-sm" aria-label="Ver ayuda de permisos">
                <CircleHelp className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Ayuda: visibilidad de usuarios y permisos</DialogTitle>
                <DialogDescription>
                  Esta guía explica el alcance de tu sesión para consultar usuarios.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Alcance</Badge>
                  <span className="font-medium text-foreground">{getScopeLabel(scope)}</span>
                </div>
                <p>{getHelpMessage(scope)}</p>
                <p className="text-xs">Los filtros solo reducen resultados dentro de tu alcance. No pueden ampliar permisos.</p>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* ─── Tarjetas KPI ─── */}
      {/*<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total en alcance</p>
                <p className="text-3xl font-bold tracking-tight">{meta.total}</p>
                <p className="text-xs text-muted-foreground">Registros reportados por backend</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuarios en página</p>
                <p className="text-3xl font-bold tracking-tight">{items.length}</p>
                <p className="text-xs text-muted-foreground">
                  Página {meta.page} de {meta.totalPages}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chart-4/10">
                <Eye className="h-6 w-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-chart-4/60 via-chart-4 to-chart-4/60" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Activos (página)</p>
                <p className="text-3xl font-bold tracking-tight">{activeUsers}</p>
                <p className="text-xs text-muted-foreground">
                  {items.length > 0
                    ? `${Math.round((activeUsers / items.length) * 100)}% activos`
                    : "Sin datos"
                  }
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
                <Activity className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-success/60 via-success to-success/60" />
        </Card>
      </div> */}

      {/* ─── Estado del endpoint (solo si NO está disponible) ─── */}
      {!endpointAvailable ? (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant={getEndpointBadgeVariant(endpointState)}>{getEndpointLabel(endpointState)}</Badge>
            <p className="text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{endpointPath}</code>
              <span className="mx-1.5 text-border">—</span>
              {endpointDetail}
            </p>
          </CardContent>
        </Card>
      ) : (
        /* ─── Barra de filtros ─── */
        <Card>
          <CardContent className="p-5">
            <AutoSubmitFiltersForm action="/dashboard/users" className="space-y-4">
              {/* Fila principal de filtros */}
              <div className="grid gap-4 md:grid-cols-12">
                {/* Búsqueda con ícono integrado */}
                <div className="space-y-1.5 md:col-span-4">
                  <label htmlFor="search-users" className="text-xs font-medium text-muted-foreground">Búsqueda</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search-users"
                      name="search"
                      defaultValue={searchText}
                      placeholder="Nombre o correo..."
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Filtro de rol */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="filter-role" className="text-xs font-medium text-muted-foreground">Rol</label>
                  <Select id="filter-role" name="role" defaultValue={roleFilter}>
                    <option value="all">Todos los roles</option>
                    {roleOptions.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Filtro de estado */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="filter-active" className="text-xs font-medium text-muted-foreground">Estado</label>
                  <Select id="filter-active" name="active" defaultValue={activeFilter}>
                    <option value="all">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </Select>
                </div>

                {/* Filtro de unión */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="filter-union" className="text-xs font-medium text-muted-foreground">Unión</label>
                  <Select id="filter-union" name="unionId" defaultValue={unionSelectValue} disabled={unionLocked}>
                    <option value="all">Todas</option>
                    {unionOptions.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  {unionLocked ? (
                    <input type="hidden" name="unionId" value={String(effectiveUnionId)} />
                  ) : null}
                </div>

                {/* Filtro de campo local */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="filter-local-field" className="text-xs font-medium text-muted-foreground">Campo local</label>
                  <Select
                    id="filter-local-field"
                    name="localFieldId"
                    defaultValue={localFieldSelectValue}
                    disabled={localFieldLocked}
                  >
                    <option value="all">Todos</option>
                    {localFieldOptions.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  {localFieldLocked ? (
                    <input type="hidden" name="localFieldId" value={String(effectiveLocalFieldId)} />
                  ) : null}
                </div>
              </div>

              {/* Fila secundaria: elementos por página + acciones */}
              <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-4">
                <div className="space-y-1">
                  <label htmlFor="filter-limit" className="text-xs font-medium text-muted-foreground">Elementos por página</label>
                  <Select id="filter-limit" name="limit" defaultValue={String(limit)} className="w-24">
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm">
                    <Search className="h-4 w-4" />
                    Filtrar
                  </Button>
                  <Link href="/dashboard/users">
                    <Button type="button" size="sm" variant="ghost">
                      Limpiar filtros
                    </Button>
                  </Link>
                </div>
              </div>
            </AutoSubmitFiltersForm>
          </CardContent>
        </Card>
      )}

      {/* ─── Contenido principal ─── */}
      {!endpointAvailable ? (
        <EmptyState
          icon={endpointState === "forbidden" ? ShieldAlert : AlertTriangle}
          title={
            endpointState === "forbidden"
              ? "Sin permisos para consultar usuarios"
              : endpointState === "rate-limited"
                ? "Rate limit alcanzado"
                : "Endpoint de usuarios no disponible"
          }
          description={endpointDetail}
          action={
            unauthorizedSession ? (
              <Link href="/api/auth/logout?next=/login">
                <Button size="sm">Ir a login</Button>
              </Link>
            ) : null
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Sin usuarios para mostrar"
          description="No hay resultados con los filtros aplicados. Intenta cambiar o limpiar los filtros."
        />
      ) : (
        <>
          {/* ─── Tabla Desktop ─── */}
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Accesos</TableHead>
                    <TableHead>Post-registro</TableHead>
                    <TableHead>Alta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((user) => {
                    const roles = getRoles(user);
                    const initials = getUserInitials(user);
                    const locationText = getLocationText(user);

                    return (
                      <TableRow key={user.user_id} className="group">
                        {/* Columna combinada: Avatar + Nombre + Email */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar size="default">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <Link
                                href={`/dashboard/users/${user.user_id}`}
                                className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                              >
                                {getUserName(user)}
                              </Link>
                              <p className="truncate text-xs text-muted-foreground max-w-[200px]">
                                {user.email || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Roles */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {roles.length === 0 ? (
                              <Badge variant="outline">Sin rol</Badge>
                            ) : (
                              roles.map((role) => (
                                <Badge key={`${user.user_id}-${role}`} variant="secondary">
                                  {role}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>

                        {/* Ubicación con tooltip */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="max-w-[180px] cursor-default truncate text-xs text-muted-foreground">
                                {locationText}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p>{locationText}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Estado */}
                        <TableCell>
                          <StatusBadge active={Boolean(user.active ?? true)} />
                        </TableCell>

                        {/* Accesos */}
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={user.access_app ? "success" : "outline"}>App</Badge>
                            <Badge variant={user.access_panel ? "success" : "outline"}>Panel</Badge>
                          </div>
                        </TableCell>

                        {/* Post-registro */}
                        <TableCell>
                          <Badge variant={user.post_registration?.complete ? "success" : "warning"}>
                            {getPostRegistrationLabel(user)}
                          </Badge>
                        </TableCell>

                        {/* Fecha de alta */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatCreatedAt(user.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>

          {/* ─── Cards Mobile ─── */}
          <div className="space-y-3 md:hidden">
            {items.map((user) => {
              const roles = getRoles(user);
              const initials = getUserInitials(user);

              return (
                <Card key={user.user_id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    {/* Encabezado: Avatar + Nombre + Estado */}
                    <div className="flex items-start gap-3">
                      <Avatar size="default">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{getUserName(user)}</p>
                          <StatusBadge active={Boolean(user.active ?? true)} />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{user.email || "Sin email"}</p>
                      </div>
                    </div>

                    {/* Ubicación */}
                    <p className="mt-2 truncate text-xs text-muted-foreground pl-11">{getLocationText(user)}</p>

                    {/* Roles + Accesos */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-11">
                      {roles.length === 0 ? (
                        <Badge variant="outline">Sin rol</Badge>
                      ) : (
                        roles.map((role) => (
                          <Badge key={`${user.user_id}-${role}`} variant="secondary">
                            {role}
                          </Badge>
                        ))
                      )}
                      <span className="mx-1 h-3 w-px bg-border" />
                      <Badge variant={user.access_app ? "success" : "outline"}>App</Badge>
                      <Badge variant={user.access_panel ? "success" : "outline"}>Panel</Badge>
                    </div>

                    {/* Footer: Fecha + Acción */}
                    <div className="mt-3 flex items-center justify-between border-t pt-3 pl-11">
                      <p className="text-xs text-muted-foreground">{formatCreatedAt(user.created_at)}</p>
                      <Link href={`/dashboard/users/${user.user_id}`}>
                        <Button size="xs" variant="outline">
                          Ver detalle
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ─── Paginación ─── */}
          <div className="flex items-center justify-between rounded-xl border bg-card p-3">
            <Link href={prevHref} aria-disabled={!meta.hasPreviousPage}>
              <Button size="sm" variant="outline" disabled={!meta.hasPreviousPage}>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
            </Link>

            <div className="text-center">
              <p className="text-sm font-medium">
                Página {meta.page} <span className="text-muted-foreground font-normal">de {meta.totalPages}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {(meta.page - 1) * meta.limit + 1}–{(meta.page - 1) * meta.limit + items.length} de {meta.total}
              </p>
            </div>

            <Link href={nextHref} aria-disabled={!meta.hasNextPage}>
              <Button size="sm" variant="outline" disabled={!meta.hasNextPage}>
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
