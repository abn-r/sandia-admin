import { Wallet, TrendingUp, Receipt, PieChart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

const metrics = [
  { label: "Ingresos totales", value: "—", icon: TrendingUp },
  { label: "Egresos totales", value: "—", icon: Receipt },
  { label: "Balance", value: "—", icon: PieChart },
];

export default function FinancesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Finanzas"
        description="Resumen financiero por club y categorias de movimientos. Microfase 3.6."
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-[11px] font-medium sm:text-xs">{m.label}</span>
                </div>
                <p className="mt-1.5 text-lg font-semibold tracking-tight sm:mt-2 sm:text-2xl">{m.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            Las metricas se conectaran con <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">/api/v1/clubs/:clubId/finances</code> cuando el endpoint este disponible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
