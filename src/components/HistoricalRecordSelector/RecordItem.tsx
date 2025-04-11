import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";

export interface DisplayField<T> {
  key: keyof T;
  label: string;
  render?: (value: any) => ReactNode;
}

export interface RecordItemProps<T> {
  record: T;
  isSelected: boolean;
  onToggleSelect: (record: T) => void;
  displayFields: DisplayField<T>[];
}

export function RecordItem<T>({
  record,
  isSelected,
  onToggleSelect,
  displayFields,
}: RecordItemProps<T>) {
  return (
    <TableRow className="border my-2 mx-1 px-1 py-2 rounded-md border-gray-300 bg-gray-100 divide-x">
      <TableCell className="">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(record)}
          className="border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 mr-1"
        />
      </TableCell>
      {displayFields.map((field, key) => {
        const value = record[field.key];
        return (
          <TableCell
            key={String(field.key)}
            className={cn("p-2 text-sm", key % 2 == 1 && "bg-white")}
          >
            {field.render ? field.render(value) : String(value)}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
