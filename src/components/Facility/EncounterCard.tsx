import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { getPermissions } from "@/common/Permissions";

import { formatDateTime } from "@/common/utils";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import {
  ENCOUNTER_PRIORITY_COLORS,
  ENCOUNTER_STATUS_COLORS,
  ENCOUNTER_STATUS_FILTER_COLORS,
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

  const StatusIcon = ENCOUNTER_STATUS_ICONS[encounter.status];

  return (
    <div className="flex items-stretch gap-2 py-4 group">
      <div className="flex flex-col items-center self-stretch">
        <div className="hidden" />

        <div
          className={cn(
            "relative p-1.5 rounded-full border transition-all duration-200 mt-4 group-hover:scale-105 group-hover:shadow-md",
            ENCOUNTER_STATUS_FILTER_COLORS[encounter.status],
          )}
          aria-label={t(`encounter_status__${encounter.status}`)}
        >
          <StatusIcon
            className={cn(
              "size-4",
              ENCOUNTER_STATUS_FILTER_COLORS[encounter.status],
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
        <CardContent className="p-4">
          <div className="font-semibold text-base mb-2">
            {t(`encounter_class__${encounter.encounter_class}`)}
          </div>
          <div className="mb-3 flex items-center gap-2">
            <Badge
              variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
              className="rounded-sm px-1.5 py-0.5"
            >
              {t(`encounter_priority__${encounter.priority.toLowerCase()}`)}
            </Badge>
            <Badge
              variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
              size="sm"
              className="rounded-sm px-1.5 py-0.5"
            >
              {t(`encounter_status__${encounter.status}`)}
            </Badge>
          </div>

          <div className="grid gap-3 sm:gap-6 sm:flex sm:flex-wrap text-sm">
            <div className="flex gap-2">
              <div>
                <div className="text-gray-600">{t("start_date")}</div>
                <div className="font-semibold text-gray-900">
                  {encounter.period.start
                    ? formatDateTime(encounter.period.start)
                    : t("not_started")}
                </div>
              </div>

              <div>
                <div className="text-gray-600">{t("end_date")}</div>
                <div className="font-semibold text-gray-900">
                  {encounter.period.end
                    ? formatDateTime(encounter.period.end)
                    : t("ongoing") + "..."}
                </div>
              </div>
            </div>
            <div>
              <div className="text-gray-600">{t("facility")}</div>
              <div className="font-semibold text-gray-900">
                {encounter.facility.name}
              </div>
            </div>
          </div>

          {encounter.tags.length > 0 && (
            <div className="w-full mt-2 sm:w-auto">
              <div className="text-gray-600 mt-1">
                {t("encounter_tag_label", { count: encounter.tags.length })}
              </div>
              <div className="flex flex-wrap gap-1">
                {encounter.tags.map((tag) => (
                  <Badge variant="secondary" key={tag.id}>
                    {getTagHierarchyDisplay(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-1">
          <div className="bg-gray-100 p-2 rounded-b-lg w-full">
            <Button asChild variant="outline" disabled={!canAccess}>
              <Link
                href={
                  facilityId
                    ? `/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
                    : `/organization/organizationId/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
                }
              >
                {t("view_encounter")}
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
