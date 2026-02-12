import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Heart,
  Stethoscope,
  CalendarDays,
  Shield,
  Sparkles,
  Users2,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

type CatalogModule = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  count?: string;
};

const modules: CatalogModule[] = [
  {
    title: "Jerarquia Geografica",
    description: "Paises, uniones, campos locales, distritos e iglesias.",
    href: "/dashboard/catalogs/geography",
    icon: Globe,
  },
  {
    title: "Tipos de Relacion",
    description: "Catalogo para contactos de emergencia y representante legal.",
    href: "/dashboard/catalogs/relationship-types",
    icon: Users2,
  },
  {
    title: "Alergias",
    description: "Catalogo de alergias para post-registro.",
    href: "/dashboard/catalogs/allergies",
    icon: Heart,
  },
  {
    title: "Enfermedades",
    description: "Catalogo medico de referencia.",
    href: "/dashboard/catalogs/diseases",
    icon: Stethoscope,
  },
  {
    title: "Anios Eclesiasticos",
    description: "Gestion de periodos anuales activos.",
    href: "/dashboard/catalogs/ecclesiastical-years",
    icon: CalendarDays,
  },
  {
    title: "Tipos de Club",
    description: "Aventureros, Conquistadores y Guias Mayores.",
    href: "/dashboard/catalogs/club-types",
    icon: Shield,
  },
  {
    title: "Ideales de Club",
    description: "Catalogo de ideales por tipo de club.",
    href: "/dashboard/catalogs/club-ideals",
    icon: Sparkles,
  },
];

export default function CatalogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Catalogos"
        description="Gestion centralizada de catalogos para post-registro, clases y estructura operativa."
      />

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="group h-full transition-all duration-150 hover:border-primary/30 hover:bg-accent/30">
                <CardContent className="flex items-center gap-3 p-3.5 sm:items-start sm:gap-3.5 sm:p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{module.title}</p>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{module.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
