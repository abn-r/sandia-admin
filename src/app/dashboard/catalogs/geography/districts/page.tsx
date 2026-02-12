import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function DistrictsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="districts" searchParams={searchParams} />;
}
