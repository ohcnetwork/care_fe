import { ScanLine, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { badgeVariants } from "@/components/ui/badge";
import { MemberCard } from "@/components/ui/member-card";

// The Badge's close button (`onClose`), which always reads "Remove"; the
// chips need their own labels. It shows on any badge color.
const BADGE_CLOSE =
  "inline-flex aspect-square shrink-0 cursor-pointer items-center justify-center self-stretch rounded-r-sm opacity-60 outline-none hover:bg-current/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:ring-inset";

// The patient card in the neutral badge's gray, so both chips match.
const NEUTRAL_CHIP =
  "border-stronger-border/40 bg-muted-background text-accent-foreground dark:border-strong-border";

export interface AppliedSearch {
  name?: string;
  visitId?: string;
  patient?: { name?: string; scanned: boolean };
}

interface EncounterSearchChipsProps extends AppliedSearch {
  onRemoveText: () => void;
  onRemovePatient: () => void;
}

/**
 * The search filters the URL applies, first inside the search, before its
 * icon and input,
 * each removable, in gray. Text filters are neutral badges; the patient is a
 * member card. They take the line's space before the input; below about 8rem a
 * chip, the input wraps to the next line instead. In a narrow toolbar the
 * chips also wrap, one per line, rather than truncating to their icons.
 */
export function EncounterSearchChips({
  name,
  visitId,
  patient,
  onRemoveText,
  onRemovePatient,
}: EncounterSearchChipsProps) {
  const { t } = useTranslation();

  // The list sets one text filter at a time.
  const textFilter = name
    ? {
        label: t("encounter_search_chip_name", { value: name }),
        removeLabel: t("encounter_search_remove_name_filter"),
      }
    : visitId
      ? {
          label: t("encounter_search_chip_visit_id", { value: visitId }),
          removeLabel: t("encounter_search_remove_visit_id_filter"),
        }
      : undefined;

  if (!textFilter && !patient) return null;

  const count = (textFilter ? 1 : 0) + (patient ? 1 : 0);
  const patientName = patient?.scanned
    ? t("encounter_search_scanned_patient")
    : (patient?.name ?? t("encounter_search_patient_fallback"));
  // A scan doesn't verify identity: the chip says so in short, and the
  // tooltip in full.
  const unverified = patient?.scanned
    ? t("encounter_search_scan_unverified")
    : undefined;

  return (
    <ul
      aria-label={t("encounter_search_applied")}
      data-slot="encounter-search-chips"
      className={cn(
        "flex max-w-max min-w-0 grow-[100] items-center gap-1 ps-1.5 @max-lg/toolbar:flex-wrap",
        count > 1 ? "basis-56" : "basis-32",
      )}
    >
      {textFilter && (
        <li
          data-slot="encounter-search-applied"
          title={textFilter.label}
          className={cn(
            badgeVariants({ variant: "neutral" }),
            "h-7 max-w-48 min-w-16 shrink gap-1 py-0 pe-0 text-sm font-normal",
          )}
        >
          {/* Capped, so a long label doesn't make its chip take more of
              the shrink than the patient's. */}
          <span className="max-w-36 truncate">{textFilter.label}</span>
          <button
            type="button"
            className={BADGE_CLOSE}
            aria-label={textFilter.removeLabel}
            onClick={onRemoveText}
          >
            <X className="size-3.5" />
          </button>
        </li>
      )}
      {patient && (
        <li
          data-slot="encounter-search-applied"
          title={unverified ? `${patientName}. ${unverified}` : patientName}
          className={cn(
            "min-w-16 shrink",
            unverified ? "max-w-60" : "max-w-48",
          )}
        >
          <MemberCard
            size="xs"
            className={cn(NEUTRAL_CHIP, unverified ? "max-w-60" : "max-w-48")}
            icon={
              patient.scanned ? (
                <ScanLine />
              ) : patient.name ? undefined : (
                <User />
              )
            }
            name={patientName}
            description={
              unverified && t("encounter_search_scan_unverified_short")
            }
            removeLabel={t("encounter_search_remove_patient")}
            onRemove={onRemovePatient}
          />
        </li>
      )}
    </ul>
  );
}
