import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers, Users } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listEcclesiasticalYears } from "@/lib/api/catalogs";
import {
  getClubById,
  listClubInstances,
  listClubInstanceMembers,
  type Club,
  type ClubInstance,
  type ClubInstanceMember,
  type ClubInstanceType,
} from "@/lib/api/clubs";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import {
  addClubInstanceMemberAction,
  removeClubInstanceMemberAction,
  updateClubInstanceAction,
  updateClubInstanceMemberRoleAction,
} from "@/lib/clubs/actions";
import { ClubInstanceMemberForm, type EcclesiasticalYearOption } from "@/components/clubs/club-instance-member-form";
import { ClubInstanceUpdateForm } from "@/components/clubs/club-instance-update-form";
import { ClubMemberRemoveAction } from "@/components/clubs/club-member-remove-action";
import { ClubMemberRoleForm } from "@/components/clubs/club-member-role-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function isInstanceType(value: string): value is ClubInstanceType {
  return value === "adventurers" || value === "pathfinders" || value === "master_guilds";
}

function normalizeClub(club: Club) {
  const districtId =
    typeof club.district_id === "number"
      ? club.district_id
      : typeof club.districlub_type_id === "number"
        ? club.districlub_type_id
        : undefined;

  return {
    ...club,
    district_id: districtId,
  };
}

function getTypeLabel(instanceType: ClubInstanceType) {
  if (instanceType === "adventurers") {
    return "Aventureros";
  }

  if (instanceType === "pathfinders") {
    return "Conquistadores";
  }

  return "Guias Mayores";
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(date);
}

function findInstance(
  instances: ClubInstance[],
  instanceType: ClubInstanceType,
  instanceId: number,
) {
  return instances.find(
    (item) => item.instance_type === instanceType && Number(item.instance_id) === Number(instanceId),
  );
}

export default async function ClubInstancePage({
  params,
}: {
  params: Promise<{ id: string; instanceType: string; instanceId: string }>;
}) {
  const { id, instanceType: instanceTypeParam, instanceId: instanceIdParam } = await params;
  const clubId = Number(id);
  const instanceId = Number(instanceIdParam);

  if (!Number.isFinite(clubId) || clubId <= 0 || !Number.isFinite(instanceId) || instanceId <= 0) {
    notFound();
  }

  if (!isInstanceType(instanceTypeParam)) {
    notFound();
  }

  let clubRaw: Club | null = null;
  try {
    const clubResponse = await getClubById(clubId);
    clubRaw = unwrapObject<Club>(clubResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 429].includes(error.status) || error.status >= 500)
    ) {
      return (
        <div className="space-y-6">
          <PageHeader
            icon={Users}
            title="Gestionar instancia"
            description="No fue posible cargar la informacion del club."
            actions={
              <Link href="/dashboard/clubs">
                <Button variant="outline">Volver</Button>
              </Link>
            }
          />
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {error.status === 429
                ? "Rate limit alcanzado al consultar el club. Reintenta en unos segundos."
                : error.status >= 500
                  ? "Backend no disponible temporalmente para consultar el club."
                  : "No tienes permisos para consultar este club."}
            </CardContent>
          </Card>
        </div>
      );
    }

    throw error;
  }

  if (!clubRaw || typeof clubRaw.club_id !== "number") {
    notFound();
  }

  const club = normalizeClub(clubRaw);

  let instances: ClubInstance[] = [];
  let instancesEndpointAvailable = true;
  let instancesEndpointDetail = "";

  try {
    const instancesResponse = await listClubInstances(clubId);
    instances = unwrapList<ClubInstance>(instancesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      instancesEndpointAvailable = false;
      if (error.status === 429) {
        instancesEndpointDetail = "Rate limit alcanzado al consultar instancias.";
      } else if (error.status >= 500) {
        instancesEndpointDetail = "Backend no disponible temporalmente para consultar instancias.";
      } else {
        instancesEndpointDetail = "No fue posible consultar las instancias del club en este entorno.";
      }
    } else {
      throw error;
    }
  }

  const instance = findInstance(instances, instanceTypeParam, instanceId);
  if (instancesEndpointAvailable && !instance) {
    notFound();
  }

  let members: ClubInstanceMember[] = [];
  let membersEndpointAvailable = true;
  let membersEndpointDetail = "";

  try {
    const membersResponse = await listClubInstanceMembers(clubId, instanceTypeParam, instanceId);
    members = unwrapList<ClubInstanceMember>(membersResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      membersEndpointAvailable = false;
      if (error.status === 429) {
        membersEndpointDetail = "Rate limit alcanzado al consultar miembros de la instancia.";
      } else if (error.status >= 500) {
        membersEndpointDetail = "Backend no disponible temporalmente para consultar miembros.";
      } else {
        membersEndpointDetail = "No fue posible consultar miembros para esta instancia en este entorno.";
      }
    } else {
      throw error;
    }
  }

  let yearOptions: EcclesiasticalYearOption[] = [];
  let yearsEndpointAvailable = true;
  let yearsEndpointDetail = "";
  try {
    const yearsResponse = await listEcclesiasticalYears();
    const years = unwrapList<{
      ecclesiastical_year_id: number;
      name: string;
      active?: boolean;
    }>(yearsResponse);
    yearOptions = years.map((year) => ({
      id: year.ecclesiastical_year_id,
      name: year.name,
      active: Boolean(year.active),
    }));
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      yearsEndpointAvailable = false;
      if (error.status === 429) {
        yearsEndpointDetail = "Rate limit alcanzado al consultar años eclesiásticos.";
      } else if (error.status >= 500) {
        yearsEndpointDetail = "Backend no disponible temporalmente para consultar años eclesiásticos.";
      } else {
        yearsEndpointDetail = "No fue posible consultar años eclesiásticos para agregar miembros.";
      }
    } else {
      throw error;
    }
  }

  const defaultYearId = yearOptions.find((year) => year.active)?.id ?? yearOptions[0]?.id;

  const editInstanceAction = updateClubInstanceAction.bind(
    null,
    clubId,
    instanceTypeParam,
    instanceId,
  );
  const addMemberAction = addClubInstanceMemberAction.bind(
    null,
    clubId,
    instanceTypeParam,
    instanceId,
  );
  const removeMemberAction = removeClubInstanceMemberAction.bind(
    null,
    clubId,
    instanceTypeParam,
    instanceId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers}
        title={instance ? instance.name : `Instancia #${instanceId}`}
        description={`Club: ${club.name} · Tipo: ${getTypeLabel(instanceTypeParam)}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/clubs/${clubId}`}>
              <Button variant="outline">Volver al club</Button>
            </Link>
            <Link href="/dashboard/clubs">
              <Button variant="outline">Ir a clubes</Button>
            </Link>
          </div>
        }
      />

      {!instancesEndpointAvailable ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{instancesEndpointDetail}</CardContent>
        </Card>
      ) : instance ? (
        <>
          <Card>
            <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Tipo</p>
                <Badge variant="outline" className="mt-1">
                  {getTypeLabel(instance.instance_type)}
                </Badge>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Miembros registrados</p>
                <p className="mt-1 font-medium tabular-nums">{instance.members_count ?? members.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Estado</p>
                <div className="mt-1">
                  <StatusBadge active={instance.active} />
                </div>
              </div>
            </CardContent>
          </Card>

          <ClubInstanceUpdateForm
            action={editInstanceAction}
            defaultValues={{
              name: instance.name,
              active: instance.active,
            }}
          />
        </>
      ) : (
        <EmptyState
          icon={Layers}
          title="Instancia no disponible"
          description="No se pudo resolver la instancia solicitada para este club."
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Miembros de la instancia</h2>
        </div>

        {!yearsEndpointAvailable ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">{yearsEndpointDetail}</CardContent>
          </Card>
        ) : null}

        <ClubInstanceMemberForm
          action={addMemberAction}
          years={yearOptions}
          defaultYearId={defaultYearId}
        />

        {!membersEndpointAvailable ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">{membersEndpointDetail}</CardContent>
          </Card>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin miembros registrados"
            description="Aun no hay miembros asociados a esta instancia."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol actual</TableHead>
                  <TableHead>Cambiar rol</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const roleAction = updateClubInstanceMemberRoleAction.bind(
                    null,
                    clubId,
                    instanceTypeParam,
                    instanceId,
                    member.user_id,
                  );

                  return (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{member.user_id}</TableCell>
                      <TableCell>
                        <p className="text-sm">{member.role_display_name ?? member.role ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        <ClubMemberRoleForm action={roleAction} defaultRoleId={member.role_id} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(member.start_date)}</TableCell>
                      <TableCell>
                        <StatusBadge active={Boolean(member.active ?? true)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <ClubMemberRemoveAction
                            action={removeMemberAction}
                            userId={member.user_id}
                            memberName={member.name}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
