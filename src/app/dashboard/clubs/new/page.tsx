import Link from "next/link";
import { Users } from "lucide-react";
import { createClubAction } from "@/lib/clubs/actions";
import { ClubForm } from "@/components/clubs/club-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

export default function NewClubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Nuevo Club"
        description="Registra un nuevo club en la estructura organizacional."
        actions={
          <Link href="/dashboard/clubs">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <ClubForm action={createClubAction} submitLabel="Crear Club" />
    </div>
  );
}
