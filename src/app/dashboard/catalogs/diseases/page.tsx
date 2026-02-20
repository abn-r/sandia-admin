import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function DiseasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="diseases" searchParams={searchParams} />;
}
