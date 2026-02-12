import { Award, MapPin, Calendar, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const timeline = [
  { phase: "Planificacion", desc: "Definir fecha, ubicacion y actividades", icon: Calendar, status: "pendiente" },
  { phase: "Inscripcion", desc: "Registro de clubes participantes", icon: Users, status: "pendiente" },
  { phase: "Ejecucion", desc: "Control en sitio, puntajes y asistencia", icon: MapPin, status: "pendiente" },
  { phase: "Resultados", desc: "Puntajes finales y premiacion", icon: Award, status: "pendiente" },
];

export default function CamporeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Award}
        title="Camporees"
        description="Gestion de eventos tipo camporee: planificacion, inscripcion y resultados. Microfase 3.6."
      />

      <Card>
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-medium">Flujo del evento</p>
          <div className="relative">
            <div className="absolute left-[19px] top-3 h-[calc(100%-24px)] w-px bg-border" />
            <div className="space-y-4">
              {timeline.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.phase} className="relative flex items-start gap-4 pl-1">
                    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Fase {i + 1}</span>
                        <Badge variant="outline">{step.status}</Badge>
                      </div>
                      <p className="text-sm font-medium">{step.phase}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
