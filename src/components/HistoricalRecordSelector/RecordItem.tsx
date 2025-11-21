import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { TableCell, TableRow } from "@/components/ui/table";
import { t } from "i18next";
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
  instructionsField?: DisplayField<T>;
  notesField?: DisplayField<T>;
}

export function RecordItem<T>({
  record,
  isSelected,
  onToggleSelect,
  displayFields,
  expandedRecordId,
  onToggleExpand,
  instructionsField,
  notesField,
}: RecordItemProps<T>) {
  const handleToggle = () => {
    onToggleSelect(record);
  };

  const recordId = (record as any).id as string;
  const isExpanded = expandedRecordId === recordId;

  const instructionsValue = instructionsField?.render?.(
    record[instructionsField.key as keyof T],
  );

  const notesValue = notesField?.render?.(record[notesField.key as keyof T]);

  const hasAdditionalInfo =
    (instructionsField || notesField) && (instructionsValue || notesValue);

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

          return (
            <TableCell
              key={field.key.toString()}
              className={cn(
                "p-2 text-sm whitespace-pre-wrap border border-gray-200 bg-white min-w-[150px]",
                "[&:nth-child(even)]:bg-gray-100",
                "[&:nth-child(2)]:rounded-l-md",
                "[&:nth-last-child(1)]:rounded-r-md",
                isSelected && "[&:nth-last-child(1)]:bg-primary-100",
              )}
            >
              <div className="text-sm">{displayValue}</div>
            </TableCell>
          );
        })}

        {(instructionsField || notesField) && (
          <TableCell
            className={
              "p-2 w-12 text-sm border border-gray-200 bg-white [&:nth-child(even)]:bg-gray-100 [&:nth-last-child(1)]:rounded-r-md"
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
        )}
      </TableRow>

      {isExpanded && hasAdditionalInfo && (
        <TableRow className="transform -translate-y-3">
          <TableCell className="border-0 bg-transparent p-0" />
          <TableCell
            colSpan={displayFields.length + 1}
            className="px-4 py-2 border-x border border-gray-200 bg-gray-50 rounded-b-md"
          >
            <div className="space-y-3 ">
              {instructionsValue && (
                <div>
                  <div className="font-medium text-sm mb-1">
                    {t("instructions")}:
                  </div>
                  <div className="text-sm break-words whitespace-normal">
                    {instructionsValue}
                  </div>
                </div>
              )}

              {instructionsValue && notesValue && <Separator />}

              {notesValue && (
                <div>
                  <div className="font-medium text-sm mb-1">{t("notes")}:</div>
                  <div className="text-sm break-words whitespace-normal">
                    {notesValue}
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
