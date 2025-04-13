import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";

export interface DisplayField<T> {
  key: keyof T | string;
  label: string;
  render: (value: any) => string | undefined;
}

export function RecordItem<T>({
  record,
  isSelected,
  onToggleSelect,
  displayFields,
}: {
  record: T;
  isSelected: boolean;
  onToggleSelect: (record: T) => void;
  displayFields: DisplayField<T>[];
}) {
  return (
    <TableRow
      className={cn(
        "border border-gray-200 hover:bg-gray-50 divide-x",
        isSelected && "bg-emerald-50",
      )}
    >
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(record)}
          className="border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
      </TableCell>
      {displayFields.map((field, index) => (
        <TableCell
          key={index}
          className={cn(
            "p-2 text-sm whitespace-pre-wrap",
            index % 2 == 1 && "bg-white",
          )}
        >
          {field.render(record[field.key as keyof T])}
        </TableCell>
      ))}
    </TableRow>
  );
}
