import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditChurchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="churches" id={Number(id)} />;
}
