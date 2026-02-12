import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditClubTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="club-types" id={Number(id)} />;
}
