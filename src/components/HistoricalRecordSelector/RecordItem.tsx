import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";

export interface DisplayField<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any) => React.ReactNode;
}

interface RecordItemProps<T> {
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
  const handleToggle = () => {
    onToggleSelect(record);
  };

  return (
    <TableRow className="border-0">
      <TableCell className="border-0 bg-transparent !p-2 w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggle}
          className="size-5"
        />
      </TableCell>
      {displayFields.map((field, idx, arr) => {
        const value = record[field.key as keyof T];
        const displayValue = field.render
          ? field.key == ""
            ? field.render(record)
            : field.render(value)
          : value?.toString() || "-";

        return (
          <TableCell
            key={field.key.toString()}
            className={cn(
              "p-2 text-sm whitespace-pre-wrap border border-gray-200 bg-white",
              idx % 2 === 0 ? "bg-gray-100" : "bg-white",
              isSelected && idx === arr.length - 1 && "bg-primary-100",
              idx === 0 && "rounded-l-md",
              idx === arr.length - 1 && "rounded-r-md",
            )}
          >
            <div className="text-sm">{displayValue}</div>
          </TableCell>
        );
      })}
    </TableRow>
  );
}
