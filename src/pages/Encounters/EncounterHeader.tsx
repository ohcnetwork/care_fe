import { ExternalLink } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";

import { formatDateTime, formatPatientAge } from "@/Utils/utils";
import EncounterProperties from "@/pages/Encounters/EncounterProperties";
import { Encounter } from "@/types/emr/encounter";

import { BloodGroupAndAllergies } from "./tabs/EncounterOverviewTab";

interface Props {
  encounter: Encounter;
}

export function EncounterHeader({ encounter }: Props) {
  const { t } = useTranslation();
  const { patient, facility } = encounter;

  return (
    <Card className="p-2 md:p-4">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 md:items-end">
        <div className="flex gap-3 items-center">
          <div className="size-12">
            <Avatar name={patient.name} />
          </div>
          <Link
            href={`/facility/${facility.id}/patient/${patient.id}`}
            className="flex flex-col"
          >
            <div className="flex gap-2 items-center">
              <h5 className="text-lg font-semibold">{patient.name}</h5>
              <ExternalLink className="size-4" />
            </div>
            <span className="text-gray-700">
              {formatPatientAge(patient, true)},{" "}
              {t(`GENDER__${patient.gender}`)}
            </span>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row gap-1 md:gap-8 items-start">
          <div className="flex md:flex-col gap-0.5 items-center md:items-start">
            <span className="text-xs text-gray-600 w-32 md:w-auto">
              {t("start_date")}:{" "}
            </span>
            <span className="text-sm font-semibold">
              {encounter.period.start
                ? formatDateTime(encounter.period.start)
                : "--"}
            </span>
          </div>
          <div className="flex md:flex-col gap-0.5 items-center md:items-start">
            <span className="text-xs text-gray-600 w-32 md:w-auto">
              {t("end_date")}:{" "}
            </span>
            <span className="text-sm font-semibold">
              {encounter.period.end
                ? formatDateTime(encounter.period.end)
                : t("ongoing")}
            </span>
          </div>
          <div className="flex md:flex-col gap-0.5 items-center md:items-start">
            <span className="text-xs text-gray-600 w-32 md:w-auto">
              {t("hospital_identifier")}:{" "}
            </span>
            {/* TODO: implement this once we have it */}
            <span className="text-sm font-semibold">--</span>
          </div>
        </div>
        <div className="md:hidden">
          <EncounterProperties encounter={encounter} canEdit={false} />
        </div>
        <div className="sm:hidden border border-gray-200 rounded-lg p-2">
          <div className="flex flex-row items-center justify-center">
            <BloodGroupAndAllergies />
          </div>
        </div>
      </div>
    </Card>
  );
}
