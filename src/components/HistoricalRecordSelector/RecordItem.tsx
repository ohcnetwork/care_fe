import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { TableCell, TableRow } from "@/components/ui/table";
import useAuthUser from "@/hooks/useAuthUser";
import { BadgeInfo } from "lucide-react";

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
  expandedRecordId?: string;
  onToggleExpand?: (recordId: string) => void;
  expandableFields?: DisplayField<T>[];
}

export function RecordItem<T>({
  record,
  isSelected,
  onToggleSelect,
  displayFields,
  expandedRecordId,
  onToggleExpand,
  expandableFields,
}: RecordItemProps<T>) {
  const handleToggle = () => {
    onToggleSelect(record);
  };

  const recordId = (record as any).id as string;
  const isExpanded = expandedRecordId === recordId;
  const user = useAuthUser();

  const expandableFieldsWithValues = expandableFields
    ?.map((field) => {
      const value = record[field.key as keyof T];
      const displayValue = field.render ? field.render(value) : value;
      return { field, displayValue };
    })
    .filter((item) => item.displayValue != null);

  const hasAdditionalInfo =
    expandableFieldsWithValues && expandableFieldsWithValues.length > 0;

  return (
    <>
      <TableRow className="border-0">
        <TableCell className="border-0 bg-transparent p-2 w-12 [&:has([role=checkbox])]:pr-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggle}
            className="size-5"
          />
        </TableCell>
        {displayFields.map((field) => {
          const value = record[field.key as keyof T];
          const displayValue = field.render
            ? field.key == ""
              ? field.render(record)
              : field.render(value)
            : value?.toString() || "-";
          const isHighlightedUser =
            field.key === "created_by" && (value as any)?.id === user?.id;

          return (
            <TableCell
              key={field.key.toString()}
              className={cn(
                "p-2 text-sm whitespace-pre-wrap border border-gray-200",
                "nth-2:rounded-l-md",
                "nth-last-1:rounded-r-md",
                isHighlightedUser
                  ? "bg-emerald-100!"
                  : "bg-white even:bg-gray-100",
              )}
            >
              <div className="text-sm">{displayValue}</div>
            </TableCell>
          );
        })}

        <TableCell
          className={
            "p-2 text-sm border border-gray-200 bg-white even:bg-gray-100 nth-last-1:rounded-r-md"
          }
        >
          {hasAdditionalInfo && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleExpand?.(recordId)}
              className="size-6"
            >
              <BadgeInfo className="size-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>

      {isExpanded && hasAdditionalInfo && (
        <TableRow className="transform -translate-y-3">
          <TableCell className="border-0 bg-transparent p-0" />
          <TableCell
            colSpan={displayFields.length + 1}
            className="px-4 py-2 border-x border border-gray-200 bg-gray-50 rounded-b-md"
          >
            <div className="space-y-3 ">
              {expandableFieldsWithValues!.map(({ field }, index) => {
                const value = record[field.key as keyof T];
                const displayValue = field.render
                  ? field.render(value)
                  : value?.toString() || "-";
                const isLastItem =
                  index === expandableFieldsWithValues!.length - 1;
                return (
                  <div key={field.key.toString()}>
                    <div className="font-medium text-sm mb-1">
                      {field.label}
                    </div>
                    <div className="text-sm break-words whitespace-normal">
                      {displayValue}
                    </div>
                    {!isLastItem && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
