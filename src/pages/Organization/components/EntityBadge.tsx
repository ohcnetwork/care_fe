import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EntityBadgeProps {
  title: string;
  count?: number | null;
  isFetching: boolean;
}

export default function EntityBadge({
  title,
  count,
  isFetching,
}: EntityBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {isFetching ? (
        <Skeleton className="h-6 w-7 rounded-sm" />
      ) : (
        <Badge variant="neutral" counter>
          {count ?? 0}
        </Badge>
      )}
    </div>
  );
}
