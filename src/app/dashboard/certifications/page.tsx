import { Activity, FileCheck, ClipboardList, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

const certTypes = [
  { name: "Certificacion basica", desc: "Requisitos fundamentales para nuevos miembros", icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
  { name: "Certificacion avanzada", desc: "Especializaciones por area de conocimiento", icon: FileCheck, color: "bg-violet-50 text-violet-600" },
  { name: "Certificacion de liderazgo", desc: "Formacion para directores e instructores", icon: BadgeCheck, color: "bg-emerald-50 text-emerald-600" },
];

export default function CertificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Certificaciones"
        description="Catalogo de certificaciones, niveles y modulos requeridos. Microfase 3.6."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {certTypes.map((ct) => {
          const Icon = ct.icon;
          return (
            <Card key={ct.name} className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`px-4 py-3 ${ct.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium">{ct.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{ct.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
