import { format, isToday } from "date-fns";
import { Pin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

import { ResolvedObservationEntry } from "./observationDetailUtils";

export const ObservationHistoryMatrix = ({
  codes,
  entriesByCode,
  totalCount,
  hasNextPage,
  fetchNextPage,
}: {
  codes: Code[];
  entriesByCode: Record<string, ResolvedObservationEntry[]>;
  totalCount: number;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
}) => {
  const { t } = useTranslation();

  const firstColRef = useRef<HTMLTableCellElement>(null);
  const [pinnedOffset, setPinnedOffset] = useState(0);

  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage?.();
  }, [inView, hasNextPage, fetchNextPage]);

  const { columns, rows } = useMemo(() => {
    // One column per distinct reading time, most recent first.
    const columnTimes = new Set<number>();
    for (const list of Object.values(entriesByCode)) {
      for (const entry of list) {
        columnTimes.add(entry.time);
      }
    }
    const columns = Array.from(columnTimes)
      .sort((a, b) => b - a)
      .map((time) => ({ key: String(time), time }));

    const rows = codes.map((code) => {
      const codeEntries = entriesByCode[code.code] ?? [];

      // Index each reading by its exact time.
      const valuesByTime: Record<
        string,
        { time: number; value?: string | null }
      > = {};
      for (const entry of codeEntries) {
        valuesByTime[String(entry.time)] = {
          time: entry.time,
          value: entry.value,
        };
      }

      return {
        id: code.code,
        title: code.display || code.code,
        valuesByTime,
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
    <div className="rounded-xl border border-gray-200 bg-white mt-5 ml-3">
      <div className="relative flex items-center gap-3 p-4">
        <span
          aria-hidden="true"
          className="absolute top-4 left-0 inset-y-6 w-1 rounded-r-lg bg-indigo-600 h-5"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-950">
            {t("observation_history")}
          </h3>
          <p className="text-sm text-gray-700">
            {t("showing_all_readings", { count: totalCount })}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-gray-200 overflow-y-auto">
        <Table
          className="border-separate border-spacing-0
    [&_td]:border-b [&_td]:border-gray-200
    [&_th]:border-b [&_th]:border-gray-200
    [&_tbody_tr:last-child_td]:border-b-0"
        >
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-50">
              <TableHead
                ref={firstColRef}
                className="sticky left-0 z-20 w-32 min-w-32 max-w-32 sm:w-64 sm:min-w-64 sm:max-w-64 border-r border-gray-200 bg-gray-50 text-gray-600"
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
                      "whitespace-nowrap border-r border-gray-200 bg-gray-100 text-center font-normal text-gray-600 last:border-r-0",
                      isLatest && "sticky z-20 bg-indigo-100",
                    )}
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        {isLatest && (
                          <div className="size-2 bg-indigo-100 rounded-full border border-indigo-700" />
                        )}
                        {isTodayCol
                          ? t("today")
                          : format(new Date(col.time), "d MMM")}
                        {isLatest && <Pin className="size-3" />}
                      </span>
                      <span className="font-semibold text-gray-700">
                        {format(new Date(col.time), "h:mm a")}
                      </span>
                    </div>
                  </TableHead>
                );
              })}
              {hasNextPage && (
                <TableHead
                  ref={loadMoreRef}
                  aria-hidden="true"
                  className="w-2 min-w-2 border-r-0 bg-gray-100"
                />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                <TableCell className="sticky left-0 z-10 w-32 max-w-32 sm:w-64 sm:max-w-64 border-r border-gray-200 bg-white">
                  <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                    <TooltipComponent content={row.title}>
                      <span className="block truncate font-semibold text-gray-950">
                        {row.title}
                      </span>
                    </TooltipComponent>
                  </div>
                </TableCell>
                {columns.map((col, index) => {
                  const entry = row.valuesByTime[col.key];
                  const isLatest = index === 0;
                  return (
                    <TableCell
                      key={col.key}
                      style={isLatest ? { left: pinnedOffset } : undefined}
                      className={cn(
                        "whitespace-nowrap border-r border-gray-200 text-center last:border-r-0 bg-white",
                        isLatest && "sticky z-10",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {entry?.value ?? "-"}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

            <TableRow className="hover:bg-transparent border-none">
              <TableCell
                colSpan={2}
                className="sticky left-0 z-10 border border-gray-200 h-2 border-l-0 border-b-0 border-t-0 p-0 bg-white"
              />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
