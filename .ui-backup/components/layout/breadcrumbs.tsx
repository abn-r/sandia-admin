import Link from "next/link";
import { ChevronRight } from "lucide-react";

function segmentLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 text-[13px] text-muted-foreground" aria-label="Breadcrumb">
      <Link href="/dashboard" className="transition-colors hover:text-foreground">
        Dashboard
      </Link>
      {segments.slice(1).map((segment, index) => {
        const href = `/${segments.slice(0, index + 2).join("/")}`;
        const isLast = index === segments.length - 2;

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground">{segmentLabel(segment)}</span>
            ) : (
              <Link href={href} className="transition-colors hover:text-foreground">
                {segmentLabel(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
