import { AlarmClockIcon, Eye } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { getPermissions } from "@/common/Permissions";

import { formatDateTime } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_STATUS_COLORS,
  ENCOUNTER_STATUS_ICONS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { useState } from "react";

interface TimelineEncounterCardProps {
  encounter: EncounterRead;
  permissions: string[];
  facilityId?: string;
  isLast?: boolean;
  isFirst?: boolean;
}

export function TimelineEncounterCard({
  encounter,
  permissions,
  facilityId,
}: TimelineEncounterCardProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { canViewEncounter, canViewPatients } = getPermissions(
    hasPermission,
    permissions,
  );
  const [isHovered, setIsHovered] = useState(false);

  const canAccess = canViewEncounter || canViewPatients;

  const ClassIcon = ENCOUNTER_CLASS_ICONS[encounter.encounter_class];
  const StatusIcon = ENCOUNTER_STATUS_ICONS[encounter.status];

  const getComponentColor = (color = "gray") => {
    return `bg-${color}-200 text-${color}-700 border-${color}-500`;
  };

  return (
    <div className="flex items-stretch gap-3 py-4 group">
      <div className="w-[36px] flex flex-col items-center self-stretch">
        <div className="hidden" />

        <div
          className={cn(
            "relative p-2 rounded-full border-2 transition-all duration-200 mt-6 group-hover:scale-105 group-hover:shadow-md",
            getComponentColor(ENCOUNTER_STATUS_COLORS[encounter.status]),
          )}
          role="img"
          aria-label={t(`encounter_status__${encounter.status}`)}
        >
          <StatusIcon
            className={cn(
              "size-4",
              getComponentColor(ENCOUNTER_STATUS_COLORS[encounter.status]),
            )}
          />
        </div>

        <div className="hidden" />
      </div>

      <Card
        className={`flex-1 transition-all duration-200 ${
          isHovered ? "shadow-md border-gray-200" : "shadow-sm border-gray-100"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <Badge
              variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
              size="sm"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium"
            >
              <ClassIcon className="size-4" />
              {t(`encounter_class__${encounter.encounter_class}`)}
            </Badge>
            <Badge
              variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
              size="sm"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium"
            >
              <StatusIcon className="size-4" />
              {t(`encounter_status__${encounter.status}`)}
            </Badge>
          </div>

          <div className="grid sm:flex sm:flex-wrap sm:justify-between gap-4">
            <div>
              <div className="text-gray-600">{t("facility")}</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {encounter.facility.name}
              </div>
            </div>

            <div>
              <div className="text-gray-600">{t("start_date")}</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {encounter.period.start
                  ? formatDateTime(encounter.period.start)
                  : t("not_started")}
              </div>
            </div>

            {encounter.period.end && (
              <div>
                <div className="text-gray-600">{t("end_date")}</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {formatDateTime(encounter.period.end)}
                </div>
              </div>
            )}

            {encounter.external_identifier && (
              <div>
                <div className="text-gray-600">{t("external_id")}</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {encounter.external_identifier}
                </div>
              </div>
            )}

            <div>
              <div className="text-gray-600 flex items-center gap-1.5">
                {t("priority")}{" "}
                <AlarmClockIcon className="size-5 text-orange-500" />
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {t(`encounter_priority__${encounter.priority.toLowerCase()}`)}
              </div>
            </div>
          </div>

          {encounter.tags.length > 0 && (
            <div className="w-full mx-3 sm:w-auto">
              <div className="flex flex-wrap gap-2">
                {encounter.tags.map((tag) => (
                  <Badge variant="outline" key={tag.id}>
                    {getTagHierarchyDisplay(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-1">
          <div className="bg-gray-100 p-4 rounded-b-lg w-full">
            {canAccess ? (
              <Button asChild variant="outline" className="px-4">
                <Link
                  href={
                    facilityId
                      ? `/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
                      : `/organization/organizationId/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
                  }
                >
                  <Eye className="mr-2 size-4" /> {t("view_encounter")}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" className="px-4" disabled>
                <Eye className="mr-2 size-4" /> {t("view_encounter")}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
