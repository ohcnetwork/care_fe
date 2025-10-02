import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
}

export default function TableSkeleton({ rows = 8 }: TableSkeletonProps) {
  return (
    <div className="rounded-lg border border-gray-300 shadow-sm overflow-hidden max-w-full">
      <div className="overflow-x-auto">
        <Table className="min-w-[600px] w-full">
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead className="w-[300px] px-4 sm:px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                <Skeleton className="h-5 w-36 sm:w-48" />
              </TableHead>
              <TableHead className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                <Skeleton className="h-5 w-36 sm:w-48" />
              </TableHead>
              <TableHead className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                <Skeleton className="h-5 w-36 sm:w-48" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <TableCell className="px-4 sm:px-6 py-4 font-medium text-gray-700">
                  <Skeleton className="h-4 w-32 sm:w-40" />
                </TableCell>
                <TableCell className="px-4 sm:px-6 py-4 text-gray-600">
                  <Skeleton className="h-4 w-32 sm:w-40" />
                </TableCell>
                <TableCell className="px-4 sm:px-6 py-4 text-gray-600">
                  <Skeleton className="h-4 w-32 sm:w-40" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
