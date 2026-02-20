import Link from "next/link";
import { AlertTriangle, ArrowLeft, ShieldAlert, UserRound } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getAdminUserDetail, type AdminUserDetail } from "@/lib/api/admin-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function listRecords(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Sin dato";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Sin dato";
  }

  return parsed.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getUserName(user: AdminUserDetail) {
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

function scopeLabel(user: AdminUserDetail) {
  if (!user.scope) {
    return "Sin scope reportado";
  }

  if (user.scope.type === "ALL") {
    return "ALL";
  }

  if (user.scope.type === "UNION") {
    return `UNION (${user.scope.union_id ?? "N/A"})`;
  }

  return `LOCAL_FIELD (${user.scope.local_field_id ?? "N/A"})`;
}

function getStringField(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "Sin dato";
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  let user: AdminUserDetail;

  try {
    user = await getAdminUserDetail(userId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return (
          <div className="space-y-6">
            <PageHeader
              icon={UserRound}
              title="Detalle de usuario"
              description="No fue posible cargar la sesion para consultar el usuario."
              actions={
                <Link href="/api/auth/logout?next=/login">
                  <Button variant="outline">Ir a login</Button>
                </Link>
              }
            />
            <EmptyState
              icon={ShieldAlert}
              title="Sesion expirada"
              description="Vuelve a iniciar sesion para consultar el detalle del usuario."
            />
          </div>
        );
      }

      if (error.status === 403) {
        return (
          <div className="space-y-6">
            <PageHeader
              icon={UserRound}
              title="Detalle de usuario"
              description="Acceso denegado por alcance del rol administrativo."
              actions={
                <Link href="/dashboard/users">
                  <Button variant="outline">Volver al listado</Button>
                </Link>
              }
            />
            <EmptyState
              icon={ShieldAlert}
              title="Sin alcance configurado"
              description="Tu rol no tiene alcance configurado para consultar este usuario. Contacta a un super_admin."
            />
          </div>
        );
      }

      if (error.status === 404) {
        return (
          <div className="space-y-6">
            <PageHeader
              icon={UserRound}
              title="Detalle de usuario"
              description="No se encontro el usuario solicitado."
              actions={
                <Link href="/dashboard/users">
                  <Button variant="outline">Volver al listado</Button>
                </Link>
              }
            />
            <EmptyState
              icon={AlertTriangle}
              title="Usuario no encontrado"
              description="Usuario no encontrado o fuera de tu alcance."
            />
          </div>
        );
      }

      if (error.status === 429) {
        return (
          <div className="space-y-6">
            <PageHeader
              icon={UserRound}
              title="Detalle de usuario"
              description="Demasiadas solicitudes al backend."
              actions={
                <Link href="/dashboard/users">
                  <Button variant="outline">Volver al listado</Button>
                </Link>
              }
            />
            <EmptyState
              icon={AlertTriangle}
              title="Rate limit alcanzado"
              description="Demasiadas solicitudes. Reintenta en unos segundos."
            />
          </div>
        );
      }

      if (error.status >= 500) {
        return (
          <div className="space-y-6">
            <PageHeader
              icon={UserRound}
              title="Detalle de usuario"
              description="Backend no disponible temporalmente."
              actions={
                <Link href="/dashboard/users">
                  <Button variant="outline">Volver al listado</Button>
                </Link>
              }
            />
            <EmptyState
              icon={AlertTriangle}
              title="Servicio no disponible"
              description="No fue posible obtener el detalle del usuario en este momento."
            />
          </div>
        );
      }
    }

    throw error;
  }

  const classes = listRecords(user.classes);
  const clubAssignments = listRecords(user.club_assignments);
  const emergencyContacts = listRecords(user.emergency_contacts);
  const legalRepresentative = asRecord(user.legal_representative);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserRound}
        title={getUserName(user)}
        description={`Detalle de usuario: ${user.user_id}`}
        actions={
          <Link href="/dashboard/users">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Badge variant="outline">Scope backend</Badge>
          <Badge variant="secondary">{scopeLabel(user)}</Badge>
          <p className="text-sm text-muted-foreground">Roles actor: {user.scope?.roles?.join(", ") || "N/A"}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Perfil personal</p>
            <p><span className="text-muted-foreground">Email:</span> {user.email || "Sin dato"}</p>
            <p><span className="text-muted-foreground">Genero:</span> {user.gender || "Sin dato"}</p>
            <p><span className="text-muted-foreground">Nacimiento:</span> {formatDate(user.birthday)}</p>
            <p><span className="text-muted-foreground">Tipo de sangre:</span> {user.blood || "Sin dato"}</p>
            <p><span className="text-muted-foreground">Bautismo:</span> {user.baptism ? "Si" : "No"}</p>
            <p><span className="text-muted-foreground">Fecha bautismo:</span> {formatDate(user.baptism_date)}</p>
            <p><span className="text-muted-foreground">Creado:</span> {formatDate(user.created_at)}</p>
            <div className="flex items-center gap-2 pt-1">
              <StatusBadge active={Boolean(user.active ?? true)} />
              <Badge variant={user.access_app ? "success" : "outline"}>App</Badge>
              <Badge variant={user.access_panel ? "success" : "outline"}>Panel</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Geografia y roles</p>
            <p><span className="text-muted-foreground">Pais:</span> {user.country?.name || "Sin dato"}</p>
            <p><span className="text-muted-foreground">Union:</span> {user.union?.name || "Sin dato"}</p>
            <p><span className="text-muted-foreground">Campo local:</span> {user.local_field?.name || "Sin dato"}</p>
            <p className="text-muted-foreground">Roles del usuario:</p>
            <div className="flex flex-wrap gap-1.5">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role} variant="secondary">{role}</Badge>
                ))
              ) : (
                <Badge variant="outline">Sin rol</Badge>
              )}
            </div>
            <p className="text-muted-foreground">Estado post-registro:</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={user.post_registration?.complete ? "success" : "warning"}>
                {user.post_registration?.complete ? "Completo" : "Pendiente"}
              </Badge>
              <Badge variant={user.post_registration?.profile_picture_complete ? "success" : "outline"}>
                Foto
              </Badge>
              <Badge variant={user.post_registration?.personal_info_complete ? "success" : "outline"}>
                Datos
              </Badge>
              <Badge variant={user.post_registration?.club_selection_complete ? "success" : "outline"}>
                Club
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Clases</p>
            {classes.length === 0 ? (
              <p className="text-muted-foreground">Sin clases registradas.</p>
            ) : (
              classes.map((item, index) => (
                <div key={`${user.user_id}-class-${index}`} className="rounded border px-2 py-1">
                  <p className="font-medium">{getStringField(item, "name", "class_name", "title")}</p>
                  <p className="text-xs text-muted-foreground">{getStringField(item, "status", "state")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Asignaciones de club</p>
            {clubAssignments.length === 0 ? (
              <p className="text-muted-foreground">Sin asignaciones registradas.</p>
            ) : (
              clubAssignments.map((item, index) => (
                <div key={`${user.user_id}-club-${index}`} className="rounded border px-2 py-1">
                  <p className="font-medium">{getStringField(item, "club_name", "name", "instance_name")}</p>
                  <p className="text-xs text-muted-foreground">Rol: {getStringField(item, "role", "role_name")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Contactos y representante legal</p>
            {emergencyContacts.length === 0 ? (
              <p className="text-muted-foreground">Sin contactos de emergencia.</p>
            ) : (
              emergencyContacts.map((item, index) => (
                <div key={`${user.user_id}-ec-${index}`} className="rounded border px-2 py-1">
                  <p className="font-medium">{getStringField(item, "name", "full_name")}</p>
                  <p className="text-xs text-muted-foreground">{getStringField(item, "phone", "cellphone")}</p>
                  <p className="text-xs text-muted-foreground">{getStringField(item, "relationship", "relationship_name")}</p>
                </div>
              ))
            )}

            <div className="pt-2">
              <p className="text-xs uppercase text-muted-foreground">Representante legal</p>
              {legalRepresentative ? (
                <div className="mt-1 rounded border px-2 py-1">
                  <p className="font-medium">{getStringField(legalRepresentative, "name", "full_name")}</p>
                  <p className="text-xs text-muted-foreground">{getStringField(legalRepresentative, "phone", "cellphone")}</p>
                  <p className="text-xs text-muted-foreground">{getStringField(legalRepresentative, "email")}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No aplica o no registrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
