import { format, isToday } from "date-fns";
import { Pin } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipComponent } from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";
import { Code } from "@/types/base/code/code";

import { ResolvedObservationEntry, unitLabel } from "./observationDetailUtils";

export const ObservationHistoryMatrix = ({
  codes,
  entriesByCode,
  totalCount,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  codes: Code[];
  entriesByCode: Record<string, ResolvedObservationEntry[]>;
  totalCount: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}) => {
  const { t } = useTranslation();

  const firstColRef = useRef<HTMLTableCellElement>(null);
  const [pinnedOffset, setPinnedOffset] = useState(0);

  const { ref: loadMoreRef, inView } = useInView();

  const loadMore = useEffectEvent(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage?.();
  });

  useEffect(() => {
    if (inView) loadMore();
  }, [inView, isFetchingNextPage]);

  const { columns, rows } = useMemo(() => {
    // One column per reading. Readings can share an effective time (several
    // results for one component), so columns are keyed per reading, not per time.
    const columnByKey = new Map<string, { time: number; occurrence: number }>();
    const countByTime = new Map<number, number>();
    for (const list of Object.values(entriesByCode)) {
      for (const entry of list) {
        if (columnByKey.has(entry.key)) continue;
        columnByKey.set(entry.key, {
          time: entry.time,
          occurrence: entry.occurrence,
        });
        countByTime.set(entry.time, (countByTime.get(entry.time) ?? 0) + 1);
      }
    }
    const columns = Array.from(columnByKey, ([key, col]) => ({
      key,
      ...col,
      isRepeated: (countByTime.get(col.time) ?? 0) > 1,
    })).sort((a, b) => b.time - a.time || a.occurrence - b.occurrence);

    const rows = codes.map((code) => {
      const codeEntries = entriesByCode[code.code] ?? [];

      const entriesByKey: Record<string, ResolvedObservationEntry> = {};
      for (const entry of codeEntries) {
        entriesByKey[entry.key] = entry;
      }

      return {
        id: code.code,
        title: code.display || code.code,
        entriesByKey,
      };
    });

    return { columns, rows };
  }, [entriesByCode, codes]);

  // Dock the pinned column to the first column's real width so it never
  // overlaps when long content stretches the first column past its base width.
  useEffect(() => {
    const el = firstColRef.current;
    if (!el) return;
    const update = () => setPinnedOffset(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns]);

  return (
    <div className="mt-5 ml-3 min-w-0 max-w-full rounded-xl border border-border bg-card">
      <div className="relative flex items-center gap-3 p-4">
        <span
          aria-hidden="true"
          className="absolute top-4 left-0 inset-y-6 w-1 rounded-r-lg bg-primary h-5"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">
            {t("observation_history")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("showing_all_readings", { count: totalCount })}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto overscroll-x-contain border-t border-border">
        <Table
          className="min-w-max border-separate border-spacing-0
    [&_td]:border-b [&_td]:border-border
    [&_th]:border-b [&_th]:border-border
    [&_tbody_tr:last-child_td]:border-b-0"
        >
          <TableHeader>
            <TableRow className="bg-muted-background">
              <TableHead
                ref={firstColRef}
                className="sticky left-0 z-20 w-32 min-w-32 max-w-32 sm:w-64 sm:min-w-64 sm:max-w-64 border-r border-border bg-soft-background text-soft-foreground"
              >
                {t("component")}
              </TableHead>
              {columns.map((col, index) => {
                const isLatest = index === 0;
                const isTodayCol = isToday(new Date(col.time));
                return (
                  <TableHead
                    key={col.key}
                    style={isLatest ? { left: pinnedOffset } : undefined}
                    className={cn(
                      "whitespace-nowrap border-r border-border bg-muted-background text-center font-normal text-soft-foreground last:border-r-0",
                      isLatest && "sticky z-20 bg-primary/10",
                    )}
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="inline-flex items-center gap-1 text-xs text-placeholder-foreground">
                        {isLatest && (
                          <span className="size-2 bg-primary/10 rounded-full border border-primary" />
                        )}
                        {isTodayCol ? t("today") : format(col.time, "d MMM")}
                        {isLatest && <Pin className="size-3" />}
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        {format(new Date(col.time), "h:mm a")}
                        {col.isRepeated && ` #${col.occurrence + 1}`}
                      </span>
                    </div>
                  </TableHead>
                );
              })}
              {hasNextPage && (
                <TableHead
                  ref={loadMoreRef}
                  aria-hidden="true"
                  className="w-2 min-w-2 border-r-0 bg-muted-background"
                />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                <TableCell className="sticky left-0 z-10 w-32 max-w-32 sm:w-64 sm:max-w-64 border-r border-border bg-card">
                  <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                    <TooltipComponent content={row.title}>
                      <span className="block truncate font-semibold text-foreground">
                        {row.title}
                      </span>
                    </TooltipComponent>
                  </div>
                </TableCell>
                {columns.map((col, index) => {
                  const entry = row.entriesByKey[col.key];
                  const unit = entry?.value ? unitLabel(entry.unit) : "";
                  const isLatest = index === 0;
                  return (
                    <TableCell
                      key={col.key}
                      style={isLatest ? { left: pinnedOffset } : undefined}
                      className={cn(
                        "whitespace-nowrap border-r border-border text-center last:border-r-0 bg-card",
                        isLatest && "sticky z-10",
                      )}
                    >
                      <span className="inline-flex items-baseline gap-1">
                        {entry?.value || "-"}
                        {unit && (
                          <span className="text-xs text-muted-foreground">
                            {unit}
                          </span>
                        )}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

            <TableRow className="hover:bg-transparent border-none">
              <TableCell
                colSpan={2}
                className="sticky left-0 z-10 border border-border h-2 border-y-0 p-0 border-l-0"
              />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
