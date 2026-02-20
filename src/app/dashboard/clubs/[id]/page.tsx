import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers, Users } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getClubById, listClubInstances, type Club, type ClubInstance } from "@/lib/api/clubs";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { createClubInstanceAction, updateClubAction } from "@/lib/clubs/actions";
import { ClubForm } from "@/components/clubs/club-form";
import { ClubInstanceForm } from "@/components/clubs/club-instance-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function normalizeClub(club: Club) {
  const districtId =
    typeof club.district_id === "number"
      ? club.district_id
      : typeof club.districlub_type_id === "number"
        ? club.districlub_type_id
        : undefined;

  const coordinates =
    club.coordinates &&
    typeof club.coordinates.lat === "number" &&
    typeof club.coordinates.lng === "number"
      ? club.coordinates
      : null;

  return {
    ...club,
    district_id: districtId,
    coordinates,
  };
}

function getTypeLabel(instanceType: ClubInstance["instance_type"]) {
  if (instanceType === "adventurers") {
    return "Aventureros";
  }

  if (instanceType === "pathfinders") {
    return "Conquistadores";
  }

  return "Guias Mayores";
}

export default async function EditClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clubId = Number(id);

  if (!Number.isFinite(clubId) || clubId <= 0) {
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
            title="Editar Club"
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

  const updateAction = updateClubAction.bind(null, clubId);
  const instanceAction = createClubInstanceAction.bind(null, clubId);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title={`Editar Club: ${club.name}`}
        description="Actualiza datos base del club y revisa sus instancias activas."
        actions={
          <Link href="/dashboard/clubs">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <ClubForm
        action={updateAction}
        submitLabel="Guardar Cambios"
        defaultValues={{
          name: club.name,
          description: club.description,
          local_field_id: club.local_field_id,
          district_id: club.district_id,
          church_id: club.church_id,
          address: club.address,
          coordinates: club.coordinates,
          active: club.active,
        }}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Instancias del club</h2>
        </div>

        <ClubInstanceForm action={instanceAction} />

        {!instancesEndpointAvailable ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {instancesEndpointDetail}
            </CardContent>
          </Card>
        ) : null}

        {instancesEndpointAvailable && instances.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Este club aun no tiene instancias registradas.
            </CardContent>
          </Card>
        ) : null}

        {instancesEndpointAvailable && instances.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Miembros</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={`${instance.instance_type}-${instance.instance_id}`}>
                    <TableCell className="font-medium">{instance.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(instance.instance_type)}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{instance.members_count ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge active={instance.active} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Link
                          href={`/dashboard/clubs/${clubId}/instances/${instance.instance_type}/${instance.instance_id}`}
                        >
                          <Button size="xs" variant="outline">
                            Gestionar
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
