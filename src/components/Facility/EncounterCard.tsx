import { t } from "i18next";
import { BadgeCheck, BedSingle, CircleDashed, Clock, Eye } from "lucide-react";
import { navigate } from "raviger";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { formatDateTime } from "@/Utils/utils";
import { Encounter, completedEncounterStatus } from "@/types/emr/encounter";

interface EncounterCardProps {
  encounter: Encounter;
}

export const EncounterCard = (props: EncounterCardProps) => {
  const { encounter } = props;

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex flex-col items-center">
          {completedEncounterStatus.includes(encounter.status) ? (
            <BadgeCheck className="w-5 h-5 text-teal-300" />
          ) : (
            <CircleDashed className="w-5 h-5 text-purple-400" />
          )}
          {/* Vertical Line */}
          <div className="w-[2px] h-full bg-secondary-300"></div>
        </div>
        <Card className="flex-1">
          <CardContent className="p-4 sm:p-2 space-y-4">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Badge
                variant="outline"
                className={cn(
                  "inline-flex gap-2 py-1",
                  completedEncounterStatus.includes(encounter.status)
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-purple-100 text-indigo-800 border-purple-200",
                )}
              >
                {completedEncounterStatus.includes(encounter.status) ? (
                  <BadgeCheck className="w-4 h-4 text-teal-700 " />
                ) : (
                  <CircleDashed className="w-4 h-4 text-indigo-800" />
                )}
                {t(`encounter_status__${encounter.status}`)}
              </Badge>
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 py-1 bg-gray-100 text-gray-800 border-gray-200"
              >
                <BedSingle />
                {t(`encounter_class__${encounter.encounter_class}`)}
              </Badge>
            </div>

            <div className="grid sm:flex sm:flex-wrap sm:justify-between gap-4">
              <div className="w-full mx-3 sm:w-auto">
                <div className="text-gray-600">{t("facility")}</div>
                <div className="font-bold flex items-center gap-2">
                  {encounter.facility.name}
                </div>
              </div>

              <div className="w-full mx-3 sm:w-auto">
                <div className="text-gray-600">{t("start_date")}</div>
                <div className="font-bold">
                  {encounter.period.start
                    ? formatDateTime(encounter.period.start)
                    : t("not_started")}
                </div>
              </div>

              <div className="w-full mx-3 sm:w-auto">
                <div className="text-gray-600">{t("priority")}</div>
                <div className="font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  {t(`encounter_priority__${encounter.priority.toLowerCase()}`)}
                </div>
              </div>

              {encounter.period.end && (
                <div className="w-full mx-3 sm:w-auto">
                  <div className="text-gray-600">{t("end_date")}</div>
                  <div className="font-bold">
                    {formatDateTime(encounter.period.end)}
                  </div>
                </div>
              )}

              {encounter.external_identifier && (
                <div className="w-full mx-3 sm:w-auto">
                  <div className="text-gray-600">{t("external_id")}</div>
                  <div className="font-bold">
                    {encounter.external_identifier}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full py-2 bg-gray-100 px-2">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${encounter.facility.id}/encounter/${encounter.id}/updates`,
                  )
                }
                className="p-2 border border-black"
              >
                <Eye />
                {t("view_encounter")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
