"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle, BellRing, Loader2, Send, Smartphone, Users } from "lucide-react";
import type { FcmToken } from "@/lib/api/notifications";
import {
  broadcastNotificationAction,
  deleteFcmTokenAction,
  registerFcmTokenAction,
  sendClubNotificationAction,
  sendDirectNotificationAction,
  type NotificationActionState,
} from "@/lib/notifications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Template = {
  id: string;
  label: string;
  title: string;
  body: string;
  dataJson: string;
};

const initialState: NotificationActionState = {};

const directTemplates: Template[] = [
  {
    id: "activity",
    label: "Nueva actividad",
    title: "Nueva actividad registrada",
    body: "Se agrego una nueva actividad a tu club.",
    dataJson: '{"type":"activity_created"}',
  },
  {
    id: "approval",
    label: "Aprobacion pendiente",
    title: "Revisa tus aprobaciones",
    body: "Tienes elementos pendientes de aprobacion.",
    dataJson: '{"type":"approval_pending"}',
  },
];

const broadcastTemplates: Template[] = [
  {
    id: "maintenance",
    label: "Mantenimiento",
    title: "Mantenimiento programado",
    body: "El sistema tendra mantenimiento hoy a las 22:00.",
    dataJson: '{"type":"maintenance"}',
  },
  {
    id: "release",
    label: "Nueva version",
    title: "Actualizacion disponible",
    body: "Hay una nueva version del panel admin disponible.",
    dataJson: '{"type":"release"}',
  },
];

const clubTemplates: Template[] = [
  {
    id: "meeting",
    label: "Recordatorio reunion",
    title: "Recordatorio de reunion",
    body: "No olvides la reunion de este sabado.",
    dataJson: '{"type":"club_meeting"}',
  },
  {
    id: "camporee",
    label: "Aviso camporee",
    title: "Actualizacion de camporee",
    body: "Revisa los cambios recientes del camporee.",
    dataJson: '{"type":"camporee_update"}',
  },
];

function getJsonError(value: string) {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return "Data JSON debe ser un objeto";
    }

    return null;
  } catch {
    return "Data JSON invalido";
  }
}

function ActionFeedback({ state }: { state: NotificationActionState }) {
  if (state.error) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {state.error}
      </div>
    );
  }

  if (state.success) {
    return <div className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">{state.success}</div>;
  }

  return null;
}

function getTokenLabel(token: FcmToken) {
  if (token.token.length <= 18) {
    return token.token;
  }

  return `${token.token.slice(0, 10)}...${token.token.slice(-6)}`;
}

function TemplateSelector({
  id,
  templates,
  onApply,
}: {
  id: string;
  templates: Template[];
  onApply: (template: Template) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Plantilla rapida</Label>
      <Select
        id={id}
        defaultValue=""
        onChange={(event) => {
          const selected = templates.find((template) => template.id === event.target.value);
          if (selected) {
            onApply(selected);
          }
        }}
      >
        <option value="">Selecciona plantilla</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function NotificationsCenter({ tokens }: { tokens: FcmToken[] }) {
  const [registerState, registerAction, registerPending] = useActionState(registerFcmTokenAction, initialState);
  const [directState, directAction, directPending] = useActionState(sendDirectNotificationAction, initialState);
  const [broadcastState, broadcastAction, broadcastPending] = useActionState(broadcastNotificationAction, initialState);
  const [clubState, clubAction, clubPending] = useActionState(sendClubNotificationAction, initialState);

  const [directForm, setDirectForm] = useState({
    userId: "",
    title: "",
    body: "",
    dataJson: "",
  });

  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    body: "",
    dataJson: "",
  });

  const [clubForm, setClubForm] = useState({
    instanceType: "pathfinders",
    instanceId: "",
    title: "",
    body: "",
    dataJson: "",
  });

  const directJsonError = useMemo(() => getJsonError(directForm.dataJson), [directForm.dataJson]);
  const broadcastJsonError = useMemo(() => getJsonError(broadcastForm.dataJson), [broadcastForm.dataJson]);
  const clubJsonError = useMemo(() => getJsonError(clubForm.dataJson), [clubForm.dataJson]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" />
            Tokens FCM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={registerAction} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="token">Token FCM</Label>
              <Input id="token" name="token" placeholder="fcm-device-token..." required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device_type">Tipo de dispositivo</Label>
              <Select id="device_type" name="device_type" defaultValue="web">
                <option value="web">Web</option>
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device_name">Nombre del dispositivo</Label>
              <Input id="device_name" name="device_name" placeholder="MacBook Pro" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={registerPending}>
                {registerPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Registrar token
              </Button>
            </div>
          </form>

          <ActionFeedback state={registerState} />

          {tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay tokens FCM registrados para este usuario.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token, index) => (
                    <TableRow key={token.fcm_token_id ?? `${token.token}-${index}`}>
                      <TableCell className="font-mono text-xs">{getTokenLabel(token)}</TableCell>
                      <TableCell>{token.device_name || "-"}</TableCell>
                      <TableCell>{token.device_type || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={token.active === false ? "warning" : "success"}>
                          {token.active === false ? "Inactivo" : "Activo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <form action={deleteFcmTokenAction}>
                            <input type="hidden" name="token" value={token.token} />
                            <Button type="submit" size="xs" variant="ghost" className="text-destructive">
                              Desactivar
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              Notificacion directa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TemplateSelector
              id="direct_template"
              templates={directTemplates}
              onApply={(template) => {
                setDirectForm((current) => ({
                  ...current,
                  title: template.title,
                  body: template.body,
                  dataJson: template.dataJson,
                }));
              }}
            />

            <form action={directAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="direct_user_id">User ID destino</Label>
                <Input
                  id="direct_user_id"
                  name="user_id"
                  placeholder="uuid-user"
                  required
                  value={directForm.userId}
                  onChange={(event) =>
                    setDirectForm((current) => ({
                      ...current,
                      userId: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direct_title">Titulo</Label>
                <Input
                  id="direct_title"
                  name="title"
                  required
                  value={directForm.title}
                  onChange={(event) =>
                    setDirectForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direct_body">Mensaje</Label>
                <Textarea
                  id="direct_body"
                  name="body"
                  required
                  value={directForm.body}
                  onChange={(event) =>
                    setDirectForm((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="direct_data">Data JSON (opcional)</Label>
                  <Badge variant={directJsonError ? "warning" : "outline"}>
                    {directJsonError ? "JSON invalido" : "JSON valido"}
                  </Badge>
                </div>
                <Textarea
                  id="direct_data"
                  name="data_json"
                  placeholder='{"type":"activity_created"}'
                  value={directForm.dataJson}
                  onChange={(event) =>
                    setDirectForm((current) => ({
                      ...current,
                      dataJson: event.target.value,
                    }))
                  }
                />
                {directJsonError ? <p className="text-xs text-destructive">{directJsonError}</p> : null}
              </div>
              <Button type="submit" disabled={directPending || Boolean(directJsonError)}>
                {directPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar
              </Button>
            </form>
            <ActionFeedback state={directState} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Broadcast global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TemplateSelector
              id="broadcast_template"
              templates={broadcastTemplates}
              onApply={(template) => {
                setBroadcastForm({
                  title: template.title,
                  body: template.body,
                  dataJson: template.dataJson,
                });
              }}
            />

            <form action={broadcastAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="broadcast_title">Titulo</Label>
                <Input
                  id="broadcast_title"
                  name="title"
                  required
                  value={broadcastForm.title}
                  onChange={(event) =>
                    setBroadcastForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="broadcast_body">Mensaje</Label>
                <Textarea
                  id="broadcast_body"
                  name="body"
                  required
                  value={broadcastForm.body}
                  onChange={(event) =>
                    setBroadcastForm((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="broadcast_data">Data JSON (opcional)</Label>
                  <Badge variant={broadcastJsonError ? "warning" : "outline"}>
                    {broadcastJsonError ? "JSON invalido" : "JSON valido"}
                  </Badge>
                </div>
                <Textarea
                  id="broadcast_data"
                  name="data_json"
                  placeholder='{"type":"announcement"}'
                  value={broadcastForm.dataJson}
                  onChange={(event) =>
                    setBroadcastForm((current) => ({
                      ...current,
                      dataJson: event.target.value,
                    }))
                  }
                />
                {broadcastJsonError ? <p className="text-xs text-destructive">{broadcastJsonError}</p> : null}
              </div>
              <Button type="submit" disabled={broadcastPending || Boolean(broadcastJsonError)}>
                {broadcastPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar broadcast
              </Button>
            </form>
            <ActionFeedback state={broadcastState} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4" />
              Notificar por club
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TemplateSelector
              id="club_template"
              templates={clubTemplates}
              onApply={(template) => {
                setClubForm((current) => ({
                  ...current,
                  title: template.title,
                  body: template.body,
                  dataJson: template.dataJson,
                }));
              }}
            />

            <form action={clubAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="club_instance_type">Tipo instancia</Label>
                  <Select
                    id="club_instance_type"
                    name="instance_type"
                    value={clubForm.instanceType}
                    onChange={(event) =>
                      setClubForm((current) => ({
                        ...current,
                        instanceType: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="adventurers">Aventureros</option>
                    <option value="pathfinders">Conquistadores</option>
                    <option value="master_guilds">Guias Mayores</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="club_instance_id">Instance ID</Label>
                  <Input
                    id="club_instance_id"
                    name="instance_id"
                    type="number"
                    min="1"
                    required
                    value={clubForm.instanceId}
                    onChange={(event) =>
                      setClubForm((current) => ({
                        ...current,
                        instanceId: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="club_title">Titulo</Label>
                <Input
                  id="club_title"
                  name="title"
                  required
                  value={clubForm.title}
                  onChange={(event) =>
                    setClubForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="club_body">Mensaje</Label>
                <Textarea
                  id="club_body"
                  name="body"
                  required
                  value={clubForm.body}
                  onChange={(event) =>
                    setClubForm((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="club_data">Data JSON (opcional)</Label>
                  <Badge variant={clubJsonError ? "warning" : "outline"}>
                    {clubJsonError ? "JSON invalido" : "JSON valido"}
                  </Badge>
                </div>
                <Textarea
                  id="club_data"
                  name="data_json"
                  placeholder='{"type":"club_notice"}'
                  value={clubForm.dataJson}
                  onChange={(event) =>
                    setClubForm((current) => ({
                      ...current,
                      dataJson: event.target.value,
                    }))
                  }
                />
                {clubJsonError ? <p className="text-xs text-destructive">{clubJsonError}</p> : null}
              </div>
              <Button type="submit" disabled={clubPending || Boolean(clubJsonError)}>
                {clubPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar al club
              </Button>
            </form>
            <ActionFeedback state={clubState} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
