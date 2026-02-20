import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function AllergiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="allergies" searchParams={searchParams} />;
}
