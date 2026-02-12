import Link from "next/link";
import { createPermissionAction } from "@/lib/rbac/actions";
import { PermissionForm } from "@/components/rbac/permission-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

export default function NewPermissionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Permiso"
        description="Crea un nuevo permiso con formato resource:action"
        actions={
          <Link href="/dashboard/rbac/permissions">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <PermissionForm action={createPermissionAction} submitLabel="Crear Permiso" />
    </div>
  );
}
