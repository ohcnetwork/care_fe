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

type CellConfig = {
  value?: string;
  className?: string;
  render?: (value: string | undefined) => React.ReactNode;
};

interface GenericTableProps {
  headers: HeaderRow[];
  rows: TableRowType[] | undefined;
  className?: string;
  classNameCell?: string;
  cellConfig?: Record<string, CellConfig>;
  renderCell?: (
    key: string,
    value: string | undefined,
    rowIndex: number,
  ) => React.ReactNode;
}

export default function PrintTable({
  headers,
  rows,
  className,
  classNameCell,
  cellConfig,
  renderCell,
}: GenericTableProps) {
  const { t } = useTranslation();

  const getCellContent = (
    key: string,
    value: string | undefined,
    rowIndex: number,
  ) => {
    if (renderCell) {
      return renderCell(key, value, rowIndex);
    }

    if (cellConfig?.[key]?.render) {
      return cellConfig[key].render(value);
    }

    return value;
  };

  return (
    <div className="overflow-hidden rounded border border-gray-200">
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
                className={cn(
                  "bg-transparent hover:bg-transparent divide-x divide-gray-200",
                  className,
                )}
              >
                {headers.map(({ key }) => (
                  <TableCell
                    className={cn(
                      "wrap-break-words whitespace-normal text-center",
                      classNameCell,
                      cellConfig?.[key]?.className,
                    )}
                    key={key}
                  >
                    {getCellContent(key, row[key], index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
