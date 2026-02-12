import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditEcclesiasticalYearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="ecclesiastical-years" id={Number(id)} />;
}
