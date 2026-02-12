import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditRelationshipTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="relationship-types" id={Number(id)} />;
}
