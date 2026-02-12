import { listRoles, listPermissions } from "@/lib/rbac/service";
import { RolePermissionsMatrix } from "@/components/rbac/role-permissions-matrix";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default async function RolesPermissionsPage() {
  const [roles, permissions] = await Promise.all([listRoles(), listPermissions()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Matriz de seguridad"
        description="Asigna permisos a cada rol del sistema. Los cambios se guardan al presionar Guardar."
      />

      {roles.length === 0 || permissions.length === 0 ? (
        <EmptyState
          title="Sin datos suficientes"
          description={
            roles.length === 0
              ? "No se encontraron roles en el sistema."
              : "No se encontraron permisos. Crea permisos primero."
          }
        />
      ) : (
        <RolePermissionsMatrix roles={roles} permissions={permissions} />
      )}
    </div>
  );
}
