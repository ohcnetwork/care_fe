import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { TableCell, TableRow } from "@/components/ui/table";
import useAuthUser from "@/hooks/useAuthUser";
import { BadgeInfo } from "lucide-react";

type RecordKey<T> = Extract<keyof T, string>;

type KeyedDisplayField<T> = {
  [K in RecordKey<T>]: {
    key: K;
    label: string;
    render?: (value: T[K]) => React.ReactNode;
  };
}[RecordKey<T>];

/** A field with an empty `key` renders the whole record. */
interface RecordDisplayField<T> {
  key: "";
  label: string;
  render: (record: T) => React.ReactNode;
}

export type DisplayField<T> =
  (T extends unknown ? KeyedDisplayField<T> : never) | RecordDisplayField<T>;

type RenderFn = (value: unknown) => React.ReactNode;

function getFieldValue<T>(record: T, field: DisplayField<T>): unknown {
  if (field.key === "") return record;
  return (record as Record<string, unknown>)[field.key];
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

  const recordId = (record as { id: string }).id;
  const isExpanded = expandedRecordId === recordId;
  const user = useAuthUser();

  const expandableFieldsWithValues = expandableFields
    ?.map((field) => {
      const value = getFieldValue(record, field);
      const render = field.render as RenderFn | undefined;
      const displayValue = render ? render(value) : value;
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
          const value = getFieldValue(record, field);
          const render = field.render as RenderFn | undefined;
          const displayValue = render
            ? render(value)
            : String(value ?? "") || "-";
          const isHighlightedUser =
            field.key === "created_by" &&
            (value as { id?: string } | undefined)?.id === user?.id;

          return (
            <TableCell
              key={field.key}
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
                const value = getFieldValue(record, field);
                const render = field.render as RenderFn | undefined;
                const displayValue = render
                  ? render(value)
                  : String(value ?? "") || "-";
                const isLastItem =
                  index === expandableFieldsWithValues!.length - 1;
                return (
                  <div key={field.key}>
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
