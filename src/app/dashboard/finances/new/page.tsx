import Link from "next/link";
import { Wallet } from "lucide-react";
import { createFinanceAction } from "@/lib/finances/actions";
import { ApiError } from "@/lib/api/client";
import { listClubs, type Club } from "@/lib/api/clubs";
import { listFinanceCategories, type FinanceCategory } from "@/lib/api/finances";
import { unwrapList } from "@/lib/api/response";
import { FinanceForm } from "@/components/finances/finance-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

function parsePositiveId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function NewFinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedClubId = parsePositiveId(params.clubId);

  let clubsEndpointAvailable = true;
  let categoriesEndpointAvailable = true;
  let clubsEndpointDetail = "";
  let categoriesEndpointDetail = "";
  let clubs: Club[] = [];
  let categories: FinanceCategory[] = [];

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

  try {
    const categoriesResponse = await listFinanceCategories();
    categories = unwrapList<FinanceCategory>(categoriesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      categoriesEndpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        categoriesEndpointDetail = "Sin permisos para consultar categorias financieras.";
      } else if (error.status === 429) {
        categoriesEndpointDetail = "Rate limit alcanzado al consultar categorias.";
      } else if (error.status >= 500) {
        categoriesEndpointDetail = "Backend no disponible temporalmente para consultar categorias.";
      } else {
        categoriesEndpointDetail = "Endpoint de categorias financieras no disponible.";
      }
    } else {
      throw error;
    }
  }

  const selectedClub =
    clubs.find((club) => club.club_id === requestedClubId) ?? clubs[0] ?? null;

  const categoryOptions = categories.map((category) => ({
    id: category.category_id,
    name: category.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Nuevo Movimiento"
        description="Registra un ingreso o egreso para un club."
        actions={
          <Link href="/dashboard/finances">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      {!clubsEndpointAvailable ? (
        <EmptyState
          icon={Wallet}
          title="Modulo de finanzas no disponible"
          description={clubsEndpointDetail}
          action={
            <Link href="/dashboard/finances">
              <Button variant="outline" size="sm">
                Reintentar
              </Button>
            </Link>
          }
        />
      ) : !selectedClub ? (
        <EmptyState
          icon={Wallet}
          title="No hay clubes disponibles"
          description="Debes crear al menos un club antes de registrar movimientos."
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
            <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
              <p>
                El movimiento se creara en el club: <strong className="text-foreground">{selectedClub.name}</strong>
              </p>
              {!categoriesEndpointAvailable ? (
                <p className="text-xs text-warning-foreground">{categoriesEndpointDetail}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Categorias financieras disponibles: {categoryOptions.length}
                </p>
              )}
            </CardContent>
          </Card>

          <FinanceForm
            action={createFinanceAction.bind(null, selectedClub.club_id)}
            submitLabel="Crear Movimiento"
            categoryOptions={categoriesEndpointAvailable ? categoryOptions : undefined}
          />
        </>
      )}
    </div>
  );
}
