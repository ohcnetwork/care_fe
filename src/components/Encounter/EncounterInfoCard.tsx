import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { EncounterActions } from "@/components/Encounter/EncounterActions";
import TagBadge from "@/components/Tags/TagBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_PRIORITY_COLORS,
  ENCOUNTER_STATUS_COLORS,
  EncounterListRead,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import { LocationTypeIcons } from "@/types/location/location";
import { getLocationPath } from "@/types/location/utils";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";
import { Clock, Stethoscope } from "lucide-react";

export interface EncounterInfoCardProps {
  encounter: EncounterListRead | EncounterRead;
  facilityId: string;
  hideBorder?: boolean;
}

export default function EncounterInfoCard(props: EncounterInfoCardProps) {
  const { t } = useTranslation();

  const { encounter, facilityId, hideBorder = false } = props;

  // Get encounter tags and handle overflow
  const encounterTags = encounter.tags || [];
  const visibleTags = encounterTags.slice(0, 2); // Show first 2 tags
  const remainingCount = encounterTags.length - 2;

  return (
    <Card
      data-status={encounter.status}
      key={props.encounter.id}
      className={cn(
        "md:flex md:flex-col h-full overflow-hidden",
        hideBorder && "border-none shadow-none",
      )}
    >
      <CardHeader className="bg-gray-100 px-4 pt-2 pb-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-2 justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-950 truncate">
                {encounter.patient.name}
              </h3>
              <p className="text-sm text-gray-700">
                {formatPatientAge(encounter.patient, true)},{" "}
                {t(`GENDER__${encounter.patient.gender}`)}
              </p>
            </div>
            <div className="flex gap-2">
              {encounter.patient.deceased_datetime && (
                <Badge variant="destructive">{t("deceased")}</Badge>
              )}
              <Badge variant={ENCOUNTER_STATUS_COLORS[encounter.status]}>
                {t(`encounter_status__${encounter.status}`)}
              </Badge>
            </div>
          </div>
          <EncounterActions encounter={encounter} />
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2 pt-2 bg-white space-y-2">
        <div className="flex gap-1 items-center text-gray-600">
          <Clock className="size-3 text-gray-500 shrink-0" />
          <span className="text-xs text-gray-700">
            {encounter.period.start &&
              formatDateTime(encounter.period.start, "DD/MM/YYYY, hh:mm A")}
            {encounter.period.end &&
              ` - ${formatDateTime(encounter.period.end, "DD/MM/YYYY, hh:mm A")}`}
          </span>
        </div>

        {/* Doctor and Location Row */}
        {(encounter.care_team?.[0] || encounter.current_location) && (
          <div className="flex flex-col md:flex-row justify-start md:items-center gap-2 md:gap-3 text-gray-600">
            {/* Primary Doctor */}
            {encounter.care_team?.[0] && (
              <div className="flex items-center gap-1 min-w-0">
                <Stethoscope className="size-3 text-gray-500 shrink-0" />
                <span className="text-xs font-medium text-gray-700 truncate">
                  {formatName(encounter.care_team[0].member)}
                </span>
              </div>
            )}

            {/* Current Location */}
            {encounter.current_location && (
              <>
                {encounter.care_team?.[0] && (
                  <span className="text-gray-300 hidden md:inline">|</span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 min-w-0 cursor-default">
                      {(() => {
                        const LocationIcon =
                          LocationTypeIcons[encounter.current_location.form];
                        return (
                          <LocationIcon className="size-3 text-gray-500 shrink-0" />
                        );
                      })()}
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {encounter.current_location.name}
                      </span>
                    </div>
                  </TooltipTrigger>
                  {encounter.current_location.parent && (
                    <TooltipContent side="bottom">
                      <span className="text-xs">
                        {getLocationPath(encounter.current_location)}
                      </span>
                    </TooltipContent>
                  )}
                </Tooltip>
              </>
            )}
          </div>
        )}

        {/* Encounter Class and Priority Tags */}
        <div className="flex flex-wrap gap-1">
          {encounter.encounter_class && (
            <Badge
              variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
              className="text-xs"
            >
              {t(`encounter_class__${encounter.encounter_class}`)}
            </Badge>
          )}
          {encounter.priority && (
            <Badge
              variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
              className="text-xs"
            >
              {t(`encounter_priority__${encounter.priority}`)}
            </Badge>
          )}
        </div>

        {/* Tags Section */}
        {encounterTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                hierarchyDisplay
                variant="outline"
                className="bg-gray-100 text-gray-700 border-gray-200 px-2 py-1 text-xs"
              />
            ))}
            {remainingCount > 0 && (
              <Badge className="bg-gray-100 text-gray-700 border-gray-200 px-2 py-1 text-xs">
                +{remainingCount}
                {t("more")}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end items-center px-4 py-2 gap-4 mt-auto">
        <Button variant="link" aria-label={t("patient_home")} asChild>
          <Link
            basePath="/"
            href={`/facility/${facilityId}/patients/home?${new URLSearchParams({
              phone_number: encounter.patient.phone_number,
              year_of_birth: encounter.patient.year_of_birth?.toString() || "",
              partial_id: encounter.patient.id.slice(0, 5),
            }).toString()}`}
            className="text-gray-700 underline hover:text-gray-900 text-sm font-medium"
          >
            {t("patient_home")}
          </Link>
        </Button>
        <Button variant="outline" aria-label={t("view_encounter")} asChild>
          <Link
            basePath="/"
            href={`/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`}
          >
            {t("view_encounter")}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
