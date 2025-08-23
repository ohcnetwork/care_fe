import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";

import query from "@/Utils/request/query";
import { Code } from "@/types/base/code/code";
import { ObservationWithUser } from "@/types/emr/observation";
import patientApi from "@/types/emr/patient/patientApi";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface ObservationHistoryTableProps {
  patientId: string;
  encounterId: string;
  codes: Code[];
}

const LIMIT = 30;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

export const ObservationHistoryTable = ({
  patientId,
  encounterId,
  codes,
}: ObservationHistoryTableProps) => {
  const { ref, inView } = useInView();

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery<
    PaginatedResponse<ObservationWithUser>
  >({
    queryKey: [
      "infinite-observations",
      patientId,
      codes.map((c) => c.code).join(","),
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await query(patientApi.listObservations, {
        pathParams: { patientId },
        queryParams: {
          encounter: encounterId,
          limit: String(LIMIT),
          codes: codes.map((c) => c.code).join(","),
          offset: String(pageParam),
        },
      })({ signal: new AbortController().signal });
      return response as PaginatedResponse<ObservationWithUser>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    );
  }

  if (!data?.pages[0]?.results.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Entered By</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.pages.map((page, _pageIndex) =>
            page.results.map((observation) => {
              const name = `${observation.data_entered_by.first_name} ${observation.data_entered_by.last_name}`;

              return (
                <TableRow key={observation.id}>
                  <TableCell>
                    {formatDate(observation.effective_datetime)}
                  </TableCell>
                  <TableCell>
                    {codes.find((c) => c.code === observation.main_code.code)
                      ?.display || observation.main_code.code}
                  </TableCell>
                  <TableCell>
                    {observation.value.value_quantity?.value?.toFixed(2) ||
                      observation.value.value}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={name} className="size-6" />
                      <span>{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {observation.note}
                  </TableCell>
                </TableRow>
              );
            }),
          )}
          {hasNextPage && (
            <TableRow ref={ref}>
              <TableCell colSpan={5}>
                <div className="flex justify-center p-4">
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
