import Link from "next/link";
import { notFound } from "next/navigation";
import { Wallet } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getFinanceById, listFinanceCategories, type Finance, type FinanceCategory } from "@/lib/api/finances";
import { unwrapList, unwrapObject } from "@/lib/api/response";
import { updateFinanceAction } from "@/lib/finances/actions";
import { FinanceForm } from "@/components/finances/finance-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type InstanceType = "adventurers" | "pathfinders" | "master_guilds";

function inferInstanceType(finance: Finance): InstanceType | undefined {
  if (typeof finance.club_adv_id === "number") {
    return "adventurers";
  }

  if (typeof finance.club_mg_id === "number") {
    return "master_guilds";
  }

  if (typeof finance.club_pathf_id === "number") {
    return "pathfinders";
  }

  return undefined;
}

function inferInstanceId(finance: Finance): number | undefined {
  if (typeof finance.club_adv_id === "number") {
    return finance.club_adv_id;
  }

  if (typeof finance.club_mg_id === "number") {
    return finance.club_mg_id;
  }

  if (typeof finance.club_pathf_id === "number") {
    return finance.club_pathf_id;
  }

  return undefined;
}

export default async function EditFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const financeId = Number(id);

  if (!Number.isFinite(financeId) || financeId <= 0) {
    notFound();
  }

  let finance: Finance | null = null;
  try {
    const response = await getFinanceById(financeId);
    finance = unwrapObject<Finance>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 429].includes(error.status) || error.status >= 500)
    ) {
      return (
        <div className="space-y-6">
          <PageHeader
            icon={Wallet}
            title="Editar Movimiento"
            description="No fue posible cargar el movimiento."
            actions={
              <Link href="/dashboard/finances">
                <Button variant="outline">Volver</Button>
              </Link>
            }
          />
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {error.status === 429
                ? "Rate limit alcanzado al consultar el movimiento. Reintenta en unos segundos."
                : error.status >= 500
                  ? "Backend no disponible temporalmente para consultar el movimiento."
                  : "No tienes permisos para consultar este movimiento."}
            </CardContent>
          </Card>
        </div>
      );
    }

    throw error;
  }

  if (!finance || typeof finance.finance_id !== "number") {
    notFound();
  }

  let categories: FinanceCategory[] = [];
  let categoriesEndpointAvailable = true;
  let categoriesEndpointDetail = "";

  try {
    const categoriesResponse = await listFinanceCategories();
    categories = unwrapList<FinanceCategory>(categoriesResponse);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 404, 405, 429].includes(error.status) || error.status >= 500)
    ) {
      categoriesEndpointAvailable = false;
      if (error.status === 429) {
        categoriesEndpointDetail = "Rate limit alcanzado al consultar categorias financieras.";
      } else if (error.status >= 500) {
        categoriesEndpointDetail = "Backend no disponible temporalmente para consultar categorias financieras.";
      } else {
        categoriesEndpointDetail = "No fue posible consultar categorias financieras en este entorno.";
      }
    } else {
      throw error;
    }
  }

  const categoryOptions = categories.map((category) => ({
    id: category.category_id,
    name: category.name,
  }));

  const action = updateFinanceAction.bind(null, financeId);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Editar Movimiento"
        description={`Editando: ${finance.description || `Movimiento #${financeId}`}`}
        actions={
          <Link href="/dashboard/finances">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      {!categoriesEndpointAvailable ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">{categoriesEndpointDetail}</CardContent>
        </Card>
      ) : null}

      <FinanceForm
        action={action}
        submitLabel="Guardar Cambios"
        categoryOptions={categoriesEndpointAvailable ? categoryOptions : undefined}
        defaultValues={{
          description: finance.description,
          amount: typeof finance.amount === "string" ? Number(finance.amount) : finance.amount,
          type: finance.type === 1 ? 1 : 0,
          transaction_date: finance.transaction_date,
          finance_category_id: finance.finance_category_id,
          instance_type: inferInstanceType(finance),
          instance_id: inferInstanceId(finance),
          ecclesiastical_year_id: finance.ecclesiastical_year_id ?? undefined,
          receipt_number: finance.receipt_number,
          notes: finance.notes,
          active: Boolean(finance.active ?? true),
        }}
      />
    </div>
  );
}
