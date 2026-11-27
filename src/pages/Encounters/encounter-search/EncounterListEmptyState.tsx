import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EncounterListEmptyStateProps {
  /** Names of the applied filters and searches, in display order. */
  applied: string[];
  /** Clears every applied filter and search at once. */
  onClearFilters: () => void;
  /** Lifts the date range; offered only for a selected patient. */
  onShowAnyDate?: () => void;
}

/**
 * Says the date range and filters hide every visit, names what is applied,
 * and offers one way out: clear them all, or for a patient, show any date.
 * Single filters are still removed from the toolbar. It explains from the
 * applied filters only, without extra queries.
 */
export function EncounterListEmptyState({
  applied,
  onClearFilters,
  onShowAnyDate,
}: EncounterListEmptyStateProps) {
  const { t } = useTranslation();
  const filtered = applied.length > 0;
  return (
    <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-3">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">
        {filtered
          ? t("encounter_list_empty_filters")
          : t("encounter_list_empty_dates")}
      </h3>
      {filtered && (
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          {t("encounter_list_empty_applied", {
            filters: applied.join(", "),
          })}
        </p>
      )}
      {(filtered || onShowAnyDate) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {filtered && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              {t("encounter_list_empty_clear_filters")}
            </Button>
          )}
          {onShowAnyDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onShowAnyDate}
            >
              {t("encounter_list_empty_any_date")}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
