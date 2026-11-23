import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";

import { SHEET_ROW_COLUMNS } from "./SpecimenCollectionRow";

interface SpecimenCollectionGroupProps {
  title: string;
  total: number;
  included: number;
  scanned: number;
  disabled: boolean;
  onIncludedChange: (included: boolean) => void;
  children: ReactNode;
}

export function SpecimenCollectionGroup({
  title,
  total,
  included,
  scanned,
  disabled,
  onIncludedChange,
  children,
}: SpecimenCollectionGroupProps) {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white shadow-xs">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-2.5">
        <Checkbox
          checked={included === total}
          indeterminate={included > 0 && included < total}
          onCheckedChange={onIncludedChange}
          disabled={disabled}
          aria-label={title}
        />
        <h5 className="min-w-0 truncate text-sm font-semibold text-foreground">
          {title}
        </h5>
        <span
          className={cn(
            "ml-auto shrink-0 text-sm font-medium",
            included > 0 && scanned === included
              ? "text-green-700"
              : "text-soft-foreground",
          )}
        >
          {included
            ? t("specimens_scanned", { scanned, total: included })
            : t("specimens_left_out", { count: total })}
        </span>
      </div>
      {included > 0 && (
        <div
          className={cn(
            "hidden gap-x-3.5 border-b border-soft-border px-4 pt-2 pb-1.5 text-sm text-soft-foreground md:grid",
            SHEET_ROW_COLUMNS,
          )}
        >
          <span />
          <span>{t("test")}</span>
          <span>{t("specimen_id")}</span>
          <span>{t("qty")}</span>
          <span className="sr-only">{t("more_details")}</span>
        </div>
      )}
      <div className="divide-y divide-soft-border">{children}</div>
    </section>
  );
}
