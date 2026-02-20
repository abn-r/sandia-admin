import Link from "next/link";
import { Boxes } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { createInventoryItemAction } from "@/lib/inventory/actions";
import { listClubs, type Club } from "@/lib/api/clubs";
import { listInventoryCategories, type InventoryCategory } from "@/lib/api/inventory";
import { unwrapList } from "@/lib/api/response";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

function parsePositiveId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function NewInventoryPage({
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
  let categories: InventoryCategory[] = [];

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
    const categoriesResponse = await listInventoryCategories();
    categories = unwrapList<InventoryCategory>(categoriesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      categoriesEndpointAvailable = false;
      if (error.status === 401 || error.status === 403) {
        categoriesEndpointDetail = "Sin permisos para consultar categorias de inventario.";
      } else if (error.status === 429) {
        categoriesEndpointDetail = "Rate limit alcanzado al consultar categorias de inventario.";
      } else if (error.status >= 500) {
        categoriesEndpointDetail = "Backend no disponible temporalmente para consultar categorias de inventario.";
      } else {
        categoriesEndpointDetail = "Endpoint de categorias de inventario no disponible.";
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
        icon={Boxes}
        title="Nuevo Item de Inventario"
        description="Registra un item para el control de inventario del club."
        actions={
          <Link href="/dashboard/inventory">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      {!clubsEndpointAvailable ? (
        <EmptyState
          icon={Boxes}
          title="Modulo de inventario no disponible"
          description={clubsEndpointDetail}
          action={
            <Link href="/dashboard/inventory">
              <Button variant="outline" size="sm">
                Reintentar
              </Button>
            </Link>
          }
        />
      ) : !selectedClub ? (
        <EmptyState
          icon={Boxes}
          title="No hay clubes disponibles"
          description="Debes crear al menos un club antes de registrar inventario."
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
                El item se creara en el club: <strong className="text-foreground">{selectedClub.name}</strong>
              </p>
              {!categoriesEndpointAvailable ? (
                <p className="text-xs text-warning-foreground">{categoriesEndpointDetail}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Categorias de inventario disponibles: {categoryOptions.length}
                </p>
              )}
            </CardContent>
          </Card>

          <InventoryForm
            action={createInventoryItemAction.bind(null, selectedClub.club_id)}
            submitLabel="Crear Item"
            categoryOptions={categoriesEndpointAvailable ? categoryOptions : undefined}
          />
        </>
      )}
    </div>
  );
}
