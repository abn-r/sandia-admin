import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditAllergyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="allergies" id={Number(id)} />;
}
