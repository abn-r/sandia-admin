import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditDistrictPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="districts" id={Number(id)} />;
}
