import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPin, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EncounterActions } from "@/components/Encounter/EncounterActions";
import {
  EncounterStatusBadge,
  EncounterTimeBlock,
  PatientMeta,
  patientHomeSearch,
  viewEncounterParams,
} from "@/components/Encounter/EncounterCardParts";
import TagBadge from "@/components/Tags/TagBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_PRIORITY_COLORS,
  EncounterListRead,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import { LocationTypeIcons } from "@/types/location/location";
import { getLocationPath } from "@/types/location/utils";
import { formatName } from "@/Utils/utils";

export interface EncounterInfoCardProps {
  encounter: EncounterListRead | EncounterRead;
  facilityId: string;
  /** Drops the border and shadow so the card sits flush, as in a sheet. */
  hideBorder?: boolean;
}

const VISIBLE_TAGS = 2;

/**
 * One encounter in the encounters list: who, status, when, what kind, where
 * and with whom, from the list response alone. The gear, the age and the
 * tags reuse their existing components.
 */
export default function EncounterInfoCard({
  encounter,
  facilityId,
  hideBorder = false,
}: EncounterInfoCardProps) {
  const { t } = useTranslation();
  const { patient } = encounter;
  const tags = encounter.tags ?? [];
  const practitioner = encounter.care_team?.[0]?.member;
  const location = encounter.current_location;
  const LocationIcon = location ? LocationTypeIcons[location.form] : MapPin;

  return (
    <article
      data-cy="encounter-card"
      data-status={encounter.status}
      className={cn(
        "flex h-full flex-col rounded-xl bg-background text-sm text-foreground",
        !hideBorder &&
          "border border-border shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-strong-border hover:shadow-md hover:shadow-black/5 dark:hover:shadow-white/5",
      )}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header: name and meta; status. */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{patient.name}</h3>
            <PatientMeta patient={patient} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {patient.deceased_datetime && (
              <Badge variant="destructive" size="md">
                {t("deceased")}
              </Badge>
            )}
            <EncounterStatusBadge status={encounter.status} />
          </div>
        </div>

        {/* The gear (Restart, for a completed encounter only) sits beside
            the time that says it was completed. */}
        <EncounterTimeBlock
          encounter={encounter}
          action={<EncounterActions encounter={encounter} />}
        />

        {/* Class, priority and tags. */}
        <div className="flex flex-wrap items-center gap-1">
          <Badge
            variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
            size="md"
          >
            {t(`encounter_class__${encounter.encounter_class}`)}
          </Badge>
          <Badge
            variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
            size="md"
          >
            {t(`encounter_priority__${encounter.priority}`)}
          </Badge>
          {tags.slice(0, VISIBLE_TAGS).map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              hierarchyDisplay
              variant="outline"
              className="text-xs"
            />
          ))}
          {tags.length > VISIBLE_TAGS && (
            <Badge variant="neutral" size="md">
              +{tags.length - VISIBLE_TAGS} {t("more")}
            </Badge>
          )}
        </div>

        {/* Where and with whom. Both slots always show, so an encounter
            without a location or a practitioner reads as unassigned. */}
        <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-dashed pt-3 text-xs text-muted-foreground">
          {location ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex min-w-0 items-center gap-1.5"
                  title={getLocationPath(location)}
                >
                  <dt className="sr-only">{t("location")}</dt>
                  <LocationIcon
                    aria-hidden="true"
                    className="size-3.5 shrink-0"
                  />
                  <dd className="truncate text-foreground">{location.name}</dd>
                </div>
              </TooltipTrigger>
              {location.parent && (
                <TooltipContent side="bottom">
                  {getLocationPath(location)}
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <dt className="sr-only">{t("location")}</dt>
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <dd className="truncate">{t("encounter_card_no_location")}</dd>
            </div>
          )}
          <div
            className="flex min-w-0 items-center gap-1.5"
            title={practitioner ? formatName(practitioner) : undefined}
          >
            <dt className="sr-only">{t("practitioner")}</dt>
            <Stethoscope aria-hidden="true" className="size-3.5 shrink-0" />
            {practitioner ? (
              <dd className="truncate text-foreground">
                {formatName(practitioner)}
              </dd>
            ) : (
              <dd className="truncate">
                {t("encounter_card_no_practitioner")}
              </dd>
            )}
          </div>
        </dl>
      </div>

      <footer className="flex items-center justify-between gap-2 rounded-b-xl border-t bg-soft-background px-4 py-2">
        <Button variant="tertiary" asChild>
          <Link
            to="/facility/$facilityId/patients/home"
            params={{ facilityId }}
            className="underline"
            search={patientHomeSearch(patient)}
          >
            {t("patient_home")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link
            to="/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab"
            params={viewEncounterParams(encounter, facilityId)}
          >
            {t("view_encounter")}
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </footer>
    </article>
  );
}
