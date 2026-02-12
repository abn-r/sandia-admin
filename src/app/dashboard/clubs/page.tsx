import { Users, Shield, UserPlus, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";

const planned = [
  { label: "Listado de clubes", description: "Tabla con filtros por tipo, estado y ubicacion", icon: Shield, status: "pendiente" },
  { label: "Instancias anuales", description: "Gestion de instancias por año eclesiastico", icon: Settings, status: "pendiente" },
  { label: "Miembros", description: "Solicitudes pendientes y asignacion de roles", icon: UserPlus, status: "pendiente" },
];

export default function ClubsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Clubes"
        description="Gestion de clubes, instancias anuales, miembros y roles. Microfase 3.3."
      />

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {planned.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="flex items-center gap-3 p-3.5 sm:items-start sm:p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
