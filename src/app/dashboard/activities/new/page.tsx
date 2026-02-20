import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { createActivityAction } from "@/lib/activities/actions";
import { ApiError } from "@/lib/api/client";
import { listClubs, type Club } from "@/lib/api/clubs";
import { unwrapList } from "@/lib/api/response";
import { ActivityForm } from "@/components/activities/activity-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

function parsePositiveId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedClubId = parsePositiveId(params.clubId);

  let clubsEndpointAvailable = true;
  let clubsEndpointDetail = "";
  let clubs: Club[] = [];

  try {
    const clubsResponse = await listClubs({ page: 1, limit: 100 });
    clubs = unwrapList<Club>(clubsResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      clubsEndpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        clubsEndpointDetail = "Sin permisos para consultar clubes.";
      } else if (error.status === 429) {
        clubsEndpointDetail = "Rate limit alcanzado al consultar clubes.";
      } else if (error.status >= 500) {
        clubsEndpointDetail = "Backend no disponible temporalmente para consultar clubes.";
      } else {
        clubsEndpointDetail = "Endpoint de clubes no disponible.";
      }
    } else {
      throw error;
    }
  }

  const selectedClub =
    clubs.find((club) => club.club_id === requestedClubId) ?? clubs[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarCheck}
        title="Nueva Actividad"
        description="Registra una nueva actividad para un club activo."
        actions={
          <Link href="/dashboard/activities">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      {!clubsEndpointAvailable ? (
        <EmptyState
          icon={CalendarCheck}
          title="Modulo de actividades no disponible"
          description={clubsEndpointDetail}
          action={
            <Link href="/dashboard/activities">
              <Button variant="outline" size="sm">
                Reintentar
              </Button>
            </Link>
          }
        />
      ) : !selectedClub ? (
        <EmptyState
          icon={CalendarCheck}
          title="No hay clubes disponibles"
          description="Debes crear al menos un club antes de registrar actividades."
          action={
            <Link href="/dashboard/clubs/new">
              <Button variant="outline" size="sm">
                Crear Club
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              La actividad se creara en el club: <strong className="text-foreground">{selectedClub.name}</strong>
            </CardContent>
          </Card>

          <ActivityForm
            action={createActivityAction.bind(null, selectedClub.club_id)}
            submitLabel="Crear Actividad"
          />
        </>
      )}
    </div>
  );
}
