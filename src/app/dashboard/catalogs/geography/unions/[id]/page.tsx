import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditUnionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="unions" id={Number(id)} />;
}
