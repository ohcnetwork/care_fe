import { ScanLine, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberCard } from "@/components/ui/member-card";

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

/**
 * The search filters the URL applies, below the toolbar, each removable.
 * Text filters are outline badges; the patient is a member card.
 */
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

  const textFilters: { key: string; label: string; removeLabel: string }[] = [
    ...(name
      ? [
          {
            key: "name",
            label: t("encounter_search_chip_name", { value: name }),
            removeLabel: t("encounter_search_remove_name_filter"),
          },
        ]
      : []),
    ...(visitId
      ? [
          {
            key: "visit",
            label: t("encounter_search_chip_visit_id", { value: visitId }),
            removeLabel: t("encounter_search_remove_visit_id_filter"),
          },
        ]
      : []),
  ];

  if (!textFilters.length && !patient && !datesCleared) return null;

  const stillApplies = name
    ? t("encounter_search_name_still_applies")
    : visitId
      ? t("encounter_search_visit_id_still_applies")
      : "";

  return (
    <div className="flex flex-col gap-2">
      {(textFilters.length > 0 || patient) && (
        <ul
          aria-label={t("encounter_search_applied")}
          className="flex flex-wrap items-center gap-2"
        >
          {textFilters.map((filter) => (
            <li
              key={filter.key}
              data-slot="encounter-search-applied"
              className={cn(
                badgeVariants({ variant: "outline", size: "lg" }),
                "h-9 max-w-full min-w-0 gap-1.5 bg-background pe-0 shadow-2xs",
              )}
            >
              <span className="truncate">{filter.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7 shrink-0 text-muted-foreground"
                aria-label={filter.removeLabel}
                onClick={onRemoveText}
              >
                <X />
              </Button>
            </li>
          ))}
          {patient && (
            <li
              data-slot="encounter-search-applied"
              className="max-w-full min-w-0"
            >
              <MemberCard
                size="sm"
                icon={
                  patient.scanned ? (
                    <ScanLine />
                  ) : patient.name ? undefined : (
                    <User />
                  )
                }
                name={
                  patient.scanned
                    ? t("encounter_search_scanned_patient")
                    : (patient.name ?? t("encounter_search_patient_fallback"))
                }
                description={
                  patient.scanned
                    ? t("encounter_search_scan_unverified")
                    : undefined
                }
                removeLabel={t("encounter_search_remove_patient")}
                onRemove={onRemovePatient}
              />
            </li>
          )}
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
