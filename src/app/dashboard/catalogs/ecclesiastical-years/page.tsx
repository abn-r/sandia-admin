import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function EcclesiasticalYearsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="ecclesiastical-years" searchParams={searchParams} />;
}
