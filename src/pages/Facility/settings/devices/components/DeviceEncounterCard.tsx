import { t } from "i18next";
import { BadgeCheck, CircleDashed, Eye } from "lucide-react";
import { Link } from "raviger";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { encounterIcons } from "@/common/constants";

import dayjs from "@/Utils/dayjs";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";
import { DeviceEncounterHistory } from "@/types/device/device";
import { completedEncounterStatus } from "@/types/emr/encounter";

interface EncounterCardProps {
  encounterData: DeviceEncounterHistory;
}

export const DeviceEncounterCard = ({ encounterData }: EncounterCardProps) => {
  const { start, end, encounter, created_by } = encounterData;

  const Icon = encounterIcons[encounter.encounter_class];

  return (
    <Card className="flex-1 p-2">
      <CardContent className="p-4 sm:p-2 space-y-4">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <div
            className="mb-2 flex gap-3 text-xl font-semibold capitalize"
            id="patient-name-consultation"
          >
            <Link
              href={`/patient/${encounter.patient.id}`}
              basePath={`/facility/${encounter.facility.id}`}
              className="text-gray-950 font-semibold flex items-start gap-0.5"
              id="patient-details"
            >
              {encounter.patient.name}
              <CareIcon
                icon="l-external-link-alt"
                className="w-3 h-3 opacity-50 mt-1"
              />
            </Link>
            <div className="mt-[6px] text-sm font-semibold text-secondary-600">
              {formatPatientAge(encounter.patient, true)} •{" "}
              {t(`GENDER__${encounter.patient.gender}`)}
            </div>
            {encounter.patient.death_datetime && (
              <Badge variant="destructive">
                <h3 className="text-sm font-medium">
                  {t("expired_on")}
                  {": "}
                  {dayjs(encounter.patient.death_datetime).format(
                    "DD MMM YYYY, hh:mm A",
                  )}
                </h3>
              </Badge>
            )}
          </div>
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
              <BadgeCheck className="w-4 h-4 text-teal-700" />
            ) : (
              <CircleDashed className="w-4 h-4 text-indigo-800" />
            )}
            {t(`encounter_status__${encounter.status}`)}
          </Badge>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 py-1 bg-gray-100 text-gray-800 border-gray-200"
          >
            {Icon}
            {t(`encounter_class__${encounter.encounter_class}`)}
          </Badge>
        </div>

        <div className="grid sm:flex sm:flex-wrap gap-7">
          <div className="w-full mx-3 sm:w-auto">
            <div className="text-gray-600 text-sm">{t("associated_by")}</div>
            <div className="font-semibold text-base flex items-center gap-2">
              {`${created_by.first_name} ${created_by.last_name}`}
            </div>
          </div>

          <div className="w-full mx-3 sm:w-auto">
            <div className="text-gray-600 text-sm">
              {t("association_start_date")}
            </div>
            <div className="font-semibold text-base">
              {start ? formatDateTime(start) : t("not_started")}
            </div>
          </div>

          {
            <div className="w-full mx-3 sm:w-auto">
              <div className="text-gray-600 text-sm">
                {t("association_end_date")}
              </div>
              <div className="font-semibold text-base">
                {end ? formatDateTime(end) : "-"}
              </div>
            </div>
          }
        </div>

        <div className="w-full py-2 bg-gray-100 px-2">
          <Button variant="outline" className="p-2 border border-black">
            <Link
              href={`/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`}
              basePath={`/facility/${encounter.facility.id}`}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>{t("view_encounter")}</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
