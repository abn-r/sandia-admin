import Link from "next/link";
import { Plus, Pencil, Ban, KeyRound } from "lucide-react";
import { listPermissions } from "@/lib/rbac/service";
import { deletePermissionAction } from "@/lib/rbac/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PermissionsPage() {
  const permissions = await listPermissions();

  return (
    <div className="space-y-5">
      <PageHeader
        icon={KeyRound}
        title="Permisos"
        description="Gestiona los permisos del sistema. Formato: resource:action"
        actions={
          <Link href="/dashboard/rbac/permissions/new">
            <Button>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Permiso</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </Link>
        }
      />

      {permissions.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No hay permisos registrados"
          description="Crea permisos para asignarlos a los roles del sistema."
          action={
            <Link href="/dashboard/rbac/permissions/new">
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Crear Permiso
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Vista tabla — desktop */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Accion</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => {
                  const [resource, action] = permission.permission_name.split(":");

                  return (
                    <TableRow key={permission.permission_id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                          {permission.permission_name}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{resource}</TableCell>
                      <TableCell className="text-muted-foreground">{action}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {permission.description || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={permission.active} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/dashboard/rbac/permissions/${permission.permission_id}`}>
                                <Button size="icon-sm" variant="ghost">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <form action={deletePermissionAction}>
                                <input type="hidden" name="id" value={permission.permission_id} />
                                <Button size="icon-sm" variant="ghost" type="submit" className="text-destructive hover:text-destructive">
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                              </form>
                            </TooltipTrigger>
                            <TooltipContent>Desactivar</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Vista cards — mobile */}
          <div className="space-y-2 md:hidden">
            {permissions.map((permission) => {
              const [resource, action] = permission.permission_name.split(":");
              return (
                <Card key={permission.permission_id}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                        {permission.permission_name}
                      </code>
                      <StatusBadge active={permission.active} />
                    </div>
                    <div className="mb-3 flex gap-1.5">
                      <Badge variant="outline">{resource}</Badge>
                      <Badge variant="secondary">{action}</Badge>
                    </div>
                    {permission.description ? (
                      <p className="mb-3 text-xs text-muted-foreground">{permission.description}</p>
                    ) : null}
                    <div className="flex gap-1 border-t pt-3">
                      <Link href={`/dashboard/rbac/permissions/${permission.permission_id}`}>
                        <Button size="xs" variant="ghost">
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Button>
                      </Link>
                      <form action={deletePermissionAction}>
                        <input type="hidden" name="id" value={permission.permission_id} />
                        <Button size="xs" variant="ghost" type="submit" className="text-destructive hover:text-destructive">
                          <Ban className="h-3 w-3" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
