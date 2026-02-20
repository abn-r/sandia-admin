import Link from "next/link";
import { notFound } from "next/navigation";
import { Tent, Users } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getCamporeeById, listCamporeeMembers, type Camporee, type CamporeeMember } from "@/lib/api/camporees";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { removeCamporeeMemberAction, registerCamporeeMemberAction, updateCamporeeAction } from "@/lib/camporees/actions";
import { CamporeeForm } from "@/components/camporees/camporee-form";
import { CamporeeMemberForm } from "@/components/camporees/camporee-member-form";
import { CamporeeMemberRemoveAction } from "@/components/camporees/camporee-member-remove-action";
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

function getCamporeeId(camporee: Camporee) {
  const rawValue = camporee.camporee_id ?? camporee.local_camporee_id ?? camporee.id;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCamporee(camporee: Camporee) {
  return {
    name: camporee.name,
    description: camporee.description ?? "",
    start_date: camporee.start_date,
    end_date: camporee.end_date,
    local_field_id: camporee.local_field_id,
    includes_adventurers: Boolean(camporee.includes_adventurers ?? false),
    includes_pathfinders: Boolean(camporee.includes_pathfinders ?? true),
    includes_master_guides: Boolean(camporee.includes_master_guides ?? false),
    local_camporee_place: camporee.local_camporee_place ?? "",
    registration_cost: camporee.registration_cost,
    active: Boolean(camporee.active ?? true),
  };
}

export default async function EditCamporeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idParam = Number(id);

  if (!Number.isFinite(idParam) || idParam <= 0) {
    notFound();
  }

  let camporee: Camporee | null = null;
  try {
    const response = await getCamporeeById(idParam);
    camporee = unwrapObject<Camporee>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 429].includes(error.status) || error.status >= 500)
    ) {
      return (
        <div className="space-y-6">
          <PageHeader
            icon={Tent}
            title="Editar Camporee"
            description="No fue posible cargar el camporee."
            actions={
              <Link href="/dashboard/camporees">
                <Button variant="outline">Volver</Button>
              </Link>
            }
          />
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {error.status === 429
                ? "Rate limit alcanzado al consultar el camporee. Reintenta en unos segundos."
                : error.status >= 500
                  ? "Backend no disponible temporalmente para consultar el camporee."
                  : "No tienes permisos para consultar este camporee."}
            </CardContent>
          </Card>
        </div>
      );
    }

    throw error;
  }

  if (!camporee) {
    notFound();
  }

  const camporeeId = getCamporeeId(camporee);
  if (!camporeeId) {
    notFound();
  }

  const action = updateCamporeeAction.bind(null, camporeeId);
  const registerMemberAction = registerCamporeeMemberAction.bind(null, camporeeId);
  const removeMemberAction = removeCamporeeMemberAction.bind(null, camporeeId);

  let members: CamporeeMember[] = [];
  let membersEndpointAvailable = true;
  let membersEndpointDetail = "";

  try {
    const membersResponse = await listCamporeeMembers(camporeeId);
    members = unwrapList<CamporeeMember>(membersResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      membersEndpointAvailable = false;
      if (error.status === 429) {
        membersEndpointDetail = "Rate limit alcanzado al consultar miembros del camporee.";
      } else if (error.status >= 500) {
        membersEndpointDetail = "Backend no disponible temporalmente para consultar miembros del camporee.";
      } else {
        membersEndpointDetail = "No fue posible consultar miembros para este camporee en este entorno.";
      }
    } else {
      throw error;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Tent}
        title="Editar Camporee"
        description={`Editando: ${camporee.name || `Camporee #${camporeeId}`}`}
        actions={
          <Link href="/dashboard/camporees">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <CamporeeForm action={action} submitLabel="Guardar Cambios" defaultValues={normalizeCamporee(camporee)} />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Miembros registrados</h2>
        </div>

        <CamporeeMemberForm action={registerMemberAction} />

        {!membersEndpointAvailable ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">{membersEndpointDetail}</CardContent>
          </Card>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Este camporee aun no tiene miembros registrados.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Seguro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">{member.name ?? "Miembro"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{member.user_id}</TableCell>
                    <TableCell className="text-muted-foreground">{member.camporee_type ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{member.club_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.insurance_status ?? member.insurance_id ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <CamporeeMemberRemoveAction
                          action={removeMemberAction}
                          userId={member.user_id}
                          memberName={member.name}
                        />
                      </div>
                    </TableCell>
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
