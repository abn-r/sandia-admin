import { CalendarCheck, CalendarDays, Clock, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

const sampleWeek = [
  { day: "Lun", activity: null },
  { day: "Mar", activity: null },
  { day: "Mie", activity: "Reunion de unidad" },
  { day: "Jue", activity: null },
  { day: "Vie", activity: null },
  { day: "Sab", activity: "Actividad especial" },
  { day: "Dom", activity: null },
];

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarCheck}
        title="Actividades"
        description="Calendario y control operativo de actividades por club. Microfase 3.6."
      />

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4 text-primary" />
            Vista semanal (ejemplo)
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {sampleWeek.map((d) => (
              <div
                key={d.day}
                className={`rounded-lg border p-2.5 text-center sm:p-3 ${d.activity ? "border-primary/30 bg-primary/5" : "bg-muted/30"}`}
              >
                <p className="text-[11px] font-medium uppercase text-muted-foreground">{d.day}</p>
                <div className="mt-1.5 flex justify-center sm:mt-2">
                  {d.activity ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </div>
                {d.activity ? (
                  <p className="mt-1 text-[10px] leading-tight text-primary sm:mt-1.5">{d.activity}</p>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Pendiente conectar con <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">/api/v1/clubs/:clubId/activities</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
