import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="ml-auto h-9 w-24" />
      </div>
      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2.5">
          <div className="flex gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`head-${i}`} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-6 border-b px-3 py-3 last:border-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`cell-${index}-${i}`} className={`h-4 ${i === 0 ? "w-32" : "w-20"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
