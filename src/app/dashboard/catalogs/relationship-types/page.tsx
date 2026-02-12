import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function RelationshipTypesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="relationship-types" searchParams={searchParams} />;
}
