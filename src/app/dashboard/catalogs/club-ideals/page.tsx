import { CatalogListPage } from "@/components/catalogs/catalog-list-page";

export default function ClubIdealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogListPage entityKey="club-ideals" searchParams={searchParams} />;
}
