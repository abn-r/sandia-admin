import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { listAdminUsers, type AdminUser } from "@/lib/api/admin-users";
import { submitApprovalDecisionAction } from "@/lib/admin-users/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getUserName(user: AdminUser) {
  const parts = [user.name, user.paternal_last_name, user.maternal_last_name]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.length > 0 ? parts.join(" ") : user.email || user.user_id;
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

function getFeedbackData(
  status: string | undefined,
  decision: string | undefined,
  user: string | undefined,
  message: string | undefined,
) {
  if (!status) {
    return null;
  }

  const decisionLabel = decision === "approve" ? "aprobacion" : "rechazo";
  const userLabel = user ? ` (${user})` : "";

  if (status === "approval_success") {
    return {
      variant: "success" as const,
      text: `Operacion completada: ${decisionLabel}${userLabel}.`,
    };
  }

  if (status === "approval_error_rate_limited") {
    return {
      variant: "warning" as const,
      text: "No se pudo guardar el cambio por rate limit. Reintenta en unos segundos.",
    };
  }

  if (status === "approval_error_forbidden") {
    return {
      variant: "warning" as const,
      text: "No tienes permisos para aprobar o rechazar usuarios.",
    };
  }

  if (status === "approval_error_missing_endpoint") {
    return {
      variant: "secondary" as const,
      text: "El endpoint de aprobaciones no esta disponible en este entorno.",
    };
  }

  if (status === "approval_error_validation") {
    return {
      variant: "warning" as const,
      text: message || "No se pudo procesar la solicitud de aprobacion.",
    };
  }

  if (status === "approval_error_api" || status === "approval_error_unknown") {
    return {
      variant: "destructive" as const,
      text: message || "Error inesperado al actualizar la aprobacion.",
    };
  }

  return null;
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = readParam(params, "status");
  const decision = readParam(params, "decision");
  const user = readParam(params, "user");
  const message = readParam(params, "message");
  const feedback = getFeedbackData(status, decision, user, message);

  const { items, endpointAvailable, endpointState, endpointPath, endpointDetail, checkedAt } =
    await listAdminUsers();
  const pendingUsers = items.filter(isPendingApproval);
  const resolvedUsers = items.length - pendingUsers.length;
  const checkedAtLabel = new Date(checkedAt).toLocaleString("es-MX");

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CheckCircle2}
        title="Aprobaciones"
        description="Cola de aprobacion de usuarios y miembros pendientes."
      />

      {feedback ? (
        <Card>
          <CardContent className="p-4">
            <Badge variant={feedback.variant}>{feedback.text}</Badge>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Pendientes</p>
            <p className="mt-1 text-2xl font-bold">{pendingUsers.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Detectados por `approval`</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Resueltos</p>
            <p className="mt-1 text-2xl font-bold">{resolvedUsers}</p>
            <p className="mt-1 text-xs text-muted-foreground">Usuarios sin estado pendiente</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Registros evaluados</p>
            <p className="mt-1 text-2xl font-bold">{items.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Fuente: endpoint usuarios</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Estado endpoint usuarios</p>
            <Badge variant={getEndpointBadgeVariant(endpointState)} className="mt-2">
              {getEndpointLabel(endpointState)}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">Revision: {checkedAtLabel}</p>
          </CardContent>
        </Card>
      </div>

      {endpointAvailable && items.length > 0 ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Badge variant="outline">Scope backend</Badge>
            <p className="text-sm text-muted-foreground">
              El backend aplica automaticamente el alcance por rol sobre esta lista.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!endpointAvailable ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant={getEndpointBadgeVariant(endpointState)}>{getEndpointLabel(endpointState)}</Badge>
            <p className="text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{endpointPath}</code>: {endpointDetail}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!endpointAvailable ? (
        <EmptyState
          icon={endpointState === "forbidden" ? ShieldAlert : AlertTriangle}
          title={
            endpointState === "forbidden"
              ? "No hay acceso a aprobaciones"
              : endpointState === "rate-limited"
                ? "Rate limit alcanzado"
                : "Aprobaciones no disponibles"
          }
          description={endpointDetail}
        />
      ) : pendingUsers.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Sin aprobaciones pendientes"
          description="No se encontraron registros en estado pendiente con la respuesta actual del backend."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((pendingUser) => (
                  <TableRow key={pendingUser.user_id}>
                    <TableCell className="font-medium">{getUserName(pendingUser)}</TableCell>
                    <TableCell className="text-muted-foreground">{pendingUser.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="warning">Pendiente</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <form action={submitApprovalDecisionAction}>
                          <input type="hidden" name="user_id" value={pendingUser.user_id} />
                          <input type="hidden" name="decision" value="approve" />
                          <Button type="submit" size="xs" variant="success">
                            Aprobar
                          </Button>
                        </form>

                        <form action={submitApprovalDecisionAction}>
                          <input type="hidden" name="user_id" value={pendingUser.user_id} />
                          <input type="hidden" name="decision" value="reject" />
                          <input
                            type="hidden"
                            name="reason"
                            value="Rechazado por administracion desde panel web."
                          />
                          <Button type="submit" size="xs" variant="destructive">
                            Rechazar
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {pendingUsers.map((pendingUser) => (
              <Card key={pendingUser.user_id}>
                <CardContent className="p-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{getUserName(pendingUser)}</p>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">{pendingUser.email || "Sin email"}</p>

                  <div className="flex gap-1.5">
                    <form action={submitApprovalDecisionAction}>
                      <input type="hidden" name="user_id" value={pendingUser.user_id} />
                      <input type="hidden" name="decision" value="approve" />
                      <Button type="submit" size="xs" variant="success">
                        Aprobar
                      </Button>
                    </form>

                    <form action={submitApprovalDecisionAction}>
                      <input type="hidden" name="user_id" value={pendingUser.user_id} />
                      <input type="hidden" name="decision" value="reject" />
                      <input
                        type="hidden"
                        name="reason"
                        value="Rechazado por administracion desde panel web."
                      />
                      <Button type="submit" size="xs" variant="destructive">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
