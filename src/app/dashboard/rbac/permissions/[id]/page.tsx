import Link from "next/link";
import { notFound } from "next/navigation";
import { getPermissionById } from "@/lib/rbac/service";
import { updatePermissionAction } from "@/lib/rbac/actions";
import { PermissionForm } from "@/components/rbac/permission-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

export default async function EditPermissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const permission = await getPermissionById(id);

  if (!permission) {
    notFound();
  }

  const action = updatePermissionAction.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Permiso"
        description={`Editando: ${permission.permission_name}`}
        actions={
          <Link href="/dashboard/rbac/permissions">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <PermissionForm
        action={action}
        defaultValues={{
          permission_name: permission.permission_name,
          description: permission.description,
          active: permission.active,
        }}
        submitLabel="Guardar Permiso"
      />
    </div>
  );
}
