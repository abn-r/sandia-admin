import { Trophy, FolderOpen, Star, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: FolderOpen, title: "Categorias", desc: "Organizar honores por area tematica (naturaleza, artes, tecnologia, etc.)" },
  { icon: Star, title: "Catalogo de honores", desc: "Nombre, descripcion, nivel de dificultad e insignia" },
  { icon: Upload, title: "Insignias", desc: "Subir y gestionar imagenes SVG/PNG de cada honor" },
];

export default function HonorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trophy}
        title="Honores"
        description="Categorias y catalogo completo de honores. Microfase 3.4."
      />

      <div className="space-y-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
