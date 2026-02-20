import { Bell } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listFcmTokens, type FcmToken } from "@/lib/api/notifications";
import { unwrapList } from "@/lib/api/response";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

type NotificationsEndpointState = "available" | "forbidden" | "missing" | "rate-limited" | "unavailable";

function mapEndpointState(error: ApiError): NotificationsEndpointState {
  if (error.status === 401 || error.status === 403) {
    return "forbidden";
  }

  if (error.status === 404 || error.status === 405) {
    return "missing";
  }

  if (error.status === 429) {
    return "rate-limited";
  }

  return "unavailable";
}

function getEndpointLabel(state: NotificationsEndpointState) {
  if (state === "available") {
    return { text: "Disponible", variant: "success" as const };
  }

  if (state === "forbidden") {
    return { text: "Sin permisos", variant: "warning" as const };
  }

  if (state === "missing") {
    return { text: "No publicado", variant: "warning" as const };
  }

  if (state === "rate-limited") {
    return { text: "Rate limit", variant: "warning" as const };
  }

  return { text: "No disponible", variant: "destructive" as const };
}

function getEndpointDetail(state: NotificationsEndpointState) {
  if (state === "available") {
    return "Tokens FCM y envio de notificaciones disponibles en backend.";
  }

  if (state === "forbidden") {
    return "No tienes permisos suficientes para consultar o enviar notificaciones en este entorno.";
  }

  if (state === "missing") {
    return "El contrato de notificaciones no esta habilitado en el backend de este entorno.";
  }

  if (state === "rate-limited") {
    return "Se alcanzo el limite de solicitudes del backend. Intenta de nuevo en unos segundos.";
  }

  return "El backend de notificaciones no responde temporalmente.";
}

export default async function NotificationsPage() {
  let endpointState: NotificationsEndpointState = "available";
  let tokens: FcmToken[] = [];

  try {
    const tokensResponse = await listFcmTokens();
    tokens = unwrapList<FcmToken>(tokensResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      endpointState = mapEndpointState(error);
    } else {
      throw error;
    }
  }

  const endpointAvailable = endpointState === "available";
  const endpointLabel = getEndpointLabel(endpointState);
  const endpointDetail = getEndpointDetail(endpointState);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bell}
        title="Notificaciones"
        description="Centro operativo para tokens FCM y envio de notificaciones push."
      />

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Badge variant={endpointLabel.variant}>{endpointLabel.text}</Badge>
          <p className="text-sm text-muted-foreground">{endpointDetail}</p>
        </CardContent>
      </Card>

      {endpointAvailable ? (
        <NotificationsCenter tokens={tokens} />
      ) : (
        <EmptyState
          icon={Bell}
          title="Notificaciones no disponibles"
          description={endpointDetail}
        />
      )}
    </div>
  );
}
