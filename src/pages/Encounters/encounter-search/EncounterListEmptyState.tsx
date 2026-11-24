import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface EmptyStateAction {
  key: string;
  label: string;
  onClick: () => void;
}

/**
 * Says the date range and filters hide every visit, with one button per
 * filter to loosen. It explains from the applied filters only, without
 * extra queries.
 */
export function EncounterListEmptyState({
  actions,
}: {
  actions: EmptyStateAction[];
}) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-3">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="mb-4 text-lg font-semibold">
        {actions.length
          ? t("encounter_list_empty_filters")
          : t("encounter_list_empty_dates")}
      </h3>
      {actions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
