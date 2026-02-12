import { Boxes, Package, Tags, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

const categories = [
  { name: "Equipo de campamento", icon: Package, items: "—" },
  { name: "Material didactico", icon: Tags, items: "—" },
  { name: "Uniformes y accesorios", icon: Boxes, items: "—" },
];

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title="Inventario"
        description="Control de inventario por club y categorias de articulos. Microfase 3.6."
      />

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.name}>
              <CardContent className="flex items-center gap-3 p-3.5 sm:flex-col sm:items-start sm:p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/8">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{cat.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground sm:mt-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{cat.items} articulos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EmptyState
        icon={Package}
        title="Sin datos de inventario"
        description="El inventario se poblara cuando se conecte el endpoint del backend."
      />
    </div>
  );
}
