import { cn } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type HeaderRow = {
  title: string;
  key: string;
  width?: number;
};

type tableRowType = Record<string, string | undefined>;
interface GenericTableProps {
  headers: HeaderRow[];
  rows: tableRowType[] | undefined;
}

export default function PrintTable({ headers, rows }: GenericTableProps) {
  return (
    <Table className="border-collapse border border-gray-50 rounded-sm">
      <TableHeader>
        <TableRow className="rounded-md overflow-hidden bg-transparent hover:bg-transparent divide-x divide-gray border-b-gray">
          {headers.map(({ key, title }, index) => (
            <TableHead
              className={cn(
                index == 0 && "first:rounded-l-md",
                "h-auto py-1 pl-2 pr-2 text-black",
              )}
              key={key}
            >
              {title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {!!rows &&
          rows.map((row, index) => (
            <TableRow
              key={index}
              className="rounded-md overflow-hidden bg-transparent hover:bg-transparent divide-x divide-gray"
            >
              {headers.map(({ key }) => (
                <TableCell key={key}>{row[key] || "-"}</TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
