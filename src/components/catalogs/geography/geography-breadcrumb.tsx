import Link from "next/link";

const geographyLinks = [
  { href: "/dashboard/catalogs/geography/countries", label: "Países" },
  { href: "/dashboard/catalogs/geography/unions", label: "Uniones" },
  { href: "/dashboard/catalogs/geography/local-fields", label: "Campos Locales" },
  { href: "/dashboard/catalogs/geography/districts", label: "Distritos" },
  { href: "/dashboard/catalogs/geography/churches", label: "Iglesias" },
];

export function GeographyBreadcrumb() {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {geographyLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full border px-3 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
