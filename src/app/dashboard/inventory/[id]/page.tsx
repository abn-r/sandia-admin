import Link from "next/link";
import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getInventoryItemById, listInventoryCategories, type InventoryCategory, type InventoryItem } from "@/lib/api/inventory";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { updateInventoryItemAction } from "@/lib/inventory/actions";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type InstanceType = "adventurers" | "pathfinders" | "master_guilds";

function inferInstanceType(item: InventoryItem): InstanceType | undefined {
  if (typeof item.club_adv_id === "number") {
    return "adventurers";
  }

  if (typeof item.club_mg_id === "number") {
    return "master_guilds";
  }

  if (typeof item.club_pathf_id === "number") {
    return "pathfinders";
  }

  return undefined;
}

function inferInstanceId(item: InventoryItem): number | undefined {
  if (typeof item.club_adv_id === "number") {
    return item.club_adv_id;
  }

  if (typeof item.club_mg_id === "number") {
    return item.club_mg_id;
  }

  if (typeof item.club_pathf_id === "number") {
    return item.club_pathf_id;
  }

  return undefined;
}

export default async function EditInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inventoryId = Number(id);

  if (!Number.isFinite(inventoryId) || inventoryId <= 0) {
    notFound();
  }

  let item: InventoryItem | null = null;
  try {
    const response = await getInventoryItemById(inventoryId);
    item = unwrapObject<InventoryItem>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 429].includes(error.status) || error.status >= 500)
    ) {
      return (
        <div className="space-y-6">
          <PageHeader
            icon={Boxes}
            title="Editar Item de Inventario"
            description="No fue posible cargar el item."
            actions={
              <Link href="/dashboard/inventory">
                <Button variant="outline">Volver</Button>
              </Link>
            }
          />
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {error.status === 429
                ? "Rate limit alcanzado al consultar el item. Reintenta en unos segundos."
                : error.status >= 500
                  ? "Backend no disponible temporalmente para consultar el item."
                  : "No tienes permisos para consultar este item."}
            </CardContent>
          </Card>
        </div>
      );
    }

    throw error;
  }

  if (!item || typeof item.inventory_id !== "number") {
    notFound();
  }

  let categories: InventoryCategory[] = [];
  let categoriesEndpointAvailable = true;
  let categoriesEndpointDetail = "";
  try {
    const categoriesResponse = await listInventoryCategories();
    categories = unwrapList<InventoryCategory>(categoriesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      categoriesEndpointAvailable = false;
      if (error.status === 429) {
        categoriesEndpointDetail = "Rate limit alcanzado al consultar categorias de inventario.";
      } else if (error.status >= 500) {
        categoriesEndpointDetail = "Backend no disponible temporalmente para consultar categorias de inventario.";
      } else {
        categoriesEndpointDetail = "No fue posible consultar categorias de inventario en este entorno.";
      }
    } else {
      throw error;
    }
  }

  const categoryOptions = categories.map((category) => ({
    id: category.category_id,
    name: category.name,
  }));

  const action = updateInventoryItemAction.bind(null, inventoryId);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title="Editar Item de Inventario"
        description={`Editando: ${item.name || `Item #${inventoryId}`}`}
        actions={
          <Link href="/dashboard/inventory">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      {!categoriesEndpointAvailable ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{categoriesEndpointDetail}</CardContent>
        </Card>
      ) : null}

      <InventoryForm
        action={action}
        submitLabel="Guardar Cambios"
        categoryOptions={categoriesEndpointAvailable ? categoryOptions : undefined}
        defaultValues={{
          name: item.name,
          description: item.description,
          inventory_category_id: item.inventory_category_id ?? undefined,
          amount: item.amount,
          instance_type: inferInstanceType(item),
          instance_id: inferInstanceId(item),
          active: Boolean(item.active ?? true),
        }}
      />
    </div>
  );
}
