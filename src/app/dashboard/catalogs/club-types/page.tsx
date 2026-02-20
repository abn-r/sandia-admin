import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function ClubTypesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="club-types" searchParams={searchParams} />;
}
