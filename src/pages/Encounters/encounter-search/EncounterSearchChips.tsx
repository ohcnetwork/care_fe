import { ScanLine, User, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface EncounterSearchChipsProps {
  name?: string;
  visitId?: string;
  patient?: { name?: string; scanned: boolean };
  onRemoveText: () => void;
  onRemovePatient: () => void;
  /** Shows "Date range cleared for this patient." with Undo. */
  datesCleared: boolean;
  onUndo: () => void;
  onDismissNotice: () => void;
}

/** The search filters the URL applies, below the toolbar, each removable. */
export function EncounterSearchChips({
  name,
  visitId,
  patient,
  onRemoveText,
  onRemovePatient,
  datesCleared,
  onUndo,
  onDismissNotice,
}: EncounterSearchChipsProps) {
  const { t } = useTranslation();

  const chips: {
    key: string;
    icon?: ReactNode;
    label: string;
    note?: string;
    removeLabel: string;
    onRemove: () => void;
  }[] = [
    ...(name
      ? [
          {
            key: "name",
            label: t("encounter_search_chip_name", { value: name }),
            removeLabel: t("encounter_search_remove_name_filter"),
            onRemove: onRemoveText,
          },
        ]
      : []),
    ...(visitId
      ? [
          {
            key: "visit",
            label: t("encounter_search_chip_visit_id", { value: visitId }),
            removeLabel: t("encounter_search_remove_visit_id_filter"),
            onRemove: onRemoveText,
          },
        ]
      : []),
    ...(patient
      ? [
          {
            key: "patient",
            icon: patient.scanned ? <ScanLine /> : <User />,
            label: patient.scanned
              ? t("encounter_search_scanned_patient")
              : (patient.name ?? t("encounter_search_patient_fallback")),
            note: patient.scanned
              ? t("encounter_search_scan_unverified")
              : undefined,
            removeLabel: t("encounter_search_remove_patient"),
            onRemove: onRemovePatient,
          },
        ]
      : []),
  ];

  if (!chips.length && !datesCleared) return null;

  const stillApplies = name
    ? t("encounter_search_name_still_applies")
    : visitId
      ? t("encounter_search_visit_id_still_applies")
      : "";

  return (
    <div className="flex flex-col gap-2">
      {chips.length > 0 && (
        <ul
          aria-label={t("encounter_search_applied")}
          className="flex flex-wrap items-center gap-2"
        >
          {chips.map((chip) => (
            <li
              key={chip.key}
              data-slot="encounter-search-chip"
              className="inline-flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full border bg-background ps-3 pe-0.5 text-sm shadow-2xs [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
            >
              {chip.icon}
              <span className="truncate font-medium">{chip.label}</span>
              {chip.note && (
                <span className="truncate text-xs text-muted-foreground">
                  {chip.note}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7 shrink-0 rounded-full text-muted-foreground"
                aria-label={chip.removeLabel}
                onClick={chip.onRemove}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {datesCleared && (
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
            onClick={onDismissNotice}
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
