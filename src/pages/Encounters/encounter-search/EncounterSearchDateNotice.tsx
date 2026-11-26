import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface EncounterSearchDateNoticeProps {
  /** The applied text filters, which still narrow the patient's visits. */
  name?: string;
  visitId?: string;
  onUndo: () => void;
  onDismiss: () => void;
}

/**
 * Below the toolbar after selecting a patient cleared the date range:
 * "Date range cleared for this patient." with Undo.
 */
export function EncounterSearchDateNotice({
  name,
  visitId,
  onUndo,
  onDismiss,
}: EncounterSearchDateNoticeProps) {
  const { t } = useTranslation();

  const stillApplies = name
    ? t("encounter_search_name_still_applies")
    : visitId
      ? t("encounter_search_visit_id_still_applies")
      : "";

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-md border bg-muted-background px-3 py-1.5 text-sm"
    >
      <span className="min-w-0 flex-1">
        {t("encounter_search_dates_cleared")}
        {stillApplies && ` ${stillApplies}`}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onUndo}>
        {t("encounter_search_undo")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("encounter_search_dismiss")}
        onClick={onDismiss}
      >
        <X />
      </Button>
    </div>
  );
}
