import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="ml-auto h-9 w-24" />
      </div>
      <Card>
        <div className="border-b bg-muted/30 px-4 py-3">
          <div className="flex gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`head-${i}`} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-6 border-b px-4 py-3.5 last:border-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`cell-${index}-${i}`} className={`h-4 ${i === 0 ? "w-32" : "w-20"}`} />
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
}
