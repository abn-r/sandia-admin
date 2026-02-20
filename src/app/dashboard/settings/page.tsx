import Link from "next/link";
import { Bell, Globe2, KeyRound, Settings, ShieldCheck, Users } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listAdminUsers } from "@/lib/api/admin-users";
import { listClubs } from "@/lib/api/clubs";
import { listFcmTokens } from "@/lib/api/notifications";
import { getCurrentUser } from "@/lib/auth/session";
import { unwrapList } from "@/lib/api/response";
import { LocalPreferences } from "@/components/settings/local-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type EndpointState = "available" | "forbidden" | "missing" | "rate-limited" | "unavailable";

type EndpointStatus = {
  available: boolean;
  state: EndpointState;
  label: string;
  detail: string;
  variant: "success" | "warning" | "destructive";
};

function buildAvailableStatus(detail: string): EndpointStatus {
  return {
    available: true,
    state: "available",
    label: "Disponible",
    detail,
    variant: "success",
  };
}

function buildUnavailableStatus(error: ApiError, missingDetail: string): EndpointStatus {
  if (error.status === 401 || error.status === 403) {
    return {
      available: false,
      state: "forbidden",
      label: "Sin permisos",
      detail: "No tienes permisos para usar este endpoint en el entorno actual.",
      variant: "warning",
    };
  }

  if (error.status === 404 || error.status === 405) {
    return {
      available: false,
      state: "missing",
      label: "No publicado",
      detail: missingDetail,
      variant: "warning",
    };
  }

  if (error.status === 429) {
    return {
      available: false,
      state: "rate-limited",
      label: "Rate limit",
      detail: "Se alcanzo el limite de solicitudes del backend. Intenta nuevamente en unos segundos.",
      variant: "warning",
    };
  }

  return {
    available: false,
    state: "unavailable",
    label: "No disponible",
    detail: "El backend no esta disponible temporalmente para este modulo.",
    variant: "destructive",
  };
}

function mapAdminUsersStatus(result: Awaited<ReturnType<typeof listAdminUsers>>): EndpointStatus {
  if (result.endpointAvailable) {
    return buildAvailableStatus(result.endpointDetail);
  }

  if (result.endpointState === "forbidden") {
    return {
      available: false,
      state: "forbidden",
      label: "Sin permisos",
      detail: result.endpointDetail,
      variant: "warning",
    };
  }

  if (result.endpointState === "rate-limited") {
    return {
      available: false,
      state: "rate-limited",
      label: "Rate limit",
      detail: result.endpointDetail,
      variant: "warning",
    };
  }

  return {
    available: false,
    state: "missing",
    label: "Pendiente",
    detail: result.endpointDetail,
    variant: "warning",
  };
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const usersResult = await listAdminUsers();
  const usersStatus = mapAdminUsersStatus(usersResult);

  let clubs = [] as Record<string, unknown>[];
  let clubsStatus = buildAvailableStatus("Endpoint /clubs operativo.");

  try {
    const clubsResponse = await listClubs({ page: 1, limit: 100 });
    clubs = unwrapList<Record<string, unknown>>(clubsResponse);
    clubsStatus = buildAvailableStatus(`Disponible (${clubs.length} registros).`);
  } catch (error) {
    if (error instanceof ApiError && ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)) {
      clubsStatus = buildUnavailableStatus(error, "El endpoint /clubs no esta habilitado en este entorno.");
    } else {
      throw error;
    }
  }

  let notificationsStatus = buildAvailableStatus("Endpoints /fcm-tokens y /notifications operativos.");
  let myFcmTokens = 0;

  try {
    const tokensResponse = await listFcmTokens();
    myFcmTokens = unwrapList<Record<string, unknown>>(tokensResponse).length;
  } catch (error) {
    if (error instanceof ApiError && ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)) {
      notificationsStatus = buildUnavailableStatus(
        error,
        "Los endpoints /fcm-tokens y /notifications no estan habilitados en este entorno.",
      );
    } else {
      throw error;
    }
  }

  const activeClubs = clubs.filter((club) => Boolean(club.active ?? true)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Configuracion"
        description="Estado operativo del panel y preferencias de experiencia."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Usuario actual</p>
            <p className="mt-1 text-sm font-semibold">{user?.email || "No disponible"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Control de seguridad y personalizacion</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Clubes activos</p>
            <p className="mt-1 text-2xl font-bold">{activeClubs}</p>
            <p className="mt-1 text-xs text-muted-foreground">Fuente: `/clubs`</p>
            <Badge variant={clubsStatus.variant} className="mt-2">
              {clubsStatus.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Usuarios administrables</p>
            <p className="mt-1 text-2xl font-bold">{usersResult.items.length}</p>
            <Badge variant={usersStatus.variant} className="mt-2">
              {usersStatus.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Tokens FCM del usuario</p>
            <p className="mt-1 text-2xl font-bold">{myFcmTokens}</p>
            <Badge variant={notificationsStatus.variant} className="mt-2">
              {notificationsStatus.label}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Salud de modulos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-md border px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Admin Users</span>
                <Badge variant={usersStatus.variant}>{usersStatus.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{usersStatus.detail}</p>
            </div>

            <div className="rounded-md border px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Clubes</span>
                <Badge variant={clubsStatus.variant}>{clubsStatus.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{clubsStatus.detail}</p>
            </div>

            <div className="rounded-md border px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Bell className="h-4 w-4" /> Notificaciones</span>
                <Badge variant={notificationsStatus.variant}>{notificationsStatus.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{notificationsStatus.detail}</p>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="flex items-center gap-1.5"><Globe2 className="h-4 w-4" /> Idioma UI</span>
              <Badge variant="outline">Configurable</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Operacion rapida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/notifications" className="block">
              <Button variant="outline" size="sm" className="w-full justify-between">
                Centro de notificaciones
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/credentials" className="block">
              <Button variant="outline" size="sm" className="w-full justify-between">
                Gestion de credenciales
                <KeyRound className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <LocalPreferences />
      </div>
    </div>
  );
}
