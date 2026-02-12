import Link from "next/link";
import { KeyRound, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  {
    title: "Permisos",
    description: "Gestiona los permisos del sistema (CRUD). Formato resource:action.",
    href: "/dashboard/rbac/permissions",
    icon: KeyRound,
  },
  {
    title: "Roles y Permisos",
    description: "Asigna y remueve permisos de cada rol del sistema.",
    href: "/dashboard/rbac/roles",
    icon: Shield,
  },
];

export default function RbacIndexPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Control de Acceso"
        description="Administra permisos y su asignacion a roles."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{section.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{section.description}</p>
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
