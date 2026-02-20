import Link from "next/link";
import { Tent } from "lucide-react";
import { createCamporeeAction } from "@/lib/camporees/actions";
import { CamporeeForm } from "@/components/camporees/camporee-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

export default function NewCamporeePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Tent}
        title="Nuevo Camporee"
        description="Registra un nuevo camporee local o de union."
        actions={
          <Link href="/dashboard/camporees">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <CamporeeForm action={createCamporeeAction} submitLabel="Crear Camporee" />
    </div>
  );
}
