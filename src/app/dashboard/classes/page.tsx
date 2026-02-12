import { GraduationCap, Layers, BookOpenCheck, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const hierarchy = [
  { level: "Clase", description: "Amigo, Companero, Explorador, Orientador, Viajero, Guia", icon: GraduationCap, depth: 0 },
  { level: "Modulo", description: "Agrupacion tematica dentro de cada clase", icon: Layers, depth: 1 },
  { level: "Seccion", description: "Requisitos individuales a completar", icon: ListChecks, depth: 2 },
];

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Clases"
        description="Estructura jerarquica de clases, modulos y secciones. Microfase 3.4."
      />

      <Card>
        <CardContent className="p-5">
          <p className="mb-4 flex items-center gap-2 text-sm font-medium">
            <BookOpenCheck className="h-4 w-4 text-primary" />
            Jerarquia de contenido
          </p>
          <div className="space-y-2">
            {hierarchy.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.level}
                  className="flex items-start gap-3 rounded-md bg-muted/40 p-3"
                  style={{ marginLeft: `${item.depth * 24}px` }}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.level}</p>
                      <Badge variant="outline">nivel {item.depth + 1}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
