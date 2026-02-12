import { UserRound, Search, Filter, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

const capabilities = [
  { icon: Search, label: "Busqueda avanzada", detail: "Filtrar por nombre, email, rol o estado" },
  { icon: Filter, label: "Filtros por rol", detail: "super_admin, admin, director, instructor, miembro" },
  { icon: ShieldCheck, label: "Gestion de estados", detail: "Activar, suspender o desactivar cuentas" },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserRound}
        title="Usuarios"
        description="Gestion de usuarios, roles y estados. Microfase 3.5."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {capabilities.map((cap) => {
          const Icon = cap.icon;
          return (
            <Card key={cap.label}>
              <CardContent className="p-4 sm:text-center">
                <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">{cap.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{cap.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EmptyState
        icon={UserRound}
        title="Listado de usuarios pendiente"
        description="Se conectara con los endpoints de usuarios cuando el backend publique /api/v1/admin/users."
      />
    </div>
  );
}
