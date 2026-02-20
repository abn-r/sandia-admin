import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { listRoles } from "@/lib/rbac/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function normalizeCategory(category: string) {
  return category === "GLOBAL" ? "Global" : category === "CLUB" ? "Club" : category;
}

export default async function RolesPage() {
  const roles = await listRoles();

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Shield}
        title="Roles"
        description="Catalogo de roles del sistema con conteo de permisos asignados."
        actions={
          <Link href="/dashboard/rbac/matrix">
            <Button variant="outline">
              Abrir matriz
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No hay roles registrados"
          description="Verifica el seed inicial de roles o la conectividad con /api/v1/admin/rbac/roles."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.role_id}>
                    <TableCell className="font-medium">{role.role_name.replaceAll("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{normalizeCategory(role.role_category)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="tabular-nums">{role.role_permissions.length}</TableCell>
                    <TableCell>
                      <StatusBadge active={role.active} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 md:hidden">
            {roles.map((role) => (
              <Card key={role.role_id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{role.role_name.replaceAll("_", " ")}</p>
                    <StatusBadge active={role.active} />
                  </div>
                  <div className="mb-2 flex gap-1.5">
                    <Badge variant="outline">{normalizeCategory(role.role_category)}</Badge>
                    <Badge variant="secondary">{role.role_permissions.length} permisos</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {role.description || "Sin descripcion"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
