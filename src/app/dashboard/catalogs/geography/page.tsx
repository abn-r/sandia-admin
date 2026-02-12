import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GeographyBreadcrumb } from "@/components/catalogs/geography/geography-breadcrumb";

const sections = [
  {
    title: "Jerarquia geografica",
    description: "Gestiona paises, uniones, campos locales, distritos e iglesias.",
  },
  {
    title: "Dependencia de post-registro",
    description: "Estos catalogos son criticos para completar el paso 3 de post-registro en app movil.",
  },
];

export default function GeographyOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jerarquia Geografica"
        description="Administra la estructura Pais > Union > Campo Local > Distrito > Iglesia."
      />

      <GeographyBreadcrumb />

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
