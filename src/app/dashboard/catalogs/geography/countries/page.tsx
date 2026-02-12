import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function CountriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="countries" searchParams={searchParams} />;
}
