import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditCountryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="countries" id={Number(id)} />;
}
