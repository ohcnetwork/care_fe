import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_PRIORITY_COLORS,
  ENCOUNTER_STATUS_COLORS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";

export interface EncounterInfoCardProps {
  encounter: EncounterRead;
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
      data-cy={`encounter-card-${encounter.id}`}
      data-status={encounter.status}
      key={props.encounter.id}
      className={cn(
        "hover:shadow-lg transition-shadow group md:flex md:flex-col h-full overflow-hidden",
        hideBorder && "border-none shadow-none",
      )}
    >
      <CardHeader className="bg-gray-100 px-4 pt-2 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-700 truncate">
              {encounter.patient.name}
            </h3>
            <p className="text-sm text-gray-600">
              {formatPatientAge(encounter.patient, true)},{" "}
              {t(`GENDER__${encounter.patient.gender}`)}
            </p>
          </div>
          {encounter.patient.deceased_datetime && (
            <Badge variant="destructive">{t("deceased")}</Badge>
          )}
          <Badge
            data-cy="encounter-status-badge"
            variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
          >
            {t(`encounter_status__${encounter.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2 pt-2 bg-white space-y-1">
        <div className="flex items-center text-gray-600 mb-1">
          <CareIcon icon="l-clock" className="mr-1 size-3" />
          <span className="text-xs text-gray-700">
            {encounter.period.start && formatDateTime(encounter.period.start)}
            {encounter.period.end &&
              ` - ${formatDateTime(encounter.period.end)}`}
          </span>
        </div>
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
              <Badge
                key={tag.id}
                variant="outline"
                className="bg-gray-100 text-gray-700 border-gray-200 px-2 py-1 text-xs"
              >
                {getTagHierarchyDisplay(tag)}
              </Badge>
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

      <CardFooter className="flex justify-end items-center px-4 py-2 space-x-4">
        <Link
          href={
            encounter.status === "completed"
              ? `/facility/${facilityId}/patients/verify?${new URLSearchParams({
                  phone_number: encounter.patient.phone_number,
                  year_of_birth: encounter.patient.year_of_birth.toString(),
                  partial_id: encounter.patient.id.slice(0, 5),
                }).toString()}`
              : `/facility/${facilityId}/patient/${encounter.patient.id}`
          }
          className="text-gray-700 underline hover:text-gray-900 text-sm font-medium"
        >
          {encounter.status === "completed"
            ? t("patient_home")
            : t("view_patient")}
        </Link>
        <Link
          href={`/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`}
        >
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm"
            title={t("view_encounter")}
          >
            {t("view_encounter")}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
