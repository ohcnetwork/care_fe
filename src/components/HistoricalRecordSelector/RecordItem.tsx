import { Info } from "lucide-react";
import { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";

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
    <tr className="border-t">
      <td className="p-4 align-middle">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(record)}
          className="border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
        />
      </td>
      {displayFields.map((field) => {
        const value = record[field.key];
        return (
          <td key={String(field.key)} className="p-4 align-middle">
            {field.render ? field.render(value) : String(value)}
          </td>
        );
      })}
      <td className="p-4 align-middle text-center">
        <Info className="h-5 w-5 text-gray-400 inline" />
      </td>
    </tr>
  );
}
