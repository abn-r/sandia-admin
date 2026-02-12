import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function LocalFieldsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="local-fields" searchParams={searchParams} />;
}
