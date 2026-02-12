import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function UnionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="unions" searchParams={searchParams} />;
}
