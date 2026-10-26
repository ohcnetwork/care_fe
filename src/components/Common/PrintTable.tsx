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

function parseSpan(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface GenericTableProps {
  headers: HeaderRow[];
  rows: TableRowType[] | undefined;
  className?: string;
  cellClassName?: string;
  headerClassName?: string;
  tableClassName?: string;
  cellConfig?: Record<string, CellConfig>;
  renderCell?: (
    key: string,
    value: string | undefined,
    rowIndex: number,
  ) => React.ReactNode;
  rowClassName?: (row: TableRowType, rowIndex: number) => string | undefined;
}

export default function PrintTable({
  headers,
  rows,
  className,
  cellClassName,
  headerClassName,
  tableClassName,
  cellConfig,
  renderCell,
  rowClassName,
}: GenericTableProps) {
  const { t } = useTranslation();

  // Pre-compute which cells are covered by a rowspan from a previous row.
  // Rows can encode `_span_${key}: "N"` to span N rows for that column.
  const skipCells: Record<string, Set<number>> = {};
  headers.forEach(({ key }) => {
    skipCells[key] = new Set();
  });
  rows?.forEach((row, rowIndex) => {
    headers.forEach(({ key }) => {
      const span = parseSpan(row[`_span_${key}`]);
      if (span) {
        for (let i = 1; i < span; i++) {
          skipCells[key].add(rowIndex + i);
        }
      }
    });
  });

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
    <div
      className={cn(
        "overflow-hidden rounded border border-gray-200",
        tableClassName,
      )}
    >
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-transparent hover:bg-transparent divide-x divide-gray-200 border-b-gray-200">
            {headers.map(({ key, width }, index) => (
              <TableHead
                className={cn(
                  index == 0 && "first:rounded-l-md",
                  "h-auto py-1 pl-2 pr-2 text-black text-center ",
                  width && `w-${width}`,
                  headerClassName,
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
            rows.map((row, index) => {
              if (row["_fullspan"]) {
                const skippedCount = headers.filter(({ key }) =>
                  skipCells[key]?.has(index),
                ).length;
                return (
                  <TableRow
                    key={index}
                    className="bg-transparent hover:bg-transparent"
                  >
                    <TableCell
                      colSpan={Math.max(1, headers.length - skippedCount)}
                      className={cn(
                        "wrap-break-word whitespace-normal",
                        cellClassName,
                      )}
                    >
                      {row["_fullspan"]}
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow
                  key={index}
                  className={cn(
                    "bg-transparent hover:bg-transparent divide-x divide-gray-200",
                    className,
                    rowClassName?.(row, index),
                  )}
                >
                  {headers.map(({ key }) => {
                    if (skipCells[key]?.has(index)) return null;
                    const rowSpan = parseSpan(row[`_span_${key}`]);
                    return (
                      <TableCell
                        rowSpan={rowSpan}
                        className={cn(
                          "wrap-break-word whitespace-normal text-center",
                          cellClassName,
                          cellConfig?.[key]?.className,
                        )}
                        key={key}
                      >
                        {getCellContent(key, row[key], index)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
