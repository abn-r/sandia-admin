import { CatalogEditPage } from "@/components/catalogs/catalog-form-page";

export default async function EditClubIdealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogEditPage entityKey="club-ideals" id={Number(id)} />;
}
