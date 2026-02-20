import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ListChecks } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getCertificationById, type Certification } from "@/lib/api/certifications";
import { unwrapObject } from "@/lib/api/response";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

function getCertificationId(certification: Certification) {
  const rawValue = certification.certification_id ?? certification.id;
  const parsed = Number(rawValue ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function CertificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const certificationId = Number(id);

  if (!Number.isFinite(certificationId) || certificationId <= 0) {
    notFound();
  }

  let certification: Certification | null = null;
  try {
    const response = await getCertificationById(certificationId);
    certification = unwrapObject<Certification>(response);
  } catch (error) {
    if (
      error instanceof ApiError &&
      ([401, 403, 429].includes(error.status) || error.status >= 500)
    ) {
      return (
        <div className="space-y-6">
          <PageHeader
            icon={Activity}
            title="Detalle de certificacion"
            description="No fue posible cargar la certificacion."
            actions={
              <Link href="/dashboard/certifications">
                <Button variant="outline">Volver</Button>
              </Link>
            }
          />
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {error.status === 429
                ? "Rate limit alcanzado al consultar la certificacion. Reintenta en unos segundos."
                : error.status >= 500
                  ? "Backend no disponible temporalmente para consultar la certificacion."
                  : "No tienes permisos para consultar esta certificacion."}
            </CardContent>
          </Card>
        </div>
      );
    }

    throw error;
  }

  if (!certification || !getCertificationId(certification)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title={certification.name || `Certificacion #${certificationId}`}
        description="Detalle de certificacion y estructura base."
        actions={
          <Link href="/dashboard/certifications">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Duracion</p>
            <p className="mt-1 font-medium">{certification.duration_hours ?? "—"} hrs</p>
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">Modulos</p>
            <Badge variant="outline" className="mt-1">{certification.modules_count ?? "—"}</Badge>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-muted-foreground">Estado</p>
            <div className="mt-1">
              <StatusBadge active={Boolean(certification.active ?? true)} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-muted-foreground">Descripcion</p>
            <p className="mt-1 text-muted-foreground">
              {certification.description || "Sin descripcion registrada."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <ListChecks className="h-4 w-4" />
          El seguimiento de progreso se gestiona por usuario en `/users/:userId/certifications/*`.
        </CardContent>
      </Card>
    </div>
  );
}
