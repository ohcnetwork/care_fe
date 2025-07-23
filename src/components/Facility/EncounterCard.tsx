import { BadgeCheck, CircleDashed, Clock, Eye } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { getPermissions } from "@/common/Permissions";
import { encounterIcons } from "@/common/constants";

import { formatDateTime } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import {
  EncounterRead,
  completedEncounterStatus,
} from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";

interface EncounterCardProps {
  encounter: EncounterRead;
  permissions: string[];
  facilityId?: string;
}

export const EncounterCard = (props: EncounterCardProps) => {
  const { t } = useTranslation();

  const { encounter, permissions, facilityId } = props;
  const { hasPermission } = usePermissions();
  const { canViewEncounter, canViewPatients } = getPermissions(
    hasPermission,
    permissions,
  );

  const canAccess = canViewEncounter || canViewPatients;
  const Icon = encounterIcons[encounter.encounter_class];

  return (
    <>
      <div className="flex gap-2">
        <div className="flex flex-col items-center">
          {completedEncounterStatus.includes(encounter.status) ? (
            <div className="p-1 rounded-full border border-teal-600 bg-green-100">
              <BadgeCheck className="size-5 text-teal-600" />
            </div>
          ) : (
            <div className="p-1 rounded-full border border-indigo-800 bg-purple-100">
              <CircleDashed className="size-5 text-purple-400" />
            </div>
          )}
          <div className="h-full">
            <Separator
              orientation="vertical"
              className="h-full bg-secondary-300"
            />
          </div>
        </div>
        <Card className="flex-1">
          <CardContent className="p-4 sm:p-2 space-y-4">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Badge
                variant={
                  completedEncounterStatus.includes(encounter.status)
                    ? "green"
                    : "indigo"
                }
                className="inline-flex gap-2 py-1"
              >
                {completedEncounterStatus.includes(encounter.status) ? (
                  <BadgeCheck className="size-4 text-teal-700" />
                ) : (
                  <CircleDashed className="size-4 text-indigo-800" />
                )}
                {t(`encounter_status__${encounter.status}`)}
              </Badge>
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-2 py-1"
              >
                {Icon}
                {t(`encounter_class__${encounter.encounter_class}`)}
              </Badge>
            </div>

            <div className="grid sm:flex sm:flex-wrap sm:justify-between gap-4">
              <div className="w-full mx-3 sm:w-auto">
                <div className="text-gray-600 text-sm">{t("facility")}</div>
                <div className="font-semibold text-base flex items-center gap-2">
                  {encounter.facility.name}
                </div>
              </div>

              <div className="w-full mx-3 sm:w-auto">
                <div className="text-gray-600 text-sm">{t("start_date")}</div>
                <div className="font-semibold text-base">
                  {encounter.period.start
                    ? formatDateTime(encounter.period.start)
                    : t("not_started")}
                </div>
              </div>

              <div className="w-full mx-3 sm:w-auto">
                <div className="text-gray-600 text-sm">{t("priority")}</div>
                <div className="font-semibold text-base flex items-center gap-2">
                  <Clock className="size-4 text-yellow-500" />
                  {t(`encounter_priority__${encounter.priority.toLowerCase()}`)}
                </div>
              </div>
              {encounter.period.end && (
                <div className="w-full mx-3 sm:w-auto">
                  <div className="text-gray-600 text-sm">{t("end_date")}</div>
                  <div className="font-semibold text-base">
                    {formatDateTime(encounter.period.end)}
                  </div>
                </div>
              )}

              {encounter.external_identifier && (
                <div className="w-full mx-3 sm:w-auto">
                  <div className="text-gray-600 text-sm">
                    {t("external_id")}
                  </div>
                  <div className="font-semibold text-base">
                    {encounter.external_identifier}
                  </div>
                </div>
              )}
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

            {canAccess && (
              <div className="w-full py-2 bg-gray-100 px-2">
                <Button variant="outline" className="p-2 border border-black">
                  <Link
                    href={
                      facilityId
                        ? `/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
                        : `/organization/organizationId/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
                    }
                    className="flex items-center gap-2"
                  >
                    <Eye className="size-4" />
                    <span>{t("view_encounter")}</span>
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
