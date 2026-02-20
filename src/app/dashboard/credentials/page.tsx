import { KeyRound, Shield, UserCog } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listOauthProviders, type OAuthProviders } from "@/lib/api/auth";
import { unwrapObject } from "@/lib/api/response";
import { extractRoles } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import {
  disconnectOauthProviderAction,
  requestPasswordResetAction,
} from "@/lib/credentials/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatusMessage = {
  text: string;
  variant: "success" | "warning" | "destructive" | "outline";
};

type EndpointStatus = {
  available: boolean;
  label: string;
  detail: string;
  variant: "success" | "warning" | "destructive";
};

function getStatusMessage(status: string | undefined): StatusMessage | null {
  if (!status) {
    return null;
  }

  if (status === "password_reset_sent") {
    return {
      text: "Se envio la solicitud de restablecimiento de contrasena.",
      variant: "success",
    };
  }

  if (status === "password_reset_error") {
    return {
      text: "No se pudo enviar la solicitud de restablecimiento.",
      variant: "destructive",
    };
  }

  if (status === "missing_email") {
    return {
      text: "Debes indicar un correo para solicitar el restablecimiento.",
      variant: "warning",
    };
  }

  if (status.startsWith("provider_disconnected_")) {
    const provider = status.replace("provider_disconnected_", "");
    return {
      text: `Se desconecto el proveedor ${provider}.`,
      variant: "success",
    };
  }

  if (status.startsWith("provider_disconnect_error_")) {
    const provider = status.replace("provider_disconnect_error_", "");
    return {
      text: `No se pudo desconectar el proveedor ${provider}.`,
      variant: "destructive",
    };
  }

  if (status === "invalid_provider") {
    return {
      text: "Proveedor OAuth invalido.",
      variant: "warning",
    };
  }

  return null;
}

function normalizeProviders(payload: unknown): OAuthProviders | null {
  const object = unwrapObject<OAuthProviders>(payload);
  if (!object) {
    return null;
  }

  return {
    google_connected: Boolean(object.google_connected),
    apple_connected: Boolean(object.apple_connected),
  };
}

function buildOauthStatus(error: ApiError): EndpointStatus {
  if (error.status === 401 || error.status === 403) {
    return {
      available: false,
      label: "Sin permisos",
      detail: "No tienes permisos para consultar el estado OAuth en este entorno.",
      variant: "warning",
    };
  }

  if (error.status === 404 || error.status === 405) {
    return {
      available: false,
      label: "No publicado",
      detail: "El endpoint /auth/oauth/providers no esta habilitado en este entorno.",
      variant: "warning",
    };
  }

  if (error.status === 429) {
    return {
      available: false,
      label: "Rate limit",
      detail: "Se alcanzo el limite de solicitudes del backend. Intenta nuevamente en unos segundos.",
      variant: "warning",
    };
  }

  return {
    available: false,
    label: "No disponible",
    detail: "El backend OAuth no responde temporalmente.",
    variant: "destructive",
  };
}

export default async function CredentialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;

  const currentUser = await getCurrentUser();
  const currentRoles = extractRoles(currentUser);

  let oauthProviders: OAuthProviders | null = null;
  let oauthStatus: EndpointStatus = {
    available: true,
    label: "Disponible",
    detail: "Endpoint /auth/oauth/providers operativo.",
    variant: "success",
  };

  try {
    const providersResponse = await listOauthProviders();
    oauthProviders = normalizeProviders(providersResponse);
  } catch (error) {
    if (error instanceof ApiError && ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)) {
      oauthStatus = buildOauthStatus(error);
    } else {
      throw error;
    }
  }

  const googleConnected = oauthProviders?.google_connected ?? Boolean(currentUser?.google_connected);
  const appleConnected = oauthProviders?.apple_connected ?? Boolean(currentUser?.apple_connected);
  const message = getStatusMessage(status);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={KeyRound}
        title="Credenciales"
        description="Administracion de acceso, proveedores OAuth y recuperacion de contrasena."
      />

      {message ? (
        <Card>
          <CardContent className="p-4">
            <Badge variant={message.variant}>{message.text}</Badge>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Usuario autenticado</p>
            <p className="mt-1 text-sm font-semibold">{currentUser?.email || "No disponible"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Roles</p>
            <p className="mt-1 text-sm font-semibold">
              {currentRoles.length > 0 ? currentRoles.join(", ") : "Sin rol global"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Google OAuth</p>
            <Badge variant={googleConnected ? "success" : "outline"} className="mt-2">
              {googleConnected ? "Conectado" : "No conectado"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Apple OAuth</p>
            <Badge variant={appleConnected ? "success" : "outline"} className="mt-2">
              {appleConnected ? "Conectado" : "No conectado"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Estado OAuth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>Endpoint `/auth/oauth/providers`</span>
              <Badge variant={oauthStatus.variant}>
                {oauthStatus.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{oauthStatus.detail}</p>

            <form action={disconnectOauthProviderAction} className="rounded-md border p-3">
              <input type="hidden" name="provider" value="google" />
              <p className="text-sm font-medium">Google</p>
              <p className="mb-2 text-xs text-muted-foreground">Revoca la vinculacion OAuth de Google para esta cuenta.</p>
              <Button type="submit" size="sm" variant="outline" disabled={!oauthStatus.available || !googleConnected}>
                Desconectar Google
              </Button>
            </form>

            <form action={disconnectOauthProviderAction} className="rounded-md border p-3">
              <input type="hidden" name="provider" value="apple" />
              <p className="text-sm font-medium">Apple</p>
              <p className="mb-2 text-xs text-muted-foreground">Revoca la vinculacion OAuth de Apple para esta cuenta.</p>
              <Button type="submit" size="sm" variant="outline" disabled={!oauthStatus.available || !appleConnected}>
                Desconectar Apple
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="h-4 w-4" />
              Recuperacion de contrasena
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={requestPasswordResetAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo de recuperacion</Label>
                <Input id="email" name="email" type="email" defaultValue={currentUser?.email || ""} required />
              </div>
              <Button type="submit" size="sm">
                Enviar solicitud
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Habilita al menos un proveedor OAuth para contingencia de acceso.</p>
            <p>2. Revisa periodicamente los roles globales del usuario administrador.</p>
            <p>3. Ejecuta restablecimiento de contrasena ante sospecha de compromiso.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
