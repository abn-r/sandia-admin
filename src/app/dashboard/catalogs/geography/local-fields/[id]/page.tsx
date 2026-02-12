import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditLocalFieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="local-fields" id={Number(id)} />;
}
