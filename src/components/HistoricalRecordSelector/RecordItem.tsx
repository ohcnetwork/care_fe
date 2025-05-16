import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";

export interface DisplayField<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any) => string;
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
    <TableRow className="divide-x">
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggle}
          className="mr-1 size-5"
        />
      </TableCell>
      {displayFields.map((field, index) => {
        const value = record[field.key as keyof T];
        const displayValue = field.render
          ? field.render(value)
          : value?.toString() || "-";

        return (
          <TableCell
            key={field.key.toString()}
            className={cn(
              "p-2 text-sm whitespace-pre-wrap",
              index % 2 === 1 && "bg-white",
            )}
          >
            <div className="text-sm">{displayValue}</div>
          </TableCell>
        );
      })}
    </TableRow>
  );
}
