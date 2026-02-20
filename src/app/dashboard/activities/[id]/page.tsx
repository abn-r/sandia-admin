import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, CheckSquare } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  getActivityById,
  listActivityAttendance,
  type Activity,
  type ActivityAttendanceMember,
} from "@/lib/api/activities";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { recordActivityAttendanceAction, updateActivityAction } from "@/lib/activities/actions";
import { ActivityAttendanceForm } from "@/components/activities/activity-attendance-form";
import { ActivityForm } from "@/components/activities/activity-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ActivityInstanceType = "adventurers" | "pathfinders" | "master_guilds";

function inferInstanceType(activity: Activity): ActivityInstanceType | undefined {
  if (activity.instance_type) {
    return activity.instance_type;
  }

  if (typeof activity.club_adv_id === "number") {
    return "adventurers";
  }

  if (typeof activity.club_mg_id === "number") {
    return "master_guilds";
  }

  if (typeof activity.club_pathf_id === "number") {
    return "pathfinders";
  }

  return undefined;
}

function inferInstanceId(activity: Activity): number | undefined {
  if (typeof activity.instance_id === "number") {
    return activity.instance_id;
  }

  if (typeof activity.club_adv_id === "number") {
    return activity.club_adv_id;
  }

  if (typeof activity.club_mg_id === "number") {
    return activity.club_mg_id;
  }

  if (typeof activity.club_pathf_id === "number") {
    return activity.club_pathf_id;
  }

  return undefined;
}

function normalizeActivity(activity: Activity) {
  return {
    name: activity.name ?? activity.title ?? "",
    description: activity.description ?? "",
    activity_type:
      typeof activity.activity_type === "number" ? String(activity.activity_type) : activity.activity_type,
    activity_date: activity.activity_date ?? activity.start_date,
    end_date: activity.end_date,
    location: activity.location ?? "",
    instance_type: inferInstanceType(activity),
    instance_id: inferInstanceId(activity),
    active: Boolean(activity.active ?? true),
  };
}

function formatAttendanceDate(value?: string) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activityId = Number(id);

  if (!Number.isFinite(activityId) || activityId <= 0) {
    notFound();
  }

  let activity: Activity | null = null;
  try {
    const response = await getActivityById(activityId);
    activity = unwrapObject<Activity>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 429].includes(error.status) || error.status >= 500)
    ) {
      return (
        <div className="space-y-6">
          <PageHeader
            icon={CalendarCheck}
            title="Editar Actividad"
            description="No fue posible cargar la actividad."
            actions={
              <Link href="/dashboard/activities">
                <Button variant="outline">Volver</Button>
              </Link>
            }
          />
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {error.status === 429
                ? "Rate limit alcanzado al consultar la actividad. Reintenta en unos segundos."
                : error.status >= 500
                  ? "Backend no disponible temporalmente para consultar la actividad."
                  : "No tienes permisos para consultar esta actividad."}
            </CardContent>
          </Card>
        </div>
      );
    }

    throw error;
  }

  if (!activity || typeof activity.activity_id !== "number") {
    notFound();
  }

  const action = updateActivityAction.bind(null, activityId);
  const attendanceAction = recordActivityAttendanceAction.bind(null, activityId);
  const defaultValues = normalizeActivity(activity);
  const activityName = defaultValues.name || `Actividad #${activity.activity_id}`;

  let attendance: ActivityAttendanceMember[] = [];
  let attendanceEndpointAvailable = true;
  let attendanceEndpointDetail = "";

  try {
    const attendanceResponse = await listActivityAttendance(activityId);
    attendance = unwrapList<ActivityAttendanceMember>(attendanceResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      attendanceEndpointAvailable = false;
      if (error.status === 429) {
        attendanceEndpointDetail = "Rate limit alcanzado al consultar asistencia.";
      } else if (error.status >= 500) {
        attendanceEndpointDetail = "Backend no disponible temporalmente para consultar asistencia.";
      } else {
        attendanceEndpointDetail = "No fue posible consultar la asistencia en este entorno.";
      }
    } else {
      throw error;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarCheck}
        title="Editar Actividad"
        description={`Editando: ${activityName}`}
        actions={
          <Link href="/dashboard/activities">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <ActivityForm action={action} submitLabel="Guardar Cambios" defaultValues={defaultValues} />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Asistencia</h2>
        </div>

        <ActivityAttendanceForm action={attendanceAction} />

        {!attendanceEndpointAvailable ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">{attendanceEndpointDetail}</CardContent>
          </Card>
        ) : attendance.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Esta actividad aun no tiene asistentes registrados.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Registrado en</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((item) => (
                  <TableRow key={item.user_id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.user_id}</TableCell>
                    <TableCell className="text-muted-foreground">{formatAttendanceDate(item.attended_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
