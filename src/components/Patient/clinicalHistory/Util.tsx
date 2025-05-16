import { format, parseISO } from "date-fns";

import { Skeleton } from "@/components/ui/skeleton";

export function TimelineLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <Skeleton className="h-6 w-16 mb-4" />
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export type GroupedByYearAndDate<T> = {
  [year: string]: {
    [date: string]: T[];
  };
};

export function groupByYearAndDate<T>(
  items: T[] | undefined,
  getDate: (item: T) => string | undefined,
): GroupedByYearAndDate<T> {
  if (!items) return {};

  return items.reduce((groups, item) => {
    const dateString = getDate(item);
    if (!dateString) return groups;

    const date = parseISO(dateString);
    const year = format(date, "yyyy");
    const fullDate = format(date, "yyyy-MM-dd");

    if (!groups[year]) {
      groups[year] = {};
    }

    if (!groups[year][fullDate]) {
      groups[year][fullDate] = [];
    }

    groups[year][fullDate].push(item);
    return groups;
  }, {} as GroupedByYearAndDate<T>);
}
