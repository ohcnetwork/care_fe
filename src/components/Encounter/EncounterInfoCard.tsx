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

import { Avatar } from "@/components/Common/Avatar";
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
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        {/* Header: avatar, name and meta; status and the gear. */}
        <div className="flex items-start gap-2.5">
          <Avatar
            name={patient.name}
            className="size-8 shrink-0 rounded-lg text-[11px]"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15.5px] leading-5 font-semibold tracking-tight">
              {patient.name}
            </h3>
            <PatientMeta patient={patient} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {patient.deceased_datetime && (
              <Badge variant="destructive" size="md">
                {t("deceased")}
              </Badge>
            )}
            <EncounterStatusBadge status={encounter.status} />
            <EncounterActions encounter={encounter} />
          </div>
        </div>

        <EncounterTimeBlock encounter={encounter} />

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

        {/* Where and with whom; hidden when neither is known. */}
        {(location || practitioner) && (
          <dl className="grid grid-cols-2 gap-2 border-t border-dashed pt-2.5 text-xs text-muted-foreground">
            {location && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex min-w-0 items-center gap-1.5"
                    title={getLocationPath(location)}
                  >
                    <dt className="sr-only">{t("location")}</dt>
                    <LocationIcon
                      aria-hidden="true"
                      className="size-[13px] shrink-0"
                    />
                    <dd className="truncate">{location.name}</dd>
                  </div>
                </TooltipTrigger>
                {location.parent && (
                  <TooltipContent side="bottom">
                    {getLocationPath(location)}
                  </TooltipContent>
                )}
              </Tooltip>
            )}
            {practitioner && (
              <div
                className="flex min-w-0 items-center gap-1.5"
                title={formatName(practitioner)}
              >
                <dt className="sr-only">{t("practitioner")}</dt>
                <Stethoscope
                  aria-hidden="true"
                  className="size-[13px] shrink-0"
                />
                <dd className="truncate">{formatName(practitioner)}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-b-xl border-t bg-soft-background px-3.5 py-2">
        {encounter.external_identifier && (
          <span
            className="min-w-0 truncate font-mono text-xs text-muted-foreground"
            title={t("encounter_id")}
          >
            {encounter.external_identifier}
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/facility/$facilityId/patients/home"
              params={{ facilityId }}
              search={patientHomeSearch(patient)}
            >
              {t("patient_home")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab"
              params={viewEncounterParams(encounter, facilityId)}
            >
              {t("view_encounter")}
              <ChevronRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </footer>
    </article>
  );
}
