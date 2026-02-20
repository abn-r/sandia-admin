import Link from "next/link";
import { cookies } from "next/headers";
import { formatDistanceToNow, isValid, parseISO, type Locale } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listAdminUsers, type AdminUser } from "@/lib/api/admin-users";
import { listClubActivities } from "@/lib/api/activities";
import { listCamporees } from "@/lib/api/camporees";
import { listCertifications } from "@/lib/api/certifications";
import { listClasses } from "@/lib/api/classes";
import { listClubs, type Club } from "@/lib/api/clubs";
import { getClubFinanceSummary } from "@/lib/api/finances";
import { listHonors } from "@/lib/api/honors";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { ADMIN_LOCALE_COOKIE, normalizeAdminLocale } from "@/lib/i18n/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ListResult<T> = {
  items: T[];
  endpointAvailable: boolean;
};

type FinanceSummaryPayload = {
  summary?: {
    total_income?: number;
    total_expenses?: number;
    balance?: number;
    transaction_count?: number;
  };
};

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function getUserName(user: AdminUser) {
  const parts = [user.name, user.paternal_last_name, user.maternal_last_name]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.length > 0 ? parts.join(" ") : user.email || user.user_id;
}

function getUserRoles(user: AdminUser) {
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

function isPendingApproval(user: AdminUser) {
  const value = user.approval;

  if (typeof value === "number") {
    return value === 0;
  }

  if (typeof value === "boolean") {
    return value === false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "pending" || normalized === "pendiente" || normalized === "0";
  }

  return false;
}

function formatRelativeDate(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return "Fecha no valida";
  }

  return formatDistanceToNow(parsed, { addSuffix: true, locale });
}

function buildRoleDistribution(users: AdminUser[]) {
  const map = new Map<string, number>();

  for (const user of users) {
    const roles = getUserRoles(user);
    const primaryRole = roles[0]?.trim();
    const label = primaryRole && primaryRole.length > 0 ? primaryRole : "sin_rol";
    map.set(label, (map.get(label) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function safeList<T>(fn: () => Promise<unknown>): Promise<ListResult<T>> {
  try {
    const payload = await fn();
    return {
      items: unwrapList<T>(payload),
      endpointAvailable: true,
    };
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      return {
        items: [],
        endpointAvailable: false,
      };
    }

    throw error;
  }
}

export default async function DashboardPage() {
  const localeCookie = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  const preferredLocale = normalizeAdminLocale(localeCookie);
  const dateLocale = preferredLocale === "en-US" ? enUS : es;

  const usersResult = await listAdminUsers();

  const [clubsResult, camporeesResult, classesResult, honorsResult, certificationsResult] =
    await Promise.all([
      safeList<Club>(() => listClubs({ page: 1, limit: 100 })),
      safeList<Record<string, unknown>>(() => listCamporees({ page: 1, limit: 100 })),
      safeList<Record<string, unknown>>(() => listClasses({ page: 1, limit: 100 })),
      safeList<Record<string, unknown>>(() => listHonors({ page: 1, limit: 100 })),
      safeList<Record<string, unknown>>(() => listCertifications({ page: 1, limit: 100 })),
    ]);

  const users = usersResult.items;
  const clubs = clubsResult.items;
  const selectedClub = clubs.find((club) => club.active) ?? clubs[0] ?? null;

  const pendingApprovals = users.filter(isPendingApproval).length;
  const activeClubs = clubs.filter((club) => Boolean(club.active)).length;
  const activeCamporees = camporeesResult.items.filter((item) => Boolean(item.active ?? true)).length;

  let activitiesCount = 0;
  let activitiesEndpointAvailable = Boolean(selectedClub);
  if (selectedClub) {
    try {
      const activitiesResponse = await listClubActivities(selectedClub.club_id, { page: 1, limit: 100 });
      activitiesCount = unwrapList<Record<string, unknown>>(activitiesResponse).length;
    } catch (error) {
      if (
        error instanceof ApiError &&
        ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
      ) {
        activitiesEndpointAvailable = false;
      } else {
        throw error;
      }
    }
  }

  let financeSummary: FinanceSummaryPayload["summary"] = undefined;
  let financeEndpointAvailable = Boolean(selectedClub);
  if (selectedClub) {
    try {
      const currentYear = new Date().getFullYear();
      const summaryResponse = await getClubFinanceSummary(selectedClub.club_id, { year: currentYear });
      const data = unwrapObject<FinanceSummaryPayload>(summaryResponse);
      if (data && data.summary && typeof data.summary === "object") {
        financeSummary = data.summary;
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
      ) {
        financeEndpointAvailable = false;
      } else {
        throw error;
      }
    }
  }

  const income = toNumber(financeSummary?.total_income);
  const expenses = toNumber(financeSummary?.total_expenses);
  const balance = toNumber(financeSummary?.balance);
  const transactions = toNumber(financeSummary?.transaction_count);

  const roleDistribution = buildRoleDistribution(users);
  const recentUsers = [...users]
    .sort((a, b) => {
      const aDate = a.created_at ? parseISO(a.created_at) : null;
      const bDate = b.created_at ? parseISO(b.created_at) : null;

      if (aDate && bDate && isValid(aDate) && isValid(bDate)) {
        return bDate.getTime() - aDate.getTime();
      }

      return 0;
    })
    .slice(0, 6);

  const endpointStatus = [
    { name: "Usuarios", available: usersResult.endpointAvailable },
    { name: "Clubes", available: clubsResult.endpointAvailable },
    { name: "Camporees", available: camporeesResult.endpointAvailable },
    { name: "Clases", available: classesResult.endpointAvailable },
    { name: "Honores", available: honorsResult.endpointAvailable },
    { name: "Certificaciones", available: certificationsResult.endpointAvailable },
    { name: "Actividades", available: activitiesEndpointAvailable },
    { name: "Finanzas", available: financeEndpointAvailable },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumen operativo generado desde endpoints reales del backend.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/approvals">
            <Button variant="outline" size="sm">
              <ClipboardCheck className="h-4 w-4" />
              Revisar aprobaciones
            </Button>
          </Link>
          <Link href="/dashboard/notifications">
            <Button size="sm">
              <Bell className="h-4 w-4" />
              Notificaciones
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Usuarios registrados</p>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold">{users.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Clubes activos</p>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold">{activeClubs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Aprobaciones pendientes</p>
              <ClipboardCheck className="h-4 w-4 text-warning-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold">{pendingApprovals}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Camporees activos</p>
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold">{activeCamporees}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Actividad reciente de usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay usuarios para mostrar.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => {
                      const roles = getUserRoles(user);

                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getUserName(user)
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((segment) => segment[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{getUserName(user)}</p>
                                <p className="text-xs text-muted-foreground">{user.email || "Sin email"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {roles.length === 0 ? (
                                <Badge variant="outline">Sin rol</Badge>
                              ) : (
                                roles.slice(0, 2).map((role) => (
                                  <Badge key={`${user.user_id}-${role}`} variant="secondary">
                                    {role}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isPendingApproval(user) ? "warning" : "success"}>
                              {isPendingApproval(user) ? "Pendiente" : "Activo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatRelativeDate(user.created_at, dateLocale)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribucion de roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos de roles.</p>
            ) : (
              roleDistribution.map((entry) => {
                const percentage = users.length > 0 ? (entry.count / users.length) * 100 : 0;
                return (
                  <div key={entry.role}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">{entry.role.replaceAll("_", " ")}</span>
                      <span className="tabular-nums">{entry.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Estado del modulo financiero</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase text-muted-foreground">Club de referencia</p>
              <p className="mt-1 text-sm font-semibold">{selectedClub?.name || "Sin club"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase text-muted-foreground">Movimientos registrados</p>
              <p className="mt-1 text-sm font-semibold">{transactions || 0}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase text-muted-foreground">Ingresos</p>
              <p className="mt-1 text-sm font-semibold text-success">{formatCurrency(income)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase text-muted-foreground">Egresos</p>
              <p className="mt-1 text-sm font-semibold text-destructive">{formatCurrency(expenses)}</p>
            </div>
            <div className="rounded-lg border p-3 sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">Balance</p>
              <p className="mt-1 text-lg font-bold">{formatCurrency(balance)}</p>
            </div>
            <div className="rounded-lg border p-3 sm:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground">Actividad del club actual</p>
                <Badge variant="outline">
                  <CalendarCheck className="mr-1 h-3 w-3" />
                  {activitiesCount} actividades
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cobertura de endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {endpointStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{item.name}</span>
                <Badge variant={item.available ? "success" : "warning"}>
                  {item.available ? "Disponible" : "Pendiente"}
                </Badge>
              </div>
            ))}

            <div className="mt-3 border-t pt-3">
              <p className="mb-2 text-xs uppercase text-muted-foreground">Catalogos funcionales</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Clases</span>
                  <strong className="text-foreground">{classesResult.items.length}</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Honores</span>
                  <strong className="text-foreground">{honorsResult.items.length}</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Certificaciones</span>
                  <strong className="text-foreground">{certificationsResult.items.length}</strong>
                </p>
              </div>
            </div>

            <Link href="/dashboard/finances" className="block">
              <Button variant="outline" size="sm" className="mt-2 w-full justify-between">
                Ver finanzas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/clubs" className="block">
              <Button variant="outline" size="sm" className="w-full justify-between">
                Ver clubes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/notifications" className="block">
              <Button variant="outline" size="sm" className="w-full justify-between">
                Centro de notificaciones
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
