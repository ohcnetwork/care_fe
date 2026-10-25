import { History, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { formatDateTime } from "@/Utils/utils";
import {
  IMMUNIZATION_STATUS_COLORS,
  ImmunizationRead,
} from "@/types/emr/immunization/immunization";

interface ImmunizationRecordListProps {
  records: ImmunizationRead[];
  isLoading: boolean;
  canEdit: boolean;
  onEdit: (record: ImmunizationRead) => void;
}

function sortKey(record: ImmunizationRead) {
  return record.occurrence ?? "";
}

export function ImmunizationRecordList({
  records,
  isLoading,
  canEdit,
  onEdit,
}: ImmunizationRecordListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!records.length) {
    return (
      <EmptyState
        icon={<History className="size-6 text-primary" />}
        title={t("immunization_records_empty")}
        description={t("immunization_records_empty_hint")}
        className="shadow-none"
      />
    );
  }

  const sorted = [...records].sort((a, b) =>
    sortKey(b).localeCompare(sortKey(a)),
  );

  return (
    <ul
      className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white"
      aria-label={t("immunization_records")}
    >
      {sorted.map((record) => {
        const vaccine = record.code.display || record.code.code;
        const enteredInError = record.status === "entered_in_error";
        const administration = [
          record.dose_quantity?.value &&
            `${record.dose_quantity.value} ${
              record.dose_quantity.unit?.display ??
              record.dose_quantity.unit?.code ??
              ""
            }`.trim(),
          record.route?.display,
          record.site?.display,
        ].filter(Boolean);
        return (
          <li
            key={record.id}
            aria-label={vaccine}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div
              className={cn(
                "min-w-0 space-y-1",
                enteredInError && "opacity-60",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "break-words font-medium text-gray-950",
                    enteredInError && "line-through",
                  )}
                >
                  {vaccine}
                </span>
                <Badge variant={IMMUNIZATION_STATUS_COLORS[record.status]}>
                  {t(`immunization_status__${record.status}`)}
                </Badge>
                {!record.primary_source && (
                  <Badge variant="outline" size="xs">
                    {t("immunization_reported")}
                  </Badge>
                )}
                {record.is_subpotent && (
                  <Badge variant="orange" size="xs">
                    {t("immunization_subpotent")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {[
                  record.occurrence
                    ? formatDateTime(record.occurrence)
                    : t("immunization_date_unknown"),
                  ...administration,
                ].join(" · ")}
              </p>
              {record.status === "not_done" && record.reason && (
                <p className="text-sm text-gray-600">
                  {t("immunization_not_done_because", {
                    reason: t(`immunization_reason__${record.reason}`),
                  })}
                </p>
              )}
              {record.is_subpotent && record.subpotent_reason && (
                <p className="text-xs text-gray-500">
                  {record.subpotent_reason}
                </p>
              )}
              {record.note && (
                <p className="whitespace-pre-wrap text-xs text-gray-500">
                  {record.note}
                </p>
              )}
            </div>
            {canEdit && !enteredInError && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="self-end sm:self-start"
                aria-label={t("immunization_edit_record_for", {
                  name: vaccine,
                })}
                onClick={() => onEdit(record)}
              >
                <Pencil className="size-4" aria-hidden="true" />
                {t("edit")}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
