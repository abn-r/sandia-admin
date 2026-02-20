import Link from "next/link";
import { notFound } from "next/navigation";
import { ListChecks, Trophy } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getHonorById, listHonorCategories, type Honor, type HonorCategory } from "@/lib/api/honors";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

function getCategoryId(honor: Honor) {
  return honor.category_id ?? honor.honors_category_id;
}

function getCategoryIdFromCategory(category: HonorCategory) {
  return category.honor_category_id ?? category.category_id;
}

export default async function HonorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const honorId = Number(id);

  if (!Number.isFinite(honorId) || honorId <= 0) {
    notFound();
  }

  let honor: Honor | null = null;
  try {
    const honorResponse = await getHonorById(honorId);
    honor = unwrapObject<Honor>(honorResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 429].includes(error.status) || error.status >= 500)
    ) {
      return (
        <div className="space-y-6">
          <PageHeader
            icon={Trophy}
            title="Detalle de honor"
            description="No fue posible cargar la informacion del honor."
            actions={
              <Link href="/dashboard/honors">
                <Button variant="outline">Volver</Button>
              </Link>
            }
          />
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {error.status === 429
                ? "Rate limit alcanzado al consultar el honor. Reintenta en unos segundos."
                : error.status >= 500
                  ? "Backend no disponible temporalmente para consultar el honor."
                  : "No tienes permisos para consultar este honor."}
            </CardContent>
          </Card>
        </div>
      );
    }

    throw error;
  }

  let categories: HonorCategory[] = [];
  let categoriesEndpointAvailable = true;
  let categoriesEndpointDetail = "";
  try {
    const categoriesResponse = await listHonorCategories();
    categories = unwrapList<HonorCategory>(categoriesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      categoriesEndpointAvailable = false;
      if (error.status === 429) {
        categoriesEndpointDetail = "Rate limit alcanzado al consultar categorias.";
      } else if (error.status >= 500) {
        categoriesEndpointDetail = "Backend no disponible temporalmente para consultar categorias.";
      } else {
        categoriesEndpointDetail = "No fue posible consultar categorias para este honor en este entorno.";
      }
    } else {
      throw error;
    }
  }

  if (!honor || typeof honor.honor_id !== "number") {
    notFound();
  }

  const categoryId = getCategoryId(honor);
  const categoryName =
    typeof categoryId === "number"
      ? categories.find((category) => getCategoryIdFromCategory(category) === categoryId)?.name ?? `#${categoryId}`
      : "N/A";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trophy}
        title={honor.name || honor.title || `Honor #${honor.honor_id}`}
        description="Detalle del honor y metadata principal del catalogo."
        actions={
          <Link href="/dashboard/honors">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      {!categoriesEndpointAvailable ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{categoriesEndpointDetail}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Categoria</p>
            <Badge variant="outline" className="mt-1">{categoryName}</Badge>
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">Estado</p>
            <div className="mt-1">
              <StatusBadge active={honor.active} />
            </div>
          </div>

          {typeof honor.club_type_id === "number" ? (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Tipo de club</p>
              <p className="mt-1 font-medium">{honor.club_type_id}</p>
            </div>
          ) : null}

          {typeof honor.skill_level === "number" ? (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Nivel</p>
              <p className="mt-1 font-medium">{honor.skill_level}</p>
            </div>
          ) : null}

          {typeof honor.requirements_count === "number" ? (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Requisitos</p>
              <p className="mt-1 font-medium tabular-nums">{honor.requirements_count}</p>
            </div>
          ) : null}

          {honor.patch_image ? (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Parche</p>
              <a
                href={honor.patch_image}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-primary underline-offset-2 hover:underline"
              >
                Ver recurso del parche
              </a>
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-muted-foreground">Descripcion</p>
            <p className="mt-1 text-muted-foreground">{honor.description || "Sin descripcion registrada."}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <ListChecks className="h-4 w-4" />
          El progreso de requisitos se administra desde el flujo por usuario (`/users/:userId/honors/*`).
        </CardContent>
      </Card>
    </div>
  );
}
