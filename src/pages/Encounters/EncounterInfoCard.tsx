import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleDashed, Droplet } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";
import { completedEncounterStatus } from "@/types/emr/encounter";

export interface PatientInfoCardProps {
  encounterId: string;
  facilityId: string;
}

export default function PatientInfoCard(props: PatientInfoCardProps) {
  const { encounterId, facilityId } = props;
  const { t } = useTranslation();

  const { data: encounter, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!encounter) {
    return null;
  }

  const { patient } = encounter;

  return (
    <div className="rounded-xl border border-gray-200 bg-white text-gray-950 shadow p-4 mt-2">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-secondary-100 flex-shrink-0">
          <Avatar name={patient.name} className="w-full h-full" />
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{patient.name}</h2>
              <div className="text-sm text-gray-600 mt-1">
                {formatPatientAge(patient, true)} •{" "}
                {t(`GENDER__${patient.gender}`)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Badge
          className="gap-1 rounded-sm py-1 px-2"
          variant="primary"
          title={`${t("start_date")}: ${
            encounter.period.start
              ? formatDateTime(encounter.period.start)
              : t("not_started")
          }`}
        >
          {t("start_date")}:
          <span className="text-xs">
            {encounter.period.start
              ? formatDateTime(encounter.period.start)
              : t("not_started")}
          </span>
        </Badge>
        <Badge
          className="gap-1 rounded-sm py-1 px-2"
          variant="primary"
          title={`${t("end_date")}: ${
            encounter.period.end
              ? formatDateTime(encounter.period.end)
              : t("ongoing")
          }`}
        >
          {t("end_date")}:
          <span className="text-xs">
            {encounter.period.end
              ? formatDateTime(encounter.period.end)
              : t("ongoing")}
          </span>
        </Badge>
        {encounter.external_identifier && (
          <Badge
            variant="secondary"
            className="gap-1 bg-blue-100 border-blue-200 text-blue-900 rounded-sm py-1 px-2"
            title={t("ip_op_obs_emr_number")}
          >
            {t("ip_op_obs_emr_number")}:{" "}
            <span className="font-medium">{encounter.external_identifier}</span>
          </Badge>
        )}
        <Badge
          className="capitalize gap-1  py-1 px-2"
          variant="secondary"
          title={`Encounter Status: ${t(`encounter_status__${encounter.status}`)}`}
        >
          {completedEncounterStatus.includes(encounter.status) ? (
            <CircleCheck className="w-4 h-4 text-green-300" fill="green" />
          ) : (
            <CircleDashed className="w-4 h-4 text-yellow-500" />
          )}
          {t(`encounter_status__${encounter.status}`)}
        </Badge>
        {patient.blood_group && (
          <Badge
            className="capitalize gap-1 py-1 px-2"
            variant="outline"
            title={`Blood Group: ${patient.blood_group?.replace("_", " ")}`}
          >
            <Droplet className="w-4 h-4 text-red-300" fill="red" />
            {patient.blood_group?.replace("_", " ")}
          </Badge>
        )}
      </div>
    </div>
  );
}
