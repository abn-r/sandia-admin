import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditDiseasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="diseases" id={Number(id)} />;
}
