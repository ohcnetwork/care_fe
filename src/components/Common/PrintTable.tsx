import { useTranslation } from "react-i18next";

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
  key: string;
  width?: number;
};

type TableRowType = Record<string, string | undefined>;
interface GenericTableProps {
  headers: HeaderRow[];
  rows: TableRowType[] | undefined;
}

export default function PrintTable({ headers, rows }: GenericTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-transparent hover:bg-transparent divide-x divide-gray-200 border-b-gray-200">
            {headers.map(({ key, width }, index) => (
              <TableHead
                className={cn(
                  index == 0 && "first:rounded-l-md",
                  "h-auto py-1 pl-2 pr-2 text-black text-center ",
                  width && `w-${width}`,
                )}
                key={key}
              >
                {t(key)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!!rows &&
            rows.map((row, index) => (
              <TableRow
                key={index}
                className="bg-transparent hover:bg-transparent divide-x divide-gray-200"
              >
                {headers.map(({ key }) => (
                  <TableCell
                    className="break-words whitespace-normal text-center"
                    key={key}
                  >
                    {row[key] || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
