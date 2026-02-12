import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function ChurchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="churches" searchParams={searchParams} />;
}
